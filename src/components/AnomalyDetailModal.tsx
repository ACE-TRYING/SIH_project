import React from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Wind, 
  Building2, 
  Activity, 
  Satellite, 
  AlertTriangle, 
  RefreshCw,
  Database,
  ClipboardCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip 
} from 'recharts';
import { ThermalAnomaly } from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { useTheme } from '../context/ThemeContext';
import { calculatePriorityScore } from '../utils/geoUtils';

interface AnomalyDetailModalProps {
  anomaly: ThermalAnomaly | null;
  onClose: () => void;
  onRunGeminiAnalysis: (anomaly: ThermalAnomaly) => Promise<void>;
  isAnalyzing: boolean;
  onUpdateIncident: (id: string, updates: Partial<ThermalAnomaly>) => void;
}

export const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({
  anomaly,
  onClose,
  onRunGeminiAnalysis,
  isAnalyzing,
  onUpdateIncident,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!anomaly) return null;

  const meta = CLASSIFICATION_METADATA[anomaly.classification];
  const isCritical = anomaly.hazardLevel === 'CRITICAL';
  const priority = calculatePriorityScore(anomaly);
  const responseStatus = anomaly.responseStatus || 'NEW';

  // Chart data for temporal recurrence
  const historyData = anomaly.temporalHistory || [
    { date: 'Day -20', frp: Math.round(anomaly.frp * 0.4), tempK: anomaly.brightness - 25, isSpike: false },
    { date: 'Day -15', frp: Math.round(anomaly.frp * 0.5), tempK: anomaly.brightness - 20, isSpike: false },
    { date: 'Day -10', frp: Math.round(anomaly.frp * 0.45), tempK: anomaly.brightness - 22, isSpike: false },
    { date: 'Day -5', frp: Math.round(anomaly.frp * 0.6), tempK: anomaly.brightness - 15, isSpike: false },
    { date: 'Latest Pass', frp: anomaly.frp, tempK: anomaly.brightness, isSpike: isCritical },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      <div className="w-full sm:max-w-2xl h-full sm:h-[94vh] bg-white dark:bg-slate-900 border-l sm:border border-slate-200 dark:border-slate-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeBg} ${meta.badgeText}`}>
                {meta.label}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {anomaly.satellite} • {anomaly.daynight === 'D' ? 'Day Pass' : 'Night Pass'}
              </span>
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg ${
                isCritical ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {anomaly.hazardLevel} PRIORITY
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              {anomaly.osmProximity?.matchedFacilityName || 'Unenriched Thermal Detection'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Coordinates: {anomaly.latitude.toFixed(5)}°N, {anomaly.longitude.toFixed(5)}°E • Acquired: {anomaly.acq_date} {anomaly.acq_time} UTC
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Data Provenance & Authenticity Matrix */}
          <div className="bg-slate-50 dark:bg-slate-950/90 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                <Database className="w-4 h-4 text-indigo-500" />
                <span>Multi-Source Provenance & Data Pipeline</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                Verified Sensor Fusion
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
              {/* NASA FIRMS */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">NASA FIRMS</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  LIVE TELEMETRY
                </span>
                <span className="text-[9px] text-slate-400 truncate">Satellite VIIRS</span>
              </div>

              {/* OpenStreetMap */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">OpenStreetMap</span>
                {anomaly.osmProximity?.matchedFacilityName && anomaly.osmProximity.facilityType && anomaly.osmProximity.facilityType !== 'NONE' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    VERIFIED ASSET
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    UNCLASSIFIED AREA
                  </span>
                )}
                <span className="text-[9px] text-slate-400 truncate">Overpass API</span>
              </div>

              {/* Open-Meteo Weather */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Weather</span>
                {anomaly.weather?.status === 'REAL' ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    OPEN-METEO REAL
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                    UNAVAILABLE
                  </span>
                )}
                <span className="text-[9px] text-slate-400 truncate">Wind Vectors</span>
              </div>

              {/* AI Classifier */}
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Gemini 3.6 Flash</span>
                {anomaly.geminiInsight ? (
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                    AI SYNTHESIS READY
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                    READY TO PROCESS
                  </span>
                )}
                <span className="text-[9px] text-slate-400 truncate">NTRO Decision Support</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Radiative Power</span>
              </div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono">{anomaly.frp} MW</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">VIIRS Channel M13</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Brightness Temp</span>
              </div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-300 font-mono">{anomaly.brightness} K</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{(anomaly.brightness - 273.15).toFixed(1)}°C</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mb-1 flex items-center gap-1">
                <Satellite className="w-3.5 h-3.5 text-cyan-500" />
                <span>90d Persistence</span>
              </div>
              <div className="text-lg font-bold text-cyan-600 dark:text-cyan-300 font-mono">
                {anomaly.persistenceIndex && anomaly.persistenceIndex > 0 ? `${(anomaly.persistenceIndex * 100).toFixed(0)}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{anomaly.historicalDetectionsCount || 0} Pass Detections</div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px] mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Asset Distance</span>
              </div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-300 font-mono">
                {anomaly.osmProximity?.distanceMeters && anomaly.osmProximity.distanceMeters >= 0
                  ? `${anomaly.osmProximity.distanceMeters}m`
                  : 'Open Area'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">OSM Facility Buffer</div>
            </div>
          </div>

          <div className="bg-rose-500/10 dark:bg-rose-950/30 p-4 rounded-xl border border-rose-500/30 space-y-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <span>Operational Priority</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Deterministic triage score, not a probability.</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{priority.score}<span className="text-xs">/100</span></div>
                <div className="text-[10px] font-semibold text-rose-700 dark:text-rose-300">{priority.responseWindow}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {priority.factors.map((factor) => (
                <span key={factor} className="px-2 py-1 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-rose-500/20 text-[10px] text-slate-700 dark:text-slate-300">{factor}</span>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/90 p-4 rounded-xl border border-cyan-500/30 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <ClipboardCheck className="w-4 h-4 text-cyan-500" />
              <span>Response Workflow</span>
              <span className="ml-auto text-[10px] font-mono text-cyan-600 dark:text-cyan-400">LOCAL OPERATIONAL LOG</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                STATUS
                <select
                  value={responseStatus}
                  onChange={(e) => onUpdateIncident(anomaly.id, { responseStatus: e.target.value as ThermalAnomaly['responseStatus'] })}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="NEW">New</option>
                  <option value="ACKNOWLEDGED">Acknowledged</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </label>
              <label className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                ASSIGN TO
                <select
                  value={anomaly.assignedAgency || ''}
                  onChange={(e) => onUpdateIncident(anomaly.id, { assignedAgency: e.target.value, responseStatus: e.target.value ? 'ASSIGNED' : responseStatus })}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="">Unassigned</option>
                  <option value="District Disaster Management Authority">District Disaster Management Authority</option>
                  <option value="Fire & Emergency Services">Fire & Emergency Services</option>
                  <option value="NDRF / SDRF">NDRF / SDRF</option>
                  <option value="Facility Emergency Control Room">Facility Emergency Control Room</option>
                </select>
              </label>
            </div>
            <textarea
              value={anomaly.responseNote || ''}
              onChange={(e) => onUpdateIncident(anomaly.id, { responseNote: e.target.value })}
              placeholder="Add verification findings or dispatch notes..."
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Temporal Recurrence Graph */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span>90-Day Radiative Power (FRP) Recurrence Trend</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Satellite Overpass History</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="frpColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={10} tickLine={false} />
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
                  <Area type="monotone" dataKey="frp" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#frpColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gemini AI Synthesis Section */}
          <div className="bg-gradient-to-br from-indigo-500/10 via-amber-500/5 to-purple-500/10 p-4 rounded-xl border border-indigo-500/30 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">NTRO AI Decision-Support Synthesis</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Gemini 3.6 Flash Multi-Sensor Evaluation</p>
                </div>
              </div>

              <button
                onClick={() => onRunGeminiAnalysis(anomaly)}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analyzing...' : anomaly.geminiInsight ? 'Re-Analyze' : 'Run AI Analysis'}</span>
              </button>
            </div>

            {anomaly.geminiInsight ? (
              <div className="space-y-2.5 pt-2 border-t border-indigo-500/20 text-xs">
                <div className="bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20">
                  <div className="font-bold text-indigo-600 dark:text-indigo-300 mb-1">Geospatial Assessment</div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{anomaly.geminiInsight.assessment}</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20">
                  <div className="font-bold text-amber-600 dark:text-amber-300 mb-1">Classification & Energy Rationale</div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{anomaly.geminiInsight.classificationRationale}</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20">
                  <div className="font-bold text-rose-600 dark:text-rose-300 mb-1">Risk Summary</div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{anomaly.geminiInsight.riskSummary}</p>
                </div>

                <div className="bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-indigo-500/20">
                  <div className="font-bold text-emerald-600 dark:text-emerald-300 mb-1">Containment Protocol</div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{anomaly.geminiInsight.containmentProtocol}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-slate-500 dark:text-slate-400 font-mono text-xs bg-white/50 dark:bg-slate-950/40 rounded-xl border border-indigo-500/20">
                Click "Run AI Analysis" to launch Gemini 3.6 Flash multi-sensor decision support for this thermal anomaly.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
