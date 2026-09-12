import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000';

router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      bundleId,
      projectId,
      projectType,
      declaredTonnage,
      evidenceItems
    } = req.body;

    if (!bundleId) {
      return res.status(400).json({ error: 'bundleId is required' });
    }

    // If evidenceItems not provided in body, load from Supabase evidence_items
    let itemsToScore = evidenceItems;
    if (!itemsToScore || !Array.isArray(itemsToScore) || itemsToScore.length === 0) {
      const { data: dbItems } = await supabase
        .from('evidence_items')
        .select('*')
        .eq('bundle_id', bundleId);
      if (dbItems && dbItems.length > 0) {
        itemsToScore = dbItems.map((di: any) => ({
          sourceType: di.source_type,
          name: di.payload?.name || di.source_type,
          payload: di.payload
        }));
      }
    }

    const declared = Number(declaredTonnage || 500);

    // Normalize evidence items so both payload-based and schema-based items are cleanly formatted
    const normalizedItems = (itemsToScore || []).map((item: any) => {
      const p = item.payload || {};
      let metric = item.metric || 'co2_flux_ppm';
      let value = 412.5;
      let calculatedTonnage = declared;

      if (item.sourceType === 'IOT_SENSOR') {
        metric = item.metric || 'co2_flux_ppm';
        value = Number(item.value ?? p.co2FluxPpm ?? p.co2_flux_ppm ?? 412.5);
        calculatedTonnage = Number(item.calculatedTonnage ?? p.calculatedTonnage ?? p.calculated_tonnage ?? (declared * (value / 412.5)));
      } else if (item.sourceType === 'SATELLITE_NDVI') {
        metric = item.metric || 'canopy_cover_delta';
        value = Number(item.value ?? p.canopyCoverDelta ?? (p.meanNdvi ? p.meanNdvi - 0.65 : 0.18));
        calculatedTonnage = Number(item.calculatedTonnage ?? p.calculatedTonnage ?? p.calculated_tonnage ?? declared);
      } else if (item.sourceType === 'OPERATIONAL_DOC') {
        metric = item.metric || 'planted_saplings';
        value = Number(item.value ?? p.plantedSaplings ?? p.saplings ?? 25000);
        calculatedTonnage = Number(item.calculatedTonnage ?? p.calculatedTonnage ?? p.calculated_tonnage ?? declared);
      } else {
        metric = item.metric || 'audit_metric';
        value = Number(item.value ?? p.value ?? 1.0);
        calculatedTonnage = Number(item.calculatedTonnage ?? p.calculatedTonnage ?? declared);
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
      console.warn('ML Engine call error, executing heuristic fallback:', mlErr.message);

      // Dynamic algorithmic fallback based on actual normalized evidence values
      let deductions = 0;
      const flags: string[] = [];

      for (const item of normalizedItems) {
        if (item.sourceType === 'IOT_SENSOR' && item.value > 600) {
          deductions += 35;
          flags.push(`CO2_FLUX_ELEVATED: Sensor CO2 flux ${item.value} ppm exceeds standard baseline`);
        }
        if (item.sourceType === 'SATELLITE_NDVI' && item.value < 0) {
          deductions += 30;
          flags.push(`NDVI_DEGRADATION: Satellite canopy change (${item.value}) indicates negative vegetative growth`);
        }
        const devPct = Math.abs((item.calculatedTonnage - declared) / declared) * 100;
        if (devPct > 15) {
          deductions += 20;
          flags.push(`TONNAGE_MISMATCH: Calculated tonnage deviates ${devPct.toFixed(1)}% from declared ${declared} tCO2e`);
        }
      }

      if (normalizedItems.length < 2) {
        deductions += 15;
        flags.push('INSUFFICIENT_SOURCES: Minimum 2 corroborating streams required for full confidence');
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
      explanationReason,
      recommendedVerifier,
      executionTimeMs
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

    if (riskError) {
      console.warn('[Supabase] Warning saving risk assessment:', riskError.message);
    }

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

    let mintResult = null;
    if (autoMintEligible) {
      try {
        const tonnageToMint = Number(declaredTonnage || 500);
        const { txHash, tokenId } = await RelayerService.mintCreditOnChain(bundleId, tonnageToMint, 2026);
        mintResult = { txHash, tokenId };

        const { data: bundle } = await supabase
          .from('evidence_bundles')
          .select('merkle_root')
          .eq('bundle_id', bundleId)
          .single();

        await supabase
          .from('carbon_credit_nfts')
          .upsert({
            token_id: tokenId,
            project_id: projectId || 'PROJ-DEFAULT',
            bundle_id: bundleId,
            current_owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            co2_tonnage: tonnageToMint,
            vintage_year: 2026,
            merkle_root: bundle?.merkle_root || '0x' + '0'.repeat(64),
            status: 'ISSUED'
          });
      } catch (err: any) {
        console.warn('[Relayer] Auto-mint execution warning:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      riskAssessment: riskRecord || assessmentRecord,
      assessment: riskRecord || assessmentRecord,
      txHash: onChainRiskTxHash,
      onChainRiskTxHash,
      mintResult,
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
