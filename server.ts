import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { classifyThermalAnomaly } from './src/utils/geoUtils';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

if (process.env.GEMINI_API_KEY !== undefined && !process.env.GEMINI_API_KEY.trim()) {
  delete process.env.GEMINI_API_KEY;
}

console.log("[ENV DEBUG]", {
  cwd: process.cwd(),
  keyExists: "GEMINI_API_KEY" in process.env,
  keyLoaded: Boolean(process.env.GEMINI_API_KEY),
  keyLength: process.env.GEMINI_API_KEY?.length,
});



const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Log GEMINI_API_KEY availability safely on startup
console.log(`[Server Init] GEMINI_API_KEY loaded: ${Boolean(process.env.GEMINI_API_KEY?.trim())}`);

// Initialize Google GenAI client (server-side only)
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
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
    geminiAvailable: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    firmsConfigured: !!(process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// PHASE 7: Structured Evidence Package Builder for Gemini Decision-Support
// ============================================================================

function formatEvidencePackage(anomaly: any) {
  const firmsLines: string[] = [
    `Coordinates: [${Number(anomaly.latitude)?.toFixed(4)}, ${Number(anomaly.longitude)?.toFixed(4)}]`,
    `Fire Radiative Power (FRP): ${anomaly.frp} MW`,
    `Brightness Temperature: ${anomaly.brightness} K (Band 21/I4)${anomaly.brightness_31 ? `, Band 31: ${anomaly.brightness_31} K` : ''}`,
    `Satellite / Sensor: ${anomaly.satellite || 'VIIRS'} (${anomaly.daynight === 'D' ? 'Daytime Overpass' : 'Nighttime Overpass'})`,
    `NASA Confidence: ${anomaly.confidence ?? 'nominal'}`,
    `Acquisition Date/Time: ${anomaly.acq_date || 'N/A'} ${anomaly.acq_time || 'N/A'} UTC`,
  ];
  if (anomaly.scan && anomaly.track) {
    firmsLines.push(`Sensor Geometry: Scan ${anomaly.scan}, Track ${anomaly.track}`);
  }

  const osmLines: string[] = [];
  if (anomaly.osmProximity && anomaly.osmProximity.matchedFacilityName) {
    osmLines.push(`Matched Infrastructure: "${anomaly.osmProximity.matchedFacilityName}"`);
    osmLines.push(`Facility Type: ${anomaly.osmProximity.facilityType || 'INDUSTRIAL'}`);
    osmLines.push(`Distance to Facility: ${anomaly.osmProximity.distanceMeters ?? 'N/A'} meters`);
    if (anomaly.osmProximity.osmId) osmLines.push(`OSM Identifier: ${anomaly.osmProximity.osmId}`);
    if (anomaly.osmProximity.operator) osmLines.push(`Operator: ${anomaly.osmProximity.operator}`);
    if (anomaly.osmProximity.tags && Object.keys(anomaly.osmProximity.tags).length > 0) {
      osmLines.push(`OSM Tags: ${JSON.stringify(anomaly.osmProximity.tags)}`);
    }
  } else {
    osmLines.push('No critical industrial facility matched within search radius (Open / Unclassified Area).');
  }

  const weatherLines: string[] = [];
  if (
    anomaly.weather?.status === 'REAL' &&
    typeof anomaly.weather.windSpeedKmh === 'number' &&
    typeof anomaly.weather.windDirectionDeg === 'number'
  ) {
    weatherLines.push(`Source: Open-Meteo Real-Time Observation`);
    weatherLines.push(`Wind Speed: ${Number(anomaly.weather.windSpeedKmh).toFixed(1)} km/h`);
    weatherLines.push(`Wind Direction: ${Number(anomaly.weather.windDirectionDeg).toFixed(0)}°`);
    if (anomaly.weather.observedAt) weatherLines.push(`Observed At: ${anomaly.weather.observedAt}`);
    weatherLines.push(`Status: REAL observation verified`);
  } else {
    weatherLines.push('Status: UNAVAILABLE (Real-time meteorological observation not retrieved for this detection; do NOT invent wind parameters).');
  }

  const classificationLines: string[] = [
    `Assigned Heuristic Classification: ${anomaly.classification || 'UNCLASSIFIED'}`,
    `Assigned Hazard Level: ${anomaly.hazardLevel || 'MODERATE'}`,
    `Heuristic Confidence Score: ${anomaly.confidenceScore ?? 'N/A'}/100`,
  ];
  if (anomaly.classificationReason) classificationLines.push(`Classification Reason: ${anomaly.classificationReason}`);
  if (anomaly.evidence && Array.isArray(anomaly.evidence) && anomaly.evidence.length > 0) {
    classificationLines.push(`Evidence Discriminators: ${anomaly.evidence.join('; ')}`);
  }
  if (anomaly.anomalyStatus) classificationLines.push(`Operational Status: ${anomaly.anomalyStatus}`);
  if (anomaly.persistenceIndex !== undefined) {
    classificationLines.push(`Temporal Persistence Index: ${(Number(anomaly.persistenceIndex) * 100).toFixed(1)}% (${anomaly.historicalDetectionsCount || 0} historical detections in 90 days)`);
  }
  if (anomaly.landCover?.type) {
    classificationLines.push(`Land Cover: ${anomaly.landCover.type} (${anomaly.landCover.description || ''})`);
  }

  return {
    firmsText: firmsLines.map(l => `- ${l}`).join('\n'),
    osmText: osmLines.map(l => `- ${l}`).join('\n'),
    weatherText: weatherLines.map(l => `- ${l}`).join('\n'),
    classificationText: classificationLines.map(l => `- ${l}`).join('\n'),
  };
}

// Gemini Geospatial Multi-Sensor Thermal Classifier & Analysis Endpoint
app.post('/api/gemini/classify-analyze', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const anomaly = req.body.anomaly;

    if (!anomaly) {
      return res.status(400).json({ error: 'Thermal anomaly payload is required.' });
    }

    const evidencePkg = formatEvidencePackage(anomaly);

    if (!ai) {
      console.warn('[Gemini API] GEMINI_API_KEY is not configured in environment. Using simulated fallback.');
      const fallbackInsight = {
        assessment: `NTRO Tactical Synthesis (Fallback): Anomaly ${anomaly.id || 'Detection'} at [${Number(anomaly.latitude).toFixed(4)}, ${Number(anomaly.longitude).toFixed(4)}] registered ${anomaly.frp} MW FRP. Spatial fusion confirms ${anomaly.osmProximity?.matchedFacilityName ? `co-location with ${anomaly.osmProximity.matchedFacilityName} (${anomaly.osmProximity.distanceMeters || 0}m)` : 'no immediate named industrial asset within primary buffer'}.`,
        classificationRationale: `Classification of ${anomaly.classification || 'THERMAL_ANOMALY'} determined by rule-based heuristic fusion of satellite radiance (${anomaly.frp} MW, ${anomaly.brightness} K) and OSM infrastructure proximity.`,
        riskSummary: `Operational hazard categorized as ${anomaly.hazardLevel || 'MODERATE'}. ${anomaly.weather?.status === 'REAL' && typeof anomaly.weather.windSpeedKmh === 'number' ? `Local wind: ${anomaly.weather.windSpeedKmh.toFixed(1)} km/h at ${anomaly.weather.windDirectionDeg}°.` : 'Local meteorological observation unavailable.'}`,
        containmentProtocol: 'Dispatch ground/aerial verification unit, notify relevant facility safety officers, and cross-reference state disaster management protocols.',
        source: 'fallback' as const,
        simulated: true,
        generatedAt: new Date().toISOString(),
      };

      return res.json({
        success: true,
        source: 'fallback',
        simulated: true,
        isSimulated: true,
        insight: fallbackInsight,
      });
    }

    const prompt = `You are the Chief Geospatial Intelligence & Remote Sensing Scientist at NTRO (National Technical Research Organisation), Government of India, specializing in satellite disaster surveillance and industrial thermal anomaly classification.

Analyze this multi-source thermal anomaly evidence package:

=== 1. VERIFIED SATELLITE TELEMETRY (NASA FIRMS) ===
${evidencePkg.firmsText}

=== 2. VERIFIED OPENSTREETMAP INFRASTRUCTURE ENRICHMENT ===
${evidencePkg.osmText}

=== 3. VERIFIED METEOROLOGICAL OBSERVATIONS (OPEN-METEO) ===
${evidencePkg.weatherText}

=== 4. RULE-BASED CLASSIFICATION & RISK EVALUATION ===
${evidencePkg.classificationText}

=== MANDATORY INSTRUCTIONS ===
1. You are providing AI decision-support and geospatial intelligence evaluation to explain the verified evidence package.
2. STRICT DATA INTEGRITY: Ground all analysis directly in the provided measurements. Do NOT invent or hallucinate arbitrary coordinates, FRP numbers, brightness values, facility names, or wind parameters.
3. If weather is UNAVAILABLE, clearly state that meteorological conditions are unobserved and avoid speculating on specific plume vectors or evacuation corridors.
4. Structure your response strictly in valid JSON matching this schema:
{
  "assessment": "Concise multi-sensor geospatial and physical assessment explaining the thermal signature based on verified satellite, OSM, and weather evidence.",
  "classificationRationale": "Detailed evaluation explaining why the evidence supports or qualifies the assigned rule-based classification, citing concrete indicators (FRP, brightness temperature, proximity to named infrastructure, day/night pass).",
  "riskSummary": "Rigorous risk evaluation assessing threats to human safety, infrastructure, and adjacent communities, taking into account verified weather observations or noting data absence.",
  "containmentProtocol": "Actionable, professional NTRO standard operational containment protocol and tactical directives tailored to the specific facility, fire type, and site conditions."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      source: 'gemini',
      simulated: false,
      isSimulated: false,
      model: 'gemini-3.6-flash',
      insight: {
        assessment: parsed.assessment || 'Assessment generated based on verified satellite and GIS evidence.',
        classificationRationale: parsed.classificationRationale || 'Classification rationale evaluated against multi-sensor telemetry.',
        riskSummary: parsed.riskSummary || 'Risk summary synthesized from infrastructure proximity and environmental telemetry.',
        containmentProtocol: parsed.containmentProtocol || 'Standard NTRO operational directive initiated.',
        source: 'gemini',
        simulated: false,
        model: 'gemini-3.6-flash',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Gemini API Error] classify-analyze failed:', error?.message || error);
    const { anomaly } = req.body || {};
    const fallbackInsight = {
      assessment: `NTRO Tactical Synthesis (Fallback): Anomaly ${anomaly?.id || 'Detection'} at [${Number(anomaly?.latitude)?.toFixed(4)}, ${Number(anomaly?.longitude)?.toFixed(4)}] registered ${anomaly?.frp || 0} MW FRP. Spatial fusion confirms ${anomaly?.osmProximity?.matchedFacilityName ? `co-location with ${anomaly.osmProximity.matchedFacilityName} (${anomaly.osmProximity.distanceMeters || 0}m)` : 'no immediate named industrial asset within primary buffer'}.`,
      classificationRationale: `Classification of ${anomaly?.classification || 'THERMAL_ANOMALY'} determined by rule-based heuristic fusion of satellite radiance (${anomaly?.frp || 0} MW, ${anomaly?.brightness || 0} K) and OSM infrastructure proximity.`,
      riskSummary: `Operational hazard categorized as ${anomaly?.hazardLevel || 'MODERATE'}. ${anomaly?.weather?.status === 'REAL' && typeof anomaly?.weather?.windSpeedKmh === 'number' ? `Local wind: ${anomaly.weather.windSpeedKmh.toFixed(1)} km/h at ${anomaly.weather.windDirectionDeg}°.` : 'Local meteorological observation unavailable.'}`,
      containmentProtocol: 'Dispatch ground/aerial verification unit, notify relevant facility safety officers, and cross-reference state disaster management protocols.',
      source: 'fallback' as const,
      simulated: true,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      source: 'fallback',
      simulated: true,
      isSimulated: true,
      errorDetails: error?.message || 'Gemini API request failed',
      insight: fallbackInsight,
    });
  }
});

// Gemini Tactical Incident Dossier Generation
app.post('/api/gemini/tactical-brief', async (req, res) => {
  try {
    const ai = getGeminiClient();
    const { anomalies, activeFacility, filterSummary } = req.body;

    const criticalCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'CRITICAL').length;
    const highCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'HIGH').length;
    const moderateCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'MODERATE' || a.hazardLevel === 'LOW').length;

    if (!ai) {
      console.warn('[Gemini API] GEMINI_API_KEY is not configured in environment. Using simulated fallback briefing.');
      return res.json({
        success: true,
        source: 'fallback',
        simulated: true,
        isSimulated: true,
        brief: `[NTRO TACTICAL INTELLIGENCE REPORT - FALLBACK MODE]
Generated at: ${new Date().toUTCString()}
Classification: RESTRICTED // DISASTER RESPONSE

EXECUTIVE SUMMARY:
Total active thermal anomalies monitored: ${anomalies?.length || 0}.
Critical Priority Alerts: ${criticalCount}.
High Priority Alerts: ${highCount}.
Moderate/Low Alerts: ${moderateCount}.

KEY FINDINGS:
1. Industrial Core Monitoring: Monitored priority thermal anomalies with FRP ranging up to ${Math.max(...(anomalies || []).map((a: any) => a.frp || 0), 0)} MW.
2. Geospatial Asset Co-location: Enriched detections cross-referenced with OpenStreetMap critical infrastructure database.
3. Meteorological Status: Real-time wind and plume dispersion integrated where local observations are available.

RECOMMENDATIONS:
- Maintain regular VIIRS/MODIS 30-minute polling cycle.
- Prioritize on-site / drone verification for anomalies in critical industrial corridors.`,
      });
    }

    const sampleAnomalies = (anomalies || []).slice(0, 10).map((a: any) => ({
      id: a.id,
      coordinates: [a.latitude, a.longitude],
      frp: `${a.frp} MW`,
      brightnessK: `${a.brightness} K`,
      classification: a.classification,
      hazardLevel: a.hazardLevel,
      facility: a.osmProximity?.matchedFacilityName || 'Unmatched Open Area',
      distanceMeters: a.osmProximity?.distanceMeters ?? null,
      weather: a.weather?.status === 'REAL' && typeof a.weather.windSpeedKmh === 'number'
        ? `${a.weather.windSpeedKmh.toFixed(1)} km/h @ ${a.weather.windDirectionDeg}°`
        : 'UNAVAILABLE',
    }));

    const prompt = `You are the Director of Geospatial Intelligence at the National Technical Research Organisation (NTRO), Government of India.
Generate an authoritative, high-level Strategic & Tactical Situation Report (SITREP) based on the latest NASA FIRMS satellite thermal anomaly detections, OpenStreetMap infrastructure enrichment, Open-Meteo weather data, and deterministic classification matrix.

=== SITUATION OVERVIEW ===
Total Active Thermal Anomalies Monitored: ${anomalies?.length || 0}
Critical Priority Count: ${criticalCount}
High Priority Count: ${highCount}
Moderate/Low Priority Count: ${moderateCount}
Filter Configuration: ${JSON.stringify(filterSummary || {})}
Focus Facility: ${activeFacility ? JSON.stringify(activeFacility) : 'Pan-Regional Surveillance'}

=== ENRICHED ANOMALIES EVIDENCE SAMPLE (TOP DETECTIONS) ===
${JSON.stringify(sampleAnomalies, null, 2)}

=== MANDATORY INSTRUCTIONS ===
1. Generate a structured, professional defence/geospatial intelligence briefing.
2. Ground the SITREP strictly in the provided satellite measurements, OSM assets, and weather conditions.
3. Do NOT invent fake measurements or fictitious facilities not present in the evidence.
4. Structure your briefing with:
   - 1. EXECUTIVE SITUATION SUMMARY
   - 2. INDUSTRIAL VS NATURAL FIRE SEGREGATION ANALYSIS
   - 3. CRITICAL INFRASTRUCTURE & FACILITY RISK ANALYSIS
   - 4. METEOROLOGICAL & DOWNWIND DISPERSION ADVISORY
   - 5. ACTIONABLE DIRECTIVES & NTRO PROTOCOL EXECUTION

Format with clear markdown headers and professional defence/geospatial intelligence phrasing.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      source: 'gemini',
      simulated: false,
      isSimulated: false,
      model: 'gemini-3.6-flash',
      brief: response.text,
    });
  } catch (error: any) {
    console.error('[Gemini API Error] tactical-brief failed:', error?.message || error);
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

// Country-to-Bounding-Box Mapping for NASA FIRMS Area API
// Coordinates format: minLon,minLat,maxLon,maxLat
const COUNTRY_BOUNDING_BOXES: Record<string, string> = {
  IND: '68,6,98,36',       // India
  USA: '-125,24,-66,50',   // United States (contiguous)
  SAU: '34,16,56,33',      // Saudi Arabia
  CAN: '-141,41,-52,83',   // Canada
  AUS: '112,-44,154,-10',  // Australia
  BRA: '-74,-34,-34,5',    // Brazil
  RUS: '19,41,180,82',     // Russia
  CHN: '73,18,135,54',     // China
  IDN: '95,-11,141,6',     // Indonesia
  ARE: '51,22,57,26',      // United Arab Emirates
  KWT: '46,28,49,31',      // Kuwait
  QAT: '50,24,52,27',      // Qatar
  IRQ: '38,29,49,38',      // Iraq
  IRN: '44,25,64,40',      // Iran
  GBR: '-8,49,2,61',       // United Kingdom
  DEU: '5,47,15,55',       // Germany
};

// Supported NASA FIRMS Sensors validation & normalization
const SUPPORTED_FIRMS_SOURCES = new Set([
  'VIIRS_NOAA20_NRT',
  'VIIRS_NOAA21_NRT',
  'VIIRS_SNPP_NRT',
  'MODIS_NRT',
  'LANDSAT_NRT',
]);

function normalizeFirmsSource(source: string): string {
  const s = (source || '').trim();
  if (SUPPORTED_FIRMS_SOURCES.has(s)) return s;
  const upper = s.toUpperCase();
  if (upper === 'VIIRS_NOAA20' || upper === 'NOAA20') return 'VIIRS_NOAA20_NRT';
  if (upper === 'VIIRS_NOAA21' || upper === 'NOAA21') return 'VIIRS_NOAA21_NRT';
  if (upper === 'VIIRS_SNPP' || upper === 'SNPP') return 'VIIRS_SNPP_NRT';
  if (upper === 'MODIS' || upper === 'MODIS_TERRA' || upper === 'MODIS_AQUA') return 'MODIS_NRT';
  return 'VIIRS_NOAA20_NRT';
}

// Validate NASA FIRMS MAP_KEY status independently
app.post('/api/firms/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const resolvedKey = (apiKey || process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY || '').trim();

    if (!resolvedKey) {
      return res.status(400).json({
        success: false,
        error: 'No NASA FIRMS MAP_KEY provided to validate.',
      });
    }

    const url = `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${resolvedKey}`;
    const firmsRes = await fetch(url);
    const text = await firmsRes.text();

    let json: any = null;
    let isValidJson = false;

    try {
      json = JSON.parse(text);
      isValidJson = true;
    } catch {
      isValidJson = false;
    }

    if (isValidJson && json && (json.transaction_limit || json.limit !== undefined)) {
      return res.json({
        success: true,
        httpStatus: firmsRes.status,
        isValidJson: true,
        transaction_limit: json.transaction_limit ?? json.limit ?? 'N/A',
        current_transactions: json.current_transactions ?? json.count ?? json.transactions ?? 'N/A',
        transaction_interval: json.transaction_interval ?? json.interval ?? 'N/A',
        isValidKey: true,
      });
    }

    // Key rejected / invalid
    const isInvalid = !firmsRes.ok || !isValidJson || text.toLowerCase().includes('invalid') || text.toLowerCase().includes('exceeded');
    return res.status(firmsRes.ok && !isInvalid ? 200 : 400).json({
      success: !isInvalid,
      httpStatus: firmsRes.status,
      isValidJson,
      isValidKey: !isInvalid,
      transaction_limit: 'N/A',
      current_transactions: 'N/A',
      transaction_interval: 'N/A',
      message: isInvalid ? 'The provided NASA FIRMS MAP_KEY is invalid or transaction limit exceeded.' : 'Status retrieved',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to reach NASA FIRMS mapkey_status endpoint.',
    });
  }
});

