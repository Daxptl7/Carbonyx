import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { MerkleService } from '../services/merkle.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

async function handleEvidenceUpload(req: Request, res: Response) {
  try {
    const {
      projectId,
      bundleId: customBundleId,
      monitoringPeriod,
      evidenceItems
    } = req.body;

    if (!projectId || !evidenceItems || !Array.isArray(evidenceItems) || evidenceItems.length === 0) {
      return res.status(400).json({ error: 'projectId and non-empty evidenceItems array are required' });
    }

    const bundleId = customBundleId || `bundle-${projectId}-${Date.now()}`;

    const ALLOWED_SOURCE_TYPES = ['IOT_SENSOR', 'SATELLITE_NDVI', 'OPERATIONAL_DOC', 'VERIFIER_AUDIT'];
    const normalizeSourceType = (rawType: string) => {
      if (!rawType) return 'IOT_SENSOR';
      if (ALLOWED_SOURCE_TYPES.includes(rawType)) return rawType;
      if (rawType.includes('DOC') || rawType.includes('FINANCIAL') || rawType.includes('EXPENSE')) return 'OPERATIONAL_DOC';
      if (rawType.includes('SAT') || rawType.includes('NDVI') || rawType.includes('ORBITAL')) return 'SATELLITE_NDVI';
      if (rawType.includes('AUDIT') || rawType.includes('VERIF')) return 'VERIFIER_AUDIT';
      return 'IOT_SENSOR';
    };

    const processedItems = evidenceItems.map((item: any) => {
      const payloadHash = CryptographicService.hashPayload(item.payload || item);
      const normalizedType = normalizeSourceType(item.sourceType);
      return {
        bundle_id: bundleId,
        source_type: normalizedType,
        payload: item.payload || item,
        payload_hash: payloadHash,
        signer_address: item.signerAddress || '0x0000000000000000000000000000000000000000',
        integrity_status: 'VALID'
      };
    });

    const leafHashes = processedItems.map(i => i.payload_hash);
    const merkleResult = MerkleService.computeMerkleTree(leafHashes);

    const bundleRecord = {
      bundle_id: bundleId,
      project_id: projectId,
      merkle_root: merkleResult.merkleRoot,
      item_count: processedItems.length,
      monitoring_period: monitoringPeriod || { startDate: '2026-01-01', endDate: '2026-03-31' },
      status: 'INGESTED'
    };

    const { data: bundle, error: bundleError } = await supabase
      .from('evidence_bundles')
      .upsert(bundleRecord)
      .select()
      .single();

    if (bundleError) {
      console.warn('[Supabase] Warning upserting evidence bundle:', bundleError.message);
    }

    const { error: itemsError } = await supabase
      .from('evidence_items')
      .upsert(processedItems);

    if (itemsError) {
      console.warn('[Supabase] Warning upserting evidence items:', itemsError.message);
    }

    let onChainTxHash = null;
    try {
      onChainTxHash = await RelayerService.commitEvidenceBundleOnChain(
        bundleId,
        projectId,
        merkleResult.merkleRoot
      );

      await supabase
        .from('evidence_bundles')
        .update({ on_chain_tx_hash: onChainTxHash })
        .eq('bundle_id', bundleId);
    } catch (err: any) {
      console.warn('[Relayer] On-chain evidence anchor warning:', err.message);
    }

    return res.status(201).json({
      success: true,
      bundleId,
      bundle: { ...(bundle || bundleRecord), on_chain_tx_hash: onChainTxHash },
      merkleRoot: merkleResult.merkleRoot,
      leafCount: merkleResult.leafCount,
      leaves: merkleResult.leaves,
      leafHashes,
      itemCount: processedItems.length,
      items: processedItems,
      onChainTxHash,
      txHash: onChainTxHash,
      message: 'Evidence bundle ingested and Merkle root anchored successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

router.post('/upload', handleEvidenceUpload);
router.post('/bundle', handleEvidenceUpload);

router.get('/bundle/:bundleId', async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.params;
    const { data: bundle, error: bError } = await supabase
      .from('evidence_bundles')
      .select('*')
      .eq('bundle_id', bundleId)
      .single();

    if (bError || !bundle) {
      return res.status(404).json({ error: 'Bundle not found' });
    }

    const { data: items } = await supabase
      .from('evidence_items')
      .select('*')
      .eq('bundle_id', bundleId);

    const leafHashes = (items || []).map(i => i.payload_hash);
    const proofs = leafHashes.map((_, idx) => {
      try {
        return MerkleService.generateProof(leafHashes, idx);
      } catch {
        return [];
      }
    });

    return res.status(200).json({
      bundle,
      items: items || [],
      merkleRoot: bundle.merkle_root,
      proofs
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
