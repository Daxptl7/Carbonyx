import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';

const router = Router();

// GET /api/projects/baseline-explorer - Feed of all submitted projects and baseline observation data
router.get(
  '/baseline-explorer',
  requireRoles('PROJECT_PROPONENT', 'REGULATOR_AUDITOR'),
  async (_req: Request, res: Response) => {
    try {
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) return res.status(500).json({ error: pError.message });

      const enriched = [];
      for (const proj of (projects || [])) {
      const { data: bundle } = await supabase
        .from('evidence_bundles')
        .select('*')
        .eq('project_id', proj.project_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let items: any[] = [];
      let risk: any = null;

      if (bundle) {
        const [itemsRes, riskRes] = await Promise.all([
          supabase.from('evidence_items').select('*').eq('bundle_id', bundle.bundle_id),
          supabase.from('risk_assessments').select('*').eq('bundle_id', bundle.bundle_id).maybeSingle()
        ]);
        items = itemsRes.data || [];
        risk = riskRes.data || null;
      }

      // Calculate challenge window remaining (14 days from project creation)
      const createdAtMs = new Date(proj.created_at || Date.now()).getTime();
      const expiryMs = createdAtMs + (14 * 24 * 60 * 60 * 1000);
      const remainingMs = Math.max(0, expiryMs - Date.now());
      const daysRemaining = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        enriched.push({
          project: proj,
          bundle,
          evidenceItems: items,
          risk,
          challengeWindow: {
            daysRemaining,
            hoursRemaining,
            isActive: remainingMs > 0,
            expiryDate: new Date(expiryMs).toISOString()
          }
        });
      }

      return res.status(200).json({ projects: enriched });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/projects/challenge - Submit formal public baseline dispute
router.post('/challenge', requireRoles('REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { projectId, bundleId, challengerAddress, category, reason } = req.body;

    if (!projectId || !reason) {
      return res.status(400).json({ error: 'projectId and dispute reason are required' });
    }

    // Flag bundle as challenged
    if (bundleId) {
      await supabase
        .from('evidence_bundles')
        .update({ status: 'CHALLENGED' })
        .eq('bundle_id', bundleId);

      await supabase
        .from('risk_assessments')
        .upsert({
          bundle_id: bundleId,
          confidence_score: 55,
          risk_level: 'HIGH',
          anomaly_flags: [`COMMUNITY_CHALLENGE: ${category || 'SUSPICIOUS_CLAIM'}`],
          explanation_reason: `Public baseline challenged: "${reason}" by ${challengerAddress || 'Anonymous'}`,
          auto_mint_eligible: false,
          verifier_required: true
        });
    }

    return res.status(200).json({
      success: true,
      projectId,
      bundleId,
      message: 'Dispute submitted to Dispute & Staking Ledger. Flagged for verifier review.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/register - Register new carbon project & generate DID
router.post('/register', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const { projectId, name, projectType, location, claimedAnnualTonnage, ownerAddress, kycPassportData } = req.body;

    if (!projectId || !name || !ownerAddress) {
      return res.status(400).json({ error: 'projectId, name, and ownerAddress are required' });
    }
    if (!isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'ownerAddress must be a valid Ethereum address' });
    }

    const did = CryptographicService.generateDID(ownerAddress);
    const kycAttestationHash = CryptographicService.hashPayload(kycPassportData || { owner: ownerAddress, timestamp: Date.now() });

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .insert({
        project_id: projectId,
        did,
        owner_address: ownerAddress,
        name,
        project_type: projectType || 'REFORESTATION',
        location: location || { country: 'Global', region: 'Default' },
        claimed_annual_tonnage: claimedAnnualTonnage || 1000,
        kyc_status: 'VERIFIED',
        kyc_attestation_hash: kycAttestationHash,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        const { data: existing } = await supabase.from('projects').select('*').eq('project_id', projectId).single();
        return res.status(200).json({ project: existing, did: existing?.did || did, message: 'Project already registered' });
      }
      return res.status(500).json({ error: dbError.message });
    }

    const txHash = await RelayerService.registerProjectOnChain(
      projectId,
      did,
      kycAttestationHash
    );

    return res.status(201).json({
      success: true,
      project,
      did,
      txHash,
      message: 'Project registered and DID created successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { data: project, error } = await supabase.from('projects').select('*').eq('project_id', projectId).single();
    if (error) return res.status(404).json({ error: 'Project not found' });
    return res.status(200).json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ projects: projects || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
