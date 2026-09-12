import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';

const router = Router();

// GET /api/verifiers — List active staked verifiers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('verifier_stakes')
      .select('*')
      .order('reputation_score', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ verifiers: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/verifiers/queue — Get anomaly queue (bundles requiring verifier review)
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('risk_assessments')
      .select('*, evidence_bundles(*, projects(*))')
      .eq('verifier_required', true)
      .order('computed_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ queue: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
