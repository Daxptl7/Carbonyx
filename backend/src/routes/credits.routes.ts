import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { RelayerService } from '../services/relayer.service';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';

const router = Router();

router.post('/mint', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const { bundleId, projectId, co2Tonnage, vintageYear, ownerAddress } = req.body;

    if (!bundleId || !projectId || !ownerAddress || !isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'bundleId, projectId, and a valid ownerAddress are required' });
    }

    const { data: risk } = await supabase.from('risk_assessments').select('*').eq('bundle_id', bundleId).single();
    if (!risk) {
      return res.status(400).json({ error: 'Evidence bundle has not been evaluated for risk' });
    }

    const { data: bundle } = await supabase.from('evidence_bundles').select('*').eq('bundle_id', bundleId).single();
    if (!bundle) {
      return res.status(404).json({ error: 'Evidence bundle not found' });
    }

    if (bundle.project_id !== projectId) {
      return res.status(409).json({ error: 'Evidence bundle does not belong to the supplied project' });
    }
    if (bundle.status === 'ISSUED') {
      return res.status(409).json({ error: 'This evidence bundle has already been issued' });
    }

    const verifierApproved = bundle.status === 'VERIFIED';
    if (!risk.auto_mint_eligible && !(risk.verifier_required && verifierApproved)) {
      return res.status(409).json({
        error: risk.verifier_required
          ? 'Minting is locked until an independent verifier approves this evidence bundle'
          : 'Evidence bundle did not pass the issuance policy gate'
      });
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
        current_owner: ownerAddress,
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

    await supabase.from('evidence_bundles').update({ status: 'ISSUED' }).eq('bundle_id', bundleId);

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
