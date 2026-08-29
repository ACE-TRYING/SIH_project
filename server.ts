import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NTRO ThermalPulse AI Geospatial Server',
    geminiAvailable: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Gemini Geospatial Multi-Sensor Thermal Classifier & Analysis Endpoint
app.post('/api/gemini/classify-analyze', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const anomaly = req.body.anomaly;

    if (!anomaly) {
      return res.status(400).json({ error: 'Thermal anomaly payload is required.' });
    }

    if (!ai) {
      // Fallback algorithmic response if no API key is set
      return res.json({
        success: true,
        isSimulated: true,
        insight: {
          assessment: `Automated Multi-Sensor Assessment: Anomaly at [${anomaly.latitude.toFixed(4)}, ${anomaly.longitude.toFixed(4)}] exhibits FRP of ${anomaly.frp} MW and Brightness of ${anomaly.brightness} K. Co-located with ${anomaly.osmProximity?.matchedFacilityName || 'Open Area'} (Distance: ${anomaly.osmProximity?.distanceMeters || 0}m). Persistence index is ${(anomaly.persistenceIndex * 100).toFixed(1)}%.`,
          classificationRationale: `Classification of ${anomaly.classification} derived from OSM tag matching, SWIR B12/B11 ratio (${anomaly.multispectral?.swirRatio_B12_B11 || 1.8}), and land-cover code (${anomaly.landCover?.type || 'INDUSTRIAL'}).`,
          riskSummary: `Hazard category: ${anomaly.hazardLevel}. Estimated toxic smoke plume reach: ${anomaly.plumeDispersion?.estimatedPlumeLengthKm || 2.5} km under wind conditions (${anomaly.plumeDispersion?.windSpeedKmH || 15} km/h at ${anomaly.plumeDispersion?.windDirectionDeg || 45}°).`,
          containmentProtocol: 'Standard NTRO Standard Operating Procedure: Verify optical Sentinel-2/Landsat-9 imagery, cross-reference state disaster management registry, and alert facility safety officer.',
          generatedAt: new Date().toISOString(),
        },
      });
    }

    const prompt = `
You are the Chief Geospatial Intelligence & Remote Sensing Scientist at NTRO (National Technical Research Organisation), specializing in satellite disaster surveillance and industrial thermal anomaly classification.

Analyze this satellite thermal detection:
- Coordinates: Latitude ${anomaly.latitude}, Longitude ${anomaly.longitude}
- Fire Radiative Power (FRP): ${anomaly.frp} MW
- Brightness Temperature: ${anomaly.brightness} Kelvin (Band 21/I4), Band 31: ${anomaly.brightness_31 || 'N/A'} K
- Satellite & Sensor: ${anomaly.satellite} (${anomaly.daynight === 'D' ? 'Day Pass' : 'Night Pass'})
- Acquisition Date & Time: ${anomaly.acq_date} ${anomaly.acq_time} UTC
- Land Cover: ${anomaly.landCover?.type} (${anomaly.landCover?.description})
- OpenStreetMap Proximity: Matched with "${anomaly.osmProximity?.matchedFacilityName}" (Facility Type: ${anomaly.osmProximity?.facilityType}), Distance: ${anomaly.osmProximity?.distanceMeters} meters
- OSM Tags: ${JSON.stringify(anomaly.osmProximity?.tags || {})}
- Temporal Persistence Index: ${(anomaly.persistenceIndex * 100).toFixed(1)}% (Historical Detections: ${anomaly.historicalDetectionsCount} in past 90 days)
- Sentinel-2 SWIR B12/B11 Ratio: ${anomaly.multispectral?.swirRatio_B12_B11}, NBR: ${anomaly.multispectral?.nbr}, NDVI: ${anomaly.multispectral?.ndvi}
- Current Wind & Plume: ${anomaly.plumeDispersion?.windSpeedKmH} km/h bearing ${anomaly.plumeDispersion?.windDirectionDeg}°, Toxic risk: ${anomaly.plumeDispersion?.toxicGasRisk}

Provide a concise, professional geospatial intelligence evaluation covering:
1. Multi-sensor assessment: Distinguish between industrial fire explosion, routine gas flaring, stubble agricultural burning, coal mine smoldering, or wildfire.
2. Classification rationale: Cite the key discriminators (persistence, OSM proximity, SWIR band ratios, FRP spike).
3. Critical infrastructure risk summary: Evaluate threat to life, storage tanks, and surrounding communities.
4. Tactical containment protocol for emergency response teams.

Respond strictly in valid JSON format matching this schema:
{
  "assessment": "string",
  "classificationRationale": "string",
  "riskSummary": "string",
  "containmentProtocol": "string"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      insight: {
        ...parsed,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Gemini Classification Error:', error);
    // Provide robust heuristic fallback
    const { anomaly } = req.body || {};
    res.json({
      success: true,
      isSimulated: true,
      insight: {
        assessment: `NTRO Tactical Synthesis: Anomaly ${anomaly?.id || 'Detection'} at [${anomaly?.latitude?.toFixed(4)}, ${anomaly?.longitude?.toFixed(4)}] registered ${anomaly?.frp || 0} MW FRP. Spatial fusion confirms co-location with ${anomaly?.osmProximity?.matchedFacilityName || 'Identified Asset'} (${anomaly?.osmProximity?.distanceMeters || 0}m). 90-day persistence stands at ${((anomaly?.persistenceIndex || 0) * 100).toFixed(1)}%.`,
        classificationRationale: `Classification of ${anomaly?.classification || 'THERMAL_ANOMALY'} determined by fusing OSM land-use footprint, SWIR B12/B11 ratio (${anomaly?.multispectral?.swirRatio_B12_B11 || 2.1}), and multi-temporal satellite recurrence.`,
        riskSummary: `Operational hazard categorized as ${anomaly?.hazardLevel || 'MODERATE'}. Downwind toxic dispersion estimated at ${anomaly?.plumeDispersion?.estimatedPlumeLengthKm || 3} km with evacuation corridor of ${anomaly?.plumeDispersion?.evacuationRadiusKm || 1.5} km.`,
        containmentProtocol: 'Dispatch aerial / drone FLIR reconnaissance, alert local emergency containment units, and enact secondary storage isolation protocol.',
        generatedAt: new Date().toISOString(),
      },
    });
  }
});

// Gemini Tactical Incident Dossier Generation
app.post('/api/gemini/tactical-brief', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { anomalies, activeFacility, filterSummary } = req.body;

    if (!ai) {
      return res.json({
        success: true,
        isSimulated: true,
        brief: `[NTRO TACTICAL INTELLIGENCE REPORT - SIMULATED MODE]
Generated at: ${new Date().toUTCString()}
Classification: RESTRICTED // DISASTER RESPONSE

EXECUTIVE SUMMARY:
Total active thermal anomalies monitored: ${anomalies?.length || 0}.
High/Critical Priority Alerts: ${anomalies?.filter((a: any) => a.hazardLevel === 'CRITICAL' || a.hazardLevel === 'HIGH').length || 0}.

KEY FINDINGS:
1. Jamnagar Petrochemical Corridor: Elevated thermal signature observed (FRP > 200 MW). Immediate verification recommended.
2. Jharia Coal Basin: Chronic sub-surface thermal persistence confirmed at 99% recurrence.
3. Agricultural / Wildfire Segregation: Successfully isolated non-industrial biomass burns in Northern & Eastern corridors using Land Cover (Corine) and zero-persistence temporal filters.

RECOMMENDATIONS:
- Maintain 30-minute VIIRS/MODIS polling interval.
- Dispatch drone-assisted FLIR verification where plume dispersion intersects populated sectors.`,
      });
    }

    const prompt = `
You are the Director of Geospatial Intelligence at the National Technical Research Organisation (NTRO), Government of India.
Generate an authoritative, high-level Strategic & Tactical Situation Report (SITREP) based on the latest NASA FIRMS satellite thermal anomaly detections and AI classification matrix.

DATA SNAPSHOT:
Total Anomalies Monitored: ${anomalies?.length || 0}
Filter Configuration: ${JSON.stringify(filterSummary || {})}
Focus Facility: ${activeFacility ? JSON.stringify(activeFacility) : 'Pan-Regional Surveillance'}
Anomalies Sample: ${JSON.stringify(
      (anomalies || []).slice(0, 8).map((a: any) => ({
        id: a.id,
        classification: a.classification,
        hazard: a.hazardLevel,
        facility: a.osmProximity?.matchedFacilityName,
        frp: a.frp,
        brightnessK: a.brightness,
        persistence: a.persistenceIndex,
        coords: [a.latitude, a.longitude],
      }))
    )}

Draft a concise, structured intelligence briefing with:
1. Executive Situation Summary
2. Industrial vs Natural Fire Segregation Breakdown
3. Critical Infrastructure & Facility Risk Analysis (Jamnagar, Paradip, Jharia, Mundra, etc.)
4. Gas Plume & Toxic Atmospheric Dispersion Advisory
5. Actionable Directive & NTRO Protocol Execution

Format with clear headers and professional defence/geospatial intelligence phrasing.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      brief: response.text,
    });
  } catch (error: any) {
    console.error('Tactical Brief Error:', error);
    const { anomalies, activeFacility } = req.body || {};
    res.json({
      success: true,
      isSimulated: true,
      brief: `# NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)
## GEOSPATIAL INTELLIGENCE & DISASTER MONITORING DIVISION
**SITUATION REPORT (SITREP) // RESTRICTED DISASTER ADVISORY**
**Timestamp:** ${new Date().toUTCString()}
**Platform:** VIIRS (NOAA-20 / S-NPP) 375m & MODIS Multispectral Array

---

### 1. EXECUTIVE SITUATION SUMMARY
Multi-sensor satellite observation has tracked **${anomalies?.length || 0} active thermal anomalies** across strategic surveillance sectors. The automated classification pipeline integrated OpenStreetMap (OSM) infrastructure polygons, 90-day persistence recurrence, and Sentinel-2 Short-Wave Infrared (SWIR Band 12/11) ratios to segregate industrial thermal sources from seasonal biomass burning.

### 2. INDUSTRIAL VS NATURAL FIRE SEGREGATION ANALYSIS
- **Persistent Industrial Gas Flares:** Multiple confirmed high-persistence (>80%) emissions at continuous petrochemical and refinery installations (e.g., Reliance Jamnagar, Paradip IOCL, Dahej Petrochemicals).
- **Critical Industrial Incidents:** High radiative power spike (>200 MW) flagged at strategic processing units requiring immediate ground-truth verification.
- **Biomass / Agricultural Stubble:** Non-persistent, wide-dispersal thermal clusters in Northern cropland corridors isolated with Corine Land Cover indices (NDVI/NBR).
- **Sub-surface Coal Fires:** Chronic thermal signatures detected across the Jharia mining basin with continuous 99% recurrence.

### 3. CRITICAL INFRASTRUCTURE & TOXIC DISPERSION ADVISORY
- **Atmospheric Plume Modeling:** Gaussian plume dispersion models indicate prevailing winds driving smoke and SO2/VOC dispersion downwind of active thermal cores.
- **Evacuation Corridor:** Precautionary safety buffer of 2.5–5.0 km recommended for downwind settlements in high-hazard zones.

### 4. ACTIONABLE NTRO DIRECTIVES
1. Maintain real-time VIIRS/MODIS 30-minute overpass synchronization.
2. Alert State Disaster Management Authorities (SDMA) and facility safety commanders.
3. Task high-resolution Sentinel-2 (10m) and Cartosat-3 optical tasking on prioritized coordinates.`,
    });
  }
});

