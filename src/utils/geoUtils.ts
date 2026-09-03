import { FireClassification, HazardLevel, ThermalAnomaly, FacilityType } from '../types';

// Haversine distance in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Generates cone polygon coordinates for wind/smoke plume dispersion
export function generatePlumeCone(
  lat: number,
  lng: number,
  lengthKm: number,
  windDirectionDeg: number,
  coneAngleDeg: number = 35
): [number, number][] {
  // Plume blows in the direction the wind is blowing towards (windDirectionDeg)
  const blowDirection = (windDirectionDeg + 180) % 360;
  const radians = (deg: number) => (deg * Math.PI) / 180;

  // Earth radius in km
  const R = 6371;

  function destinationPoint(lat: number, lon: number, distanceKm: number, bearingDeg: number): [number, number] {
    const δ = distanceKm / R;
    const θ = radians(bearingDeg);
    const φ1 = radians(lat);
    const λ1 = radians(lon);

    const sinφ2 = Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ);
    const φ2 = Math.asin(sinφ2);
    const y = Math.sin(θ) * Math.sin(δ) * Math.cos(φ1);
    const x = Math.cos(δ) - Math.sin(φ1) * sinφ2;
    const λ2 = λ1 + Math.atan2(y, x);

    return [(φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI];
  }

  const leftBearing = (blowDirection - coneAngleDeg / 2 + 360) % 360;
  const rightBearing = (blowDirection + coneAngleDeg / 2) % 360;

  const ptOrigin: [number, number] = [lat, lng];
  const ptLeft = destinationPoint(lat, lng, lengthKm, leftBearing);
  const ptCenter = destinationPoint(lat, lng, lengthKm * 1.1, blowDirection);
  const ptRight = destinationPoint(lat, lng, lengthKm, rightBearing);

  return [ptOrigin, ptLeft, ptCenter, ptRight, ptOrigin];
}

export interface ClassificationResult {
  classification: FireClassification;
  confidenceScore: number; // 0-100 heuristic evidence score (NOT a probability)
  hazardLevel: HazardLevel;
  anomalyStatus: ThermalAnomaly['anomalyStatus'];
  classificationReason: string;
  evidence: string[];
}

export interface PriorityScore {
  score: number;
  responseWindow: string;
  factors: string[];
}

// Operational triage score: deterministic and explainable, not a probability.
export function calculatePriorityScore(anomaly: Pick<ThermalAnomaly, 'frp' | 'brightness' | 'hazardLevel' | 'persistenceIndex' | 'osmProximity' | 'weather' | 'classification'>): PriorityScore {
  let score = 10;
  const factors: string[] = [];

  if (anomaly.hazardLevel === 'CRITICAL') { score += 35; factors.push('Critical hazard classification'); }
  else if (anomaly.hazardLevel === 'HIGH') { score += 25; factors.push('High hazard classification'); }
  else if (anomaly.hazardLevel === 'MODERATE') { score += 12; factors.push('Moderate hazard classification'); }
  if (anomaly.frp >= 150) { score += 25; factors.push(`Extreme FRP (${anomaly.frp.toFixed(1)} MW)`); }
  else if (anomaly.frp >= 75) { score += 16; factors.push(`Elevated FRP (${anomaly.frp.toFixed(1)} MW)`); }
  else if (anomaly.frp >= 35) { score += 8; factors.push(`Moderate FRP (${anomaly.frp.toFixed(1)} MW)`); }
  if (anomaly.brightness >= 380) { score += 12; factors.push(`High brightness (${anomaly.brightness.toFixed(1)} K)`); }
  else if (anomaly.brightness >= 350) { score += 6; factors.push(`Elevated brightness (${anomaly.brightness.toFixed(1)} K)`); }

  const distance = anomaly.osmProximity?.distanceMeters;
  if (typeof distance === 'number' && distance >= 0) {
    if (distance <= 500) { score += 18; factors.push(`Asset proximity (${distance} m)`); }
    else if (distance <= 3000) { score += 10; factors.push(`Facility buffer proximity (${(distance / 1000).toFixed(1)} km)`); }
  }
  if ((anomaly.persistenceIndex ?? 0) >= 0.7) { score += 8; factors.push(`Persistent signal (${((anomaly.persistenceIndex ?? 0) * 100).toFixed(0)}%)`); }
  if (anomaly.weather?.status === 'REAL' && (anomaly.weather.windSpeedKmh ?? 0) >= 25) {
    score += 5;
    factors.push(`Strong wind (${anomaly.weather.windSpeedKmh.toFixed(1)} km/h)`);
  }
  if (anomaly.classification === 'INDUSTRIAL_FIRE' || anomaly.classification === 'COAL_MINING_FIRE') {
    score += 5;
    factors.push('Industrial or mining incident type');
  }

  const boundedScore = Math.min(100, score);
  return {
    score: boundedScore,
    responseWindow: boundedScore >= 80 ? 'Immediate: verify within 15 min' : boundedScore >= 60 ? 'Urgent: verify within 60 min' : 'Routine: monitor next pass',
    factors,
  };
}

