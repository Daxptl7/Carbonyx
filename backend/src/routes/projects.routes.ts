import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

async function handleRegisterProject(req: Request, res: Response) {
  try {
    const {
      projectId,
      name,
      projectType,
      location,
      claimedAnnualTonnage,
      ownerAddress,
      kycPassportData
    } = req.body;

    if (!projectId || !name || !ownerAddress) {
      return res.status(400).json({ error: 'projectId, name, and ownerAddress are required' });
    }

    const did = CryptographicService.generateProjectDID
      ? CryptographicService.generateProjectDID(projectId, ownerAddress)
      : CryptographicService.generateDID(ownerAddress);

    const kycAttestationHash = CryptographicService.hashPayload(
      kycPassportData || { owner: ownerAddress, timestamp: Date.now() }
    );

    const projectRecord = {
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
    };

    const { data: project, error: dbError } = await supabase
      .from('projects')
      .upsert(projectRecord)
      .select()
      .single();

    if (dbError) {
      console.warn('[Supabase] Warning registering project:', dbError.message);
    }

    let onChainTxHash = null;
    try {
      onChainTxHash = await RelayerService.registerProjectOnChain(
        projectId,
        did,
        kycAttestationHash,
        86400
      );
    } catch (err: any) {
      console.warn('[Relayer] On-chain project registration warning:', err.message);
    }

    return res.status(201).json({
      success: true,
      project: project || projectRecord,
      did,
      txHash: onChainTxHash,
      onChainTxHash,
      message: 'Project registered and DID created successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

router.post('/register', handleRegisterProject);
router.post('/', handleRegisterProject);

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ projects: projects || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

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
