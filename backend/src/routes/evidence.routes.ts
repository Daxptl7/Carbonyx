import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { MerkleService, MerkleLeaf } from '../services/merkle.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

// POST /api/evidence/bundle — Ingest multi-source evidence, compute Merkle tree & anchor on-chain
router.post('/bundle', async (req: Request, res: Response) => {
  try {
    const {
      bundleId,
      projectId,
      evidenceItems,
      monitoringPeriod
    } = req.body;

    if (!bundleId || !projectId || !Array.isArray(evidenceItems) || evidenceItems.length === 0) {
      return res.status(400).json({ error: 'Missing bundleId, projectId, or evidenceItems' });
    }

    // 1. Hash each evidence item leaf
    const leafHashes: string[] = evidenceItems.map((item: any) => {
      return MerkleService.hashLeaf({
        sourceType: item.sourceType,
        payload: item.payload || item
      });
    });

    // 2. Compute canonical SHA-256 Merkle Root
    const merkleRoot = MerkleService.computeMerkleRoot(leafHashes);

    // 3. Commit on-chain via Relayer
    let onChainTxHash = null;
    try {
      onChainTxHash = await RelayerService.commitEvidenceBundle(bundleId, projectId, merkleRoot);
    } catch (err: any) {
      console.warn('[Relayer] On-chain evidence commitment warning:', err.message);
    }

    // 4. Persist bundle in Supabase
    const bundleRecord = {
      bundle_id: bundleId,
      project_id: projectId,
      merkle_root: merkleRoot,
      item_count: evidenceItems.length,
      monitoring_period: monitoringPeriod || { start: '2026-01-01', end: '2026-06-30' },
      status: 'INGESTED',
      on_chain_tx_hash: onChainTxHash
    };

    const { error: bundleErr } = await supabase
      .from('evidence_bundles')
      .upsert(bundleRecord);

    if (bundleErr) {
      console.warn('[Supabase] Warning saving evidence bundle:', bundleErr.message);
    }

    // 5. Persist evidence items with payload hashes
    const itemRecords = evidenceItems.map((item: any, idx: number) => ({
      bundle_id: bundleId,
      source_type: item.sourceType,
      payload: item.payload || item,
      payload_hash: leafHashes[idx],
      signature: item.signature || null,
      signer_address: item.signerAddress || null,
      integrity_status: 'VALID'
    }));

    const { error: itemsErr } = await supabase
      .from('evidence_items')
      .upsert(itemRecords);

    if (itemsErr) {
      console.warn('[Supabase] Warning saving evidence items:', itemsErr.message);
    }

    return res.status(201).json({
      success: true,
      bundleId,
      projectId,
      merkleRoot,
      itemCount: evidenceItems.length,
      leafHashes,
      onChainTxHash
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/evidence/bundle/:bundleId — Fetch bundle and generate Merkle proofs
router.get('/bundle/:bundleId', async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.params;

    const { data: bundle, error: bundleErr } = await supabase
      .from('evidence_bundles')
      .select('*')
      .eq('bundle_id', bundleId)
      .single();

    if (bundleErr || !bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    const { data: items } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('bundle_id', bundleId);

    const leafHashes = (items || []).map(item => item.payload_hash);
    const proofs = leafHashes.map((_, idx) => MerkleService.generateProof(leafHashes, idx));

    return res.json({
      bundle,
      items: items || [],
      merkleRoot: bundle.merkle_root,
      proofs
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
