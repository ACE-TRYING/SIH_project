import { getGeminiClient } from '../config/env';

export function formatEvidencePackage(anomaly: any) {
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

export async function classifyAndAnalyzeAnomaly(anomaly: any) {
  const ai = getGeminiClient();
  const evidencePkg = formatEvidencePackage(anomaly);

  if (!ai) {
    console.warn('[Gemini Service] GEMINI_API_KEY is not configured in environment. Using fallback.');
    return {
      success: true,
      source: 'fallback',
      simulated: true,
      isSimulated: true,
      insight: {
        assessment: `NTRO Tactical Synthesis (Fallback): Anomaly ${anomaly.id || 'Detection'} at [${Number(anomaly.latitude).toFixed(4)}, ${Number(anomaly.longitude).toFixed(4)}] registered ${anomaly.frp} MW FRP. Spatial fusion confirms ${anomaly.osmProximity?.matchedFacilityName ? `co-location with ${anomaly.osmProximity.matchedFacilityName} (${anomaly.osmProximity.distanceMeters || 0}m)` : 'no immediate named industrial asset within primary buffer'}.`,
        classificationRationale: `Classification of ${anomaly.classification || 'THERMAL_ANOMALY'} determined by rule-based heuristic fusion of satellite radiance (${anomaly.frp} MW, ${anomaly.brightness} K) and OSM infrastructure proximity.`,
        riskSummary: `Operational hazard categorized as ${anomaly.hazardLevel || 'MODERATE'}. ${anomaly.weather?.status === 'REAL' && typeof anomaly.weather.windSpeedKmh === 'number' ? `Local wind: ${anomaly.weather.windSpeedKmh.toFixed(1)} km/h at ${anomaly.weather.windDirectionDeg}°.` : 'Local meteorological observation unavailable.'}`,
        containmentProtocol: 'Dispatch ground/aerial verification unit, notify relevant facility safety officers, and cross-reference state disaster management protocols.',
        source: 'fallback' as const,
        simulated: true,
        generatedAt: new Date().toISOString(),
      },
    };
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
  return {
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
  };
}

export async function generateTacticalBrief(anomalies: any[], activeFacility: any, filterSummary: any) {
  const ai = getGeminiClient();

  const criticalCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'CRITICAL').length;
  const highCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'HIGH').length;
  const moderateCount = (anomalies || []).filter((a: any) => a.hazardLevel === 'MODERATE' || a.hazardLevel === 'LOW').length;

  if (!ai) {
    console.warn('[Gemini Service] GEMINI_API_KEY is not configured in environment. Using simulated fallback briefing.');
    return {
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
    };
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

  return {
    success: true,
    source: 'gemini',
    simulated: false,
    isSimulated: false,
    model: 'gemini-3.6-flash',
    brief: response.text,
  };
}
