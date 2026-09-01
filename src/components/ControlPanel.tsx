import React from 'react';
import { 
  Search, 
  Flame, 
  Activity, 
  SlidersHorizontal, 
  RotateCcw, 
  Radio, 
  MapPin,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { 
  GISFilterState, 
  ThermalAnomaly, 
  IndustrialFacility, 
  FireClassification,
  HazardLevel 
} from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';

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
}) => {
  const toggleClassification = (cls: FireClassification) => {
    const exists = filters.classifications.includes(cls);
    if (exists) {
      if (filters.classifications.length === 1) return; // Keep at least one
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

  return (
    <aside className="w-full md:w-96 lg:w-[400px] h-full bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-200 overflow-hidden">
      {/* Search & Strategic Hotspots Bar */}
      <div className="p-3 border-b border-slate-800 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search facility, coordinate, or state..."
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
          />
        </div>

        {/* Quick Strategic Corridor Jumps */}
        <div>
          <div className="text-[11px] font-mono font-medium text-slate-400 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span>Strategic Surveillance Corridors</span>
            </span>
            <span className="text-[10px] text-slate-500">NTRO Tier-1</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {facilities.map((fac) => (
              <button
                key={fac.id}
                id={`btn-jump-${fac.id}`}
                onClick={() => onSelectFacility(fac)}
                className={`text-[10px] px-2 py-1 rounded whitespace-nowrap border transition font-mono ${
                  selectedFacility?.id === fac.id
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                }`}
              >
                {fac.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Parameters & Sliders */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40 space-y-3">
        {/* Classification Segregation Matrix Toggles */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Classification Filter</span>
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <button
                onClick={selectAllClassifications}
                className="text-amber-400 hover:underline"
              >
                All
              </button>
              <span>•</span>
              <button
                onClick={() => selectOnlyClassification('INDUSTRIAL_FIRE')}
                className="text-rose-400 hover:underline"
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
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-[11px] transition text-left ${
                    isSelected
                      ? `${meta.badgeBg} ${meta.badgeText} font-medium`
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="truncate pr-1">{meta.label.split('/')[0]}</span>
                  <span className="font-mono text-[10px] font-bold px-1 rounded bg-slate-950/50">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Persistence & FRP Threshold Sliders */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>Min FRP:</span>
              <span className="text-amber-400 font-bold">{filters.minFrp} MW</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              step="10"
              value={filters.minFrp}
              onChange={(e) => onUpdateFilters({ minFrp: Number(e.target.value) })}
              className="w-full accent-amber-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>Persistence Index:</span>
              <span className="text-cyan-400 font-bold">≥{(filters.minPersistence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.9"
              step="0.1"
              value={filters.minPersistence}
              onChange={(e) => onUpdateFilters({ minPersistence: Number(e.target.value) })}
              className="w-full accent-cyan-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Day / Night & Reset */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1 bg-slate-950 rounded p-0.5 border border-slate-800 font-mono text-[10px]">
            {(['ALL', 'D', 'N'] as const).map((dn) => (
              <button
                key={dn}
                onClick={() => onUpdateFilters({ dayNight: dn })}
                className={`px-2 py-0.5 rounded transition ${
                  filters.dayNight === dn
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dn === 'ALL' ? 'Day+Night' : dn === 'D' ? 'Day' : 'Night'}
              </button>
            ))}
          </div>

          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Filtered Detections List */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>
            Showing <strong className="text-slate-100">{filteredAnomalies.length}</strong> of {anomalies.length} Anomaly Detections
          </span>
          <span className="text-[10px] text-amber-400 font-semibold">LIVE VIIRS FEED</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-1.5">
          {filteredAnomalies.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No anomalies match the selected filter parameters. Adjust FRP or persistence sliders.
            </div>
          ) : (
            filteredAnomalies.map((anomaly) => {
              const meta = CLASSIFICATION_METADATA[anomaly.classification];
              const isSelected = selectedAnomaly?.id === anomaly.id;
              const isCritical = anomaly.hazardLevel === 'CRITICAL';

              return (
                <div
                  key={anomaly.id}
                  id={`anomaly-item-${anomaly.id}`}
                  onClick={() => onSelectAnomaly(anomaly)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-800 border-amber-400 ring-1 ring-amber-400 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${meta.badgeBg} ${meta.badgeText}`}
                    >
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{anomaly.satellite}</span>
                      <span>•</span>
                      <span className={anomaly.daynight === 'D' ? 'text-amber-300' : 'text-indigo-300'}>
                        {anomaly.daynight === 'D' ? 'Day' : 'Night'}
                      </span>
                    </span>
                  </div>

                  <div className="font-semibold text-xs text-slate-100 mb-1 leading-snug line-clamp-1">
                    {anomaly.osmProximity?.matchedFacilityName || 'Unenriched Thermal Detection'}
                  </div>

                  <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded border border-slate-800/80">
                    <div>
                      <span>FRP: </span>
                      <strong className="text-rose-400">{anomaly.frp} MW</strong>
                    </div>
                    <div>
                      <span>Temp: </span>
                      <strong className="text-slate-200">{anomaly.brightness}K</strong>
                    </div>
                    <div>
                      <span>Persist: </span>
                      <strong className="text-cyan-300">
                        {anomaly.persistenceIndex && anomaly.persistenceIndex > 0 ? `${(anomaly.persistenceIndex * 100).toFixed(0)}%` : 'Unavailable'}
                      </strong>
                    </div>
                  </div>

                  {isCritical && (
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-red-400 font-mono bg-red-950/40 px-1.5 py-0.5 rounded border border-red-800/50 animate-pulse">
                      <span>CRITICAL HAZARD SPIKE</span>
                      <span>+{(anomaly.frp * 2.5).toFixed(0)}% Departure</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};
