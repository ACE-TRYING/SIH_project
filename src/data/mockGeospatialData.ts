import { FireClassification, IndustrialFacility, ThermalAnomaly } from '../types';

export const STRATEGIC_FACILITIES: IndustrialFacility[] = [
  {
    id: 'fac-jamnagar-01',
    name: 'Reliance Jamnagar Refining & Petrochemical Complex',
    category: 'OIL_REFINERY',
    lat: 22.3582,
    lng: 69.8654,
    capacity: '1.24 Million BPD',
    operator: 'Reliance Industries Ltd',
    locationName: 'Jamnagar, Gujarat, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 3000,
    flareStacksCount: 14,
  },
  {
    id: 'fac-nayara-02',
    name: 'Nayara Energy Vadinar Refinery Complex',
    category: 'OIL_REFINERY',
    lat: 22.4289,
    lng: 69.7214,
    capacity: '400,000 BPD',
    operator: 'Nayara Energy / Rosneft',
    locationName: 'Vadinar, Gujarat, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 2500,
    flareStacksCount: 6,
  },
  {
    id: 'fac-paradip-03',
    name: 'IOCL Paradip Refinery & Petrochemicals',
    category: 'PETROCHEMICAL',
    lat: 20.2831,
    lng: 86.6455,
    capacity: '300,000 BPD / 15 MMTPA',
    operator: 'Indian Oil Corporation Ltd',
    locationName: 'Paradip, Odisha, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 2500,
    flareStacksCount: 8,
  },
  {
    id: 'fac-jharia-04',
    name: 'Jharia Coalfield Underground Fire Zone',
    category: 'COAL_MINE',
    lat: 23.7441,
    lng: 86.4172,
    capacity: 'Opencast & Underground Mines',
    operator: 'Bharat Coking Coal Limited (BCCL)',
    locationName: 'Dhanbad, Jharkhand, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 4000,
    flareStacksCount: 0,
  },
  {
    id: 'fac-mundra-05',
    name: 'Mundra Thermal & Ultra Mega Power Complex',
    category: 'THERMAL_POWER',
    lat: 22.8242,
    lng: 69.5283,
    capacity: '4,620 MW + 4,000 MW',
    operator: 'Adani Power & Tata Power',
    locationName: 'Mundra, Gujarat, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 2000,
    flareStacksCount: 4,
  },
  {
    id: 'fac-bhilai-06',
    name: 'SAIL Bhilai Steel Plant Complex',
    category: 'STEEL_PLANT',
    lat: 21.1895,
    lng: 81.3916,
    capacity: '7.0 MMTPA Crude Steel',
    operator: 'Steel Authority of India Ltd (SAIL)',
    locationName: 'Bhilai, Chhattisgarh, India',
    country: 'India',
    riskTier: 'TIER_2_STRATEGIC',
    bufferZoneRadiusMeters: 2000,
    flareStacksCount: 5,
  },
  {
    id: 'fac-dahej-07',
    name: 'Petronet LNG & Dahej Petrochem SEZ',
    category: 'LNG_TERMINAL',
    lat: 21.7011,
    lng: 72.5312,
    capacity: '17.5 MMTPA LNG Regas',
    operator: 'Petronet LNG / ONGC Petro additions',
    locationName: 'Dahej, Gujarat, India',
    country: 'India',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 2500,
    flareStacksCount: 7,
  },
  {
    id: 'fac-rastanura-08',
    name: 'Aramco Ras Tanura Refining & Marine Terminal',
    category: 'OIL_REFINERY',
    lat: 26.6541,
    lng: 50.1582,
    capacity: '550,000 BPD',
    operator: 'Saudi Aramco',
    locationName: 'Eastern Province, Saudi Arabia',
    country: 'Saudi Arabia',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 3500,
    flareStacksCount: 18,
  },
  {
    id: 'fac-houston-09',
    name: 'ExxonMobil Baytown Refinery Complex',
    category: 'OIL_REFINERY',
    lat: 29.7541,
    lng: -95.0123,
    capacity: '584,000 BPD',
    operator: 'ExxonMobil Chemical',
    locationName: 'Baytown, Texas, USA',
    country: 'USA',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 3000,
    flareStacksCount: 12,
  },
  {
    id: 'fac-jurong-10',
    name: 'Jurong Island Petrochemical Cluster',
    category: 'PETROCHEMICAL',
    lat: 1.2678,
    lng: 103.7012,
    capacity: 'Over 100 Global Chemical Giants',
    operator: 'JTC / ExxonMobil / Shell',
    locationName: 'Jurong Island, Singapore',
    country: 'Singapore',
    riskTier: 'TIER_1_CRITICAL',
    bufferZoneRadiusMeters: 2500,
    flareStacksCount: 15,
  }
];

