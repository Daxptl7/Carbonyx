import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { RelayerService } from '../services/relayer.service';
import { CryptographicService } from '../services/cryptographic.service';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';

const router = Router();

const reviewAction = (item: any) => item?.payload?.action || (typeof item?.payload?.approved === 'boolean' ? 'DECISION' : 'NOTE');

function buildQuorum(riskLevel: string, auditItems: any[], highRiskQuorum = 2) {
  const required = riskLevel === 'HIGH' ? Math.max(1, highRiskQuorum) : 1;
  const decisions = auditItems.filter((item) => reviewAction(item) === 'DECISION');
  const votesByVerifier = new Map<string, any>();

  for (const item of decisions) {
    const address = String(item?.payload?.verifierAddress || item?.signer_address || '').toLowerCase();
    if (address) votesByVerifier.set(address, item);
  }

  const votes = Array.from(votesByVerifier.values());
  return {
    required,
    approvals: votes.filter((item) => item?.payload?.approved === true).length,
    rejections: votes.filter((item) => item?.payload?.approved === false).length,
    votes: votes.map((item) => ({
      verifierAddress: item?.payload?.verifierAddress || item?.signer_address,
      approved: item?.payload?.approved,
      auditNotes: item?.payload?.auditNotes,
      recommendedTonnage: item?.payload?.recommendedTonnage,
      submittedAt: item?.submitted_at
    }))
  };
}

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
    const [assessmentResult, policyResult] = await Promise.all([
      supabase.from('risk_assessments').select('*').eq('verifier_required', true).limit(10),
      supabase.from('regulator_policies').select('settings').eq('policy_name', 'GLOBAL_ISSUANCE_POLICY').maybeSingle()
    ]);
    const assessments = assessmentResult.data;
    const rError = assessmentResult.error;
    const highRiskQuorum = Number(policyResult.data?.settings?.highRiskVerifierQuorum || 2);

    if (rError) return res.status(500).json({ error: rError.message });

    const bundleIds = (assessments || []).map((item) => item.bundle_id);
    if (bundleIds.length === 0) return res.status(200).json({ queue: [] });

    const { data: bundles, error: bundleError } = await supabase
      .from('evidence_bundles')
      .select('*')
      .in('bundle_id', bundleIds);
    if (bundleError) return res.status(500).json({ error: bundleError.message });

    const projectIds = (bundles || []).map((bundle) => bundle.project_id);
    const [itemsResult, projectsResult] = await Promise.all([
      supabase.from('evidence_items').select('*').in('bundle_id', bundleIds).order('submitted_at', { ascending: true }),
      supabase.from('projects').select('*').in('project_id', projectIds)
    ]);
    if (itemsResult.error) return res.status(500).json({ error: itemsResult.error.message });
    if (projectsResult.error) return res.status(500).json({ error: projectsResult.error.message });

    const queue = (assessments || []).map((assessment) => {
      const bundle = (bundles || []).find((item) => item.bundle_id === assessment.bundle_id) || null;
      const project = (projectsResult.data || []).find((item) => item.project_id === bundle?.project_id) || null;
      const evidenceItems = (itemsResult.data || []).filter((item) => item.bundle_id === assessment.bundle_id);
      const auditItems = evidenceItems.filter((item) => item.source_type === 'VERIFIER_AUDIT');

      return {
        ...assessment,
        evidence_bundles: bundle ? { ...bundle, projects: project, evidence_items: evidenceItems.filter((item) => item.source_type !== 'VERIFIER_AUDIT') } : null,
        review_history: auditItems,
        quorum: buildQuorum(assessment.risk_level, auditItems, highRiskQuorum)
      };
    });

    return res.status(200).json({ queue });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/verifiers/request-evidence - Ask the proponent for clarification or new evidence.
