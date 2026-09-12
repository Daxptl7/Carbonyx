import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';
import { randomUUID } from 'node:crypto';

const router = Router();
const PROJECT_TYPES = [
  'REFORESTATION',
  'BLUE_CARBON',
  'METHANE_CAPTURE',
  'RENEWABLE_ENERGY',
  'PEATLAND_RESTORATION',
  'MANGROVE_BLUE_CARBON',
  'SOIL_CARBON'
];

// GET /api/projects/baseline-explorer - Feed of all submitted projects and baseline observation data
router.get(
  '/baseline-explorer',
  requireRoles('PROJECT_PROPONENT', 'CORPORATE_BUYER', 'REGULATOR_AUDITOR'),
  async (_req: Request, res: Response) => {
    try {
      const { data: projects, error: pError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) return res.status(500).json({ error: pError.message });
      const { data: policyRecord } = await supabase
        .from('regulator_policies')
        .select('settings')
        .eq('policy_name', 'GLOBAL_ISSUANCE_POLICY')
        .maybeSingle();
      const observationWindowDays = Math.max(1, Number(policyRecord?.settings?.observationWindowDays || 14));

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
      let objections: any[] = [];

      if (bundle) {
        const [itemsRes, riskRes, objectionsRes] = await Promise.all([
          supabase.from('evidence_items').select('*').eq('bundle_id', bundle.bundle_id),
          supabase.from('risk_assessments').select('*').eq('bundle_id', bundle.bundle_id).maybeSingle(),
          supabase.from('project_objections').select('*').eq('project_id', proj.project_id).order('created_at', { ascending: false })
        ]);
        items = itemsRes.data || [];
        risk = riskRes.data || null;
        objections = objectionsRes.data || [];
      }

      // Calculate challenge window remaining (14 days from project creation)
      const createdAtMs = new Date(proj.created_at || Date.now()).getTime();
      const expiryMs = createdAtMs + (observationWindowDays * 24 * 60 * 60 * 1000);
      const remainingMs = Math.max(0, expiryMs - Date.now());
      const daysRemaining = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
      const hoursRemaining = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        enriched.push({
          project: proj,
          bundle,
          evidenceItems: items,
          risk,
          objections,
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

// GET /api/projects/my-registry - Projects created by the signed-in proponent.
router.get('/my-registry', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const auth = res.locals.auth;
    const ownerAddress = String(req.query.ownerAddress || '').trim();

    if (ownerAddress && !isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'ownerAddress must be a valid Ethereum address' });
    }

    let projectQuery = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    projectQuery = ownerAddress
      ? projectQuery.or(`created_by_user_id.eq.${auth.id},owner_address.ilike.${ownerAddress}`)
      : projectQuery.eq('created_by_user_id', auth.id);

    const { data: projects, error: projectsError } = await projectQuery;
    if (projectsError) return res.status(500).json({ error: projectsError.message });

    const registryProjects = [];
    for (const project of projects || []) {
      const { data: bundle } = await supabase
        .from('evidence_bundles')
        .select('*')
        .eq('project_id', project.project_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const [riskResult, objectionsResult, verifierRequestsResult, regulatoryActionsResult] = await Promise.all([
        bundle
          ? supabase.from('risk_assessments').select('*').eq('bundle_id', bundle.bundle_id).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        supabase
          .from('project_objections')
          .select('*')
          .eq('project_id', project.project_id)
          .order('created_at', { ascending: false }),
        bundle
          ? supabase.from('evidence_items').select('*').eq('bundle_id', bundle.bundle_id).eq('source_type', 'VERIFIER_AUDIT').order('submitted_at', { ascending: false })
          : Promise.resolve({ data: [], error: null }),
        supabase.from('regulatory_actions').select('*').eq('project_id', project.project_id).order('created_at', { ascending: false })
      ]);

      if (objectionsResult.error) {
        return res.status(500).json({ error: objectionsResult.error.message });
      }
      if (verifierRequestsResult.error) {
        return res.status(500).json({ error: verifierRequestsResult.error.message });
      }
      if (regulatoryActionsResult.error) {
        return res.status(500).json({ error: regulatoryActionsResult.error.message });
      }

      registryProjects.push({
        project,
        bundle: bundle || null,
        risk: riskResult.data || null,
        objections: objectionsResult.data || [],
        evidenceRequests: (verifierRequestsResult.data || []).filter((item: any) => item?.payload?.action === 'EVIDENCE_REQUESTED'),
        regulatoryActions: regulatoryActionsResult.data || []
      });
    }

    return res.status(200).json({ projects: registryProjects });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/challenge - Submit formal public baseline dispute
router.post('/challenge', requireRoles('CORPORATE_BUYER', 'REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { projectId, bundleId, challengerAddress, category, reason } = req.body;
    const auth = res.locals.auth;

    if (!projectId || !reason) {
      return res.status(400).json({ error: 'projectId and dispute reason are required' });
    }

    if (challengerAddress && !isAddress(challengerAddress)) {
      return res.status(400).json({ error: 'challengerAddress must be a valid Ethereum address' });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('project_id')
      .eq('project_id', projectId)
      .maybeSingle();
    if (projectError) return res.status(500).json({ error: projectError.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (bundleId) {
      const { data: bundle } = await supabase
        .from('evidence_bundles')
        .select('bundle_id')
        .eq('bundle_id', bundleId)
        .eq('project_id', projectId)
        .maybeSingle();
      if (!bundle) return res.status(400).json({ error: 'The evidence bundle does not belong to this project' });
    }

    const objectionId = `OBJ-${randomUUID()}`;
    const { data: objection, error: objectionError } = await supabase
      .from('project_objections')
      .insert({
        objection_id: objectionId,
        project_id: projectId,
        bundle_id: bundleId || null,
        raised_by_user_id: auth.id,
        raised_by_role: auth.role,
        raised_by_name: auth.displayName,
        challenger_address: challengerAddress || auth.walletAddress || null,
        category: category || 'SUSPICIOUS_CLAIM',
        reason: String(reason).trim(),
        status: 'OPEN'
      })
      .select()
      .single();

    if (objectionError) return res.status(500).json({ error: objectionError.message });

    // Flag bundle as challenged
    if (bundleId) {
      await supabase
        .from('evidence_bundles')
        .update({ status: 'CHALLENGED' })
        .eq('bundle_id', bundleId);

      const { data: existingRisk } = await supabase
        .from('risk_assessments')
        .select('id')
        .eq('bundle_id', bundleId)
        .maybeSingle();

      if (existingRisk) {
        await supabase
          .from('risk_assessments')
          .update({ auto_mint_eligible: false, verifier_required: true })
          .eq('bundle_id', bundleId);
      } else {
        await supabase
          .from('risk_assessments')
          .insert({
            bundle_id: bundleId,
            confidence_score: 55,
            risk_level: 'HIGH',
            anomaly_flags: [],
            explanation_reason: 'No AI assessment was available before the baseline objection was raised.',
            auto_mint_eligible: false,
            verifier_required: true
          });
      }
    }

    await supabase
      .from('projects')
      .update({ status: 'PENDING_CHALLENGE' })
      .eq('project_id', projectId);

    return res.status(200).json({
      success: true,
      projectId,
      bundleId,
      objection,
      message: 'Dispute submitted to Dispute & Staking Ledger. Flagged for verifier review.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/objections/:objectionId/respond - Rebut or revise a challenged baseline.
router.post('/objections/:objectionId/respond', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const auth = res.locals.auth;
    const objectionId = String(req.params.objectionId || '');
    const responseType = String(req.body?.responseType || '').toUpperCase();
    const responseText = String(req.body?.response || '').trim();
    const ownerAddress = String(req.body?.ownerAddress || '').trim();
    const revision = req.body?.revision || {};

    if (!['REBUTTAL', 'BASELINE_REVISION'].includes(responseType)) {
      return res.status(400).json({ error: 'responseType must be REBUTTAL or BASELINE_REVISION' });
    }
    if (responseText.length < 5) {
      return res.status(400).json({ error: 'Provide a response of at least 5 characters' });
    }
    if (ownerAddress && !isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'ownerAddress must be a valid Ethereum address' });
    }

    const { data: objection, error: objectionError } = await supabase
      .from('project_objections')
      .select('*')
      .eq('objection_id', objectionId)
      .maybeSingle();
    if (objectionError) return res.status(500).json({ error: objectionError.message });
    if (!objection) return res.status(404).json({ error: 'Objection not found' });
    if (['RESOLVED', 'DISMISSED'].includes(objection.status)) {
      return res.status(409).json({ error: 'This objection has already been closed' });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('project_id', objection.project_id)
      .maybeSingle();
    if (projectError) return res.status(500).json({ error: projectError.message });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const ownsProjectByAccount = project.created_by_user_id === auth.id;
    const ownsLegacyProjectByWallet = Boolean(
      ownerAddress && String(project.owner_address).toLowerCase() === ownerAddress.toLowerCase()
    );
    if (!ownsProjectByAccount && !ownsLegacyProjectByWallet) {
      return res.status(403).json({ error: 'Only the project proponent can respond to this objection' });
    }

    let revisionSnapshot = null;
    if (responseType === 'BASELINE_REVISION') {
      const projectUpdates: Record<string, any> = {};

      if (typeof revision.name === 'string' && revision.name.trim().length >= 2 && revision.name.trim() !== project.name) {
        projectUpdates.name = revision.name.trim();
      }
      if (typeof revision.projectType === 'string' && PROJECT_TYPES.includes(revision.projectType) && revision.projectType !== project.project_type) {
        projectUpdates.project_type = revision.projectType;
      }
      if (revision.location && typeof revision.location === 'object') {
        const revisedLocation = {
          country: String(revision.location.country || project.location?.country || 'Global').trim(),
          region: String(revision.location.region || project.location?.region || 'Default').trim()
        };
        if (revisedLocation.country !== project.location?.country || revisedLocation.region !== project.location?.region) {
          projectUpdates.location = revisedLocation;
        }
      }
      if (revision.claimedAnnualTonnage !== undefined) {
        const tonnage = Number(revision.claimedAnnualTonnage);
        if (!Number.isFinite(tonnage) || tonnage <= 0) {
          return res.status(400).json({ error: 'claimedAnnualTonnage must be a positive number' });
        }
        if (tonnage !== Number(project.claimed_annual_tonnage)) {
          projectUpdates.claimed_annual_tonnage = tonnage;
        }
      }

      if (Object.keys(projectUpdates).length === 0) {
        return res.status(400).json({ error: 'Change at least one baseline field before submitting a revision' });
      }

      revisionSnapshot = {
        previous: {
          name: project.name,
          projectType: project.project_type,
          location: project.location,
          claimedAnnualTonnage: project.claimed_annual_tonnage
        },
        revised: {
          name: projectUpdates.name ?? project.name,
          projectType: projectUpdates.project_type ?? project.project_type,
          location: projectUpdates.location ?? project.location,
          claimedAnnualTonnage: projectUpdates.claimed_annual_tonnage ?? project.claimed_annual_tonnage
        }
      };

      const { error: updateProjectError } = await supabase
        .from('projects')
        .update(projectUpdates)
        .eq('project_id', project.project_id);
      if (updateProjectError) return res.status(500).json({ error: updateProjectError.message });
    }

    const now = new Date().toISOString();
    const nextStatus = responseType === 'BASELINE_REVISION' ? 'REVISION_SUBMITTED' : 'RESPONDED';
    const { data: updatedObjection, error: updateObjectionError } = await supabase
      .from('project_objections')
      .update({
        status: nextStatus,
        response_type: responseType,
        proponent_response: responseText,
        revision_snapshot: revisionSnapshot,
        responded_at: now,
        updated_at: now
      })
      .eq('objection_id', objectionId)
      .select()
      .single();

    if (updateObjectionError) return res.status(500).json({ error: updateObjectionError.message });

    return res.status(200).json({
      success: true,
      objection: updatedObjection,
      message: responseType === 'BASELINE_REVISION'
        ? 'Baseline revision submitted for objection review'
        : 'Response submitted to the objection reviewer'
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
        created_by_user_id: res.locals.auth.id,
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
