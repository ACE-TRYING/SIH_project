import React from 'react';
import { ArrowRight, Flame, Radio, Satellite, Sparkles } from 'lucide-react';
import { ThermalAnomaly } from '../types';
import { calculatePriorityScore } from '../utils/geoUtils';

interface HeroSectionProps {
  anomalies: ThermalAnomaly[];
  isLiveData: boolean;
  onOpenSimulatePass: () => void;
  onOpenTacticalBrief: () => void;
  onQuickFilter?: (classification?: any, hazardOnly?: boolean) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  anomalies,
  isLiveData,
  onOpenSimulatePass,
  onOpenTacticalBrief,
  onQuickFilter,
}) => {
  const criticalCount = anomalies.filter((anomaly) => anomaly.hazardLevel === 'CRITICAL').length;
  const averagePriority = anomalies.length
    ? Math.round(anomalies.reduce((sum, anomaly) => sum + calculatePriorityScore(anomaly).score, 0) / anomalies.length)
    : 0;

  return (
    <section className="shrink-0 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-100 to-amber-50/40 dark:from-slate-950 dark:via-slate-900/90 dark:to-indigo-950/40 bg-tactical-grid bg-radial-tactical px-4 py-6 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            National Thermal Intelligence & Response Network
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
            See the signal. Understand the risk. Act sooner.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
            ThermalPulse fuses NASA FIRMS satellite heat detections, critical infrastructure corridors, real atmospheric winds, and explainable AI for rapid tactical response.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={onOpenSimulatePass}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 active:scale-[.98] dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 cursor-pointer"
            >
              <Satellite className="h-4 w-4" />
              Run an operational scenario
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onOpenTacticalBrief}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:border-amber-500 hover:bg-white dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-amber-400 cursor-pointer active:scale-95 shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              Generate situation report
            </button>
          </div>
        </div>

        {/* Interactive KPI Quick-Filter Cards */}
        <div className="grid w-full max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-4 lg:w-[540px]">
          <div 
            onClick={() => onQuickFilter && onQuickFilter(undefined, false)}
            title="Click to view all signals"
            className="rounded-2xl border border-slate-200/90 bg-white/85 p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 hover:border-cyan-500/60 dark:hover:border-cyan-400/60 cursor-pointer transition active:scale-95 group"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">Signals</div>
            <div className="mt-1 text-2xl font-bold text-slate-950 dark:text-white">{anomalies.length}</div>
            <div className="mt-1 text-[10px] text-cyan-700 dark:text-cyan-400 font-mono">FIRMS detections</div>
          </div>

          <div 
            onClick={() => onQuickFilter && onQuickFilter(undefined, true)}
            title="Click to filter for Critical Priority signals"
            className="rounded-2xl border border-rose-200/90 bg-rose-50/80 p-3.5 shadow-sm dark:border-rose-900/70 dark:bg-rose-950/40 hover:border-rose-500/80 cursor-pointer transition active:scale-95 group"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Critical</div>
            <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold text-rose-700 dark:text-rose-300">
              <Flame className="h-5 w-5 text-rose-500 group-hover:animate-bounce" />
              {criticalCount}
            </div>
            <div className="mt-1 text-[10px] text-rose-600 dark:text-rose-400 font-mono">Immediate review</div>
          </div>

          <div 
            onClick={() => onQuickFilter && onQuickFilter('INDUSTRIAL_FIRE')}
            title="Click to filter for Industrial Refinery Fires"
            className="rounded-2xl border border-amber-200/90 bg-amber-50/80 p-3.5 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/40 hover:border-amber-500/80 cursor-pointer transition active:scale-95 group"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Avg Priority</div>
            <div className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">
              {averagePriority}<span className="text-sm font-normal">/100</span>
            </div>
            <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-mono">Triage rating</div>
          </div>

          <div 
            onClick={onOpenSimulatePass}
            title="Click to configure live / simulated passes"
            className="rounded-2xl border border-emerald-200/90 bg-emerald-50/80 p-3.5 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/40 hover:border-emerald-500/80 cursor-pointer transition active:scale-95 group"
          >
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Network</div>
            <div className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              {isLiveData ? 'LIVE FIRMS' : 'SIMULATION'}
            </div>
            <div className="mt-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">Satellite feed</div>
          </div>
        </div>
      </div>
    </section>
  );
};
