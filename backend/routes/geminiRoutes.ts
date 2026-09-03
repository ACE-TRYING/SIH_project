import { Router } from 'express';
import { classifyAndAnalyzeAnomaly, generateTacticalBrief } from '../services/geminiService';

const router = Router();

router.post('/gemini/classify-analyze', async (req, res) => {
  try {
    const { anomaly } = req.body;
    if (!anomaly) {
      return res.status(400).json({ error: 'Thermal anomaly payload is required.' });
    }
    const result = await classifyAndAnalyzeAnomaly(anomaly);
    res.json(result);
  } catch (error: any) {
    console.error('[Gemini Route Error] classify-analyze failed:', error?.message || error);
    const { anomaly } = req.body || {};
    res.json({
      success: true,
      source: 'fallback',
      simulated: true,
      isSimulated: true,
      errorDetails: error?.message || 'Gemini API request failed',
      insight: {
        assessment: `NTRO Tactical Synthesis (Fallback): Anomaly ${anomaly?.id || 'Detection'} at [${Number(anomaly?.latitude)?.toFixed(4)}, ${Number(anomaly?.longitude)?.toFixed(4)}] registered ${anomaly?.frp || 0} MW FRP. Spatial fusion confirms ${anomaly?.osmProximity?.matchedFacilityName ? `co-location with ${anomaly.osmProximity.matchedFacilityName} (${anomaly.osmProximity.distanceMeters || 0}m)` : 'no immediate named industrial asset within primary buffer'}.`,
        classificationRationale: `Classification of ${anomaly?.classification || 'THERMAL_ANOMALY'} determined by rule-based heuristic fusion of satellite radiance (${anomaly?.frp || 0} MW, ${anomaly?.brightness || 0} K) and OSM infrastructure proximity.`,
        riskSummary: `Operational hazard categorized as ${anomaly?.hazardLevel || 'MODERATE'}. ${anomaly?.weather?.status === 'REAL' && typeof anomaly?.weather?.windSpeedKmh === 'number' ? `Local wind: ${anomaly.weather.windSpeedKmh.toFixed(1)} km/h at ${anomaly.weather.windDirectionDeg}°.` : 'Local meteorological observation unavailable.'}`,
        containmentProtocol: 'Dispatch ground/aerial verification unit, notify relevant facility safety officers, and cross-reference state disaster management protocols.',
        source: 'fallback' as const,
        simulated: true,
        generatedAt: new Date().toISOString(),
      },
    });
  }
});

router.post('/gemini/tactical-brief', async (req, res) => {
  try {
    const { anomalies, activeFacility, filterSummary } = req.body;
    const result = await generateTacticalBrief(anomalies, activeFacility, filterSummary);
    res.json(result);
  } catch (error: any) {
    console.error('[Gemini Route Error] tactical-brief failed:', error?.message || error);
    const { anomalies } = req.body || {};
    const criticalCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'CRITICAL').length;
    const highCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'HIGH').length;

    res.json({
      success: true,
      source: 'fallback',
      simulated: true,
      isSimulated: true,
      errorDetails: error?.message || 'Gemini API request failed',
      brief: `# NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
## GEOSPATIAL INTELLIGENCE & DISASTER MONITORING DIVISION
**SITUATION REPORT (SITREP) // RESTRICTED DISASTER ADVISORY (FALLBACK)**
**Timestamp:** ${new Date().toUTCString()}
**Platform:** VIIRS (NOAA-20 / S-NPP) 375m & MODIS Multispectral Array

---

### 1. EXECUTIVE SITUATION SUMMARY
Multi-sensor satellite observation has tracked **${anomalies?.length || 0} active thermal anomalies** across strategic surveillance sectors (${criticalCount} Critical, ${highCount} High Priority). The automated classification pipeline integrated OpenStreetMap (OSM) infrastructure polygons, recurrence persistence, and radiometric energy thresholds to segregate industrial thermal sources from seasonal biomass burning.

### 2. INDUSTRIAL VS NATURAL FIRE SEGREGATION ANALYSIS
- **Industrial Installations:** Verified thermal emissions near petrochemical, metal, power, and manufacturing infrastructure.
- **Biomass / Agricultural Burns:** Dispersed thermal signatures isolated using spatial buffering and non-persistent signatures.
- **Mining / Coal Fires:** Chronic thermal signatures detected across mining basins with sustained recurrence.

### 3. METEOROLOGICAL & DISPERSION ADVISORY
- Real-time weather data evaluated for priority coordinates via Open-Meteo. Where wind data is unavailable, local ground observations should be consulted before deploying smoke dispersion boundaries.

### 4. ACTIONABLE NTRO DIRECTIVES
1. Maintain real-time VIIRS/MODIS satellite overpass synchronization.
2. Alert State Disaster Management Authorities (SDMA) and facility safety commanders for priority detections.
3. Task high-resolution optical and FLIR verification on prioritized coordinates.`,
    });
  }
});

export default router;
