import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { requireRoles } from '../auth/middleware';
import { isAddress } from 'ethers';

const router = Router();

// GET /api/marketplace/credits - Catalog of verified carbon credits
router.get('/credits', requireRoles('CORPORATE_BUYER', 'REGULATOR_AUDITOR'), async (req: Request, res: Response) => {
  try {
    const { methodology } = req.query;
    let query = supabase
      .from('carbon_credit_nfts')
      .select('*, projects(*)')
      .in('status', ['ISSUED', 'TRANSFERRED']);

    const { data: credits, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ credits: credits || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/marketplace/escrow/buy - Initiate escrow purchase
router.post('/escrow/buy', requireRoles('CORPORATE_BUYER'), async (req: Request, res: Response) => {
  try {
    const { tokenId, buyerAddress } = req.body;
    const depositAmount = req.body.depositAmount !== undefined ? req.body.depositAmount : req.body.amountEth;

    if (!tokenId || !buyerAddress || depositAmount === undefined) {
      return res.status(400).json({ error: 'tokenId, buyerAddress, and depositAmount are required' });
    }
    if (!isAddress(buyerAddress) || !Number.isFinite(Number(depositAmount)) || Number(depositAmount) <= 0) {
      return res.status(400).json({ error: 'Provide a valid buyer address and positive escrow deposit' });
    }

    const { data: nft } = await supabase
      .from('carbon_credit_nfts')
      .select('*')
      .eq('token_id', tokenId)
      .single();

    if (!nft) return res.status(404).json({ error: 'Credit NFT not found' });
    if (!['ISSUED', 'TRANSFERRED'].includes(nft.status)) {
      return res.status(409).json({ error: 'This credit is not available for purchase' });
    }
    if (String(nft.current_owner).toLowerCase() === buyerAddress.toLowerCase()) {
      return res.status(409).json({ error: 'The connected wallet already owns this credit' });
    }

    const escrowId = `escrow-${tokenId}-${Date.now()}`;

    // 1. Insert Escrow Order
    const { data: escrow, error: eError } = await supabase
      .from('escrows')
      .insert({
        escrow_id: escrowId,
        token_id: tokenId,
        buyer_address: buyerAddress,
        seller_address: nft.current_owner,
        deposit_amount: depositAmount,
        status: 'LOCKED',
        challenge_window_expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (eError) return res.status(500).json({ error: eError.message });

    // 2. Update NFT Status to ESCROWED
    await supabase
      .from('carbon_credit_nfts')
      .update({ status: 'ESCROWED' })
      .eq('token_id', tokenId);

    return res.status(201).json({
      success: true,
      escrow,
      escrowId: escrow.escrow_id,
      message: 'Escrow deposit locked successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/marketplace/escrow/release - Release escrow to seller and transfer NFT
router.post('/escrow/release', requireRoles('CORPORATE_BUYER'), async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.body;

    if (!escrowId) {
      return res.status(400).json({ error: 'escrowId is required' });
    }

    const { data: escrow } = await supabase
      .from('escrows')
      .select('*')
      .eq('escrow_id', escrowId)
      .single();

    if (!escrow || escrow.status !== 'LOCKED') {
      return res.status(400).json({ error: 'Escrow order not found or not in LOCKED state' });
    }

    await supabase
      .from('escrows')
      .update({ status: 'RELEASED' })
      .eq('escrow_id', escrowId);

    await supabase
      .from('carbon_credit_nfts')
      .update({
        current_owner: escrow.buyer_address,
        status: 'TRANSFERRED'
      })
      .eq('token_id', escrow.token_id);

    return res.status(200).json({
      success: true,
      escrowId,
      newOwner: escrow.buyer_address,
      message: 'Escrow settled and carbon credit transferred to buyer'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Helper retirement handler
const handleRetirement = async (req: Request, res: Response) => {
  try {
    const tokenId = req.body.tokenId;
    const retirementReason = req.body.retirementReason || req.body.retireReason || 'Corporate ESG Net-Zero Offset';
    const ownerAddress = req.body.ownerAddress || req.body.retiredBy || req.body.beneficiary;

    if (!tokenId) {
      return res.status(400).json({ error: 'tokenId is required' });
    }
    if (!ownerAddress || !isAddress(ownerAddress)) {
      return res.status(400).json({ error: 'A valid owner wallet is required to retire this credit' });
    }

    const { data: ownedCredit, error: ownerLookupError } = await supabase
      .from('carbon_credit_nfts')
      .select('current_owner, status')
      .eq('token_id', tokenId)
      .maybeSingle();
    if (ownerLookupError) return res.status(500).json({ error: ownerLookupError.message });
    if (!ownedCredit) return res.status(404).json({ error: 'Credit NFT not found' });
    if (String(ownedCredit.current_owner).toLowerCase() !== ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Only the current owner wallet can retire this credit' });
    }
    if (ownedCredit.status !== 'ISSUED' && ownedCredit.status !== 'TRANSFERRED') {
      return res.status(409).json({ error: 'This credit cannot be retired in its current state' });
    }

    const retiredAt = new Date().toISOString();
    const certificateHash = `0xcert_${tokenId}_${Date.now()}`;

    // Update in Supabase gracefully
    const { data: retiredCredit, error: retirementError } = await supabase
      .from('carbon_credit_nfts')
      .update({
        status: 'RETIRED',
        retirement_reason: retirementReason,
        retired_at: retiredAt
      })
      .eq('token_id', tokenId)
      .select('token_id, project_id, co2_tonnage, vintage_year, merkle_root')
      .maybeSingle();

    if (retirementError) {
      return res.status(500).json({ error: retirementError.message });
    }
    if (!retiredCredit) {
      return res.status(404).json({ error: 'Credit NFT not found' });
    }

    return res.status(200).json({
      success: true,
      certificateHash,
      certificate: {
        certificateId: `CERT-RETIRE-${tokenId}-${Date.now()}`,
        beneficiary: req.body.beneficiary || ownerAddress,
        tonnage: retiredCredit.co2_tonnage,
        vintage: retiredCredit.vintage_year,
        projectName: 'Verified Carbon Sink',
        merkleRoot: retiredCredit.merkle_root,
        retiredAt,
        retirementReason
      },
      message: 'Carbon credit successfully retired & Certificate generated'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

router.post('/retire', requireRoles('CORPORATE_BUYER'), handleRetirement);
router.post('/credits/retire', requireRoles('CORPORATE_BUYER'), handleRetirement);

export default router;
