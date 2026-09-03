import { Router } from 'express';
import { fetchOpenMeteoWind } from '../services/weatherService';

const router = Router();

router.post('/weather/current', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
        error: 'latitude and longitude are required.',
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
        error: 'latitude and longitude must be numeric.',
      });
    }

    if (lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
        error: `Invalid latitude ${lat}. Must be between -90 and 90.`,
      });
    }

    if (lon < -180 || lon > 180) {
      return res.status(400).json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
        error: `Invalid longitude ${lon}. Must be between -180 and 180.`,
      });
    }

    const result = await fetchOpenMeteoWind(lat, lon);

    if (!result) {
      return res.json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
      });
    }

    res.json({
      success: true,
      source: 'OPEN_METEO',
      status: 'REAL',
      windSpeedKmh: result.windSpeedKmh,
      windDirectionDeg: result.windDirectionDeg,
      observedAt: result.observedAt,
    });
  } catch (error: any) {
    console.error('[WEATHER Route Error]', error?.message || error);
    res.status(500).json({
      success: false,
      source: 'OPEN_METEO',
      status: 'ERROR',
      error: error?.message || 'Weather API request failed.',
    });
  }
});

export default router;