// NASA FIRMS Live Fetcher / Proxy
app.post('/api/firms/fetch-live', async (req, res) => {
  try {
    const { apiKey, source = 'VIIRS_NOAA20_NRT', countryCode = 'IND', dayRange = 1 } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'NASA FIRMS API Key (MAP_KEY) is required for live endpoint queries.',
      });
    }

    // NASA FIRMS API live query format:
    // https://firms.modaps.eosdis.nasa.gov/api/country/csv/[MAP_KEY]/[SOURCE]/[COUNTRY]/[DAY_RANGE]
    const url = `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${apiKey}/${source}/${countryCode}/${dayRange}`;
    
    const firmsResponse = await fetch(url);
    if (!firmsResponse.ok) {
      throw new Error(`NASA FIRMS API returned HTTP ${firmsResponse.status}: ${firmsResponse.statusText}`);
    }

    const csvText = await firmsResponse.text();
    res.json({
      success: true,
      rawCsv: csvText,
      urlQueried: `https://firms.modaps.eosdis.nasa.gov/api/country/csv/***KEY***/${source}/${countryCode}/${dayRange}`,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('FIRMS Live Fetch Error:', error);
    res.status(500).json({ error: error.message || 'Failed to query NASA FIRMS API.' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NTRO ThermalPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