router.post('/request-evidence', requireRoles('INDEPENDENT_VERIFIER'), async (req: Request, res: Response) => {
  try {
    const { bundleId, verifierAddress, category, message, dueDate } = req.body;
    if (!bundleId || !verifierAddress || !message || String(message).trim().length < 10) {
      return res.status(400).json({ error: 'bundleId, verifierAddress, and a detailed evidence request are required' });
    }
    if (!isAddress(verifierAddress)) {
      return res.status(400).json({ error: 'verifierAddress must be a valid Ethereum address' });
    }

    const { data: verifier } = await supabase
      .from('verifier_stakes')
      .select('active_in_pool')
      .eq('verifier_address', verifierAddress)
      .maybeSingle();
    if (!verifier?.active_in_pool) {
      return res.status(403).json({ error: 'Only an active staked verifier can request evidence' });
    }

    const { data: bundle } = await supabase
      .from('evidence_bundles')
      .select('bundle_id')
      .eq('bundle_id', bundleId)
      .maybeSingle();
    if (!bundle) return res.status(404).json({ error: 'Bundle not found' });

    const payload = {
      action: 'EVIDENCE_REQUESTED',
      category: category || 'ADDITIONAL_DOCUMENTATION',
      message: String(message).trim(),
      dueDate: dueDate || null,
      verifierAddress,
      verifierName: res.locals.auth.displayName,
      timestamp: Date.now()
    };
    const { data: requestItem, error } = await supabase
      .from('evidence_items')
      .insert({
        bundle_id: bundleId,
        source_type: 'VERIFIER_AUDIT',
        payload,
        payload_hash: CryptographicService.hashPayload(payload),
        signer_address: verifierAddress,
        integrity_status: 'VALID'
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ success: true, request: requestItem, message: 'Evidence request recorded in the audit trail' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/verifiers/verify - Record human verifier audit decision
router.post('/verify', requireRoles('INDEPENDENT_VERIFIER'), async (req: Request, res: Response) => {
  try {
    const {
      bundleId,
      verifierAddress,
      approved,
      auditNotes,
      checklist,
      conflictConfirmed,
      decisionConfidence,
      recommendedTonnage
    } = req.body;

    if (!bundleId || !verifierAddress || approved === undefined) {
      return res.status(400).json({ error: 'bundleId, verifierAddress, and approved decision are required' });
    }
    if (!isAddress(verifierAddress)) {
      return res.status(400).json({ error: 'verifierAddress must be a valid Ethereum address' });
    }
    if (!auditNotes || String(auditNotes).trim().length < 10) {
      return res.status(400).json({ error: 'Add detailed audit notes before submitting a decision' });
    }
    if (!checklist || Object.values(checklist).length < 5 || !Object.values(checklist).every(Boolean)) {
      return res.status(400).json({ error: 'Complete every verification checklist item before submitting a decision' });
    }
    if (conflictConfirmed !== true) {
      return res.status(400).json({ error: 'The conflict-of-interest declaration must be confirmed' });
    }
    if (!Number.isFinite(Number(decisionConfidence)) || Number(decisionConfidence) < 0 || Number(decisionConfidence) > 100) {
      return res.status(400).json({ error: 'Decision confidence must be between 0 and 100' });
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

    const [riskResult, policyResult] = await Promise.all([
      supabase.from('risk_assessments').select('risk_level').eq('bundle_id', bundleId).maybeSingle(),
      supabase.from('regulator_policies').select('settings').eq('policy_name', 'GLOBAL_ISSUANCE_POLICY').maybeSingle()
    ]);
    const risk = riskResult.data;
    const highRiskQuorum = Number(policyResult.data?.settings?.highRiskVerifierQuorum || 2);

    const { data: existingAudits, error: auditsError } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('bundle_id', bundleId)
      .eq('source_type', 'VERIFIER_AUDIT')
      .order('submitted_at', { ascending: true });
    if (auditsError) return res.status(500).json({ error: auditsError.message });

    const alreadyVoted = (existingAudits || []).some((item) =>
      reviewAction(item) === 'DECISION'
      && String(item?.payload?.verifierAddress || item?.signer_address || '').toLowerCase() === verifierAddress.toLowerCase()
    );
    if (alreadyVoted) {
      return res.status(409).json({ error: 'This verifier wallet has already voted on the selected bundle' });
    }

    const auditPayload = {
      action: 'DECISION',
      approved,
      auditNotes: String(auditNotes).trim(),
      checklist,
      conflictConfirmed,
      decisionConfidence: Number(decisionConfidence),
      recommendedTonnage: Number.isFinite(Number(recommendedTonnage)) ? Number(recommendedTonnage) : null,
      verifierAddress,
      verifierName: res.locals.auth.displayName,
      timestamp: Date.now()
    };
    const { data: voteItem, error: voteError } = await supabase.from('evidence_items').insert({
      bundle_id: bundleId,
      source_type: 'VERIFIER_AUDIT',
      payload: auditPayload,
      payload_hash: CryptographicService.hashPayload(auditPayload),
      signer_address: verifierAddress,
      integrity_status: 'VALID'
    }).select().single();
    if (voteError) return res.status(500).json({ error: voteError.message });

    const quorum = buildQuorum(risk?.risk_level || 'HIGH', [...(existingAudits || []), voteItem], highRiskQuorum);
    const finalized = quorum.approvals >= quorum.required || quorum.rejections >= quorum.required;
    if (!finalized) {
      return res.status(200).json({
        success: true,
        finalized: false,
        approved,
        bundleId,
        quorum,
        message: `Vote recorded. ${quorum.required - Math.max(quorum.approvals, quorum.rejections)} more independent verifier decision required.`
      });
    }

    const finalApproved = quorum.approvals >= quorum.required;
    let mintTxHash = null;
    let tokenId = null;
    const verificationTxHash = await RelayerService.recordVerificationOnChain(bundleId, finalApproved);

    if (finalApproved) {
      const proposedTonnages = quorum.votes
        .filter((vote) => vote.approved)
        .map((vote) => Number(vote.recommendedTonnage))
        .filter((value) => Number.isFinite(value) && value > 0);
      const tonnage = Math.round(proposedTonnages.length
        ? proposedTonnages.reduce((sum, value) => sum + value, 0) / proposedTonnages.length
        : Number((bundle.projects as any)?.claimed_annual_tonnage || 100));
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

    const finalizationPayload = {
      action: 'QUORUM_FINALIZED',
      approved: finalApproved,
      quorum,
      verificationTxHash,
      mintTxHash,
      tokenId,
      timestamp: Date.now()
    };
    await supabase.from('evidence_items').insert({
      bundle_id: bundleId,
      source_type: 'VERIFIER_AUDIT',
      payload: finalizationPayload,
      payload_hash: CryptographicService.hashPayload(finalizationPayload),
      signer_address: verifierAddress,
      integrity_status: 'VALID'
    });

    return res.status(200).json({
      success: true,
      finalized: true,
      approved: finalApproved,
      bundleId,
      quorum,
      transactionHash: mintTxHash,
      verificationTxHash,
      tokenId,
      message: finalApproved ? 'Verifier quorum reached and Carbon Credit NFT issued' : 'Verifier quorum rejected the evidence bundle'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
