import { Router, Request, Response } from 'express';
import { SatelliteService } from '../services/satellite.service';
import { requireRoles } from '../auth/middleware';

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

router.post('/ndvi', requireRoles('PROJECT_PROPONENT'), async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, bbox, radiusKm, baseline, current, declaredTonnage } = req.body || {};

    if (bbox && (!Array.isArray(bbox) || bbox.length !== 4)) {
      return res.status(400).json({ error: 'bbox must be [minLon, minLat, maxLon, maxLat]' });
    }

    if (!bbox && (latitude === undefined || longitude === undefined)) {
      return res.status(400).json({ error: 'Project latitude and longitude are required when bbox is not provided' });
    }

    if (!bbox && ((latitude !== undefined && Number.isNaN(Number(latitude))) || (longitude !== undefined && Number.isNaN(Number(longitude))))) {
      return res.status(400).json({ error: 'latitude and longitude must be numeric when provided' });
    }
    if (!bbox && (Number(latitude) < -90 || Number(latitude) > 90 || Number(longitude) < -180 || Number(longitude) > 180)) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90 and longitude between -180 and 180' });
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
