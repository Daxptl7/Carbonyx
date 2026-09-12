import { randomUUID } from 'node:crypto';
import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireRoles } from '../auth/middleware';

const router = Router();

const DEFAULT_POLICY = {
  minimumAiConfidence: 85,
  maximumEvidenceDeviation: 15,
  highRiskVerifierQuorum: 2,
  observationWindowDays: 14,
  automaticEscalation: true
};

router.get('/overview', requireRoles('REGULATOR_AUDITOR'), async (_req: Request, res: Response) => {
  try {
    const auth = res.locals.auth;
    const [
      projectsResult,
      bundlesResult,
      risksResult,
      evidenceResult,
      creditsResult,
      verifiersResult,
      objectionsResult,
      disputesResult,
      actionsResult,
      policiesResult,
      watchlistResult
    ] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('evidence_bundles').select('*').order('created_at', { ascending: false }),
      supabase.from('risk_assessments').select('*').order('computed_at', { ascending: false }),
      supabase.from('evidence_items').select('*').order('submitted_at', { ascending: false }),
      supabase.from('carbon_credit_nfts').select('*').order('created_at', { ascending: false }),
      supabase.from('verifier_stakes').select('*').order('reputation_score', { ascending: false }),
      supabase.from('project_objections').select('*').order('created_at', { ascending: false }),
      supabase.from('disputes').select('*'),
      supabase.from('regulatory_actions').select('*').order('created_at', { ascending: false }),
      supabase.from('regulator_policies').select('*').eq('policy_name', 'GLOBAL_ISSUANCE_POLICY').maybeSingle(),
      supabase.from('regulator_watchlist').select('*').eq('regulator_user_id', auth.id).order('created_at', { ascending: false })
    ]);

    const firstError = [projectsResult, bundlesResult, risksResult, evidenceResult, creditsResult, verifiersResult, objectionsResult, disputesResult, actionsResult, policiesResult, watchlistResult]
      .find((result) => result.error)?.error;
    if (firstError) return res.status(500).json({ error: firstError.message });

    const projects = projectsResult.data || [];
    const bundles = bundlesResult.data || [];
    const risks = risksResult.data || [];
    const evidence = evidenceResult.data || [];
    const credits = creditsResult.data || [];
    const actions = actionsResult.data || [];

    const investigations = projects.map((project) => {
      const bundle = bundles.find((item) => item.project_id === project.project_id) || null;
      const risk = bundle ? risks.find((item) => item.bundle_id === bundle.bundle_id) || null : null;
      return {
        project,
        bundle,
        risk,
        evidenceItems: bundle ? evidence.filter((item) => item.bundle_id === bundle.bundle_id) : [],
        credits: credits.filter((item) => item.project_id === project.project_id),
        objections: (objectionsResult.data || []).filter((item) => item.project_id === project.project_id),
        regulatoryActions: actions.filter((item) => item.project_id === project.project_id)
      };
    });

    const integrityAlerts: any[] = [];
    const merkleGroups = new Map<string, any[]>();
    for (const bundle of bundles) {
      const group = merkleGroups.get(bundle.merkle_root) || [];
      group.push(bundle);
      merkleGroups.set(bundle.merkle_root, group);
    }
    for (const [merkleRoot, group] of merkleGroups) {
      const projectIds = [...new Set(group.map((item) => item.project_id))];
      if (projectIds.length > 1) integrityAlerts.push({
        id: `merkle-${merkleRoot}`,
        severity: 'CRITICAL',
        type: 'DUPLICATE_MERKLE_ROOT',
        title: 'Evidence root reused across projects',
        detail: `${projectIds.length} projects share Merkle root ${merkleRoot.slice(0, 14)}…`,
        projectIds
      });
    }

    const snapshotGroups = new Map<string, any[]>();
    for (const item of evidence.filter((entry) => entry.source_type === 'SATELLITE_NDVI')) {
      const hash = String(item.payload?.snapshotHash || '');
      if (!hash) continue;
      const group = snapshotGroups.get(hash) || [];
      group.push(item);
      snapshotGroups.set(hash, group);
    }
    for (const [hash, group] of snapshotGroups) {
      const bundleIds = [...new Set(group.map((item) => item.bundle_id))];
      if (bundleIds.length > 1) integrityAlerts.push({
        id: `snapshot-${hash}`,
        severity: 'HIGH',
        type: 'DUPLICATE_SATELLITE_EVIDENCE',
        title: 'Satellite snapshot reused',
        detail: `${bundleIds.length} evidence bundles reference snapshot ${hash.slice(0, 14)}…`,
        bundleIds
      });
    }

    const locationGroups = new Map<string, any[]>();
    for (const project of projects) {
      const locationKey = `${project.location?.country || ''}/${project.location?.region || ''}`.toLowerCase();
      if (!locationKey || locationKey === '/') continue;
      const group = locationGroups.get(locationKey) || [];
      group.push(project);
      locationGroups.set(locationKey, group);
    }
    for (const [location, group] of locationGroups) {
      if (group.length > 1) integrityAlerts.push({
        id: `location-${location}`,
        severity: 'MEDIUM',
        type: 'OVERLAPPING_JURISDICTION',
        title: 'Projects share the same declared region',
        detail: `${group.length} projects are registered in ${location.replace('/', ', ')}. Boundary review recommended.`,
        projectIds: group.map((item) => item.project_id)
      });
    }

    return res.status(200).json({
      investigations,
      credits,
      verifiers: verifiersResult.data || [],
      disputes: disputesResult.data || [],
      integrityAlerts,
      actions,
      policy: policiesResult.data?.settings || DEFAULT_POLICY,
      watchlist: watchlistResult.data || []
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/actions', requireRoles('REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { projectId, tokenId, actionType, reason } = req.body;
    const allowed = ['SUSPEND_PROJECT', 'CLEAR_PROJECT', 'FREEZE_TRANSFERS', 'REVOKE_CREDITS', 'REOPEN_REVIEW', 'REQUIRE_MONITORING'];
    if (!projectId || !allowed.includes(actionType) || !reason || String(reason).trim().length < 10) {
      return res.status(400).json({ error: 'A project, valid enforcement action, and detailed reason are required' });
    }

    const { data: project } = await supabase.from('projects').select('*').eq('project_id', projectId).maybeSingle();
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const { data: bundle } = await supabase.from('evidence_bundles').select('*').eq('project_id', projectId).order('created_at', { ascending: false }).limit(1).maybeSingle();
    const { data: projectCredits } = await supabase.from('carbon_credit_nfts').select('token_id,status').eq('project_id', projectId);

    const previousState = { projectStatus: project.status, bundleStatus: bundle?.status || null, credits: projectCredits || [] };
    if (actionType === 'SUSPEND_PROJECT') await supabase.from('projects').update({ status: 'SUSPENDED' }).eq('project_id', projectId);
    if (actionType === 'CLEAR_PROJECT') await supabase.from('projects').update({ status: 'ACTIVE' }).eq('project_id', projectId);
    if (actionType === 'FREEZE_TRANSFERS') await supabase.from('carbon_credit_nfts').update({ status: 'DISPUTED' }).eq('project_id', projectId).in('status', ['ISSUED', 'TRANSFERRED', 'ESCROWED']);
    if (actionType === 'REVOKE_CREDITS') await supabase.from('carbon_credit_nfts').update({ status: 'REVOKED' }).eq('project_id', projectId).neq('status', 'RETIRED');
    if (actionType === 'REOPEN_REVIEW' && bundle) {
      await supabase.from('evidence_bundles').update({ status: 'ANOMALOUS' }).eq('bundle_id', bundle.bundle_id);
      await supabase.from('risk_assessments').update({ verifier_required: true, auto_mint_eligible: false }).eq('bundle_id', bundle.bundle_id);
    }

    const newState = {
      projectStatus: actionType === 'SUSPEND_PROJECT' ? 'SUSPENDED' : actionType === 'CLEAR_PROJECT' ? 'ACTIVE' : project.status,
      enforcement: actionType
    };
    const auth = res.locals.auth;
    const actionRecord = {
      action_id: `REG-${randomUUID()}`,
      project_id: projectId,
      token_id: tokenId || null,
      regulator_user_id: auth.id,
      regulator_name: auth.displayName,
      action_type: actionType,
      reason: String(reason).trim(),
      previous_state: previousState,
      new_state: newState
    };
    const { data: action, error } = await supabase.from('regulatory_actions').insert(actionRecord).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, action, message: `${actionType.replace(/_/g, ' ')} recorded successfully` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/policy', requireRoles('REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const settings = req.body?.settings;
    if (!settings || !Number.isFinite(Number(settings.minimumAiConfidence)) || !Number.isFinite(Number(settings.maximumEvidenceDeviation))) {
      return res.status(400).json({ error: 'Valid policy settings are required' });
    }
    const auth = res.locals.auth;
    const { data: policy, error } = await supabase.from('regulator_policies').upsert({
      policy_name: 'GLOBAL_ISSUANCE_POLICY',
      settings,
      updated_by_user_id: auth.id,
      updated_by_name: auth.displayName,
      updated_at: new Date().toISOString()
    }, { onConflict: 'policy_name' }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, policy, message: 'Global issuance policy updated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/watchlist', requireRoles('REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { entityType, entityId, notes } = req.body;
    const auth = res.locals.auth;
    if (!['PROJECT', 'VERIFIER', 'WALLET', 'REGION'].includes(entityType)) {
      return res.status(400).json({ error: 'A valid watchlist entity type is required' });
    }
    if (!entityId) return res.status(400).json({ error: 'entityId is required' });

    const { data: existing } = await supabase.from('regulator_watchlist').select('id').eq('regulator_user_id', auth.id).eq('entity_type', entityType).eq('entity_id', entityId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('regulator_watchlist').delete().eq('id', existing.id);
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ success: true, watching: false, message: 'Removed from regulatory watchlist' });
    }

    const { data: item, error } = await supabase.from('regulator_watchlist').insert({
      regulator_user_id: auth.id,
      entity_type: entityType,
      entity_id: entityId,
      notes: notes || null
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true, watching: true, item, message: 'Added to regulatory watchlist' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/disputes/:disputeId/resolve', requireRoles('REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const disputeId = String(req.params.disputeId || '');
    const { ruling, reason } = req.body;
    if (!['UPHELD', 'DISMISSED'].includes(ruling) || !reason || String(reason).trim().length < 10) {
      return res.status(400).json({ error: 'A valid ruling and detailed resolution reason are required' });
    }

    const { data: dispute } = await supabase.from('disputes').select('*').eq('dispute_id', disputeId).maybeSingle();
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    if (dispute.status !== 'OPEN') return res.status(409).json({ error: 'This dispute already has a final ruling' });

    const auth = res.locals.auth;
    const { data: resolved, error } = await supabase.from('disputes').update({
      status: ruling,
      resolved_by: `${auth.displayName}: ${String(reason).trim()}`,
      resolved_at: new Date().toISOString()
    }).eq('dispute_id', disputeId).select().single();
    if (error) return res.status(500).json({ error: error.message });

    if (ruling === 'UPHELD') {
      await supabase.from('carbon_credit_nfts').update({ status: 'REVOKED' }).eq('token_id', dispute.token_id).neq('status', 'RETIRED');
    }

    return res.status(200).json({ success: true, dispute: resolved, message: `Dispute ${ruling.toLowerCase()} and ruling recorded` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
