import React, { useEffect, useState } from 'react';
import { Activity, Database, Satellite, ShieldCheck } from 'lucide-react';
import { ThermalAnomaly } from '../types';

interface FooterProps {
  anomalies: ThermalAnomaly[];
  activePass: string;
  isLiveData: boolean;
}

export const Footer: React.FC<FooterProps> = ({ anomalies, activePass, isLiveData }) => {
  const [lastChecked, setLastChecked] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setLastChecked(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const criticalCount = anomalies.filter((anomaly) => anomaly.hazardLevel === 'CRITICAL').length;

  return (
    <footer className="min-h-9 shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 px-3 sm:px-4 py-1.5 text-[10px] text-slate-500 dark:text-slate-400 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 font-mono">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-cyan-500" />
            ThermalPulse Operations Console
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isLiveData ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isLiveData ? 'LIVE FEED' : 'DEMO / REPLAY'}
          </span>
          <span className="flex items-center gap-1.5">
            <Satellite className="h-3 w-3 text-cyan-500" />
            <span className="max-w-[190px] truncate">{activePass}</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="flex items-center gap-1.5">
            <Database className="h-3 w-3 text-indigo-500" />
            {anomalies.length} detections
          </span>
          <span className={criticalCount > 0 ? 'font-bold text-rose-500' : ''}>
            {criticalCount} critical
          </span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-emerald-500" />
            Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="hidden md:inline text-slate-400 dark:text-slate-600">FIRMS • OSM • Open-Meteo</span>
        </div>
      </div>
    </footer>
  );
};