// NASA FIRMS Live Fetcher / Proxy using supported AREA API
app.post('/api/firms/fetch-live', async (req, res) => {
  try {
    const { apiKey, source = 'VIIRS_NOAA20_NRT', countryCode = 'IND', dayRange = 1 } = req.body;
    const resolvedKey = (apiKey || process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY || '').trim();

    if (!resolvedKey) {
      return res.status(400).json({
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: 'NASA FIRMS API Key (MAP_KEY) is required. Please enter your MAP_KEY in Data Management.',
      });
    }

    console.log('[FIRMS] LIVE request started');
    console.log('[FIRMS] Using AREA endpoint');

    // Translate countryCode to bounding box coordinates (minLon,minLat,maxLon,maxLat)
    const cleanCountry = (countryCode || 'IND').trim().toUpperCase();
    const bbox = COUNTRY_BOUNDING_BOXES[cleanCountry] || COUNTRY_BOUNDING_BOXES['IND'];
    const cleanSource = normalizeFirmsSource(source || 'VIIRS_NOAA20_NRT');
    const cleanDayRange = Math.min(10, Math.max(1, parseInt(String(dayRange), 10) || 1));

    // NASA FIRMS AREA API live query format:
    // https://firms.modaps.eosdis.nasa.gov/api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${resolvedKey}/${cleanSource}/${bbox}/${cleanDayRange}`;

    const firmsResponse = await fetch(url);
    console.log('[FIRMS] NASA response received');

    if (!firmsResponse.ok) {
      return res.status(firmsResponse.status).json({
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: `NASA FIRMS API returned HTTP ${firmsResponse.status}: ${firmsResponse.statusText}`,
      });
    }

    const csvText = await firmsResponse.text();

    // Detect NASA inline error responses (NASA returns 200 OK with error text in body)
    const lower = csvText.toLowerCase();
    if (
      lower.includes('invalid map_key') ||
      lower.includes('invalid map key') ||
      lower.includes('invalid key') ||
      lower.includes('unauthorized') ||
      lower.includes('invalid source') ||
      lower.includes('invalid country') ||
      lower.includes('invalid area') ||
      lower.includes('transaction limit') ||
      lower.includes('rate limit') ||
      lower.startsWith('<!doctype') ||
      lower.startsWith('<html')
    ) {
      const sanitizedError = csvText.trim().split(resolvedKey).join('***KEY***');
      return res.status(400).json({
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: `NASA FIRMS rejected the request: ${sanitizedError}`,
      });
    }

    // Count records in CSV (excluding header and blank lines)
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsedCount = Math.max(0, lines.length - 1);

    console.log(`[FIRMS] CSV records parsed: ${parsedCount}`);
    console.log('[FIRMS] Returning LIVE NASA FIRMS records');

    res.json({
      success: true,
      source: 'NASA_FIRMS_LIVE',
      simulated: false,
      count: parsedCount,
      rawCsv: csvText,
      urlQueried: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/***KEY***/${cleanSource}/${bbox}/${cleanDayRange}`,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    const rawError = error?.message || 'Failed to query NASA FIRMS API.';
    const sanitizedError = typeof rawError === 'string' ? rawError.split(req.body?.apiKey || '').join('***KEY***') : 'Failed to query NASA FIRMS API.';
    console.error('[FIRMS Error] Failed to fetch live data:', sanitizedError);
    res.status(500).json({
      success: false,
      source: 'NASA_FIRMS',
      simulated: false,
      error: sanitizedError,
    });
  }
});

// ============================================================================
// PHASE 4: Real OpenStreetMap (OSM) Overpass API Enrichment Engine

interface OsmCacheEntry {
  timestamp: number;
  elements: any[];
}

const osmCache = new Map<string, OsmCacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes in-memory cache

// Haversine geographic distance in meters
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build Overpass QL query targeted at industrial infrastructure within radiusMeters (5km)
function buildOverpassQuery(lat: number, lon: number, radiusMeters: number = 5000): string {
  return `[out:json][timeout:12];
(
  node["man_made"="works"](around:${radiusMeters},${lat},${lon});
  way["man_made"="works"](around:${radiusMeters},${lat},${lon});
  relation["man_made"="works"](around:${radiusMeters},${lat},${lon});
  node["industrial"](around:${radiusMeters},${lat},${lon});
  way["industrial"](around:${radiusMeters},${lat},${lon});
  relation["industrial"](around:${radiusMeters},${lat},${lon});
  node["power"="plant"](around:${radiusMeters},${lat},${lon});
  way["power"="plant"](around:${radiusMeters},${lat},${lon});
  relation["power"="plant"](around:${radiusMeters},${lat},${lon});
  node["power"="generator"](around:${radiusMeters},${lat},${lon});
  way["power"="generator"](around:${radiusMeters},${lat},${lon});
  relation["power"="generator"](around:${radiusMeters},${lat},${lon});
  node["landuse"="industrial"](around:${radiusMeters},${lat},${lon});
  way["landuse"="industrial"](around:${radiusMeters},${lat},${lon});
  relation["landuse"="industrial"](around:${radiusMeters},${lat},${lon});
  node["man_made"="storage_tank"](around:${radiusMeters},${lat},${lon});
  way["man_made"="storage_tank"](around:${radiusMeters},${lat},${lon});
  relation["man_made"="storage_tank"](around:${radiusMeters},${lat},${lon});
  node["landuse"="quarry"](around:${radiusMeters},${lat},${lon});
  way["landuse"="quarry"](around:${radiusMeters},${lat},${lon});
  relation["landuse"="quarry"](around:${radiusMeters},${lat},${lon});
);
out center 25;`;
}

// Fetch elements from public Overpass API with failover endpoints and caching
async function fetchOverpassElements(lat: number, lon: number): Promise<{ elements: any[]; status: 'SUCCESS' | 'EMPTY' | 'FAILED' }> {
  // Round coordinates to ~3 decimal places (~100m) for caching
  const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const now = Date.now();
  const cached = osmCache.get(cacheKey);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return { elements: cached.elements, status: cached.elements.length > 0 ? 'SUCCESS' : 'EMPTY' };
  }

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  const query = buildOverpassQuery(lat, lon, 5000);

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NTROThermalPulse/1.0 (Geospatial Thermal Analysis)',
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const json: any = await response.json();
        const elements = json.elements || [];
        osmCache.set(cacheKey, { timestamp: now, elements });
        return { elements, status: elements.length > 0 ? 'SUCCESS' : 'EMPTY' };
      }
    } catch (err: any) {
      console.warn(`[Overpass API] Endpoint ${endpoint} failed or timed out:`, err?.message || err);
    }
  }

  return { elements: [], status: 'FAILED' };
}

// Map OSM tags to application FacilityType
function mapOsmFacilityType(tags: Record<string, string>): string {
  const power = (tags.power || '').toLowerCase();
  const industrial = (tags.industrial || '').toLowerCase();
  const manMade = (tags.man_made || '').toLowerCase();
  const landuse = (tags.landuse || '').toLowerCase();
  const resource = (tags.resource || '').toLowerCase();
  const substance = (tags.substance || tags.product || '').toLowerCase();
  const name = (tags.name || tags['name:en'] || '').toLowerCase();

  // Power generation
  if (
    power === 'plant' ||
    power === 'generator' ||
    name.includes('thermal power') ||
    name.includes('power station') ||
    name.includes('power plant')
  ) {
    return 'THERMAL_POWER';
  }

  // Oil refinery
  if (
    industrial === 'oil' ||
    industrial === 'petroleum' ||
    name.includes('refinery') ||
    tags.plant === 'refinery'
  ) {
    return 'OIL_REFINERY';
  }

  // Petrochemical & Chemical works
  if (
    industrial === 'chemical' ||
    industrial === 'petrochemical' ||
    name.includes('petrochemical') ||
    name.includes('chemical')
  ) {
    return 'PETROCHEMICAL';
  }

  // Coal mining (REQUIRES explicit coal evidence)
  const hasCoalEvidence =
    resource === 'coal' ||
    substance.includes('coal') ||
    tags.mine === 'coal' ||
    name.includes('coal') ||
    name.includes('colliery') ||
    name.includes('coalfield');

  if (hasCoalEvidence) {
    return 'COAL_MINE';
  }

  // Specific LNG / LPG / Petroleum storage terminal
  const hasPetroleumGasStorage =
    substance.includes('lng') ||
    substance.includes('lpg') ||
    substance.includes('oil') ||
    substance.includes('gas') ||
    substance.includes('fuel') ||
    resource.includes('gas') ||
    resource.includes('oil') ||
    name.includes('lng') ||
    name.includes('lpg') ||
    name.includes('petroleum') ||
    name.includes('crude') ||
    name.includes('oil terminal') ||
    name.includes('fuel depot');

  if (hasPetroleumGasStorage) {
    return 'LNG_TERMINAL';
  }

  // Steel plant
  if (
    industrial === 'steel' ||
    substance === 'steel' ||
    name.includes('steel plant') ||
    name.includes('blast furnace')
  ) {
    return 'STEEL_PLANT';
  }

  // Generic storage tank (without specific petroleum/gas evidence)
  if (manMade === 'storage_tank' || industrial === 'storage') {
    return 'STORAGE_TANK';
  }

  // Generic quarry (stone, limestone, granite without coal tags)
  if (landuse === 'quarry' || tags.mine === 'yes') {
    return 'QUARRY';
  }

  // General industrial works
  if (landuse === 'industrial' || industrial || manMade === 'works') {
    return 'CHEMICAL';
  }

  return 'NONE';
}

// Find nearest relevant OSM facility candidate using Haversine calculation
function selectNearestOsmFacility(anomalyLat: number, anomalyLon: number, elements: any[]) {
  if (!elements || elements.length === 0) return null;

  let bestMatch: any = null;
  let minDistance = Infinity;

  for (const elem of elements) {
    const elemLat = elem.lat ?? elem.center?.lat;
    const elemLon = elem.lon ?? elem.center?.lon;
    if (elemLat === undefined || elemLon === undefined) continue;

    const distMeters = haversineDistanceMeters(anomalyLat, anomalyLon, elemLat, elemLon);

    if (distMeters < minDistance) {
      minDistance = distMeters;
      const tags = elem.tags || {};
      const name = tags.name || tags['name:en'] || tags['official_name'] || 'Unnamed OSM facility';
      const facilityType = mapOsmFacilityType(tags);

      bestMatch = {
        matchedFacilityName: name,
        facilityType,
        distanceMeters: Math.round(distMeters),
        osmId: `${elem.type}/${elem.id}`,
        tags,
      };
    }
  }

  return bestMatch;
}

// POST /api/osm/enrich-anomalies
app.post('/api/osm/enrich-anomalies', async (req, res) => {
  try {
    const { anomalies, maxEnrich = 15 } = req.body;

    if (!Array.isArray(anomalies)) {
      return res.status(400).json({ error: 'Anomalies array is required for enrichment.' });
    }

    if (anomalies.length === 0) {
      return res.json({
        success: true,
        enrichedCount: 0,
        anomalies: [],
      });
    }

    // Rank anomalies by importance (FRP descending, then confidence)
    const rankedIndices = anomalies
      .map((a: any, idx: number) => ({ idx, frp: Number(a.frp || 0) }))
      .sort((a, b) => b.frp - a.frp)
      .slice(0, Math.min(maxEnrich, anomalies.length))
      .map((item) => item.idx);

    const enrichedAnomalies = [...anomalies];

    // Process top anomalies sequentially with rate protection
    for (const targetIndex of rankedIndices) {
      const anomaly = enrichedAnomalies[targetIndex];
      const { latitude, longitude } = anomaly;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') continue;

      const { elements, status } = await fetchOverpassElements(latitude, longitude);

      if (status === 'SUCCESS' && elements.length > 0) {
        const bestCandidate = selectNearestOsmFacility(latitude, longitude, elements);
        if (bestCandidate) {
          const reclassified = classifyThermalAnomaly({
            frp: anomaly.frp,
            brightnessK: anomaly.brightness,
            brightness31K: anomaly.brightness_31,
            confidence: anomaly.confidence,
            satellite: anomaly.satellite,
            persistenceIndex: anomaly.persistenceIndex,
            historicalDetectionsCount: anomaly.historicalDetectionsCount,
            osmFacilityType: bestCandidate.facilityType,
            osmFacilityName: bestCandidate.matchedFacilityName,
            osmDistanceMeters: bestCandidate.distanceMeters,
            osmTags: bestCandidate.tags,
            landCoverType: anomaly.landCover?.type,
          });

          enrichedAnomalies[targetIndex] = {
            ...anomaly,
            osmProximity: bestCandidate,
            classification: reclassified.classification,
            confidenceScore: reclassified.confidenceScore,
            hazardLevel: reclassified.hazardLevel,
            anomalyStatus: reclassified.anomalyStatus,
            classificationReason: reclassified.classificationReason,
            evidence: reclassified.evidence,
          };
        } else {
          enrichedAnomalies[targetIndex] = {
            ...anomaly,
            osmProximity: {
              matchedFacilityName: 'No nearby facility found',
              facilityType: 'NONE',
              distanceMeters: -1,
              osmId: 'none',
              tags: {},
            },
          };
        }
      } else if (status === 'EMPTY') {
        enrichedAnomalies[targetIndex] = {
          ...anomaly,
          osmProximity: {
            matchedFacilityName: 'No nearby facility found',
            facilityType: 'NONE',
            distanceMeters: -1,
            osmId: 'none',
            tags: {},
          },
        };
      } else {
        // Failed Overpass lookup: leave FIRMS intact with clear status
        enrichedAnomalies[targetIndex] = {
          ...anomaly,
          osmProximity: {
            matchedFacilityName: 'OSM lookup unavailable',
            facilityType: 'NONE',
            distanceMeters: -1,
            osmId: 'none',
            tags: {},
          },
        };
      }

      // Small delay between requests to respect public Overpass API limits
      await new Promise((r) => setTimeout(r, 250));
    }

    res.json({
      success: true,
      enrichedCount: rankedIndices.length,
      anomalies: enrichedAnomalies,
    });
  } catch (error: any) {
    console.error('[OSM Overpass Error] Enrichment failed:', error?.message || error);
    // Return original anomalies unharmed on error
    res.json({
      success: false,
      error: error?.message || 'OSM enrichment failed',
      anomalies: req.body?.anomalies || [],
    });
  }
});

// ============================================================================
// PHASE 6: Real Weather / Wind Data via Open-Meteo (no API key required)

interface WeatherCacheEntry {
  timestamp: number;
  data: {
    windSpeedKmh: number;
    windDirectionDeg: number;
    observedAt: string;
  } | null;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute TTL

// Fetch real current wind from Open-Meteo (no key required for non-commercial use)
// Returns null on any failure — NEVER fabricates values
async function fetchOpenMeteoWind(
  lat: number,
  lon: number
): Promise<{ windSpeedKmh: number; windDirectionDeg: number; observedAt: string } | null> {
  const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    // Open-Meteo current weather endpoint — wind_speed_10m (km/h), wind_direction_10m (degrees)
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=UTC&forecast_days=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'NTROThermalPulse/1.0 (Geospatial Thermal Analysis)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[WEATHER] Open-Meteo HTTP ${response.status} for (${lat},${lon})`);
      weatherCache.set(cacheKey, { timestamp: now, data: null });
      return null;
    }

    const json: any = await response.json();
    const current = json?.current;
    if (
      current == null ||
      current.wind_speed_10m == null ||
      current.wind_direction_10m == null
    ) {
      console.warn(`[WEATHER] Open-Meteo returned no current data for (${lat},${lon})`);
      weatherCache.set(cacheKey, { timestamp: now, data: null });
      return null;
    }

    const result = {
      windSpeedKmh: Number(current.wind_speed_10m),
      windDirectionDeg: Number(current.wind_direction_10m),
      observedAt: current.time ?? new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err: any) {
    console.warn(`[WEATHER] Open-Meteo fetch error for (${lat},${lon}):`, err?.message || err);
    weatherCache.set(cacheKey, { timestamp: now, data: null });
    return null;
  }
}

// POST /api/weather/current — server-side Open-Meteo proxy
// Body: { latitude: number, longitude: number }
app.post('/api/weather/current', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Strict coordinate validation
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

    console.log('[WEATHER] LIVE request started');
    const result = await fetchOpenMeteoWind(lat, lon);
    console.log('[WEATHER] Open-Meteo response received');

    if (!result) {
      return res.json({
        success: false,
        source: 'OPEN_METEO',
        status: 'UNAVAILABLE',
      });
    }

    console.log('[WEATHER] Wind data parsed');
    console.log('[WEATHER] Returning REAL weather data');

    res.json({
      success: true,
      source: 'OPEN_METEO',
      status: 'REAL',
      windSpeedKmh: result.windSpeedKmh,
      windDirectionDeg: result.windDirectionDeg,
      observedAt: result.observedAt,
    });
  } catch (error: any) {
    console.error('[WEATHER Error]', error?.message || error);
    res.status(500).json({
      success: false,
      source: 'OPEN_METEO',
      status: 'ERROR',
      error: error?.message || 'Weather API request failed.',
    });
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
