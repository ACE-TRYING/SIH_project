import React, { useState } from 'react';
import { 
  X, 
  Satellite, 
  Flame, 
  Sparkles, 
  Radio, 
  AlertTriangle, 
  CheckCircle,
  Play,
  RotateCw
} from 'lucide-react';
import { ThermalAnomaly } from '../types';

interface SimulatePassModalProps {
  onInjectScenario: (scenarioType: 'JAMNAGAR_SPIKE' | 'JHARIA_EXPANSION' | 'PUNJAB_STUBBLE_BURST' | 'ALL_ROUTINE') => void;
  onClose: () => void;
}

export const SimulatePassModal: React.FC<SimulatePassModalProps> = ({
  onInjectScenario,
  onClose,
}) => {
  const [selectedSatellite, setSelectedSatellite] = useState<'VIIRS_NOAA20' | 'VIIRS_SNPP' | 'MODIS_Aqua'>('VIIRS_NOAA20');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const runSimulation = (scenario: 'JAMNAGAR_SPIKE' | 'JHARIA_EXPANSION' | 'PUNJAB_STUBBLE_BURST' | 'ALL_ROUTINE') => {
    setIsSimulating(true);
    setActiveScenario(scenario);

    setTimeout(() => {
      onInjectScenario(scenario);
      setIsSimulating(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Live Satellite Overpass Telemetry Simulator
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Simulate real-time VIIRS 375m & MODIS orbital swathes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Satellite Selection */}
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
              Select Orbital Swath Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'VIIRS_NOAA20', label: 'VIIRS NOAA-20', time: '14:22 UTC Night' },
                { id: 'VIIRS_SNPP', label: 'VIIRS S-NPP', time: '18:45 UTC Night' },
                { id: 'MODIS_Aqua', label: 'MODIS Aqua', time: '08:15 UTC Day' },
              ].map((sat) => (
                <button
                  key={sat.id}
                  onClick={() => setSelectedSatellite(sat.id as any)}
                  className={`p-2 rounded-xl border text-left font-mono transition ${
                    selectedSatellite === sat.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="font-bold text-xs">{sat.label}</div>
                  <div className="text-[10px] text-slate-500">{sat.time}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Test Scenarios */}
          <div className="space-y-2.5 pt-2">
            <div className="font-semibold text-slate-200">
              Trigger Operational Test Scenarios:
            </div>

            {/* Scenario 1: Jamnagar Refinery Fire Spike */}
            <div
              onClick={() => !isSimulating && runSimulation('JAMNAGAR_SPIKE')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/60 cursor-pointer transition flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-slate-100 group-hover:text-rose-400 transition">
                    Scenario A: Jamnagar CDU Tank Farm Fire Spike (218 MW)
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Simulates a 600% FRP departure at Reliance Jamnagar CDU-4. Triggers instant NTRO Critical Alarm, SWIR saturation, and toxic dispersion advisory.
                </p>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-rose-400 flex-shrink-0 mt-1" />
            </div>

            {/* Scenario 2: Jharia Coalfield Smolder Expansion */}
            <div
              onClick={() => !isSimulating && runSimulation('JHARIA_EXPANSION')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-orange-500/60 cursor-pointer transition flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="font-bold text-slate-100 group-hover:text-orange-400 transition">
                    Scenario B: Jharia Underground Coal Mine Seam Fire (88.5 MW)
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Simulates chronic 99% recurrence sub-surface coal smoldering with severe PM2.5/CO toxic plume drift across Dhanbad corridor.
                </p>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-orange-400 flex-shrink-0 mt-1" />
            </div>

            {/* Scenario 3: Seasonal Agricultural Stubble Surge */}
            <div
              onClick={() => !isSimulating && runSimulation('PUNJAB_STUBBLE_BURST')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-lime-500/60 cursor-pointer transition flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-lime-500" />
                  <span className="font-bold text-slate-100 group-hover:text-lime-400 transition">
                    Scenario C: North India Seasonal Stubble Surge (Zero Persistence)
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  Demonstrates segregation capability: multiple high-FRP crop residue burns on farmland correctly isolated from industrial installations.
                </p>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-lime-400 flex-shrink-0 mt-1" />
            </div>

            {/* Scenario 4: All Routine Industrial Flares */}
            <div
              onClick={() => !isSimulating && runSimulation('ALL_ROUTINE')}
              className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-cyan-500/60 cursor-pointer transition flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="font-bold text-slate-100 group-hover:text-cyan-400 transition">
                    Scenario D: Baseline Routine Operating Mode
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  All strategic refineries, petrochemicals, and thermal plants operating within baseline flaring limits (FRP &lt; 50 MW, low hazard).
                </p>
              </div>
              <Play className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 mt-1" />
            </div>
          </div>

          {isSimulating && (
            <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-center flex items-center justify-center gap-2 text-indigo-300 font-mono animate-pulse">
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Simulating {selectedSatellite} orbital pass and recalculating AI classifications...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
