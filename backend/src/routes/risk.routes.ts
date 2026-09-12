import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RelayerService } from '../services/relayer.service';

const router = Router();
const ML_ENGINE_URL = process.env.ML_ENGINE_URL || 'http://127.0.0.1:8000';

// POST /api/risk/evaluate — Calls FastAPI ML engine, updates on-chain gate, mints if eligible
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const {
      bundleId,
      projectId,
      projectType,
      declaredTonnage,
      evidenceItems
    } = req.body;

    if (!bundleId || !projectId || !declaredTonnage || !evidenceItems) {
      return res.status(400).json({ error: 'Missing required fields for risk evaluation' });
    }

    // 1. Call Python ML engine /score
    let mlResult: any;
    try {
      const mlResponse = await fetch(`${ML_ENGINE_URL}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bundleId,
          projectId,
          projectType: projectType || 'REFORESTATION',
          declaredTonnage: Number(declaredTonnage),
          evidenceItems
        })
      });

      if (!mlResponse.ok) {
        const errText = await mlResponse.text();
        return res.status(mlResponse.status).json({ error: `ML Engine error: ${errText}` });
      }

      mlResult = await mlResponse.json();
    } catch (err: any) {
      return res.status(502).json({ error: `Failed to connect to ML Engine: ${err.message}` });
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
    } = mlResult;

    // 2. Persist risk assessment in Supabase
    const assessmentRecord = {
      bundle_id: bundleId,
      confidence_score: confidenceScore,
      risk_level: riskLevel,
      anomaly_flags: anomalyFlags,
      explanation_reason: explanationReason,
      auto_mint_eligible: autoMintEligible,
      verifier_required: verifierRequired
    };

    const { error: dbErr } = await supabase
      .from('risk_assessments')
      .upsert(assessmentRecord);

    if (dbErr) {
      console.warn('[Supabase] Warning saving risk assessment:', dbErr.message);
    }

    // 3. Record risk result on-chain via Relayer
    let onChainRiskTxHash = null;
    try {
      const correlationMet = !anomalyFlags.some((f: string) => f.includes('MISMATCH') || f.includes('DEVIATION'));
      const confidenceMet = confidenceScore >= 85;
      onChainRiskTxHash = await RelayerService.recordRiskResult(
        bundleId,
        correlationMet,
        confidenceMet,
        verifierRequired
      );
    } catch (err: any) {
      console.warn('[Relayer] On-chain risk recording warning:', err.message);
    }

    // 4. If autoMintEligible, automatically trigger on-chain minting!
    let mintResult = null;
    if (autoMintEligible) {
      try {
        const { txHash, tokenId } = await RelayerService.mintCredit(bundleId, declaredTonnage, 2026);
        mintResult = { txHash, tokenId };

        // Fetch bundle to get merkle root and project
        const { data: bundle } = await supabase
          .from('evidence_bundles')
          .select('merkle_root')
          .eq('bundle_id', bundleId)
          .single();

        // Persist minted NFT in Supabase
        await supabase
          .from('carbon_credit_nfts')
          .upsert({
            token_id: tokenId,
            project_id: projectId,
            bundle_id: bundleId,
            current_owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Issuer default Anvil account
            co2_tonnage: declaredTonnage,
            vintage_year: 2026,
            merkle_root: bundle?.merkle_root || '0x' + '0'.repeat(64),
            status: 'ISSUED'
          });
      } catch (err: any) {
        console.warn('[Relayer] Auto-mint execution warning:', err.message);
      }
    }

    return res.json({
      success: true,
      assessment: {
        bundleId,
        confidenceScore,
        riskLevel,
        autoMintEligible,
        verifierRequired,
        anomalyFlags,
        explanationReason,
        recommendedVerifier,
        executionTimeMs
      },
      onChainRiskTxHash,
      mintResult
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/risk/:bundleId — Retrieve risk assessment
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

    return res.json({ assessment: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
