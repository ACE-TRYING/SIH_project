import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { GisMap } from './components/GisMap';
import { ControlPanel } from './components/ControlPanel';
import { AnomalyDetailModal } from './components/AnomalyDetailModal';
import { TacticalBriefModal } from './components/TacticalBriefModal';
import { DataManagementModal } from './components/DataManagementModal';
import { SimulatePassModal } from './components/SimulatePassModal';
import { SegregationMatrixModal } from './components/SegregationMatrixModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { 
  INITIAL_THERMAL_ANOMALIES, 
  STRATEGIC_FACILITIES 
} from './data/mockGeospatialData';
import { 
  ThermalAnomaly, 
  IndustrialFacility, 
  GISFilterState, 
  MapLayerControls, 
  FireClassification 
} from './types';

const INITIAL_FILTERS: GISFilterState = {
  classifications: [
    'INDUSTRIAL_FIRE',
    'PERSISTENT_GAS_FLARE',
    'COAL_MINING_FIRE',
    'POWER_PLANT_THERMAL',
    'AGRICULTURAL_STUBBLE',
    'FOREST_WILDFIRE',
    'URBAN_OTHER',
  ],
  hazardLevels: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'],
  minFrp: 0,
  maxFrp: 500,
  dayNight: 'ALL',
  satellite: 'ALL',
  facilityType: 'ALL',
  minPersistence: 0,
  searchQuery: '',
  datePreset: 'all',
};

const INITIAL_LAYER_CONTROLS: MapLayerControls = {
  baseLayer: 'satellite',
  showHeatmap: false,
  showBufferZones: true,
  showOsmFacilities: true,
  showPlumes: true,
  showSentinelFootprint: true,
  showClustering: false,
  activeFilterOnly: true,
};

