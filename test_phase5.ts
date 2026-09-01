import { classifyThermalAnomaly } from './src/utils/geoUtils';

console.log('=== RUNNING PHASE 5 TEST SUITE ===\n');

// Test A: Power Plant
console.log('--- TEST A: Power Plant ---');
const testA = classifyThermalAnomaly({
  frp: 145,
  brightnessK: 355,
  confidence: 'high',
  osmFacilityType: 'THERMAL_POWER',
  osmFacilityName: 'Mundra Thermal Power Station',
  osmDistanceMeters: 700,
  osmTags: { power: 'plant' },
});
console.log('Classification:', testA.classification);
console.log('Confidence Score:', testA.confidenceScore, '%');
console.log('Reason:', testA.classificationReason);
console.log('Evidence:', testA.evidence);
console.log('Status:', testA.classification === 'POWER_PLANT_THERMAL' ? 'PASSED' : 'FAILED');

// Test B: Coal Mine (Explicit coal tags)
console.log('\n--- TEST B: Coal Mine ---');
const testB = classifyThermalAnomaly({
  frp: 85,
  brightnessK: 345,
  confidence: 'high',
  osmFacilityType: 'COAL_MINE',
  osmFacilityName: 'Cluster 8 Coal Mine',
  osmDistanceMeters: 1200,
  osmTags: { landuse: 'quarry', resource: 'coal' },
});
console.log('Classification:', testB.classification);
console.log('Confidence Score:', testB.confidenceScore, '%');
console.log('Reason:', testB.classificationReason);
console.log('Evidence:', testB.evidence);
console.log('Status:', testB.classification === 'COAL_MINING_FIRE' ? 'PASSED' : 'FAILED');

// Test C: Generic Quarry (No Coal Tags)
console.log('\n--- TEST C: Generic Quarry (No Coal Evidence) ---');
const testC = classifyThermalAnomaly({
  frp: 50,
  brightnessK: 330,
  confidence: 'nominal',
  osmFacilityType: 'QUARRY',
  osmFacilityName: 'Limestone Quarry',
  osmDistanceMeters: 900,
  osmTags: { landuse: 'quarry' },
});
console.log('Classification:', testC.classification);
console.log('Confidence Score:', testC.confidenceScore, '%');
console.log('Reason:', testC.classificationReason);
console.log('Evidence:', testC.evidence);
console.log('Status:', testC.classification !== 'COAL_MINING_FIRE' && testC.classification === 'URBAN_OTHER' ? 'PASSED' : 'FAILED');

// Test D: Generic Storage Tank (No LNG/Oil Tags)
console.log('\n--- TEST D: Storage Tank (No LNG/Oil Evidence) ---');
const testD = classifyThermalAnomaly({
  frp: 45,
  brightnessK: 335,
  confidence: 'nominal',
  osmFacilityType: 'STORAGE_TANK',
  osmFacilityName: 'Industrial Water Tank',
  osmDistanceMeters: 600,
  osmTags: { man_made: 'storage_tank' },
});
console.log('Classification:', testD.classification);
console.log('Confidence Score:', testD.confidenceScore, '%');
console.log('Reason:', testD.classificationReason);
console.log('Evidence:', testD.evidence);
console.log('Status:', testD.classification !== 'PERSISTENT_GAS_FLARE' && testD.classification === 'URBAN_OTHER' ? 'PASSED' : 'FAILED');

// Test E: High FRP But No OSM Facility
console.log('\n--- TEST E: High FRP / No OSM Facility ---');
const testE = classifyThermalAnomaly({
  frp: 180,
  brightnessK: 365,
  confidence: 'high',
  osmFacilityType: 'NONE',
  osmDistanceMeters: -1,
});
console.log('Classification:', testE.classification);
console.log('Confidence Score:', testE.confidenceScore, '%');
console.log('Reason:', testE.classificationReason);
console.log('Evidence:', testE.evidence);
console.log('Status:', testE.classification !== 'INDUSTRIAL_FIRE' && testE.classification === 'URBAN_OTHER' ? 'PASSED' : 'FAILED');

// Test F: Missing Persistence (High FRP/Temp)
console.log('\n--- TEST F: Missing Persistence ---');
const testF = classifyThermalAnomaly({
  frp: 120,
  brightnessK: 375,
  confidence: 'high',
  persistenceIndex: undefined,
  osmFacilityType: 'NONE',
  osmDistanceMeters: -1,
});
console.log('Classification:', testF.classification);
console.log('Confidence Score:', testF.confidenceScore, '%');
console.log('Reason:', testF.classificationReason);
console.log('Evidence:', testF.evidence);
console.log('Status:', testF.classification !== 'PERSISTENT_GAS_FLARE' ? 'PASSED' : 'FAILED');
