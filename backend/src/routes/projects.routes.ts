import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { projectId, name, projectType, location, claimedAnnualTonnage, ownerAddress, kycPassportData } = req.body;

    if (!projectId || !name || !ownerAddress) {
      return res.status(400).json({ error: 'projectId, name, and ownerAddress are required' });
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
        return res.status(200).json({ project: existing, message: 'Project already registered' });
      }
      return res.status(500).json({ error: dbError.message });
    }

    const txHash = await RelayerService.registerProjectOnChain(
      CryptographicService.toBytes32(projectId),
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

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: projects, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ projects });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
