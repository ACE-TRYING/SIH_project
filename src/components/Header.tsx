import React from 'react';
import { 
  ShieldAlert, 
  Satellite, 
  Flame, 
  FileText, 
  UploadCloud, 
  Layers, 
  Activity, 
  RefreshCw,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { ThermalAnomaly } from '../types';

interface HeaderProps {
  anomalies: ThermalAnomaly[];
  onOpenTacticalBrief: () => void;
  onOpenDataManagement: () => void;
  onOpenSimulatePass: () => void;
  onOpenSegregationMatrix: () => void;
  onToggleAnalytics: () => void;
  showAnalytics: boolean;
  activePass: string;
}

export const Header: React.FC<HeaderProps> = ({
  anomalies,
  onOpenTacticalBrief,
  onOpenDataManagement,
  onOpenSimulatePass,
  onOpenSegregationMatrix,
  onToggleAnalytics,
  showAnalytics,
  activePass,
}) => {
  const criticalCount = anomalies.filter((a) => a.hazardLevel === 'CRITICAL').length;
  const industrialCount = anomalies.filter((a) => a.classification === 'INDUSTRIAL_FIRE').length;
  const flareCount = anomalies.filter((a) => a.classification === 'PERSISTENT_GAS_FLARE').length;

  return (
    <header className="bg-slate-900/95 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 via-rose-600 to-indigo-900 border border-amber-400/40 shadow-lg shadow-rose-950/50">
          <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              NTRO DISASTER INTEL
            </span>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              ThermalPulse <span className="text-xs font-normal text-slate-400">| AI Industrial Fire & Persistent Thermal Classifier</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>NASA FIRMS VIIRS/MODIS</span>
            <span>•</span>
            <span>OpenStreetMap Infrastructure</span>
            <span>•</span>
            <span>Sentinel-2 SWIR</span>
          </p>
        </div>
      </div>

      {/* Real-time Status Counters */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80 font-mono text-xs">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 text-slate-300">
          <Satellite className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
          <span className="text-slate-400">Pass:</span>
          <span className="text-cyan-300 font-semibold">{activePass}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Industrial Fires:</span>
          <span className="font-bold text-rose-400">{industrialCount}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Persistent Flares:</span>
          <span className="font-bold text-amber-400">{flareCount}</span>
        </div>

        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/30 border border-red-500 text-red-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="font-bold">{criticalCount} CRITICAL SPIKES</span>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          id="btn-segregation-matrix"
          onClick={onOpenSegregationMatrix}
          title="AI Classification & Segregation Algorithm Details"
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Segregation Logic</span>
        </button>

        <button
          id="btn-simulate-pass"
          onClick={onOpenSimulatePass}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Simulate Pass</span>
        </button>

        <button
          id="btn-data-management"
          onClick={onOpenDataManagement}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
          <span>FIRMS API / Import</span>
        </button>

        <button
          id="btn-toggle-analytics"
          onClick={onToggleAnalytics}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
            showAnalytics
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Analytics</span>
        </button>

        <button
          id="btn-tactical-brief"
          onClick={onOpenTacticalBrief}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-md shadow-rose-950/40 border border-amber-400/30 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>NTRO SITREP Brief</span>
        </button>
      </div>
    </header>
  );
};
