import React from 'react';
import { 
  ShieldAlert, 
  Satellite, 
  Flame, 
  UploadCloud, 
  Layers, 
  Activity, 
  RefreshCw,
  Sparkles,
  HelpCircle,
  Sun,
  Moon,
  Filter
} from 'lucide-react';
import { ThermalAnomaly, FireClassification } from '../types';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  anomalies: ThermalAnomaly[];
  onOpenTacticalBrief: () => void;
  onOpenDataManagement: () => void;
  onOpenSimulatePass: () => void;
  onOpenSegregationMatrix: () => void;
  onToggleAnalytics: () => void;
  showAnalytics: boolean;
  activePass: string;
  isLiveData?: boolean;
  onQuickFilter?: (classification?: FireClassification, hazardOnly?: boolean) => void;
  onInjectScenario?: (scenarioType: 'JAMNAGAR_SPIKE' | 'JHARIA_EXPANSION' | 'PUNJAB_STUBBLE_BURST' | 'ALL_ROUTINE') => void;
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
  isLiveData = false,
  onQuickFilter,
  onInjectScenario,
}) => {
  const { theme, toggleTheme } = useTheme();

  const criticalCount = anomalies.filter((a) => a.hazardLevel === 'CRITICAL').length;
  const industrialCount = anomalies.filter((a) => a.classification === 'INDUSTRIAL_FIRE').length;
  const flareCount = anomalies.filter((a) => a.classification === 'PERSISTENT_GAS_FLARE').length;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur shadow-sm transition-colors duration-200">
      {/* Brand & Organization */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-600 to-indigo-900 border border-amber-400/40 shadow-lg shadow-rose-950/20">
          <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              NTRO DISASTER INTEL
            </span>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              ThermalPulse <span className="hidden sm:inline text-xs font-normal text-slate-500 dark:text-slate-400">| AI Industrial Fire & Thermal Surveillance</span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
            <span>NASA FIRMS VIIRS/MODIS</span>
            <span>•</span>
            <span>OSM Infrastructure</span>
            <span>•</span>
            <span>Open-Meteo Telemetry</span>
          </p>
        </div>
      </div>

      {/* Real-time Interactive Status Counters (Clickable Shortcuts) */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono text-xs shadow-inner overflow-x-auto no-scrollbar">
        {isLiveData ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold cursor-default shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>NASA FIRMS — LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-medium cursor-default shrink-0">
            <span>DEMO MODE</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 shrink-0">
          <Satellite className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
          <span className="text-slate-400">Pass:</span>
          <span className="text-cyan-600 dark:text-cyan-300 font-semibold truncate max-w-[140px]">{activePass}</span>
        </div>

        {/* Clickable Quick Filter: Industrial Fires */}
        <button
          onClick={() => onQuickFilter && onQuickFilter('INDUSTRIAL_FIRE')}
          title="Click to filter map & sidebar for Industrial Fires"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-300 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Flame className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden md:inline">Fires:</span>
          <span className="font-bold text-rose-600 dark:text-rose-400">{industrialCount}</span>
        </button>

        {/* Clickable Quick Filter: Gas Flares */}
        <button
          onClick={() => onQuickFilter && onQuickFilter('PERSISTENT_GAS_FLARE')}
          title="Click to filter map & sidebar for Gas Flares"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-600 dark:text-amber-300 transition cursor-pointer active:scale-95 shrink-0"
        >
          <Activity className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Flares:</span>
          <span className="font-bold text-amber-600 dark:text-amber-400">{flareCount}</span>
        </button>

        {/* Clickable Quick Filter: Critical Spikes */}
        {criticalCount > 0 && (
          <button
            onClick={() => onQuickFilter && onQuickFilter(undefined, true)}
            title="Click to filter map & sidebar for Critical Priority incidents"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500 text-red-700 dark:text-red-200 animate-pulse transition cursor-pointer active:scale-95 shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="font-bold">{criticalCount} CRITICAL</span>
          </button>
        )}
      </div>

      {/* Action Controls & Theme Toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Tactical Theme Mode Switcher */}
        <button
          id="btn-toggle-theme"
          onClick={toggleTheme}
          title={`Currently ${theme === 'dark' ? 'Dark Mode' : 'Light Mode'} (Click to switch)`}
          className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 transition active:scale-95 shadow-xs cursor-pointer"
        >
          {theme === 'dark' ? (
            <>
              <Moon className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-[11px] text-cyan-300 font-bold">Dark</span>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-500" />
              <span className="font-mono text-[11px] text-amber-600 font-bold">Light</span>
            </>
          )}
        </button>

        <button
          id="btn-segregation-matrix"
          onClick={onOpenSegregationMatrix}
          title="AI Classification & Segregation Algorithm Details"
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="hidden sm:inline">Logic</span>
        </button>

        <button
          id="btn-simulate-pass"
          onClick={onOpenSimulatePass}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 dark:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 transition cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span>Simulate</span>
        </button>

        <button
          id="btn-data-management"
          onClick={onOpenDataManagement}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
        >
          <UploadCloud className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>FIRMS Data</span>
        </button>

        <button
          id="btn-toggle-analytics"
          onClick={onToggleAnalytics}
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition cursor-pointer ${
            showAnalytics
              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Analytics</span>
        </button>

        <button
          id="btn-tactical-brief"
          onClick={onOpenTacticalBrief}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white shadow-md shadow-rose-950/20 border border-amber-400/30 transition active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>NTRO SITREP</span>
        </button>
      </div>

      <nav aria-label="Primary navigation" className="flex w-full items-center gap-1 border-t border-slate-200/80 pt-2 dark:border-slate-800/80">
        <span className="px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workspace</span>
        <button className="rounded-md bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white dark:bg-amber-500 dark:text-slate-950">Mission Control</button>
        <button onClick={onToggleAnalytics} className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer">Analytics</button>
        <button onClick={onOpenDataManagement} className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer">Data sources</button>
        <button onClick={onOpenSegregationMatrix} className="rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 cursor-pointer">How it works</button>
        <span className="ml-auto hidden text-[10px] font-mono text-slate-400 sm:inline">Decision support for disaster response</span>
      </nav>
    </header>
  );
};
