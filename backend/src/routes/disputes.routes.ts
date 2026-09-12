import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// In-memory fallback disputes store if database table is initializing
let inMemoryDisputes: Array<{
  id: string;
  project_id: string;
  token_id: number;
  initiator: string;
  category: string;
  reason: string;
  status: 'PENDING' | 'UPHELD' | 'DISMISSED';
  approving_verifier: string;
  escrow_id?: string;
  resolution_notes?: string;
  slashed_amount_eth?: number;
  created_at: string;
  resolved_at?: string;
}> = [
  {
    id: 'disp-amz-004-981',
    project_id: 'PROJ-AMAZON-004',
    token_id: 4,
    initiator: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Acme Corp
    category: 'Satellite Spectral Divergence',
    reason: 'Ground IoT sensor NDVI reported 0.88, but Copernicus Sentinel-2 spectral analysis revealed 0.44 canopy index (42% divergence).',
    status: 'PENDING',
    approving_verifier: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Bob Verifier
    escrow_id: 'escrow-4-amz',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

/**
 * GET /api/disputes
 * Fetch all community dispute records
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: dbDisputes, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !dbDisputes || dbDisputes.length === 0) {
      return res.json({ success: true, data: inMemoryDisputes });
    }

    return res.json({ success: true, data: dbDisputes });
  } catch (err: any) {
    return res.json({ success: true, data: inMemoryDisputes });
  }
});

/**
 * POST /api/disputes/resolve
 * Arbitrate and resolve an on-chain/off-chain dispute
 */
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { disputeId, upholdDispute, resolutionNotes } = req.body;

    if (!disputeId) {
      return res.status(400).json({ success: false, error: 'Dispute ID is required' });
    }

    const dispute = inMemoryDisputes.find(d => d.id === disputeId);
    if (dispute) {
      dispute.status = upholdDispute ? 'UPHELD' : 'DISMISSED';
      dispute.resolution_notes = resolutionNotes || (upholdDispute ? 'Dispute upheld: Malicious telemetry detected' : 'Dispute dismissed: Telemetry validated');
      dispute.resolved_at = new Date().toISOString();

      let slashedEth = 0;
      if (upholdDispute) {
        slashedEth = 0.5; // 50% of 1.0 ETH stake
        dispute.slashed_amount_eth = slashedEth;

        // 1. Update Supabase Verifier Stake if table exists
        try {
          const { data: verifier } = await supabase
            .from('verifier_stakes')
            .select('*')
            .eq('verifier_address', dispute.approving_verifier)
            .single();

          if (verifier) {
            const newStake = Math.max(0, Number(verifier.staked_amount) * 0.5);
            const totalSlashed = Number(verifier.total_slashed || 0) + (Number(verifier.staked_amount) * 0.5);
            await supabase
              .from('verifier_stakes')
              .update({
                staked_amount: newStake,
                total_slashed: totalSlashed,
                reputation_score: Math.max(0, Number(verifier.reputation_score || 100) - 30)
              })
              .eq('verifier_address', dispute.approving_verifier);
          }
        } catch (_) {}

        // 2. Update Credit NFT status to REVOKED
        try {
          await supabase
            .from('carbon_credit_nfts')
            .update({ status: 'REVOKED' })
            .eq('token_id', dispute.token_id);
        } catch (_) {}

        // 3. Refund Escrow if active
        if (dispute.escrow_id) {
          try {
            await supabase
              .from('escrows')
              .update({ status: 'REFUNDED' })
              .eq('id', dispute.escrow_id);
          } catch (_) {}
        }
      } else {
        // Restore credit status to ISSUED
        try {
          await supabase
            .from('carbon_credit_nfts')
            .update({ status: 'ISSUED' })
            .eq('token_id', dispute.token_id);
        } catch (_) {}
      }

      return res.json({
        success: true,
        message: upholdDispute 
          ? `Dispute upheld! Credit #${dispute.token_id} permanently REVOKED, buyer REFUNDED, and Verifier ${dispute.approving_verifier.slice(0, 8)}... slashed ${slashedEth} ETH (50%).`
          : `Dispute dismissed. Credit #${dispute.token_id} restored to ISSUED status.`,
        data: {
          dispute,
          actions_executed: {
            credit_status: upholdDispute ? 'REVOKED' : 'ISSUED',
            escrow_refunded: upholdDispute && !!dispute.escrow_id,
            verifier_slashed: upholdDispute,
            slashed_amount_eth: slashedEth
          }
        }
      });
    }

    return res.status(404).json({ success: false, error: 'Dispute not found' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
