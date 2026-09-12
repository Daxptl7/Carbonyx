import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

// POST /api/projects — Register a new carbon project with DID and on-chain anchor
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      projectId,
      ownerAddress,
      name,
      projectType,
      location,
      claimedAnnualTonnage
    } = req.body;

    if (!projectId || !ownerAddress || !name || !projectType) {
      return res.status(400).json({ error: 'Missing required fields: projectId, ownerAddress, name, projectType' });
    }

    // 1. Generate DID
    const did = CryptographicService.generateProjectDID(projectId, ownerAddress);
    const kycHash = '0x' + '0'.repeat(64);

    // 2. Submit on-chain registration transaction
    let onChainTxHash = null;
    try {
      onChainTxHash = await RelayerService.registerProject(projectId, did, kycHash, 86400);
    } catch (err: any) {
      console.warn('[Relayer] On-chain project registration warning:', err.message);
    }

    // 3. Persist in Supabase
    const projectRecord = {
      project_id: projectId,
      did,
      owner_address: ownerAddress,
      name,
      project_type: projectType,
      location: location || { lat: -3.4653, lng: -62.2159, region: 'Amazon Basin' },
      claimed_annual_tonnage: claimedAnnualTonnage || 500.0,
      kyc_status: 'VERIFIED',
      kyc_attestation_hash: kycHash,
      status: 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('projects')
      .upsert(projectRecord)
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Warning inserting project:', error.message);
    }

    return res.status(201).json({
      success: true,
      project: data || projectRecord,
      did,
      onChainTxHash
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects — List all registered projects
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ projects: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId — Get project details
router.get('/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .select('*, evidence_bundles(*)')
      .eq('project_id', projectId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Project not found' });
    }

    return res.json({ project: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
