import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

router.post('/mint', async (req: Request, res: Response) => {
  try {
    const { bundleId, projectId, co2Tonnage, vintageYear, ownerAddress } = req.body;

    if (!bundleId || !projectId) {
      return res.status(400).json({ error: 'bundleId and projectId are required' });
    }

    const { data: risk } = await supabase.from('risk_assessments').select('*').eq('bundle_id', bundleId).single();
    if (!risk) {
      return res.status(400).json({ error: 'Evidence bundle has not been evaluated for risk' });
    }

    const { data: bundle } = await supabase.from('evidence_bundles').select('*').eq('bundle_id', bundleId).single();
    if (!bundle) {
      return res.status(404).json({ error: 'Evidence bundle not found' });
    }

    const tonnage = co2Tonnage || 500;
    const vintage = vintageYear || new Date().getFullYear();

    const { txHash, tokenId } = await RelayerService.mintCreditOnChain(
      CryptographicService.toBytes32(bundleId),
      tonnage,
      vintage
    );

    const { data: nftRecord, error: nftError } = await supabase
      .from('carbon_credit_nfts')
      .insert({
        token_id: tokenId,
        project_id: projectId,
        bundle_id: bundleId,
        current_owner: ownerAddress || '0x71C8363879F80e6138e09664D6745B73B47c2CEe',
        co2_tonnage: tonnage,
        vintage_year: vintage,
        merkle_root: bundle.merkle_root,
        status: 'ISSUED'
      })
      .select()
      .single();

    if (nftError) {
      console.warn('Supabase NFT insert notice:', nftError.message);
    }

    await supabase.from('evidence_bundles').update({ status: 'MINTED' }).eq('bundle_id', bundleId);

    return res.status(201).json({
      success: true,
      tokenId,
      txHash,
      nft: nftRecord,
      merkleRoot: bundle.merkle_root,
      message: 'Carbon credit ERC-721 token minted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/', async (_req: Request, res: Response) => {
  try {
    const { data: credits, error } = await supabase.from('carbon_credit_nfts').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ credits: credits || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
