import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { CryptographicService } from '../services/cryptographic.service';
import { MerkleService } from '../services/merkle.service';
import { RelayerService } from '../services/relayer.service';

const router = Router();

router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { projectId, bundleId: customBundleId, monitoringPeriod, evidenceItems } = req.body;

    if (!projectId || !evidenceItems || !Array.isArray(evidenceItems) || evidenceItems.length === 0) {
      return res.status(400).json({ error: 'projectId and an array of evidenceItems are required' });
    }

    const bundleId = customBundleId || `bundle-${projectId}-${Date.now()}`;

    const processedItems = evidenceItems.map((item: any) => {
      const payloadHash = CryptographicService.hashPayload(item.payload || item);
      return {
        bundle_id: bundleId,
        source_type: item.sourceType || 'IOT_SENSOR',
        payload: item.payload || item,
        payload_hash: payloadHash,
        signer_address: item.signerAddress || '0x0000000000000000000000000000000000000000',
        integrity_status: 'VALID'
      };
    });

    const leafHashes = processedItems.map(i => i.payload_hash);
    const merkleResult = MerkleService.computeMerkleTree(leafHashes);

    const { data: bundle, error: bundleError } = await supabase
      .from('evidence_bundles')
      .insert({
        bundle_id: bundleId,
        project_id: projectId,
        merkle_root: merkleResult.merkleRoot,
        item_count: processedItems.length,
        monitoring_period: monitoringPeriod || { startDate: '2026-01-01', endDate: '2026-03-31' },
        status: 'INGESTED'
      })
      .select()
      .single();

    if (bundleError) return res.status(500).json({ error: bundleError.message });

    const { error: itemsError } = await supabase.from('evidence_items').insert(processedItems);
    if (itemsError) return res.status(500).json({ error: itemsError.message });

    const onChainTx = await RelayerService.commitEvidenceBundleOnChain(
      CryptographicService.toBytes32(bundleId),
      CryptographicService.toBytes32(projectId),
      merkleResult.merkleRoot
    );

    await supabase.from('evidence_bundles').update({ on_chain_tx_hash: onChainTx }).eq('bundle_id', bundleId);

    return res.status(201).json({
      success: true,
      bundle: { ...bundle, on_chain_tx_hash: onChainTx },
      merkleRoot: merkleResult.merkleRoot,
      leafCount: merkleResult.leafCount,
      leaves: merkleResult.leaves,
      items: processedItems,
      message: 'Evidence bundle ingested and Merkle root anchored successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/bundle/:bundleId', async (req: Request, res: Response) => {
  try {
    const { bundleId } = req.params;
    const { data: bundle, error: bError } = await supabase.from('evidence_bundles').select('*').eq('bundle_id', bundleId).single();
    if (bError) return res.status(404).json({ error: 'Bundle not found' });

    const { data: items } = await supabase.from('evidence_items').select('*').eq('bundle_id', bundleId);

    return res.status(200).json({ bundle, items: items || [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