export default function App() {
  const [anomalies, setAnomalies] = useState<ThermalAnomaly[]>(INITIAL_THERMAL_ANOMALIES);
  const [facilities] = useState<IndustrialFacility[]>(STRATEGIC_FACILITIES);
  const [filters, setFilters] = useState<GISFilterState>(INITIAL_FILTERS);
  const [layerControls, setLayerControls] = useState<MapLayerControls>(INITIAL_LAYER_CONTROLS);

  // Selected State
  const [selectedAnomaly, setSelectedAnomaly] = useState<ThermalAnomaly | null>(null);
  const [selectedFacility, setSelectedFacility] = useState<IndustrialFacility | null>(null);

  // Modals & Panels
  const [showTacticalBrief, setShowTacticalBrief] = useState<boolean>(false);
  const [showDataManagement, setShowDataManagement] = useState<boolean>(false);
  const [showSimulatePass, setShowSimulatePass] = useState<boolean>(false);
  const [showSegregationMatrix, setShowSegregationMatrix] = useState<boolean>(false);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [isAnalyzingAnomaly, setIsAnalyzingAnomaly] = useState<boolean>(false);
  const [activePass, setActivePass] = useState<string>('VIIRS NOAA-20 (14:22 UTC)');
  const [isLiveData, setIsLiveData] = useState<boolean>(false);

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      // Classification
      if (!filters.classifications.includes(a.classification)) return false;

      // FRP range
      if (a.frp < filters.minFrp) return false;

      // Persistence
      if ((a.persistenceIndex ?? 0) < filters.minPersistence) return false;

      // Day / Night
      if (filters.dayNight !== 'ALL' && a.daynight !== filters.dayNight) return false;

      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const facilityName = (a.osmProximity?.matchedFacilityName || '').toLowerCase();
        const classification = a.classification.toLowerCase();
        const id = a.id.toLowerCase();
        const coords = `${a.latitude.toFixed(3)}, ${a.longitude.toFixed(3)}`;
        if (
          !facilityName.includes(query) &&
          !classification.includes(query) &&
          !id.includes(query) &&
          !coords.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [anomalies, filters]);

  // Update Filters
  const handleUpdateFilters = (newFilters: Partial<GISFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Update Layer Controls
  const handleUpdateLayerControls = (newControls: Partial<MapLayerControls>) => {
    setLayerControls((prev) => ({ ...prev, ...newControls }));
  };

  // Facility Selection
  const handleSelectFacility = (fac: IndustrialFacility) => {
    setSelectedFacility(fac);
    setSelectedAnomaly(null);
  };

  // Anomaly Selection
  const handleSelectAnomaly = (anomaly: ThermalAnomaly) => {
    setSelectedAnomaly(anomaly);
    setSelectedFacility(null);
  };

  // Run Gemini Analysis for selected anomaly
  const handleRunGeminiAnalysis = async (anomaly: ThermalAnomaly) => {
    setIsAnalyzingAnomaly(true);
    try {
      const res = await fetch('/api/gemini/classify-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomaly }),
      });

      if (!res.ok) {
        throw new Error('Failed to run AI classification analysis');
      }

      const data = await res.json();
      if (data.insight) {
        const updatedAnomaly: ThermalAnomaly = {
          ...anomaly,
          geminiInsight: data.insight,
        };

        setAnomalies((prev) =>
          prev.map((a) => (a.id === anomaly.id ? updatedAnomaly : a))
        );
        setSelectedAnomaly(updatedAnomaly);
      }
    } catch (err) {
      console.error(err);
      alert('Error querying Gemini Geospatial AI: ' + (err as Error).message);
    } finally {
      setIsAnalyzingAnomaly(false);
    }
  };

  // Ingest Imported Anomalies
  const handleImportAnomalies = (
    newItems: ThermalAnomaly[],
    mode: 'replace' | 'append',
    sourceLabel?: string,
    isLive: boolean = false
  ) => {
    if (mode === 'replace') {
      setAnomalies(newItems);
    } else {
      setAnomalies((prev) => [...newItems, ...prev]);
    }
    if (sourceLabel) {
      setActivePass(sourceLabel);
    }
    setIsLiveData(isLive);
  };

  // Inject Simulation Scenario
  const handleInjectScenario = (
    scenarioType: 'JAMNAGAR_SPIKE' | 'JHARIA_EXPANSION' | 'PUNJAB_STUBBLE_BURST' | 'ALL_ROUTINE'
  ) => {
    setIsLiveData(false);
    if (scenarioType === 'JAMNAGAR_SPIKE') {
      setActivePass('VIIRS NOAA-20 (NIGHT PASS + SPIKE)');
      setAnomalies((prev) =>
        prev.map((a) => {
          if (a.id === 'firms-ind-001') {
            return {
              ...a,
              frp: 310.5,
              brightness: 420.2,
              anomalyStatus: 'ACCIDENTAL_SPIKE_FIRE',
              hazardLevel: 'CRITICAL',
              multispectral: {
                ...a.multispectral,
                swirRatio_B12_B11: 3.85,
                estimatedTempCelsius: 910,
              },
              plumeDispersion: {
                ...a.plumeDispersion,
                estimatedPlumeLengthKm: 12.0,
                evacuationRadiusKm: 5.0,
              },
            };
          }
          return a;
        })
      );
      // Auto-select Jamnagar
      const jamnagar = anomalies.find((a) => a.id === 'firms-ind-001');
      if (jamnagar) setSelectedAnomaly(jamnagar);
    } else if (scenarioType === 'JHARIA_EXPANSION') {
      setActivePass('VIIRS S-NPP (COAL BASIN OVERPASS)');
      const jharia = anomalies.find((a) => a.id === 'firms-ind-004');
      if (jharia) setSelectedAnomaly(jharia);
    } else if (scenarioType === 'PUNJAB_STUBBLE_BURST') {
      setActivePass('MODIS TERRA (NORTH INDIA HARVEST SWATH)');
      const stubble = anomalies.find((a) => a.id === 'firms-agr-008');
      if (stubble) setSelectedAnomaly(stubble);
    } else {
      setActivePass('VIIRS NOAA-21 (NOMINAL)');
      setAnomalies(INITIAL_THERMAL_ANOMALIES);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Intelligence Header */}
      <Header
        anomalies={anomalies}
        onOpenTacticalBrief={() => setShowTacticalBrief(true)}
        onOpenDataManagement={() => setShowDataManagement(true)}
        onOpenSimulatePass={() => setShowSimulatePass(true)}
        onOpenSegregationMatrix={() => setShowSegregationMatrix(true)}
        onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
        showAnalytics={showAnalytics}
        activePass={activePass}
        isLiveData={isLiveData}
      />

      {/* Main Workspace (Sidebar + GIS Map) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Side Filter & Telemetry Dock */}
        <ControlPanel
          filters={filters}
          onUpdateFilters={handleUpdateFilters}
          onResetFilters={handleResetFilters}
          anomalies={anomalies}
          filteredAnomalies={filteredAnomalies}
          selectedAnomaly={selectedAnomaly}
          onSelectAnomaly={handleSelectAnomaly}
          facilities={facilities}
          selectedFacility={selectedFacility}
          onSelectFacility={handleSelectFacility}
        />

        {/* Center/Right Leaflet GIS Map Canvas */}
        <div className="flex-1 relative h-full">
          <GisMap
            anomalies={filteredAnomalies}
            facilities={facilities}
            selectedAnomaly={selectedAnomaly}
            onSelectAnomaly={handleSelectAnomaly}
            layerControls={layerControls}
            onUpdateLayerControls={handleUpdateLayerControls}
            selectedFacility={selectedFacility}
          />
        </div>
      </div>

      {/* In-depth Anomaly Detail Inspection Drawer */}
      {selectedAnomaly && (
        <AnomalyDetailModal
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onRunGeminiAnalysis={handleRunGeminiAnalysis}
          isAnalyzing={isAnalyzingAnomaly}
        />
      )}

      {/* Tactical Situation Report (SITREP) Modal */}
      {showTacticalBrief && (
        <TacticalBriefModal
          anomalies={filteredAnomalies}
          activeFacility={selectedFacility}
          filters={filters}
          onClose={() => setShowTacticalBrief(false)}
        />
      )}

      {/* Live NASA FIRMS API & Data Management Modal */}
      {showDataManagement && (
        <DataManagementModal
          anomalies={anomalies}
          onImportAnomalies={handleImportAnomalies}
          onClose={() => setShowDataManagement(false)}
        />
      )}

      {/* Real-time Satellite Overpass Simulator Modal */}
      {showSimulatePass && (
        <SimulatePassModal
          onInjectScenario={handleInjectScenario}
          onClose={() => setShowSimulatePass(false)}
        />
      )}

      {/* Segregation Algorithm Methodology Modal */}
      {showSegregationMatrix && (
        <SegregationMatrixModal
          onClose={() => setShowSegregationMatrix(false)}
        />
      )}

      {/* Comprehensive Analytics Dashboard */}
      {showAnalytics && (
        <AnalyticsDashboard
          anomalies={filteredAnomalies}
          facilities={facilities}
          onClose={() => setShowAnalytics(false)}
          onSelectAnomaly={(a) => {
            setSelectedAnomaly(a);
            setShowAnalytics(false);
          }}
        />
      )}
    </div>
  );
}
