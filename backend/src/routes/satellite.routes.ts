import { Router, Request, Response } from 'express';
import { SatelliteService } from '../services/satellite.service';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const configured = SatelliteService.isConfigured();

  return res.status(200).json({
    status: configured ? 'configured' : 'fallback',
    configured,
    source: configured ? 'copernicus' : 'mock',
    message: configured
      ? 'Copernicus Sentinel Hub credentials are configured.'
      : 'Copernicus credentials are missing. Satellite NDVI requests will use deterministic fallback data.'
  });
});

router.post('/ndvi', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, bbox, radiusKm, baseline, current, declaredTonnage } = req.body || {};

    if (bbox && (!Array.isArray(bbox) || bbox.length !== 4)) {
      return res.status(400).json({ error: 'bbox must be [minLon, minLat, maxLon, maxLat]' });
    }

    if (!bbox && ((latitude !== undefined && Number.isNaN(Number(latitude))) || (longitude !== undefined && Number.isNaN(Number(longitude))))) {
      return res.status(400).json({ error: 'latitude and longitude must be numeric when provided' });
    }

    const result = await SatelliteService.getNdviComparison({
      latitude: latitude === undefined ? undefined : Number(latitude),
      longitude: longitude === undefined ? undefined : Number(longitude),
      bbox,
      radiusKm,
      baseline,
      current,
      declaredTonnage
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
