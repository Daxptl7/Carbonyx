import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RelayerService } from '../services/relayer.service';
import { CryptographicService } from '../services/cryptographic.service';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';

const router = Router();

// POST /api/verifiers/stake (and POST /api/verifiers) - Register or update verifier stake
const handleStake = async (req: Request, res: Response) => {
  try {
    const { verifierAddress, specialization } = req.body;
    const stakedAmount = req.body.stakedAmount !== undefined ? req.body.stakedAmount : req.body.amountEth;

    if (!verifierAddress || stakedAmount === undefined) {
      return res.status(400).json({ error: 'verifierAddress and stakedAmount are required' });
    }
    if (!isAddress(verifierAddress) || !Number.isFinite(Number(stakedAmount)) || Number(stakedAmount) < 0.1) {
      return res.status(400).json({ error: 'Provide a valid verifier address and a stake of at least 0.1 ETH' });
    }

    const { data: verifier, error } = await supabase
      .from('verifier_stakes')
      .upsert({
        verifier_address: verifierAddress,
        staked_amount: Number(stakedAmount),
        reputation_score: 100,
        active_in_pool: Number(stakedAmount) >= 0.1,
        specialization: specialization || 'REFORESTATION',
        last_stake_timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      success: true,
      verifier,
      message: 'Verifier stake recorded successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

router.post('/stake', requireRoles('INDEPENDENT_VERIFIER'), handleStake);
router.post('/', requireRoles('INDEPENDENT_VERIFIER'), handleStake);

// GET /api/verifiers - List all verifiers
router.get('/', requireRoles('INDEPENDENT_VERIFIER', 'REGULATOR_AUDITOR'), async (_req: Request, res: Response) => {
  try {
    const { data: verifiers, error } = await supabase
      .from('verifier_stakes')
      .select('*')
      .order('staked_amount', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ verifiers: verifiers || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/verifiers/queue - Get bundles requiring human verifier review
router.get('/queue', requireRoles('INDEPENDENT_VERIFIER'), async (_req: Request, res: Response) => {
  try {
    const { data: assessments, error: rError } = await supabase
      .from('risk_assessments')
      .select('*')
      .eq('verifier_required', true)
      .limit(10);

    if (rError) return res.status(500).json({ error: rError.message });

    return res.status(200).json({ queue: assessments || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/verifiers/verify - Record human verifier audit decision
router.post('/verify', requireRoles('INDEPENDENT_VERIFIER'), async (req: Request, res: Response) => {
  try {
    const { bundleId, verifierAddress, approved, auditNotes } = req.body;

    if (!bundleId || !verifierAddress || approved === undefined) {
      return res.status(400).json({ error: 'bundleId, verifierAddress, and approved decision are required' });
    }
    if (!isAddress(verifierAddress)) {
      return res.status(400).json({ error: 'verifierAddress must be a valid Ethereum address' });
    }

    // 1. Verify verifier is staked and active
    const { data: verifier } = await supabase
      .from('verifier_stakes')
      .select('*')
      .eq('verifier_address', verifierAddress)
      .single();

    if (!verifier || !verifier.active_in_pool) {
      return res.status(403).json({
        error: 'Verifier must have minimum active collateral staked (>= 0.1 ETH) to submit audits'
      });
    }

    // 2. Fetch Bundle Details
    const { data: bundle } = await supabase
      .from('evidence_bundles')
      .select('*, projects(*)')
      .eq('bundle_id', bundleId)
      .single();

    if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

    let mintTxHash = null;
    let tokenId = null;
    const verificationTxHash = await RelayerService.recordVerificationOnChain(bundleId, approved);

    const auditPayload = {
      approved,
      auditNotes: auditNotes || (approved ? 'Approved by accredited verifier' : 'Rejected by accredited verifier'),
      verifierAddress,
      verificationTxHash,
      timestamp: Date.now()
    };
    await supabase.from('evidence_items').insert({
      bundle_id: bundleId,
      source_type: 'VERIFIER_AUDIT',
      payload: auditPayload,
      payload_hash: CryptographicService.hashPayload(auditPayload),
      signer_address: verifierAddress,
      integrity_status: 'VALID'
    });

    if (approved) {
      const tonnage = Math.round(Number((bundle.projects as any)?.claimed_annual_tonnage || 100));
      const vintage = new Date().getFullYear();

      const mintResult = await RelayerService.mintCreditOnChain(
        bundleId,
        tonnage,
        vintage
      );

      mintTxHash = mintResult.txHash;
      tokenId = mintResult.tokenId;

      await supabase
        .from('evidence_bundles')
        .update({ status: 'ISSUED' })
        .eq('bundle_id', bundleId);

      const recipient = (bundle.projects as any)?.owner_address || verifierAddress;

      await supabase
        .from('carbon_credit_nfts')
        .insert({
          token_id: tokenId,
          project_id: bundle.project_id,
          bundle_id: bundleId,
          current_owner: recipient,
          co2_tonnage: tonnage,
          vintage_year: vintage,
          merkle_root: bundle.merkle_root,
          token_uri: `ipfs://QmVerifierApproved/${bundleId}`,
          status: 'ISSUED'
        });

      await supabase
        .from('verifier_stakes')
        .update({
          reputation_score: Math.min(100, (verifier.reputation_score || 100) + 2)
        })
        .eq('verifier_address', verifierAddress);
    } else {
      await supabase
        .from('evidence_bundles')
        .update({ status: 'REJECTED' })
        .eq('bundle_id', bundleId);
    }

    await supabase
      .from('risk_assessments')
      .update({ verifier_required: false })
      .eq('bundle_id', bundleId);

    return res.status(200).json({
      success: true,
      approved,
      bundleId,
      transactionHash: mintTxHash,
      verificationTxHash,
      tokenId,
      message: approved ? 'Bundle approved and Carbon Credit NFT issued' : 'Bundle rejected by verifier audit'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