// Evidence-based rule-based heuristic classification engine
export function classifyThermalAnomaly(params: {
  frp?: number;
  brightness?: number;
  brightnessK?: number;
  brightness31K?: number;
  confidence?: string | number;
  satellite?: string;
  persistenceIndex?: number;
  historicalDetectionsCount?: number;
  osmFacilityType?: FacilityType;
  osmFacilityName?: string;
  osmDistanceMeters?: number;
  osmTags?: Record<string, string>;
  landCoverType?: string;
  swirRatio?: number;
}): ClassificationResult {
  const frp = Number(params.frp ?? 0);
  const brightnessK = Number(params.brightnessK ?? params.brightness ?? 0);
  const {
    confidence = 'nominal',
    persistenceIndex,
    osmFacilityType = 'NONE',
    osmFacilityName,
    osmDistanceMeters = -1,
    osmTags = {},
    landCoverType = 'UNKNOWN',
  } = params;

  const evidence: string[] = [];

  // 1. Transparent Heuristic Evidence Scoring (Conservative 0-100 scale)
  let heuristicScore = 20; // Base presence points

  // FIRMS Detection Confidence
  if (confidence === 'high') {
    heuristicScore += 25;
    evidence.push('FIRMS detection confidence: HIGH');
  } else if (confidence === 'nominal') {
    heuristicScore += 15;
    evidence.push('FIRMS detection confidence: NOMINAL');
  } else if (confidence === 'low') {
    heuristicScore += 5;
    evidence.push('FIRMS detection confidence: LOW');
  } else if (typeof confidence === 'number') {
    const pts = Math.round((Math.min(100, Math.max(0, confidence)) / 100) * 25);
    heuristicScore += pts;
    evidence.push(`FIRMS confidence: ${confidence}%`);
  }

  // FIRMS Thermal Radiative Power (FRP)
  if (frp > 100) {
    heuristicScore += 20;
    evidence.push(`Strong thermal radiative power: ${frp.toFixed(1)} MW FRP`);
  } else if (frp > 35) {
    heuristicScore += 15;
    evidence.push(`Moderate thermal radiative power: ${frp.toFixed(1)} MW FRP`);
  } else if (frp > 0) {
    heuristicScore += 8;
    evidence.push(`Low thermal radiative power: ${frp.toFixed(1)} MW FRP`);
  }

  // FIRMS Brightness Temperature
  if (brightnessK > 350) {
    heuristicScore += 10;
    evidence.push(`High brightness temperature: ${brightnessK.toFixed(1)} K`);
  } else if (brightnessK > 320) {
    heuristicScore += 5;
    evidence.push(`Brightness temperature: ${brightnessK.toFixed(1)} K`);
  }

  // 2. Evaluate Real OpenStreetMap (OSM) Evidence
  const hasOsmCandidate = osmDistanceMeters >= 0 && osmDistanceMeters <= 5000 && osmFacilityType !== 'NONE';
  const isCloseProximity = osmDistanceMeters >= 0 && osmDistanceMeters <= 3000;
  const isVeryCloseProximity = osmDistanceMeters >= 0 && osmDistanceMeters <= 1200;

  if (hasOsmCandidate) {
    const distKm = (osmDistanceMeters / 1000).toFixed(2);
    const facilityLabel = osmFacilityName && osmFacilityName !== 'Unnamed OSM facility' ? `"${osmFacilityName}"` : 'OSM mapped facility';
    evidence.push(`OSM proximity: ${facilityLabel} (${osmFacilityType}) at ${distKm} km`);

    if (isVeryCloseProximity) {
      heuristicScore += 20;
    } else if (isCloseProximity) {
      heuristicScore += 10;
    }

    // A. POWER PLANT THERMAL
    if (osmFacilityType === 'THERMAL_POWER' && isCloseProximity) {
      heuristicScore += 10;
      const finalScore = Math.min(85, Math.max(35, heuristicScore));
      return {
        classification: 'POWER_PLANT_THERMAL',
        confidenceScore: finalScore,
        hazardLevel: frp > 120 ? 'HIGH' : 'LOW',
        anomalyStatus: 'NORMAL_ROUTINE',
        classificationReason: `Thermal anomaly located ${distKm} km from an OSM-mapped power generation facility (${facilityLabel}).`,
        evidence,
      };
    }

    // B. COAL MINING FIRE (Strictly requires explicit coal evidence)
    const hasExplicitCoalEvidence =
      osmFacilityType === 'COAL_MINE' ||
      osmTags.resource === 'coal' ||
      (osmTags.substance || '').toLowerCase().includes('coal') ||
      (osmFacilityName || '').toLowerCase().includes('coal') ||
      (osmFacilityName || '').toLowerCase().includes('colliery');

    if (hasExplicitCoalEvidence && isCloseProximity) {
      heuristicScore += 10;
      const finalScore = Math.min(85, Math.max(35, heuristicScore));
      return {
        classification: 'COAL_MINING_FIRE',
        confidenceScore: finalScore,
        hazardLevel: frp > 70 ? 'HIGH' : 'MODERATE',
        anomalyStatus: 'SUB_SURFACE_SMOLDERING',
        classificationReason: `Thermal anomaly co-located ${distKm} km from a documented coal mining site (${facilityLabel}) with verified coal resource tags.`,
        evidence,
      };
    }

    // C. PERSISTENT GAS FLARE (Requires actual non-null persistence evidence)
    const hasRealPersistence = persistenceIndex !== undefined && persistenceIndex !== null && persistenceIndex > 0.4;
    const isFlareCompatibleFacility =
      osmFacilityType === 'OIL_REFINERY' ||
      osmFacilityType === 'PETROCHEMICAL' ||
      osmFacilityType === 'LNG_TERMINAL';

    if (hasRealPersistence && isFlareCompatibleFacility && isCloseProximity) {
      heuristicScore += 10;
      evidence.push(`90-day temporal persistence: ${(persistenceIndex * 100).toFixed(0)}%`);
      const finalScore = Math.min(85, Math.max(35, heuristicScore));
      return {
        classification: 'PERSISTENT_GAS_FLARE',
        confidenceScore: finalScore,
        hazardLevel: frp > 80 ? 'MODERATE' : 'LOW',
        anomalyStatus: frp > 60 ? 'ELEVATED_FLARE' : 'NORMAL_ROUTINE',
        classificationReason: `High multi-temporal persistence (${(persistenceIndex * 100).toFixed(0)}%) co-located ${distKm} km from verified refinery/petrochemical infrastructure (${facilityLabel}).`,
        evidence,
      };
    }

    // D. INDUSTRIAL FIRE (Major thermal event near genuine industrial facility)
    const isGenuineIndustrialFacility =
      osmFacilityType === 'OIL_REFINERY' ||
      osmFacilityType === 'PETROCHEMICAL' ||
      osmFacilityType === 'STEEL_PLANT' ||
      osmFacilityType === 'CHEMICAL' ||
      osmFacilityType === 'LNG_TERMINAL';

    if (isGenuineIndustrialFacility && isCloseProximity && (frp > 40 || brightnessK > 335)) {
      heuristicScore += 10;
      const finalScore = Math.min(85, Math.max(35, heuristicScore));
      return {
        classification: 'INDUSTRIAL_FIRE',
        confidenceScore: finalScore,
        hazardLevel: frp > 120 ? 'CRITICAL' : 'HIGH',
        anomalyStatus: 'ACCIDENTAL_SPIKE_FIRE',
        classificationReason: `Elevated thermal intensity (${frp.toFixed(1)} MW) situated ${distKm} km from an industrial installation (${facilityLabel}).`,
        evidence,
      };
    }
  }

  // 3. Evaluate Real Land Cover Evidence (Only if non-UNKNOWN and verified)
  const hasRealLandCover = landCoverType !== 'UNKNOWN' && landCoverType !== '';
  if (hasRealLandCover) {
    evidence.push(`Land cover classification: ${landCoverType}`);

    if (landCoverType === 'CROPLAND') {
      heuristicScore += 10;
      const finalScore = Math.min(80, Math.max(35, heuristicScore));
      return {
        classification: 'AGRICULTURAL_STUBBLE',
        confidenceScore: finalScore,
        hazardLevel: frp > 80 ? 'HIGH' : 'MODERATE',
        anomalyStatus: 'ACTIVE_SPREADING',
        classificationReason: `Thermal anomaly positioned on verified agricultural cropland without adjacent industrial infrastructure.`,
        evidence,
      };
    }

    if (landCoverType === 'DENSE_FOREST' || landCoverType === 'SHRUBLAND') {
      heuristicScore += 10;
      const finalScore = Math.min(80, Math.max(35, heuristicScore));
      return {
        classification: 'FOREST_WILDFIRE',
        confidenceScore: finalScore,
        hazardLevel: frp > 100 ? 'CRITICAL' : 'HIGH',
        anomalyStatus: 'ACTIVE_SPREADING',
        classificationReason: `Thermal detection situated in woodland/shrubland land-cover zone without industrial association.`,
        evidence,
      };
    }
  }

  // 4. Conservative Fallback: URBAN_OTHER
  // For un-enriched FIRMS anomalies, generic storage tanks, generic quarries without coal tags, or isolated detections
  const isHighThermalIntensity = frp > 100 || brightnessK > 360;
  const isModerateThermalIntensity = frp > 40 || brightnessK > 335;
  const finalScore = Math.min(75, Math.max(30, heuristicScore));

  let reason = `FIRMS thermal detection (${frp.toFixed(1)} MW, ${brightnessK.toFixed(1)} K). Contextual evidence is insufficient to confirm a specific industrial/wildfire class.`;
  if (osmFacilityType === 'STORAGE_TANK') {
    reason = `Thermal signal located near an OSM storage tank without specific petroleum/gas tags. Classified conservatively as URBAN_OTHER.`;
  } else if (osmFacilityType === 'QUARRY') {
    reason = `Thermal signal near an OSM quarry without verified coal resource tags. Classified conservatively as URBAN_OTHER.`;
  }

  return {
    classification: 'URBAN_OTHER',
    confidenceScore: finalScore,
    hazardLevel: isHighThermalIntensity ? 'HIGH' : isModerateThermalIntensity ? 'MODERATE' : 'LOW',
    anomalyStatus: 'NORMAL_ROUTINE',
    classificationReason: reason,
    evidence,
  };
}

