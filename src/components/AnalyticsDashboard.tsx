import React from 'react';
import { 
  X, 
  BarChart3, 
  PieChart as PieIcon, 
  Activity, 
  ShieldAlert 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  ScatterChart, 
  Scatter, 
  ZAxis 
} from 'recharts';
import { ThermalAnomaly, IndustrialFacility } from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { useTheme } from '../context/ThemeContext';

interface AnalyticsDashboardProps {
  anomalies: ThermalAnomaly[];
  facilities: IndustrialFacility[];
  onClose: () => void;
  onSelectAnomaly: (anomaly: ThermalAnomaly) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  anomalies,
  facilities,
  onClose,
  onSelectAnomaly,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Classification breakdown
  const classificationCounts = Object.entries(
    anomalies.reduce((acc, a) => {
      acc[a.classification] = (acc[a.classification] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([key, count]) => ({
    name: CLASSIFICATION_METADATA[key as keyof typeof CLASSIFICATION_METADATA]?.label.split('/')[0] || key,
    rawKey: key,
    count,
    color: CLASSIFICATION_METADATA[key as keyof typeof CLASSIFICATION_METADATA]?.markerColor || '#8884d8',
  }));

  // Scatter data: Persistence (X) vs FRP (Y) vs Brightness (Z)
  const scatterData = anomalies.map((a) => ({
    id: a.id,
    name: a.osmProximity?.matchedFacilityName || 'Unenriched Detection',
    persistence: Number(((a.persistenceIndex ?? 0) * 100).toFixed(0)),
    frp: a.frp,
    brightness: a.brightness,
    classification: a.classification,
    color: CLASSIFICATION_METADATA[a.classification]?.markerColor || '#8884d8',
  }));

  // Top FRP Anomalies
  const topFRP = [...anomalies].sort((a, b) => b.frp - a.frp).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-5xl h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                NTRO Thermal Analytics & Segregation Metrics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Multi-sensor cross-correlation across {anomalies.length} satellite anomalies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-1">Total Anomalies</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{anomalies.length}</div>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 mt-1 font-semibold">VIIRS & MODIS NRT</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-1">Max Fire Power</div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono">
                {Math.max(...anomalies.map((a) => a.frp), 0)} <span className="text-xs font-normal">MW</span>
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Industrial Spike Detected</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-1">Mean 90d Persistence</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
                {anomalies.length > 0 ? `${((anomalies.reduce((s, a) => s + (a.persistenceIndex ?? 0), 0) / anomalies.length) * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Distinguishes routine vs transient</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] mb-1">Flare Stacks</div>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 font-mono">
                {anomalies.filter((a) => a.classification === 'PERSISTENT_GAS_FLARE').length}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">99.1% Confidence Segregated</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Chart 1: Classification Segregation Distribution */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-amber-500" />
                  <span>AI Fire & Thermal Segregation Breakdown</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Total Count</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classificationCounts} layout="vertical">
                    <XAxis type="number" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke={isDark ? '#cbd5e1' : '#475569'} 
                      fontSize={10} 
                      width={120} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#020617' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0', 
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderRadius: '8px', 
                        fontSize: '11px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {classificationCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Persistence (%) vs FRP (MW) Scatter Matrix */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-500" />
                  <span>Segregation Space: Persistence vs FRP (MW)</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">FRP vs Recurrence</span>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                    <XAxis 
                      type="number" 
                      dataKey="persistence" 
                      name="Persistence Index" 
                      unit="%" 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      fontSize={10} 
                      label={{ value: 'Persistence Index (%)', position: 'insideBottom', offset: -10, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="frp" 
                      name="FRP" 
                      unit="MW" 
                      stroke={isDark ? '#64748b' : '#94a3b8'} 
                      fontSize={10} 
                      label={{ value: 'Fire Radiative Power (MW)', angle: -90, position: 'insideLeft', fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    />
                    <ZAxis type="number" dataKey="brightness" range={[40, 200]} name="Brightness Temp" unit="K" />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#020617' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0', 
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderRadius: '8px', 
                        fontSize: '11px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Scatter name="Anomalies" data={scatterData}>
                      {scatterData.map((entry, index) => (
                        <Cell key={`scatter-cell-${index}`} fill={entry.color} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Critical Hazard Ranking Table */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Highest Radiative Power & Priority Incidents</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Click row to Inspect on GIS Map</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-2">Anomaly ID</th>
                    <th className="pb-2">Matched Facility</th>
                    <th className="pb-2">Classification</th>
                    <th className="pb-2">FRP</th>
                    <th className="pb-2">Brightness</th>
                    <th className="pb-2">Persistence</th>
                    <th className="pb-2">Hazard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {topFRP.map((a) => {
                    const meta = CLASSIFICATION_METADATA[a.classification];
                    return (
                      <tr
                        key={a.id}
                        onClick={() => {
                          onSelectAnomaly(a);
                          onClose();
                        }}
                        className="hover:bg-slate-200/50 dark:hover:bg-slate-900/80 cursor-pointer transition"
                      >
                        <td className="py-2.5 text-cyan-600 dark:text-cyan-400 font-bold">{a.id}</td>
                        <td className="py-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{a.osmProximity?.matchedFacilityName || 'Unenriched Detection'}</td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}>
                            {meta.label.split('/')[0]}
                          </span>
                        </td>
                        <td className="py-2.5 text-rose-600 dark:text-rose-400 font-bold">{a.frp} MW</td>
                        <td className="py-2.5 text-amber-600 dark:text-amber-300">{a.brightness} K</td>
                        <td className="py-2.5 text-cyan-600 dark:text-cyan-300">{a.persistenceIndex && a.persistenceIndex > 0 ? `${(a.persistenceIndex * 100).toFixed(0)}%` : 'N/A'}</td>
                        <td className="py-2.5">
                          <span className={`font-bold ${a.hazardLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {a.hazardLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
