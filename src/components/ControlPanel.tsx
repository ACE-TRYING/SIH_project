import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Flame, 
  RotateCcw, 
  MapPin, 
  HelpCircle, 
  ListFilter, 
  SlidersHorizontal, 
  Info,
  Download,
  ArrowUpDown,
  X,
  Crosshair,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { 
  GISFilterState, 
  ThermalAnomaly, 
  IndustrialFacility, 
  FireClassification,
  IncidentResponseStatus
} from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { calculatePriorityScore, exportAnomaliesToGeoJSON, exportAnomaliesToCSV } from '../utils/geoUtils';

interface ControlPanelProps {
  filters: GISFilterState;
  onUpdateFilters: (filters: Partial<GISFilterState>) => void;
  onResetFilters: () => void;
  anomalies: ThermalAnomaly[];
  filteredAnomalies: ThermalAnomaly[];
  selectedAnomaly: ThermalAnomaly | null;
  onSelectAnomaly: (anomaly: ThermalAnomaly) => void;
  facilities: IndustrialFacility[];
  selectedFacility: IndustrialFacility | null;
  onSelectFacility: (facility: IndustrialFacility) => void;
  onUpdateIncident?: (id: string, updates: Partial<ThermalAnomaly>) => void;
}

const ALL_CLASSIFICATIONS: FireClassification[] = [
  'INDUSTRIAL_FIRE',
  'PERSISTENT_GAS_FLARE',
  'COAL_MINING_FIRE',
  'POWER_PLANT_THERMAL',
  'AGRICULTURAL_STUBBLE',
  'FOREST_WILDFIRE',
  'URBAN_OTHER',
];

type SortMode = 'priority' | 'frp' | 'temp' | 'date' | 'persistence';

