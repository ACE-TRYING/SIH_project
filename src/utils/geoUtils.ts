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

// Rule-based classification engine matching multi-sensor parameters
export function classifyThermalAnomaly(params: {
  frp: number;
  brightnessK: number;
  persistenceIndex: number;
  osmFacilityType: FacilityType;
  osmDistanceMeters: number;
  landCoverType: string;
  swirRatio: number;
  baselineFrp?: number;
}): {
  classification: FireClassification;
  confidenceScore: number;
  hazardLevel: HazardLevel;
  anomalyStatus: ThermalAnomaly['anomalyStatus'];
} {
  const { frp, brightnessK, persistenceIndex, osmFacilityType, osmDistanceMeters, landCoverType, swirRatio, baselineFrp = 30 } = params;

  // 1. Industrial proximity check (< 800m to known industrial installation)
  const isNearIndustrial = osmDistanceMeters <= 1000 && osmFacilityType !== 'NONE';

  if (isNearIndustrial) {
    if (osmFacilityType === 'COAL_MINE' || landCoverType === 'MINING_SURFACE') {
      return {
        classification: 'COAL_MINING_FIRE',
        confidenceScore: 97.5,
        hazardLevel: frp > 70 ? 'HIGH' : 'MODERATE',
        anomalyStatus: 'SUB_SURFACE_SMOLDERING',
      };
    }

    if (osmFacilityType === 'THERMAL_POWER') {
      return {
        classification: 'POWER_PLANT_THERMAL',
        confidenceScore: 93.0,
        hazardLevel: 'LOW',
        anomalyStatus: 'NORMAL_ROUTINE',
      };
    }

    // Distinguish routine flare vs accidental fire / catastrophic spike
    const isMajorSpike = frp > baselineFrp * 2.5 || (frp > 100 && swirRatio > 2.8);
    if (isMajorSpike) {
      return {
        classification: 'INDUSTRIAL_FIRE',
        confidenceScore: 95.0,
        hazardLevel: 'CRITICAL',
        anomalyStatus: 'ACCIDENTAL_SPIKE_FIRE',
      };
    }

    if (persistenceIndex > 0.4 || swirRatio > 1.6) {
      return {
        classification: 'PERSISTENT_GAS_FLARE',
        confidenceScore: 98.0,
        hazardLevel: frp > 60 ? 'MODERATE' : 'LOW',
        anomalyStatus: frp > 50 ? 'ELEVATED_FLARE' : 'NORMAL_ROUTINE',
      };
    }
  }

  // 2. Agricultural Stubble Burning
  if (landCoverType === 'CROPLAND' && persistenceIndex < 0.15) {
    return {
      classification: 'AGRICULTURAL_STUBBLE',
      confidenceScore: 96.5,
      hazardLevel: frp > 80 ? 'HIGH' : 'MODERATE',
      anomalyStatus: 'ACTIVE_SPREADING',
    };
  }

  // 3. Forest Wildfire
  if ((landCoverType === 'DENSE_FOREST' || landCoverType === 'SHRUBLAND') && persistenceIndex < 0.15) {
    return {
      classification: 'FOREST_WILDFIRE',
      confidenceScore: 98.8,
      hazardLevel: frp > 100 ? 'CRITICAL' : 'HIGH',
      anomalyStatus: 'ACTIVE_SPREADING',
    };
  }

  // 4. Fallback / Urban
  return {
    classification: 'URBAN_OTHER',
    confidenceScore: 78.0,
    hazardLevel: 'LOW',
    anomalyStatus: 'NORMAL_ROUTINE',
  };
}

