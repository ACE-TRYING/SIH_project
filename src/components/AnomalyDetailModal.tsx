import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sparkles, 
  Wind, 
  Building2, 
  Activity, 
  Calendar, 
  Satellite, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert,
  Share2, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Database
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine 
} from 'recharts';
import { ThermalAnomaly } from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';

interface AnomalyDetailModalProps {
  anomaly: ThermalAnomaly | null;
  onClose: () => void;
  onRunGeminiAnalysis: (anomaly: ThermalAnomaly) => Promise<void>;
  isAnalyzing: boolean;
}

export const AnomalyDetailModal: React.FC<AnomalyDetailModalProps> = ({
  anomaly,
  onClose,
  onRunGeminiAnalysis,
  isAnalyzing,
}) => {
  if (!anomaly) return null;

  const meta = CLASSIFICATION_METADATA[anomaly.classification];
  const isCritical = anomaly.hazardLevel === 'CRITICAL';

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
      <div className="w-full sm:max-w-2xl h-full sm:h-[94vh] bg-slate-900 border-l sm:border border-slate-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${meta.badgeBg} ${meta.badgeText}`}>
                {meta.label}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {anomaly.satellite} • {anomaly.daynight === 'D' ? 'Day Pass' : 'Night Pass'}
              </span>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                isCritical ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-800 text-slate-300'
              }`}>
                {anomaly.hazardLevel} PRIORITY
              </span>
            </div>

            <h2 className="text-lg font-bold text-white leading-tight">
              {anomaly.osmProximity?.matchedFacilityName || 'Unenriched Thermal Detection'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Coordinates: {anomaly.latitude.toFixed(5)}°N, {anomaly.longitude.toFixed(5)}°E • Acquired: {anomaly.acq_date} {anomaly.acq_time} UTC
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Phase 8: Data Provenance & Authenticity Audit Matrix */}
          <div className="bg-slate-950/90 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-100">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Multi-Source Data Provenance & Authenticity</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                SIH Data Provenance Audit
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
              {/* NASA FIRMS */}
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">NASA FIRMS</span>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  REAL
                </span>
                <span className="text-[9px] text-slate-500 truncate">Satellite Telemetry</span>
              </div>

              {/* OpenStreetMap */}
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">OpenStreetMap</span>
                {anomaly.osmProximity?.matchedFacilityName && anomaly.osmProximity.facilityType && anomaly.osmProximity.facilityType !== 'NONE' ? (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    REAL
                  </span>
                ) : anomaly.osmProximity !== undefined && anomaly.osmProximity !== null ? (
                  <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    REAL — NO MATCH
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    PENDING
                  </span>
                )}
                <span className="text-[9px] text-slate-500 truncate">Overpass API</span>
              </div>

              {/* Open-Meteo Weather */}
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Weather</span>
                {anomaly.weather?.status === 'REAL' ? (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    REAL
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    UNAVAILABLE
                  </span>
                )}
                <span className="text-[9px] text-slate-500 truncate">Open-Meteo API</span>
              </div>

              {/* Rule-Based Classification */}
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Classification</span>
                <span className="text-cyan-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                  HEURISTIC
                </span>
                <span className="text-[9px] text-slate-500 truncate">Rule Engine</span>
              </div>

              {/* Gemini Diagnostics */}
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px]">Gemini 3.7</span>
                {anomaly.geminiInsight?.source === 'gemini' || (anomaly.geminiInsight && !anomaly.geminiInsight.simulated) ? (
                  <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                    REAL
                  </span>
                ) : anomaly.geminiInsight ? (
                  <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                    FALLBACK
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
                    PENDING
                  </span>
                )}
                <span className="text-[9px] text-slate-500 truncate">Decision Support</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Bento Grid — Verified NASA FIRMS Telemetry */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Fire Radiative Power</div>
              <div className="text-xl font-bold text-rose-400 font-mono">{anomaly.frp} <span className="text-xs font-normal">MW</span></div>
              <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                NASA FIRMS (REAL)
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Brightness Temp</div>
              <div className="text-xl font-bold text-amber-400 font-mono">{anomaly.brightness} <span className="text-xs font-normal">K</span></div>
              <div className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                NASA FIRMS Band 21/I4
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Persistence Index</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">
                {anomaly.persistenceIndex && anomaly.persistenceIndex > 0 ? `${(anomaly.persistenceIndex * 100).toFixed(0)}%` : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500">
                {anomaly.historicalDetectionsCount && anomaly.historicalDetectionsCount > 0 ? `${anomaly.historicalDetectionsCount} detections / 90d` : 'Historical passes'}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Sensor Temp (°C)</div>
              <div className="text-xl font-bold text-orange-400 font-mono">
                {anomaly.brightness > 0 ? `${Math.round(anomaly.brightness - 273.15)}°C` : 'Unavailable'}
              </div>
              <div className="text-[10px] text-slate-500">Derived from Kelvin</div>
            </div>
          </div>

          {/* Rule-Based Classification & Evidence Explanation */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Classification & Evidence Breakdown</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                HEURISTIC RULE ENGINE (NOT ML)
              </span>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-[11px]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pb-1 border-b border-slate-800/80">
                <div>
                  <span className="text-slate-400">Classification: </span>
                  <span className="font-bold text-amber-300 font-mono">{anomaly.classification}</span>
                </div>
                <div>
                  <span className="text-slate-400">Method: </span>
                  <span className="font-semibold text-slate-200 font-mono">HEURISTIC RULE ENGINE</span>
                </div>
                <div>
                  <span className="text-slate-400">Confidence: </span>
                  <span className="font-bold text-cyan-400 font-mono">Heuristic evidence score: {anomaly.confidenceScore ?? 'N/A'}/100</span>
                </div>
              </div>

              {anomaly.classificationReason && (
                <div className="text-slate-300 text-[11px] leading-relaxed pt-1">
                  <span className="text-slate-400 font-medium">Evaluation Rationale: </span>
                  {anomaly.classificationReason}
                </div>
              )}

              {anomaly.evidence && anomaly.evidence.length > 0 && (
                <div className="pt-1 border-t border-slate-800/80">
                  <div className="text-slate-400 font-medium mb-1">Active Evidence Verified:</div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-300 font-mono">
                    {anomaly.evidence.map((ev, i) => (
                      <li key={i} className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Temporal Persistence & Emission Graph */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Thermal Recurrence & Emission History</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">FRP (MW)</span>
            </div>

            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="frpGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="MW" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <ReferenceLine y={40} label={{ value: 'Baseline', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="frp" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#frpGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geospatial Fusion Details: OSM & Sentinel-2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* OSM Infrastructure Matching */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  <span>OpenStreetMap Infrastructure</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  anomaly.osmProximity?.matchedFacilityName && anomaly.osmProximity.facilityType !== 'NONE'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : anomaly.osmProximity !== undefined && anomaly.osmProximity !== null
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {anomaly.osmProximity?.matchedFacilityName && anomaly.osmProximity.facilityType !== 'NONE'
                    ? '● REAL'
                    : anomaly.osmProximity !== undefined && anomaly.osmProximity !== null
                    ? '● REAL — NO MATCH'
                    : '● PENDING'}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div><strong>Matched Entity:</strong> {anomaly.osmProximity?.matchedFacilityName || (anomaly.osmProximity === null ? 'No matched facility (Open Area)' : 'Pending OSM Lookup')}</div>
                <div><strong>Facility Type:</strong> {anomaly.osmProximity?.facilityType && anomaly.osmProximity.facilityType !== 'NONE' ? anomaly.osmProximity.facilityType : 'Unavailable'}</div>
                <div><strong>Proximity:</strong> <span className="text-cyan-400 font-bold">{anomaly.osmProximity?.distanceMeters !== undefined && anomaly.osmProximity.distanceMeters >= 0 ? `${anomaly.osmProximity.distanceMeters} meters` : 'Unavailable'}</span></div>
                <div><strong>OSM Feature ID:</strong> {anomaly.osmProximity?.osmId && anomaly.osmProximity.osmId !== 'none' ? anomaly.osmProximity.osmId : 'Unavailable'}</div>
              </div>
            </div>

            {/* Sentinel-2 Multispectral & SWIR */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <Satellite className="w-4 h-4 text-amber-400" />
                  <span>Spectral & Land Cover</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {anomaly.multispectral ? 'SIMULATED' : 'UNAVAILABLE'}
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div><strong>SWIR B12/B11 Ratio:</strong> <span className="text-amber-400 font-bold">{anomaly.multispectral?.swirRatio_B12_B11 ?? 'Unavailable'}</span></div>
                <div><strong>Normalized Burn Ratio (NBR):</strong> {anomaly.multispectral?.nbr ?? 'Unavailable'}</div>
                <div><strong>NDVI Vegetation Index:</strong> {anomaly.multispectral?.ndvi ?? 'Unavailable'}</div>
                <div><strong>Land Cover:</strong> {anomaly.landCover?.type && anomaly.landCover.type !== 'UNKNOWN' ? `${anomaly.landCover.type} ${anomaly.landCover?.description ? `(${anomaly.landCover.description})` : ''}` : 'Unavailable'}</div>
              </div>
            </div>
          </div>

          {/* Toxic Smoke & Atmospheric Plume Dispersion */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Wind className="w-4 h-4 text-rose-400" />
                <span>Atmospheric Dispersion & Plume Status</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {anomaly.plumeDispersion?.toxicGasRisk || 'UNAVAILABLE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div>
                <div className="text-slate-400">Wind Vector</div>
                <div className="font-bold text-slate-200">
                  {anomaly.weather?.status === 'REAL' && typeof anomaly.weather.windSpeedKmh === 'number'
                    ? `${anomaly.weather.windSpeedKmh.toFixed(1)} km/h @ ${anomaly.weather.windDirectionDeg}°`
                    : anomaly.plumeDispersion?.windSpeedKmH && anomaly.plumeDispersion.windSpeedKmH > 0
                    ? `${anomaly.plumeDispersion.windSpeedKmH} km/h @ ${anomaly.plumeDispersion.windDirectionDeg}°`
                    : 'Unavailable'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Plume Length</div>
                <div className="font-bold text-slate-400">
                  {anomaly.plumeDispersion?.estimatedPlumeLengthKm && anomaly.plumeDispersion.estimatedPlumeLengthKm > 0
                    ? `${anomaly.plumeDispersion.estimatedPlumeLengthKm} km`
                    : 'Unavailable'}
                </div>
              </div>
              <div>
                <div className="text-slate-400">Evac Radius</div>
                <div className="font-bold text-slate-400">
                  {anomaly.plumeDispersion?.evacuationRadiusKm && anomaly.plumeDispersion.evacuationRadiusKm > 0
                    ? `${anomaly.plumeDispersion.evacuationRadiusKm} km`
                    : 'Unavailable'}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-800/60 leading-relaxed">
              <span className="text-amber-400 font-medium">⚠ Advisory: </span>
              Wind information is provided for situational awareness only. No validated plume dispersion model is currently implemented.
            </div>
          </div>

          {/* Phase 6 — Wind / Plume Advisory (real Open-Meteo, situational awareness only) */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Wind className="w-4 h-4 text-sky-400" />
                <span>Weather Observation (Open-Meteo)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  anomaly.weather?.status === 'REAL'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {anomaly.weather?.status === 'REAL' ? '● REAL — Open-Meteo' : '● UNAVAILABLE'}
                </span>
              </div>
            </div>

            {anomaly.weather?.status === 'REAL' && typeof anomaly.weather.windSpeedKmh === 'number' && typeof anomaly.weather.windDirectionDeg === 'number' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-slate-400 mb-0.5">Wind Speed</div>
                  <div className="font-bold text-sky-300">{anomaly.weather.windSpeedKmh.toFixed(1)} km/h</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-slate-400 mb-0.5">Direction</div>
                  <div className="font-bold text-sky-300">{anomaly.weather.windDirectionDeg}°</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-slate-400 mb-0.5">Source</div>
                  <div className="font-bold text-slate-200">Open-Meteo (REAL)</div>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-center">
                  <div className="text-slate-400 mb-0.5">Observed</div>
                  <div className="font-bold text-slate-300 truncate text-[10px]">
                    {anomaly.weather.observedAt ? new Date(anomaly.weather.observedAt).toUTCString().slice(0, 22) : 'Current'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800">
                Weather: Unavailable — real-time weather data not retrieved for this detection.
              </div>
            )}

            <div className="text-[10px] text-slate-500 bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-800/60 leading-relaxed">
              <span className="text-amber-400 font-medium">⚠ Advisory: </span>
              Wind information is provided for situational awareness only. No validated plume dispersion model is currently implemented.
            </div>
          </div>

          {/* Gemini AI Geospatial Diagnostics Section */}
          <div className="bg-gradient-to-br from-indigo-950/50 via-slate-950 to-slate-950 p-4 rounded-xl border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-indigo-300">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                <span>Gemini 3.7 Flash Geospatial Intelligence Diagnostics</span>
              </div>

              <button
                id="btn-run-gemini-audit"
                onClick={() => onRunGeminiAnalysis(anomaly)}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md transition"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Sensor Fusion...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Re-Audit</span>
                  </>
                )}
              </button>
            </div>

            {anomaly.geminiInsight ? (
              <div className="space-y-2.5 text-xs text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div>
                  <strong className="text-indigo-400">Multimodal Assessment:</strong>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">{anomaly.geminiInsight.assessment}</p>
                </div>

                <div>
                  <strong className="text-amber-400">Classification Rationale:</strong>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">{anomaly.geminiInsight.classificationRationale}</p>
                </div>

                <div>
                  <strong className="text-rose-400">Risk & Threat Assessment:</strong>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">{anomaly.geminiInsight.riskSummary}</p>
                </div>

                <div>
                  <strong className="text-emerald-400">NTRO Emergency Directive:</strong>
                  <p className="mt-0.5 text-slate-300 leading-relaxed">{anomaly.geminiInsight.containmentProtocol}</p>
                </div>

                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800 flex items-center justify-between flex-wrap gap-1">
                  <span>Verified at: {new Date(anomaly.geminiInsight.generatedAt).toUTCString()}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${
                    anomaly.geminiInsight.source === 'gemini' || anomaly.geminiInsight.simulated === false
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {anomaly.geminiInsight.source === 'gemini' || anomaly.geminiInsight.simulated === false
                      ? '● REAL — Gemini Decision Support'
                      : '● FALLBACK — Simulated / Heuristic Synthesis'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-center">
                Click "Run AI Re-Audit" to invoke Gemini 3.7 Flash server-side sensor synthesis and tactical containment evaluation.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 font-mono">
            NTRO Anomaly ID: <span className="text-slate-200">{anomaly.id}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const text = `NTRO THERMAL ALERT:\nAnomaly ID: ${anomaly.id}\nClassification: ${anomaly.classification}\nFacility: ${anomaly.osmProximity?.matchedFacilityName || 'Unenriched'}\nFRP: ${anomaly.frp} MW\nCoordinates: ${anomaly.latitude}, ${anomaly.longitude}`;
                navigator.clipboard.writeText(text);
                alert('Copied NTRO Incident Summary to clipboard.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Copy Dispatch</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