export const INITIAL_THERMAL_ANOMALIES: ThermalAnomaly[] = [
  // 1. Accidental Industrial Fire / Overpressure Flare at Jamnagar (CRITICAL ALERT)
  {
    id: 'firms-ind-001',
    latitude: 22.3615,
    longitude: 69.8698,
    brightness: 395.4,
    brightness_31: 312.2,
    scan: 0.38,
    track: 0.36,
    acq_date: '2026-08-28',
    acq_time: '14:22',
    satellite: 'VIIRS_NOAA20',
    confidence: 'high',
    version: '2.0NRT',
    frp: 218.4,
    daynight: 'N',
    classification: 'INDUSTRIAL_FIRE',
    confidenceScore: 96.8,
    persistenceIndex: 0.88,
    historicalDetectionsCount: 42,
    anomalyStatus: 'ACCIDENTAL_SPIKE_FIRE',
    hazardLevel: 'CRITICAL',
    osmProximity: {
      matchedFacilityName: 'Reliance Jamnagar Crude Distillation Unit 4',
      facilityType: 'OIL_REFINERY',
      distanceMeters: 85,
      osmId: 'way/89421041',
      operator: 'Reliance Industries Ltd',
      tags: { industrial: 'refinery', 'man_made': 'flare_stack', 'hazard': 'hydrocarbon_flammable' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Continuous Industrial/Commercial Fabric with heavy chemical installations'
    },
    multispectral: {
      swirRatio_B12_B11: 3.42,
      nbr: -0.42,
      ndvi: 0.04,
      estimatedTempCelsius: 820
    },
    plumeDispersion: {
      windSpeedKmH: 24,
      windDirectionDeg: 65,
      estimatedPlumeLengthKm: 8.4,
      toxicGasRisk: 'SO2_HIGH',
      evacuationRadiusKm: 3.5
    },
    temporalHistory: [
      { date: '2026-08-22', frp: 28.1, tempK: 334.1, satellite: 'VIIRS_SNPP', isSpike: false },
      { date: '2026-08-24', frp: 31.4, tempK: 336.5, satellite: 'VIIRS_NOAA20', isSpike: false },
      { date: '2026-08-26', frp: 34.0, tempK: 338.2, satellite: 'MODIS_Aqua', isSpike: false },
      { date: '2026-08-27', frp: 45.2, tempK: 345.0, satellite: 'VIIRS_SNPP', isSpike: false },
      { date: '2026-08-28', frp: 218.4, tempK: 395.4, satellite: 'VIIRS_NOAA20', isSpike: true }
    ],
    geminiInsight: {
      assessment: 'Abnormal thermal spike detected within Reliance Jamnagar CDU-4 boundary. FRP jumped from baseline 32 MW to 218.4 MW within 24h pass. Correlated with high SWIR B12/B11 signature (3.42) indicating intense localized combustion, not routine low-emissivity flare.',
      classificationRationale: 'Co-located with OSM Refinery Polygon (<100m) + SWIR saturation + 600% FRP departure from 90-day baseline persistence profile.',
      riskSummary: 'High potential of accidental naphtha/hydrocarbon storage tank fire or emergency high-pressure blowdown relief.',
      containmentProtocol: 'Dispatch NTRO Emergency Advisory to Gujarat State Disaster Management Authority (GSDMA) and industrial firefighting unit. Monitor SWIR plume dispersion towards SW azimuth.',
      generatedAt: '2026-08-28T14:35:00Z'
    }
  },

  // 2. Routine Persistent Gas Flaring (Jamnagar Petrochem Stack 2)
  {
    id: 'firms-ind-002',
    latitude: 22.3490,
    longitude: 69.8510,
    brightness: 338.2,
    brightness_31: 298.1,
    scan: 0.40,
    track: 0.38,
    acq_date: '2026-08-28',
    acq_time: '14:22',
    satellite: 'VIIRS_NOAA20',
    confidence: 'high',
    version: '2.0NRT',
    frp: 38.6,
    daynight: 'N',
    classification: 'PERSISTENT_GAS_FLARE',
    confidenceScore: 99.1,
    persistenceIndex: 0.94,
    historicalDetectionsCount: 81,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'LOW',
    osmProximity: {
      matchedFacilityName: 'Jamnagar Ethylene Cracker Elevated Flare Stack #2',
      facilityType: 'PETROCHEMICAL',
      distanceMeters: 45,
      osmId: 'node/49821034',
      operator: 'Reliance Industries Ltd',
      tags: { 'man_made': 'flare_stack', 'substance': 'associated_petroleum_gas' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Industrial Heavy Manufacturing and Refining Area'
    },
    multispectral: {
      swirRatio_B12_B11: 1.85,
      nbr: 0.05,
      ndvi: 0.02,
      estimatedTempCelsius: 480
    },
    plumeDispersion: {
      windSpeedKmH: 22,
      windDirectionDeg: 60,
      estimatedPlumeLengthKm: 1.2,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    },
    temporalHistory: [
      { date: '2026-08-22', frp: 36.2, tempK: 337.0, satellite: 'VIIRS_SNPP', isSpike: false },
      { date: '2026-08-24', frp: 39.1, tempK: 338.8, satellite: 'VIIRS_NOAA20', isSpike: false },
      { date: '2026-08-26', frp: 37.4, tempK: 336.9, satellite: 'MODIS_Aqua', isSpike: false },
      { date: '2026-08-27', frp: 38.0, tempK: 338.0, satellite: 'VIIRS_SNPP', isSpike: false },
      { date: '2026-08-28', frp: 38.6, tempK: 338.2, satellite: 'VIIRS_NOAA20', isSpike: false }
    ]
  },

  // 3. Nayara Vadinar Elevated Flare
  {
    id: 'firms-ind-003',
    latitude: 22.4312,
    longitude: 69.7245,
    brightness: 346.5,
    brightness_31: 301.4,
    scan: 0.39,
    track: 0.37,
    acq_date: '2026-08-28',
    acq_time: '14:22',
    satellite: 'VIIRS_NOAA20',
    confidence: 'high',
    version: '2.0NRT',
    frp: 52.1,
    daynight: 'N',
    classification: 'PERSISTENT_GAS_FLARE',
    confidenceScore: 97.4,
    persistenceIndex: 0.91,
    historicalDetectionsCount: 68,
    anomalyStatus: 'ELEVATED_FLARE',
    hazardLevel: 'MODERATE',
    osmProximity: {
      matchedFacilityName: 'Nayara Vadinar Coker Unit Flare System',
      facilityType: 'OIL_REFINERY',
      distanceMeters: 110,
      osmId: 'way/66520194',
      operator: 'Nayara Energy',
      tags: { industrial: 'refinery', 'facility': 'petroleum_storage' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Industrial Complex Fabric'
    },
    multispectral: {
      swirRatio_B12_B11: 2.10,
      nbr: -0.08,
      ndvi: 0.03,
      estimatedTempCelsius: 560
    },
    plumeDispersion: {
      windSpeedKmH: 26,
      windDirectionDeg: 70,
      estimatedPlumeLengthKm: 2.8,
      toxicGasRisk: 'VOC_ELEVATED',
      evacuationRadiusKm: 0.5
    }
  },

  // 4. Jharia Sub-surface Coal Mine Fire
  {
    id: 'firms-ind-004',
    latitude: 23.7482,
    longitude: 86.4198,
    brightness: 358.9,
    brightness_31: 304.5,
    scan: 0.42,
    track: 0.39,
    acq_date: '2026-08-28',
    acq_time: '18:45',
    satellite: 'VIIRS_SNPP',
    confidence: 'high',
    version: '2.0NRT',
    frp: 88.5,
    daynight: 'N',
    classification: 'COAL_MINING_FIRE',
    confidenceScore: 98.2,
    persistenceIndex: 0.99,
    historicalDetectionsCount: 110,
    anomalyStatus: 'SUB_SURFACE_SMOLDERING',
    hazardLevel: 'HIGH',
    osmProximity: {
      matchedFacilityName: 'BCCL Jharia Block IV Underground Seam 14',
      facilityType: 'COAL_MINE',
      distanceMeters: 15,
      osmId: 'way/11029481',
      operator: 'Bharat Coking Coal Ltd',
      tags: { 'landuse': 'quarry', 'resource': 'coal', 'hazard': 'mine_fire' }
    },
    landCover: {
      type: 'MINING_SURFACE',
      corineCode: 131,
      description: 'Mineral extraction sites and open-cast coal spoil tips'
    },
    multispectral: {
      swirRatio_B12_B11: 2.75,
      nbr: -0.28,
      ndvi: 0.01,
      estimatedTempCelsius: 640
    },
    plumeDispersion: {
      windSpeedKmH: 14,
      windDirectionDeg: 120,
      estimatedPlumeLengthKm: 4.5,
      toxicGasRisk: 'PM2.5_EXTREME',
      evacuationRadiusKm: 1.8
    }
  },

  // 5. Paradip IOCL Petrochem Flare
  {
    id: 'firms-ind-005',
    latitude: 20.2855,
    longitude: 86.6482,
    brightness: 341.2,
    brightness_31: 299.8,
    scan: 0.37,
    track: 0.36,
    acq_date: '2026-08-28',
    acq_time: '19:10',
    satellite: 'VIIRS_SNPP',
    confidence: 'high',
    version: '2.0NRT',
    frp: 44.2,
    daynight: 'N',
    classification: 'PERSISTENT_GAS_FLARE',
    confidenceScore: 98.6,
    persistenceIndex: 0.89,
    historicalDetectionsCount: 74,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'LOW',
    osmProximity: {
      matchedFacilityName: 'IOCL Paradip Polypropylene Plant Flare',
      facilityType: 'PETROCHEMICAL',
      distanceMeters: 60,
      osmId: 'way/90812341',
      operator: 'Indian Oil Corporation',
      tags: { industrial: 'petrochemical', 'product': 'polypropylene' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Coastal Petrochemical Complex'
    },
    multispectral: {
      swirRatio_B12_B11: 1.92,
      nbr: 0.02,
      ndvi: 0.05,
      estimatedTempCelsius: 510
    },
    plumeDispersion: {
      windSpeedKmH: 18,
      windDirectionDeg: 190,
      estimatedPlumeLengthKm: 1.5,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    }
  },

  // 6. Mundra Thermal Power Plant Hot Discharge & Plume
  {
    id: 'firms-ind-006',
    latitude: 22.8268,
    longitude: 69.5315,
    brightness: 332.4,
    brightness_31: 296.2,
    scan: 0.45,
    track: 0.41,
    acq_date: '2026-08-28',
    acq_time: '08:15',
    satellite: 'MODIS_Terra',
    confidence: 'nominal',
    version: '6.1NRT',
    frp: 29.8,
    daynight: 'D',
    classification: 'POWER_PLANT_THERMAL',
    confidenceScore: 94.5,
    persistenceIndex: 0.86,
    historicalDetectionsCount: 56,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'LOW',
    osmProximity: {
      matchedFacilityName: 'Mundra Ultra Mega Power Plant Boiler Block 5',
      facilityType: 'THERMAL_POWER',
      distanceMeters: 90,
      osmId: 'way/34591021',
      operator: 'Tata Power / Adani',
      tags: { 'power': 'plant', 'plant:source': 'coal', 'plant:output:electricity': '4000MW' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Thermal Power Utility Generation Infrastructure'
    },
    multispectral: {
      swirRatio_B12_B11: 1.45,
      nbr: 0.12,
      ndvi: 0.01,
      estimatedTempCelsius: 380
    },
    plumeDispersion: {
      windSpeedKmH: 20,
      windDirectionDeg: 45,
      estimatedPlumeLengthKm: 2.1,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    }
  },

  // 7. SAIL Bhilai Steel Plant Blast Furnace Slag Burning
  {
    id: 'firms-ind-007',
    latitude: 21.1920,
    longitude: 81.3948,
    brightness: 351.0,
    brightness_31: 302.1,
    scan: 0.38,
    track: 0.36,
    acq_date: '2026-08-28',
    acq_time: '14:22',
    satellite: 'VIIRS_NOAA20',
    confidence: 'high',
    version: '2.0NRT',
    frp: 64.7,
    daynight: 'N',
    classification: 'INDUSTRIAL_FIRE',
    confidenceScore: 92.1,
    persistenceIndex: 0.79,
    historicalDetectionsCount: 48,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'MODERATE',
    osmProximity: {
      matchedFacilityName: 'SAIL Bhilai Blast Furnace #8 "Mahamaya"',
      facilityType: 'STEEL_PLANT',
      distanceMeters: 40,
      osmId: 'way/77102934',
      operator: 'SAIL',
      tags: { industrial: 'steel_mill', 'substance': 'molten_iron_slag' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Integrated Steel & Heavy Metallurgy Complex'
    },
    multispectral: {
      swirRatio_B12_B11: 2.30,
      nbr: -0.15,
      ndvi: 0.02,
      estimatedTempCelsius: 720
    },
    plumeDispersion: {
      windSpeedKmH: 12,
      windDirectionDeg: 280,
      estimatedPlumeLengthKm: 1.9,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    }
  },

  // 8. Agricultural Stubble Burning (Punjab / Sangrur - NEGATIVE CONTROL / SEGREGATION)
  {
    id: 'firms-agr-008',
    latitude: 30.2451,
    longitude: 75.8412,
    brightness: 348.7,
    brightness_31: 308.2,
    scan: 0.50,
    track: 0.44,
    acq_date: '2026-08-28',
    acq_time: '08:15',
    satellite: 'MODIS_Terra',
    confidence: 'high',
    version: '6.1NRT',
    frp: 76.3,
    daynight: 'D',
    classification: 'AGRICULTURAL_STUBBLE',
    confidenceScore: 97.9,
    persistenceIndex: 0.05, // Transient! Zero long term persistence
    historicalDetectionsCount: 2,
    anomalyStatus: 'ACTIVE_SPREADING',
    hazardLevel: 'MODERATE',
    osmProximity: {
      matchedFacilityName: 'None (Agricultural Farmland)',
      facilityType: 'NONE',
      distanceMeters: 14200,
      osmId: 'none',
      tags: {}
    },
    landCover: {
      type: 'CROPLAND',
      corineCode: 211,
      description: 'Permanently Irrigated Crop Agriculture'
    },
    multispectral: {
      swirRatio_B12_B11: 1.35,
      nbr: -0.58,
      ndvi: 0.38,
      estimatedTempCelsius: 410
    },
    plumeDispersion: {
      windSpeedKmH: 15,
      windDirectionDeg: 310,
      estimatedPlumeLengthKm: 6.2,
      toxicGasRisk: 'PM2.5_EXTREME',
      evacuationRadiusKm: 0.0
    }
  },

  // 9. Forest Wildfire (Similipal National Park - NEGATIVE CONTROL / SEGREGATION)
  {
    id: 'firms-for-009',
    latitude: 21.6521,
    longitude: 86.3214,
    brightness: 362.4,
    brightness_31: 309.8,
    scan: 0.48,
    track: 0.42,
    acq_date: '2026-08-28',
    acq_time: '19:10',
    satellite: 'VIIRS_SNPP',
    confidence: 'high',
    version: '2.0NRT',
    frp: 112.8,
    daynight: 'N',
    classification: 'FOREST_WILDFIRE',
    confidenceScore: 99.4,
    persistenceIndex: 0.02, // Transient
    historicalDetectionsCount: 1,
    anomalyStatus: 'ACTIVE_SPREADING',
    hazardLevel: 'HIGH',
    osmProximity: {
      matchedFacilityName: 'None (Biosphere Forest Reserve)',
      facilityType: 'NONE',
      distanceMeters: 28500,
      osmId: 'none',
      tags: {}
    },
    landCover: {
      type: 'DENSE_FOREST',
      corineCode: 312,
      description: 'Broad-leaved and coniferous protected forest canopy'
    },
    multispectral: {
      swirRatio_B12_B11: 1.22,
      nbr: -0.74,
      ndvi: 0.65,
      estimatedTempCelsius: 580
    },
    plumeDispersion: {
      windSpeedKmH: 19,
      windDirectionDeg: 240,
      estimatedPlumeLengthKm: 14.5,
      toxicGasRisk: 'PM2.5_EXTREME',
      evacuationRadiusKm: 4.0
    }
  },

  // 10. Aramco Ras Tanura Mega Flare (International Benchmark)
  {
    id: 'firms-ind-010',
    latitude: 26.6578,
    longitude: 50.1610,
    brightness: 368.5,
    brightness_31: 308.2,
    scan: 0.38,
    track: 0.36,
    acq_date: '2026-08-28',
    acq_time: '21:30',
    satellite: 'VIIRS_NOAA21',
    confidence: 'high',
    version: '2.0NRT',
    frp: 142.6,
    daynight: 'N',
    classification: 'PERSISTENT_GAS_FLARE',
    confidenceScore: 98.9,
    persistenceIndex: 0.98,
    historicalDetectionsCount: 104,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'LOW',
    osmProximity: {
      matchedFacilityName: 'Saudi Aramco Ras Tanura Terminal High Flare Stack A',
      facilityType: 'OIL_REFINERY',
      distanceMeters: 35,
      osmId: 'way/55019284',
      operator: 'Saudi Aramco',
      tags: { industrial: 'refinery_terminal', 'flare': 'marine_offloading' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Coastal Marine Hydrocarbon Terminal'
    },
    multispectral: {
      swirRatio_B12_B11: 2.80,
      nbr: 0.01,
      ndvi: 0.00,
      estimatedTempCelsius: 760
    },
    plumeDispersion: {
      windSpeedKmH: 28,
      windDirectionDeg: 330,
      estimatedPlumeLengthKm: 5.1,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    }
  },

  // 11. Houston Ship Channel Petrochem Fire (Accidental explosion scenario)
  {
    id: 'firms-ind-011',
    latitude: 29.7562,
    longitude: -95.0145,
    brightness: 388.2,
    brightness_31: 310.4,
    scan: 0.37,
    track: 0.35,
    acq_date: '2026-08-28',
    acq_time: '04:12',
    satellite: 'VIIRS_NOAA20',
    confidence: 'high',
    version: '2.0NRT',
    frp: 184.2,
    daynight: 'N',
    classification: 'INDUSTRIAL_FIRE',
    confidenceScore: 95.8,
    persistenceIndex: 0.74,
    historicalDetectionsCount: 38,
    anomalyStatus: 'ACCIDENTAL_SPIKE_FIRE',
    hazardLevel: 'CRITICAL',
    osmProximity: {
      matchedFacilityName: 'ExxonMobil Baytown Aromatics Fractionator 3',
      facilityType: 'PETROCHEMICAL',
      distanceMeters: 55,
      osmId: 'way/18294012',
      operator: 'ExxonMobil',
      tags: { industrial: 'chemical', 'hazard': 'benzene_toluene_xylene' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'High-density Petrochemical & Refining Port'
    },
    multispectral: {
      swirRatio_B12_B11: 3.15,
      nbr: -0.38,
      ndvi: 0.02,
      estimatedTempCelsius: 850
    },
    plumeDispersion: {
      windSpeedKmH: 18,
      windDirectionDeg: 140,
      estimatedPlumeLengthKm: 9.2,
      toxicGasRisk: 'VOC_ELEVATED',
      evacuationRadiusKm: 4.0
    }
  },

  // 12. Jurong Island Singapore Petrochem Flare
  {
    id: 'firms-ind-012',
    latitude: 1.2690,
    longitude: 103.7028,
    brightness: 345.1,
    brightness_31: 300.2,
    scan: 0.39,
    track: 0.37,
    acq_date: '2026-08-28',
    acq_time: '18:00',
    satellite: 'VIIRS_SNPP',
    confidence: 'high',
    version: '2.0NRT',
    frp: 49.5,
    daynight: 'N',
    classification: 'PERSISTENT_GAS_FLARE',
    confidenceScore: 99.0,
    persistenceIndex: 0.95,
    historicalDetectionsCount: 88,
    anomalyStatus: 'NORMAL_ROUTINE',
    hazardLevel: 'LOW',
    osmProximity: {
      matchedFacilityName: 'Shell Jurong Bukom Olefins Stack',
      facilityType: 'PETROCHEMICAL',
      distanceMeters: 75,
      osmId: 'way/99021481',
      operator: 'Shell Singapore',
      tags: { industrial: 'cracker', 'gas': 'ethylene' }
    },
    landCover: {
      type: 'INDUSTRIAL_BUILTUP',
      corineCode: 121,
      description: 'Artificial Petrochemical Island'
    },
    multispectral: {
      swirRatio_B12_B11: 1.95,
      nbr: 0.01,
      ndvi: 0.01,
      estimatedTempCelsius: 530
    },
    plumeDispersion: {
      windSpeedKmH: 10,
      windDirectionDeg: 210,
      estimatedPlumeLengthKm: 1.4,
      toxicGasRisk: 'NORMAL_COMBUSTION',
      evacuationRadiusKm: 0.0
    }
  }
];

export const CLASSIFICATION_METADATA: Record<FireClassification, {
  label: string;
  badgeBg: string;
  badgeText: string;
  markerColor: string;
  iconName: string;
  description: string;
  riskDefinition: string;
}> = {
  INDUSTRIAL_FIRE: {
    label: 'Industrial Fire / Explosion',
    badgeBg: 'bg-rose-500/20 border-rose-500/50',
    badgeText: 'text-rose-400',
    markerColor: '#f43f5e',
    iconName: 'Flame',
    description: 'Abnormal thermal spike inside industrial boundaries exceeding baseline emissions by >200%.',
    riskDefinition: 'High risk of toxic release, structural asset collapse, and uncontained fire spread.'
  },
  PERSISTENT_GAS_FLARE: {
    label: 'Persistent Gas Flare',
    badgeBg: 'bg-amber-500/20 border-amber-500/50',
    badgeText: 'text-amber-400',
    markerColor: '#f59e0b',
    iconName: 'Zap',
    description: 'Routine continuous flaring of associated petroleum gases with high 90-day persistence (>75%).',
    riskDefinition: 'Monitored routine operation; emission monitoring required for methane compliance.'
  },
  COAL_MINING_FIRE: {
    label: 'Coal Mine / Sub-surface Fire',
    badgeBg: 'bg-orange-500/20 border-orange-500/50',
    badgeText: 'text-orange-400',
    markerColor: '#ea580c',
    iconName: 'Layers',
    description: 'Chronic sub-surface smoldering or opencast seam combustion in coal basin geologies.',
    riskDefinition: 'Extreme air quality degradation (PM2.5/CO), ground subsidence, and loss of coal reserve.'
  },
  POWER_PLANT_THERMAL: {
    label: 'Thermal Power Emission',
    badgeBg: 'bg-yellow-500/20 border-yellow-500/50',
    badgeText: 'text-yellow-400',
    markerColor: '#eab308',
    iconName: 'Activity',
    description: 'Superheated boiler exhaust, cooling tower thermal plumes, or high-temperature slag discharge.',
    riskDefinition: 'Thermal footprint associated with baseline base-load power generation.'
  },
  AGRICULTURAL_STUBBLE: {
    label: 'Agricultural Stubble Burning',
    badgeBg: 'bg-lime-500/20 border-lime-500/50',
    badgeText: 'text-lime-400',
    markerColor: '#84cc16',
    iconName: 'Wheat',
    description: 'Seasonal post-harvest biomass burning on agricultural crop fields with zero multi-month persistence.',
    riskDefinition: 'Severe seasonal haze/smog impact; seasonal regulatory enforcement required.'
  },
  FOREST_WILDFIRE: {
    label: 'Forest Wildfire',
    badgeBg: 'bg-red-600/20 border-red-600/50',
    badgeText: 'text-red-400',
    markerColor: '#dc2626',
    iconName: 'TreePine',
    description: 'Natural or man-made biomass wildfire actively propagating through forest canopy or bushlands.',
    riskDefinition: 'Rapidly spreading perimeter threatening ecological reserves, biodiversity, and forestry.'
  },
  URBAN_OTHER: {
    label: 'Urban / Other Anomaly',
    badgeBg: 'bg-purple-500/20 border-purple-500/50',
    badgeText: 'text-purple-400',
    markerColor: '#a855f7',
    iconName: 'AlertCircle',
    description: 'Municipal waste burning, solar farm glare reflection, or unclassified thermal signature.',
    riskDefinition: 'Low-to-moderate local hazard requiring optical satellite verification.'
  }
};
