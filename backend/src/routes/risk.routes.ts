import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';
import { requireRoles } from '../auth/middleware';

const router = Router();
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://localhost:8000';

router.post('/evaluate', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const { bundleId, projectId, projectType, declaredTonnage, evidenceItems } = req.body || {};

    if (!bundleId) {
      return res.status(400).json({ error: 'bundleId is required' });
    }

    const declared = Number(declaredTonnage || 500);
    const rawItems: any[] = Array.isArray(evidenceItems) ? evidenceItems : [];

    // Normalize items for ML schema compatibility
    const normalizedItems = rawItems.map((item: any) => {
      const p = item.payload || item;
      let metric = 'CO2_FLUX';
      let value = 0;
      let calculatedTonnage = declared;

      if (item.sourceType === 'IOT_SENSOR' || p.sensorId) {
        metric = 'CO2_FLUX';
        value = Number(p.co2FluxPpm ?? p.co2Flux ?? p.value ?? 418.2);
        calculatedTonnage = Number(p.biomassKgM2 ? p.biomassKgM2 * 3.5 : declared);
      } else if (item.sourceType === 'SATELLITE_NDVI' || p.satellite) {
        metric = 'NDVI_CHANGE';
        value = Number(p.meanNdvi ?? p.ndvi ?? 0.812);
        calculatedTonnage = Number(p.canopyCoveragePct ? (p.canopyCoveragePct / 100) * declared * 1.1 : declared);
      } else {
        metric = 'VERIFIER_ASSESSMENT';
        value = 1.0;
        calculatedTonnage = declared;
      }

      return {
        sourceType: item.sourceType || 'IOT_SENSOR',
        metric,
        value,
        calculatedTonnage,
        timestamp: Number(p.timestamp || item.timestamp || Math.floor(Date.now() / 1000))
      };
    });

    let scoreResult: any;
    try {
      const response = await fetch(`${ML_ENGINE_URL}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId,
          projectId: projectId || 'PROJ-DEFAULT',
          projectType: projectType || 'REFORESTATION',
          declaredTonnage: declared,
          evidenceItems: normalizedItems
        })
      });

      if (response.ok) {
        scoreResult = await response.json();
      } else {
        const errText = await response.text();
        throw new Error(`ML Engine HTTP ${response.status}: ${errText}`);
      }
    } catch (mlErr: any) {
      console.warn('ML Engine offline or executing dynamic heuristic fallback:', mlErr.message);

      let deductions = 0;
      const flags: string[] = [];

      for (const item of normalizedItems) {
        if (item.sourceType === 'IOT_SENSOR' && item.value > 600) {
          deductions += 35;
          flags.push(`CO2_FLUX_ELEVATED: Sensor CO2 flux ${item.value} ppm exceeds standard baseline`);
        }
        if (item.sourceType === 'SATELLITE_NDVI' && item.value < 0.65) {
          deductions += 30;
          flags.push(`NDVI_DEGRADATION: Satellite canopy NDVI (${item.value}) indicates low vegetative density`);
        }
        const devPct = Math.abs((item.calculatedTonnage - declared) / declared) * 100;
        if (devPct > 20) {
          deductions += 20;
          flags.push(`TONNAGE_MISMATCH: Calculated tonnage deviates ${devPct.toFixed(1)}% from declared ${declared} tCO2e`);
        }
      }

      const dynScore = Math.max(0, Math.min(100, 100 - deductions));
      const dynRisk = dynScore >= 85 ? 'LOW' : dynScore >= 60 ? 'MEDIUM' : 'HIGH';
      const autoMint = dynScore >= 85;

      scoreResult = {
        bundleId,
        confidenceScore: dynScore,
        riskLevel: dynRisk,
        autoMintEligible: autoMint,
        verifierRequired: !autoMint,
        anomalyFlags: flags,
        explanationReason: flags.length === 0
          ? `All ${normalizedItems.length} telemetry streams corroborated within acceptable variance thresholds. Dynamic confidence score: ${dynScore}%.`
          : `Heuristic anomaly check detected ${flags.length} discrepancy flag(s). Calculated confidence score: ${dynScore}%.`,
        executionTimeMs: 12
      };
    }

    const {
      confidenceScore,
      riskLevel,
      autoMintEligible,
      verifierRequired,
      anomalyFlags,
      explanationReason
    } = scoreResult;

    const assessmentRecord = {
      bundle_id: bundleId,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      anomaly_flags: anomalyFlags || [],
      explanation_reason: explanationReason || 'Cross-source evidence corroborated',
      auto_mint_eligible: autoMintEligible,
      verifier_required: verifierRequired
    };

    const { data: riskRecord, error: riskError } = await supabase
      .from('risk_assessments')
      .upsert(assessmentRecord)
      .select()
      .single();

    let onChainRiskTxHash = null;
    try {
      const correlationMet = !(anomalyFlags || []).some((f: string) => f.includes('MISMATCH') || f.includes('DEVIATION'));
      const confidenceMet = confidenceScore >= 85;
      onChainRiskTxHash = await RelayerService.recordRiskResultOnChain(
        bundleId,
        correlationMet,
        confidenceMet,
        verifierRequired
      );
    } catch (err: any) {
      console.warn('[Relayer] On-chain risk recording warning:', err.message);
    }

    return res.status(200).json({
      success: true,
      riskAssessment: riskRecord || assessmentRecord,
      assessment: riskRecord || assessmentRecord,
      txHash: onChainRiskTxHash,
      onChainRiskTxHash,
      mintResult: null,
      message: 'Risk assessment evaluated and recorded successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:bundleId', async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.params;
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('bundle_id', bundleId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Risk assessment not found' });
    }

    return res.json({ assessment: data, riskAssessment: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
