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
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { FeatureOverview } from './components/FeatureOverview';
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
  baseLayer: 'dark',
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
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter((a) => {
      // Classification
      if (!filters.classifications.includes(a.classification)) return false;

      // FRP range
      if (a.frp < filters.minFrp) return false;
      if (a.frp > filters.maxFrp) return false;

      if (!filters.hazardLevels.includes(a.hazardLevel)) return false;
      if (filters.satellite !== 'ALL' && a.satellite !== filters.satellite) return false;
      if (filters.facilityType !== 'ALL' && a.osmProximity?.facilityType !== filters.facilityType) return false;

      if (filters.datePreset !== 'all') {
        const acquisition = new Date(`${a.acq_date}T00:00:00Z`).getTime();
        const now = Date.now();
        const days = filters.datePreset === 'today' ? 1 : filters.datePreset === '7days' ? 7 : 30;
        if (!Number.isFinite(acquisition) || acquisition < now - days * 24 * 60 * 60 * 1000) return false;
      }

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

  const handleUpdateIncident = (id: string, updates: Partial<ThermalAnomaly>) => {
    setAnomalies((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    setSelectedAnomaly((prev) => (prev?.id === id ? { ...prev, ...updates } : prev));
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
      setAnomalies((prev) => {
        const updated = prev.map((a) => {
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
        });
        const jamnagar = updated.find((a) => a.id === 'firms-ind-001');
        if (jamnagar) setSelectedAnomaly(jamnagar);
        return updated;
      });
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

  const handleQuickFilter = (classification?: FireClassification, hazardOnly?: boolean) => {
    if (classification) {
      setFilters({
        ...INITIAL_FILTERS,
        classifications: [classification],
      });
    } else if (hazardOnly) {
      setFilters({
        ...INITIAL_FILTERS,
        hazardLevels: ['CRITICAL'],
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-x-hidden font-sans transition-colors duration-200 bg-radial-tactical">
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
        onQuickFilter={handleQuickFilter}
        onInjectScenario={handleInjectScenario}
      />

      <HeroSection
        anomalies={anomalies}
        isLiveData={isLiveData}
        onOpenSimulatePass={() => setShowSimulatePass(true)}
        onOpenTacticalBrief={() => setShowTacticalBrief(true)}
        onQuickFilter={handleQuickFilter}
      />

      <FeatureOverview
        onOpenDataManagement={() => setShowDataManagement(true)}
        onOpenSegregationMatrix={() => setShowSegregationMatrix(true)}
      />

      {/* Main Workspace (Sidebar + GIS Map) */}
      <section id="workspace" className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/70 px-4 py-12 sm:px-6 lg:px-8 bg-tactical-grid transition-colors duration-200">
        <div className="mx-auto max-w-[1800px]">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">Live operations workspace</div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">Monitor the national thermal picture</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Use the map and incident queue below to inspect signals, compare risk, and open evidence-backed response actions.</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 px-3.5 py-2 text-xs font-mono text-slate-600 dark:text-slate-300 shadow-sm backdrop-blur">
              Click an incident or corridor to inspect evidence & AI diagnostics
            </div>
          </div>
          <div className="flex h-[740px] flex-col overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl lg:h-[800px] md:flex-row backdrop-blur">
        {/* Left Side Filter & Telemetry Dock */}
        {!focusMode && (
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
            onUpdateIncident={handleUpdateIncident}
          />
        )}

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
            focusMode={focusMode}
            onToggleFocusMode={() => setFocusMode((current) => !current)}
          />
        </div>
      </div>
        </div>
      </section>

      <Footer anomalies={anomalies} activePass={activePass} isLiveData={isLiveData} />

      {/* In-depth Anomaly Detail Inspection Drawer */}
      {selectedAnomaly && (
        <AnomalyDetailModal
          anomaly={selectedAnomaly}
          onClose={() => setSelectedAnomaly(null)}
          onRunGeminiAnalysis={handleRunGeminiAnalysis}
          isAnalyzing={isAnalyzingAnomaly}
          onUpdateIncident={handleUpdateIncident}
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
