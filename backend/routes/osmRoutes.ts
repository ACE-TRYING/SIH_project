import { Router } from 'express';
import { enrichAnomaliesWithOsm } from '../services/osmService';

const router = Router();

router.post('/osm/enrich-anomalies', async (req, res) => {
  try {
    const { anomalies, maxEnrich = 15 } = req.body;
    if (!Array.isArray(anomalies)) {
      return res.status(400).json({ error: 'Anomalies array is required for enrichment.' });
    }
    const result = await enrichAnomaliesWithOsm(anomalies, maxEnrich);
    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[OSM Route Error] Enrichment failed:', error?.message || error);
    res.json({
      success: false,
      error: error?.message || 'OSM enrichment failed',
      anomalies: req.body?.anomalies || [],
    });
  }
});

export default router;
