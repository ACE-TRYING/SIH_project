import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NTRO ThermalPulse AI Geospatial Server',
    geminiAvailable: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    firmsConfigured: !!(process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY),
    timestamp: new Date().toISOString(),
  });
});

export default router;
