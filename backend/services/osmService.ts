import { classifyThermalAnomaly } from '../../src/utils/geoUtils';

interface OsmCacheEntry {
  timestamp: number;
  elements: any[];
}

const osmCache = new Map<string, OsmCacheEntry>();
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes in-memory cache

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function buildOverpassQuery(lat: number, lon: number, radiusMeters: number = 5000): string {
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

export async function fetchOverpassElements(lat: number, lon: number): Promise<{ elements: any[]; status: 'SUCCESS' | 'EMPTY' | 'FAILED' }> {
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

export function mapOsmFacilityType(tags: Record<string, string>): string {
  const power = (tags.power || '').toLowerCase();
  const industrial = (tags.industrial || '').toLowerCase();
  const manMade = (tags.man_made || '').toLowerCase();
  const landuse = (tags.landuse || '').toLowerCase();
  const resource = (tags.resource || '').toLowerCase();
  const substance = (tags.substance || tags.product || '').toLowerCase();
  const name = (tags.name || tags['name:en'] || '').toLowerCase();

  if (
    power === 'plant' ||
    power === 'generator' ||
    name.includes('thermal power') ||
    name.includes('power station') ||
    name.includes('power plant')
  ) {
    return 'THERMAL_POWER';
  }

  if (
    industrial === 'oil' ||
    industrial === 'petroleum' ||
    name.includes('refinery') ||
    tags.plant === 'refinery'
  ) {
    return 'OIL_REFINERY';
  }

  if (
    industrial === 'chemical' ||
    industrial === 'petrochemical' ||
    name.includes('petrochemical') ||
    name.includes('chemical')
  ) {
    return 'PETROCHEMICAL';
  }

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

  if (
    industrial === 'steel' ||
    substance === 'steel' ||
    name.includes('steel plant') ||
    name.includes('blast furnace')
  ) {
    return 'STEEL_PLANT';
  }

  if (manMade === 'storage_tank' || industrial === 'storage') {
    return 'STORAGE_TANK';
  }

  if (landuse === 'quarry' || tags.mine === 'yes') {
    return 'QUARRY';
  }

  if (landuse === 'industrial' || industrial || manMade === 'works') {
    return 'CHEMICAL';
  }

  return 'NONE';
}

export function selectNearestOsmFacility(anomalyLat: number, anomalyLon: number, elements: any[]) {
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

export async function enrichAnomaliesWithOsm(anomalies: any[], maxEnrich: number = 15) {
  if (!Array.isArray(anomalies)) {
    throw new Error('Anomalies array is required for enrichment.');
  }

  if (anomalies.length === 0) {
    return {
      enrichedCount: 0,
      anomalies: [],
    };
  }

  const rankedIndices = anomalies
    .map((a: any, idx: number) => ({ idx, frp: Number(a.frp || 0) }))
    .sort((a, b) => b.frp - a.frp)
    .slice(0, Math.min(maxEnrich, anomalies.length))
    .map((item) => item.idx);

  const enrichedAnomalies = [...anomalies];

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

    await new Promise((r) => setTimeout(r, 250));
  }

  return {
    enrichedCount: rankedIndices.length,
    anomalies: enrichedAnomalies,
  };
}