const NEXT_STATUS: Record<IncidentResponseStatus, IncidentResponseStatus> = {
  NEW: 'ACKNOWLEDGED',
  ACKNOWLEDGED: 'ASSIGNED',
  ASSIGNED: 'RESOLVED',
  RESOLVED: 'NEW',
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  anomalies,
  filteredAnomalies,
  selectedAnomaly,
  onSelectAnomaly,
  facilities,
  selectedFacility,
  onSelectFacility,
  onUpdateIncident,
}) => {
  const [activeTab, setActiveTab] = useState<'filters' | 'list'>('filters');
  const [sortBy, setSortBy] = useState<SortMode>('priority');

  const toggleClassification = (cls: FireClassification) => {
    const exists = filters.classifications.includes(cls);
    if (exists) {
      if (filters.classifications.length === 1) return;
      onUpdateFilters({
        classifications: filters.classifications.filter((c) => c !== cls),
      });
    } else {
      onUpdateFilters({
        classifications: [...filters.classifications, cls],
      });
    }
  };

  const selectOnlyClassification = (cls: FireClassification) => {
    onUpdateFilters({ classifications: [cls] });
  };

  const selectAllClassifications = () => {
    onUpdateFilters({ classifications: ALL_CLASSIFICATIONS });
  };

  const handleCycleStatus = (anomaly: ThermalAnomaly, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateIncident) return;
    const current = anomaly.responseStatus || 'NEW';
    const next = NEXT_STATUS[current] || 'NEW';
    onUpdateIncident(anomaly.id, { responseStatus: next });
  };

  // Helper text for FRP energy levels
  const getFrpEnergyLabel = (val: number) => {
    if (val === 0) return 'All Detections';
    if (val <= 20) return 'Low Energy (>20 MW)';
    if (val <= 60) return 'Moderate Energy (>60 MW)';
    return 'Severe Thermal Spike (>100 MW)';
  };

  return (
    <aside className="w-full md:w-96 lg:w-[420px] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-200 shadow-sm">
      {/* Search & Strategic Hotspots Bar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50/90 dark:bg-slate-950/60">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility name, state, or ID..."
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            className="w-full bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition font-mono shadow-sm"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onUpdateFilters({ searchQuery: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Strategic Corridor Jumps */}
        <div>
          <div className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
              <span>Surveillance Corridors</span>
            </span>
            <span className="text-[10px] text-slate-400">NTRO Tier-1</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {facilities.map((fac) => (
              <button
                key={fac.id}
                id={`btn-jump-${fac.id}`}
                onClick={() => onSelectFacility(fac)}
                className={`text-[10px] px-2.5 py-1 rounded-lg whitespace-nowrap border transition font-mono cursor-pointer ${
                  selectedFacility?.id === fac.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-200 font-bold shadow-sm'
                    : 'bg-white dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {fac.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Clean Workspace */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 p-1 gap-1">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === 'filters'
              ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters & Triage</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
            activeTab === 'list'
              ? 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Active Incidents ({filteredAnomalies.length})</span>
        </button>
      </div>

      {/* TAB 1: Filter Parameters & Sliders */}
      {activeTab === 'filters' && (
        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
          {/* Classification Segregation Matrix Toggles */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Thermal Category Matrix</span>
              </span>
              <div className="flex items-center gap-1.5 text-[10px]">
                <button
                  onClick={selectAllClassifications}
                  className="text-amber-600 dark:text-amber-400 font-medium hover:underline"
                >
                  Select All
                </button>
                <span>•</span>
                <button
                  onClick={() => selectOnlyClassification('INDUSTRIAL_FIRE')}
                  className="text-rose-600 dark:text-rose-400 font-medium hover:underline"
                >
                  Fires Only
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {ALL_CLASSIFICATIONS.map((cls) => {
                const meta = CLASSIFICATION_METADATA[cls];
                const isSelected = filters.classifications.includes(cls);
                const count = anomalies.filter((a) => a.classification === cls).length;

                return (
                  <button
                    key={cls}
                    id={`filter-chip-${cls}`}
                    onClick={() => toggleClassification(cls)}
                    className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition text-left ${
                      isSelected
                        ? `${meta.badgeBg} ${meta.badgeText} font-semibold shadow-sm`
                        : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <span className="truncate pr-1">{meta.label.split('/')[0]}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-950/50">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy & Persistence Threshold Controls */}
          <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div>
              <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <span>Min Fire Energy (FRP):</span>
                  <span title="Fire Radiative Power (MW) measures total thermal heat emitted from orbit.">
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{filters.minFrp} MW</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={filters.minFrp}
                onChange={(e) => onUpdateFilters({ minFrp: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 text-right">
                {getFrpEnergyLabel(filters.minFrp)}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300 font-mono mb-1">
                <span className="flex items-center gap-1 font-semibold">
                  <span>Persistence Index:</span>
                  <span title="90-Day Recurrence Index: Distinguishes chronic industrial flares (>70%) from one-off wildfires (<20%).">
                    <Info className="w-3 h-3 text-slate-400" />
                  </span>
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">≥{(filters.minPersistence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.9"
                step="0.1"
                value={filters.minPersistence}
                onChange={(e) => onUpdateFilters({ minPersistence: Number(e.target.value) })}
                className="w-full accent-cyan-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 text-right">
                {filters.minPersistence === 0 ? 'Show All Detections' : `Filters for >${(filters.minPersistence * 100).toFixed(0)}% Recurrence`}
              </div>
            </div>
          </div>

          {/* Day / Night Filter & Reset Controls */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800 font-mono text-[10px] shadow-sm">
              {(['ALL', 'D', 'N'] as const).map((dn) => (
                <button
                  key={dn}
                  onClick={() => onUpdateFilters({ dayNight: dn })}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filters.dayNight === dn
                      ? 'bg-amber-500 text-white dark:text-slate-950 font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {dn === 'ALL' ? 'Day + Night' : dn === 'D' ? 'Day Swath' : 'Night Swath'}
                </button>
              ))}
            </div>

            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: Filtered Detections List & Workable Queue */}
      {(activeTab === 'list' || activeTab === 'filters') && (
        <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'filters' ? 'h-64 border-t border-slate-200 dark:border-slate-800' : ''}`}>
          {/* Subheader with Count, Sort, and Export */}
          <div className="px-3 py-2 bg-slate-100/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>
                Queue: <strong className="text-slate-900 dark:text-slate-100">{filteredAnomalies.length}</strong>
              </span>
              <div className="flex items-center gap-1 ml-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortMode)}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-[10px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                >
                  <option value="priority">Sort: Priority</option>
                  <option value="frp">Sort: FRP Energy</option>
                  <option value="temp">Sort: Temperature</option>
                  <option value="date">Sort: Recent</option>
                  <option value="persistence">Sort: Persistence</option>
                </select>
              </div>
            </div>

            {/* Workable Data Export */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => exportAnomaliesToGeoJSON(filteredAnomalies)}
                title="Export filtered detections as GeoJSON for GIS"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-cyan-600 dark:text-cyan-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>GeoJSON</span>
              </button>
              <button
                onClick={() => exportAnomaliesToCSV(filteredAnomalies)}
                title="Export filtered detections as CSV table"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer active:scale-95 shadow-xs"
              >
                <Download className="w-3 h-3" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60 p-2 space-y-2">
            {filteredAnomalies.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                No anomalies match the selected filter parameters. Adjust FRP or persistence sliders.
              </div>
            ) : (
              [...filteredAnomalies]
                .sort((a, b) => {
                  if (sortBy === 'priority') {
                    return calculatePriorityScore(b).score - calculatePriorityScore(a).score;
                  }
                  if (sortBy === 'frp') {
                    return b.frp - a.frp;
                  }
                  if (sortBy === 'temp') {
                    return b.brightness - a.brightness;
                  }
                  if (sortBy === 'date') {
                    return `${b.acq_date} ${b.acq_time}`.localeCompare(`${a.acq_date} ${a.acq_time}`);
                  }
                  if (sortBy === 'persistence') {
                    return (b.persistenceIndex ?? 0) - (a.persistenceIndex ?? 0);
                  }
                  return 0;
                })
                .map((anomaly) => {
                  const meta = CLASSIFICATION_METADATA[anomaly.classification];
                  const isSelected = selectedAnomaly?.id === anomaly.id;
                  const isCritical = anomaly.hazardLevel === 'CRITICAL';
                  const priority = calculatePriorityScore(anomaly);
                  const status = anomaly.responseStatus || 'NEW';

                  return (
                    <div
                      key={anomaly.id}
                      id={`anomaly-item-${anomaly.id}`}
                      onClick={() => onSelectAnomaly(anomaly)}
                      className={`p-3 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-amber-500/10 dark:bg-slate-800/95 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-950/70 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeBg} ${meta.badgeText}`}
                        >
                          {meta.label}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span>{anomaly.satellite}</span>
                          <span>•</span>
                          <span className={anomaly.daynight === 'D' ? 'text-amber-600 dark:text-amber-300 font-semibold' : 'text-indigo-600 dark:text-indigo-300 font-semibold'}>
                            {anomaly.daynight === 'D' ? 'Day' : 'Night'}
                          </span>
                        </span>
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          priority.score >= 80 
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30' 
                            : priority.score >= 60 
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                        }`}>
                          P{priority.score}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 mb-1.5 leading-snug line-clamp-1">
                        {anomaly.osmProximity?.matchedFacilityName || 'Unenriched Thermal Detection'}
                      </div>

                      <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/80 p-2 rounded-xl border border-slate-200 dark:border-slate-800/80">
                        <div>
                          <span>Energy: </span>
                          <strong className="text-rose-600 dark:text-rose-400">{anomaly.frp} MW</strong>
                        </div>
                        <div>
                          <span>Heat: </span>
                          <strong className="text-slate-800 dark:text-slate-200">{(anomaly.brightness - 273.15).toFixed(0)}°C</strong>
                        </div>
                        <div>
                          <span>Persistence: </span>
                          <strong className="text-cyan-600 dark:text-cyan-300">
                            {anomaly.persistenceIndex && anomaly.persistenceIndex > 0 ? `${(anomaly.persistenceIndex * 100).toFixed(0)}%` : 'N/A'}
                          </strong>
                        </div>
                      </div>

                      {/* Action Bar inside card */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                        {/* Interactive Status Triage Pill */}
                        <button
                          onClick={(e) => handleCycleStatus(anomaly, e)}
                          title="Click to advance response status"
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-semibold transition cursor-pointer active:scale-95 ${
                            status === 'RESOLVED'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              : status === 'ASSIGNED'
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30'
                              : status === 'ACKNOWLEDGED'
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{status}</span>
                        </button>

                        {/* Interactive Action Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAnomaly(anomaly);
                            }}
                            title="Target coordinates on map"
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                          >
                            <Crosshair className="w-3 h-3 text-amber-500" />
                            <span>Target</span>
                          </button>
                        </div>
                      </div>

                      {isCritical && (
                        <div className="mt-2 flex items-center justify-between text-[10px] text-red-600 dark:text-red-400 font-mono bg-red-500/10 dark:bg-red-950/40 px-2 py-1 rounded-lg border border-red-500/30 animate-pulse">
                          <span className="font-bold">CRITICAL HAZARD SPIKE</span>
                          <span>+{(anomaly.frp * 2.5).toFixed(0)}% Departure</span>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