// Splits a single CSV line accounting for quotes
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"(.*)"$/, '$1'));
  return result;
}

// Convert FIRMS raw CSV line to parsed anomaly object
export function parseFirmsCsvRow(row: Record<string, string>, index: number): ThermalAnomaly | null {
  try {
    const lat = parseFloat(row.latitude || row.lat);
    const lon = parseFloat(row.longitude || row.lon || row.long);

    // If coordinates are invalid, return null to safely ignore row
    if (isNaN(lat) || isNaN(lon)) return null;

    const brightness = parseFloat(row.bright_ti4 || row.brightness || row.bright_t31 || '0');
    const brightness31 = parseFloat(row.bright_ti5 || row.bright_t31 || '0');
    const frp = parseFloat(row.frp || '0');
    const acqDate = row.acq_date || row.acqdate || new Date().toISOString().split('T')[0];
    const acqTime = row.acq_time || row.acqtime || '00:00';
    const satelliteRaw = (row.satellite || row.instrument || 'VIIRS_NOAA20').toUpperCase();
    const daynightRaw = (row.daynight || 'N').toUpperCase();
    const daynight: 'D' | 'N' = daynightRaw.startsWith('D') ? 'D' : 'N';

    const confidenceRaw = (row.confidence || 'nominal').toLowerCase();
    let confidence: 'low' | 'nominal' | 'high' | number = 'nominal';
    if (confidenceRaw === 'low' || confidenceRaw === 'l') {
      confidence = 'low';
    } else if (confidenceRaw === 'nominal' || confidenceRaw === 'n') {
      confidence = 'nominal';
    } else if (confidenceRaw === 'high' || confidenceRaw === 'h') {
      confidence = 'high';
    } else if (!isNaN(Number(confidenceRaw))) {
      confidence = Number(confidenceRaw);
    }

    let satellite: ThermalAnomaly['satellite'] = 'VIIRS_NOAA20';
    if (satelliteRaw.includes('SNPP') || satelliteRaw.includes('NPP')) satellite = 'VIIRS_SNPP';
    else if (satelliteRaw.includes('NOAA21') || satelliteRaw.includes('21')) satellite = 'VIIRS_NOAA21';
    else if (satelliteRaw.includes('TERRA') || satelliteRaw.includes('T')) satellite = 'MODIS_Terra';
    else if (satelliteRaw.includes('AQUA') || satelliteRaw.includes('A')) satellite = 'MODIS_Aqua';

    // Classification strictly using real available FIRMS measurements
    const classified = classifyThermalAnomaly({
      frp,
      brightnessK: brightness,
      brightness31K: brightness31 > 0 ? brightness31 : undefined,
      confidence,
      satellite,
    });

    return {
      id: `firms-live-${Date.now()}-${index}`,
      latitude: lat,
      longitude: lon,
      brightness,
      brightness_31: brightness31 > 0 ? brightness31 : undefined,
      scan: parseFloat(row.scan || '0.4'),
      track: parseFloat(row.track || '0.4'),
      acq_date: acqDate,
      acq_time: acqTime,
      satellite,
      confidence,
      version: row.version || '2.0NRT',
      frp,
      daynight,
      classification: classified.classification,
      confidenceScore: classified.confidenceScore,
      classificationReason: classified.classificationReason,
      evidence: classified.evidence,
      persistenceIndex: undefined,
      historicalDetectionsCount: undefined,
      anomalyStatus: classified.anomalyStatus,
      hazardLevel: classified.hazardLevel,
      // Contextual fields are unavailable until real external data lookup (Phase 4 OpenStreetMap)
      osmProximity: undefined,
      landCover: undefined,
      multispectral: {
        swirRatio_B12_B11: undefined,
        nbr: undefined,
        ndvi: undefined,
        estimatedTempCelsius: brightness > 0 ? Math.round(brightness - 273.15) : 0,
      },
      plumeDispersion: undefined,
    };
  } catch (err) {
    console.error('Error parsing FIRMS row:', err);
    return null;
  }
}

