import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/marketplace/credits — Get all issued/active carbon credit NFTs
router.get('/credits', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('carbon_credit_nfts')
      .select('*, projects(*), evidence_bundles(*)')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ credits: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/marketplace/retire — Permanently retire a carbon credit
router.post('/retire', async (req: Request, res: Response) => {
  try {
    const { tokenId, retirementReason, ownerAddress } = req.body;
    if (!tokenId || !retirementReason) {
      return res.status(400).json({ error: 'Missing tokenId or retirementReason' });
    }

    const { data, error } = await supabase
      .from('carbon_credit_nfts')
      .update({
        status: 'RETIRED',
        retirement_reason: retirementReason,
        retired_at: new Date().toISOString()
      })
      .eq('token_id', tokenId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, credit: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
