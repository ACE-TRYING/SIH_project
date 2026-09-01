export type FireClassification =
  | 'INDUSTRIAL_FIRE'
  | 'PERSISTENT_GAS_FLARE'
  | 'FOREST_WILDFIRE'
  | 'AGRICULTURAL_STUBBLE'
  | 'COAL_MINING_FIRE'
  | 'POWER_PLANT_THERMAL'
  | 'URBAN_OTHER';

export type HazardLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type FacilityType =
  | 'OIL_REFINERY'
  | 'PETROCHEMICAL'
  | 'STEEL_PLANT'
  | 'THERMAL_POWER'
  | 'LNG_TERMINAL'
  | 'COAL_MINE'
  | 'CHEMICAL'
  | 'STORAGE_TANK'
  | 'QUARRY'
  | 'NONE';

export interface ThermalAnomaly {
  id: string;
  latitude: number;
  longitude: number;
  brightness: number; // in Kelvin (e.g. 335.2)
  brightness_31?: number; // Band 31 Kelvin
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite: 'VIIRS_SNPP' | 'VIIRS_NOAA20' | 'VIIRS_NOAA21' | 'MODIS_Terra' | 'MODIS_Aqua';
  confidence: 'low' | 'nominal' | 'high' | number;
  version: string;
  frp: number; // Fire Radiative Power in MW
  daynight: 'D' | 'N';
  
  // AI & Geospatial Fusion Attributes
  classification: FireClassification;
  confidenceScore: number; // 0-100 heuristic evidence score
  classificationReason?: string;
  evidence?: string[];
  persistenceIndex?: number; // 0.0 - 1.0 (recurrence over past 90 days)
  historicalDetectionsCount?: number;
  anomalyStatus?: 'NORMAL_ROUTINE' | 'ELEVATED_FLARE' | 'ACCIDENTAL_SPIKE_FIRE' | 'SUB_SURFACE_SMOLDERING' | 'ACTIVE_SPREADING';
  hazardLevel: HazardLevel;
  
  osmProximity?: {
    matchedFacilityName: string;
    facilityType: FacilityType;
    distanceMeters: number;
    osmId: string;
    operator?: string;
    tags: Record<string, string>;
  } | null;

  landCover?: {
    type: 'INDUSTRIAL_BUILTUP' | 'DENSE_FOREST' | 'CROPLAND' | 'SHRUBLAND' | 'MINING_SURFACE' | 'WATER_COASTAL' | 'UNKNOWN';
    corineCode?: number;
    description: string;
  } | null;

  multispectral?: {
    swirRatio_B12_B11?: number;
    nbr?: number; // Normalized Burn Ratio
    ndvi?: number; // Normalized Difference Vegetation Index
    estimatedTempCelsius: number;
  } | null;

  plumeDispersion?: {
    windSpeedKmH: number;
    windDirectionDeg: number;
    estimatedPlumeLengthKm: number;
    toxicGasRisk: 'SO2_HIGH' | 'VOC_ELEVATED' | 'PM2.5_EXTREME' | 'NORMAL_COMBUSTION' | 'UNAVAILABLE';
    evacuationRadiusKm: number;
  } | null;

  temporalHistory?: Array<{
    date: string;
    frp: number;
    tempK: number;
    satellite: string;
    isSpike: boolean;
  }>;

  geminiInsight?: {
    assessment: string;
    classificationRationale: string;
    riskSummary: string;
    containmentProtocol: string;
    generatedAt: string;
    source?: 'gemini' | 'fallback';
    simulated?: boolean;
    model?: string;
  };

  // Phase 6: Real weather/wind from Open-Meteo (server-side proxy)
  // status='REAL'      → all measurement fields are present and real
  // status='UNAVAILABLE'/'ERROR' → measurement fields are absent (undefined)
  weather?: {
    source: 'OPEN_METEO';
    windSpeedKmh?: number;
    windDirectionDeg?: number;
    observedAt?: string; // ISO timestamp from Open-Meteo
    status: 'REAL' | 'UNAVAILABLE' | 'ERROR';
  } | null;
}

export interface IndustrialFacility {
  id: string;
  name: string;
  category: FacilityType;
  lat: number;
  lng: number;
  capacity?: string;
  operator: string;
  locationName: string;
  country: string;
  riskTier: 'TIER_1_CRITICAL' | 'TIER_2_STRATEGIC' | 'TIER_3_STANDARD';
  bufferZoneRadiusMeters: number;
  activeAnomaliesCount?: number;
  flareStacksCount?: number;
}

export interface GISFilterState {
  classifications: FireClassification[];
  hazardLevels: HazardLevel[];
  minFrp: number;
  maxFrp: number;
  dayNight: 'ALL' | 'D' | 'N';
  satellite: string;
  facilityType: string;
  minPersistence: number;
  searchQuery: string;
  datePreset: 'all' | 'today' | '7days' | '30days';
}

export interface MapLayerControls {
  baseLayer: 'satellite' | 'dark' | 'osm' | 'terrain';
  showHeatmap: boolean;
  showBufferZones: boolean;
  showOsmFacilities: boolean;
  showPlumes: boolean;
  showSentinelFootprint: boolean;
  showClustering: boolean;
  activeFilterOnly: boolean;
}

export interface FirnsApiConfig {
  apiKey: string;
  source: 'VIIRS_NOAA20_NRT' | 'VIIRS_SNPP_NRT' | 'MODIS_NRT';
  countryCode: string;
  dayRange: number;
}