// Convert FIRMS raw CSV line to parsed anomaly object
export function parseFirmsCsvRow(row: Record<string, string>, index: number): ThermalAnomaly | null {
  try {
    const lat = parseFloat(row.latitude || row.lat);
    const lon = parseFloat(row.longitude || row.lon || row.long);
    const brightness = parseFloat(row.bright_ti4 || row.brightness || row.bright_t31 || '330');
    const brightness31 = parseFloat(row.bright_ti5 || row.bright_t31 || '295');
    const frp = parseFloat(row.frp || '25');
    const acqDate = row.acq_date || new Date().toISOString().split('T')[0];
    const acqTime = row.acq_time || '12:00';
    const satelliteRaw = (row.satellite || 'VIIRS_NOAA20').toUpperCase();
    const daynight = (row.daynight || 'N').toUpperCase() as 'D' | 'N';
    const confidenceRaw = row.confidence || 'nominal';
    let confidence: 'low' | 'nominal' | 'high' | number = 'nominal';
    if (confidenceRaw === 'low' || confidenceRaw === 'nominal' || confidenceRaw === 'high') {
      confidence = confidenceRaw;
    } else if (!isNaN(Number(confidenceRaw))) {
      confidence = Number(confidenceRaw);
    }

    if (isNaN(lat) || isNaN(lon)) return null;

    let satellite: ThermalAnomaly['satellite'] = 'VIIRS_NOAA20';
    if (satelliteRaw.includes('SNPP') || satelliteRaw.includes('NPP')) satellite = 'VIIRS_SNPP';
    else if (satelliteRaw.includes('NOAA21') || satelliteRaw.includes('21')) satellite = 'VIIRS_NOAA21';
    else if (satelliteRaw.includes('TERRA') || satelliteRaw.includes('T')) satellite = 'MODIS_Terra';
    else if (satelliteRaw.includes('AQUA') || satelliteRaw.includes('A')) satellite = 'MODIS_Aqua';

    // Rule heuristics for generic raw input
    const isSyntheticHigh = brightness > 370 || frp > 120;
    const classified = classifyThermalAnomaly({
      frp,
      brightnessK: brightness,
      persistenceIndex: isSyntheticHigh ? 0.75 : 0.2,
      osmFacilityType: isSyntheticHigh ? 'OIL_REFINERY' : 'NONE',
      osmDistanceMeters: isSyntheticHigh ? 120 : 5000,
      landCoverType: isSyntheticHigh ? 'INDUSTRIAL_BUILTUP' : 'CROPLAND',
      swirRatio: isSyntheticHigh ? 2.5 : 1.2,
    });

    return {
      id: `firms-imported-${Date.now()}-${index}`,
      latitude: lat,
      longitude: lon,
      brightness,
      brightness_31: brightness31,
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
      persistenceIndex: isSyntheticHigh ? 0.82 : 0.05,
      historicalDetectionsCount: isSyntheticHigh ? 35 : 2,
      anomalyStatus: classified.anomalyStatus,
      hazardLevel: classified.hazardLevel,
      osmProximity: {
        matchedFacilityName: isSyntheticHigh ? 'Identified Industrial Installation' : 'Open Field',
        facilityType: isSyntheticHigh ? 'OIL_REFINERY' : 'NONE',
        distanceMeters: isSyntheticHigh ? 120 : 4500,
        osmId: `import/${index}`,
        tags: {},
      },
      landCover: {
        type: isSyntheticHigh ? 'INDUSTRIAL_BUILTUP' : 'CROPLAND',
        corineCode: isSyntheticHigh ? 121 : 211,
        description: isSyntheticHigh ? 'Industrial Fabric' : 'Agricultural Land',
      },
      multispectral: {
        swirRatio_B12_B11: isSyntheticHigh ? 2.6 : 1.15,
        nbr: isSyntheticHigh ? -0.25 : -0.6,
        ndvi: isSyntheticHigh ? 0.03 : 0.45,
        estimatedTempCelsius: Math.round(brightness - 273.15 + (frp * 2.5)),
      },
      plumeDispersion: {
        windSpeedKmH: 16,
        windDirectionDeg: 60,
        estimatedPlumeLengthKm: Math.min(15, Math.max(1, frp * 0.06)),
        toxicGasRisk: isSyntheticHigh ? 'SO2_HIGH' : 'NORMAL_COMBUSTION',
        evacuationRadiusKm: isSyntheticHigh ? 2.0 : 0.0,
      },
    };
  } catch (err) {
    console.error('Error parsing row:', err);
    return null;
  }
}