// Export anomalies as GeoJSON FeatureCollection
export function exportAnomaliesToGeoJSON(anomalies: ThermalAnomaly[]) {
  const geojson = {
    type: 'FeatureCollection',
    metadata: {
      generator: 'NTRO ThermalPulse AI Intelligence Platform',
      exportedAt: new Date().toISOString(),
      count: anomalies.length,
    },
    features: anomalies.map((a) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [a.longitude, a.latitude],
      },
      properties: {
        id: a.id,
        classification: a.classification,
        hazardLevel: a.hazardLevel,
        frp_mw: a.frp,
        brightness_k: a.brightness,
        temperature_c: a.brightness ? Math.round(a.brightness - 273.15) : null,
        satellite: a.satellite,
        acq_date: a.acq_date,
        acq_time: a.acq_time,
        daynight: a.daynight,
        confidence: a.confidence,
        matchedFacility: a.osmProximity?.matchedFacilityName || null,
        distanceToFacilityMeters: a.osmProximity?.distanceMeters ?? null,
        persistenceIndex: a.persistenceIndex ?? null,
        responseStatus: a.responseStatus || 'NEW',
        assignedAgency: a.assignedAgency || null,
      },
    })),
  };

  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ntro-thermalpulse-${new Date().toISOString().slice(0, 10)}.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export anomalies as standard CSV
