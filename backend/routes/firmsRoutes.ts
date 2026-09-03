import { Router } from 'express';
import { validateFirmsKey, fetchLiveFirmsData } from '../services/firmsService';

const router = Router();

router.post('/firms/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const result = await validateFirmsKey(apiKey);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reach NASA FIRMS mapkey_status endpoint.',
    });
  }
});

router.post('/firms/fetch-live', async (req, res) => {
  try {
    const result = await fetchLiveFirmsData(req.body || {});
    res.status(result.status).json(result.data);
  } catch (error: any) {
    const rawError = error?.message || 'Failed to query NASA FIRMS API.';
    const sanitizedError = typeof rawError === 'string' ? rawError.split(req.body?.apiKey || '').join('***KEY***') : 'Failed to query NASA FIRMS API.';
    console.error('[FIRMS Route Error] Failed to fetch live data:', sanitizedError);
    res.status(500).json({
      success: false,
      source: 'NASA_FIRMS',
      simulated: false,
      error: sanitizedError,
    });
  }
});

export default router;