export function exportAnomaliesToCSV(anomalies: ThermalAnomaly[]) {
  const headers = [
    'ID',
    'Classification',
    'HazardLevel',
    'PriorityScore',
    'Latitude',
    'Longitude',
    'FRP_MW',
    'Brightness_K',
    'Temperature_C',
    'Satellite',
    'AcquisitionDate',
    'AcquisitionTime',
    'DayNight',
    'Confidence',
    'MatchedFacility',
    'DistanceToFacility_m',
    'PersistenceIndex',
    'ResponseStatus',
  ];

  const rows = anomalies.map((a) => {
    const pScore = calculatePriorityScore(a).score;
    const tempC = a.brightness ? Math.round(a.brightness - 273.15) : '';
    return [
      `"${a.id}"`,
      `"${a.classification}"`,
      `"${a.hazardLevel}"`,
      pScore,
      a.latitude,
      a.longitude,
      a.frp,
      a.brightness,
      tempC,
      `"${a.satellite}"`,
      `"${a.acq_date}"`,
      `"${a.acq_time}"`,
      `"${a.daynight}"`,
      `"${a.confidence}"`,
      `"${(a.osmProximity?.matchedFacilityName || '').replace(/"/g, '""')}"`,
      a.osmProximity?.distanceMeters ?? '',
      a.persistenceIndex ?? '',
      `"${a.responseStatus || 'NEW'}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ntro-thermalpulse-report-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
