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
  Share2, 
  ExternalLink,
  ChevronRight,
  RefreshCw
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
              {anomaly.osmProximity.matchedFacilityName}
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
          {/* Key Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Fire Radiative Power</div>
              <div className="text-xl font-bold text-rose-400 font-mono">{anomaly.frp} <span className="text-xs font-normal">MW</span></div>
              <div className="text-[10px] text-slate-500">VIIRS 375m I-Band</div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Brightness Temp</div>
              <div className="text-xl font-bold text-amber-400 font-mono">{anomaly.brightness} <span className="text-xs font-normal">K</span></div>
              <div className="text-[10px] text-slate-500">~{Math.round(anomaly.brightness - 273.15)}°C Sensor Temp</div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Persistence Index</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">{(anomaly.persistenceIndex * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-slate-500">{anomaly.historicalDetectionsCount} detections / 90d</div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="text-[11px] text-slate-400 font-mono mb-0.5">Estimated Flame Temp</div>
              <div className="text-xl font-bold text-orange-400 font-mono">{anomaly.multispectral.estimatedTempCelsius}°C</div>
              <div className="text-[10px] text-slate-500">Plank Law Inversion</div>
            </div>
          </div>

          {/* Temporal Persistence & Emission Graph */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>90-Day Thermal Recurrence & Baseline Comparison</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">FRP (MW) over Satellite Passes</span>
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
                  <ReferenceLine y={40} label={{ value: 'Routine Flare Baseline', fill: '#f59e0b', fontSize: 10 }} stroke="#f59e0b" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="frp" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#frpGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Geospatial Fusion Details: OSM & Sentinel-2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* OSM Infrastructure Matching */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span>OpenStreetMap Infrastructure Fusion</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div><strong>Matched Entity:</strong> {anomaly.osmProximity.matchedFacilityName}</div>
                <div><strong>Facility Type:</strong> {anomaly.osmProximity.facilityType}</div>
                <div><strong>Proximity:</strong> <span className="text-cyan-400 font-bold">{anomaly.osmProximity.distanceMeters} meters</span></div>
                <div><strong>OSM Feature ID:</strong> {anomaly.osmProximity.osmId}</div>
              </div>
            </div>

            {/* Sentinel-2 Multispectral & SWIR */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Satellite className="w-4 h-4 text-amber-400" />
                <span>Sentinel-2 MSI / SWIR Validation</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                <div><strong>SWIR B12/B11 Ratio:</strong> <span className="text-amber-400 font-bold">{anomaly.multispectral.swirRatio_B12_B11}</span> (High combustion index)</div>
                <div><strong>Normalized Burn Ratio (NBR):</strong> {anomaly.multispectral.nbr}</div>
                <div><strong>NDVI Vegetation Index:</strong> {anomaly.multispectral.ndvi} (Non-vegetated ground)</div>
                <div><strong>Land Cover:</strong> {anomaly.landCover.type} (Corine {anomaly.landCover.corineCode})</div>
              </div>
            </div>
          </div>

          {/* Toxic Smoke & Atmospheric Plume Dispersion */}
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Wind className="w-4 h-4 text-rose-400" />
                <span>Atmospheric Dispersion & Toxic Hazard Zone</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                {anomaly.plumeDispersion.toxicGasRisk}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono bg-slate-900 p-2 rounded-lg border border-slate-800">
              <div>
                <div className="text-slate-400">Wind Vector</div>
                <div className="font-bold text-slate-200">{anomaly.plumeDispersion.windSpeedKmH} km/h @ {anomaly.plumeDispersion.windDirectionDeg}°</div>
              </div>
              <div>
                <div className="text-slate-400">Plume Length</div>
                <div className="font-bold text-amber-400">{anomaly.plumeDispersion.estimatedPlumeLengthKm} km</div>
              </div>
              <div>
                <div className="text-slate-400">Evac Radius</div>
                <div className="font-bold text-rose-400">{anomaly.plumeDispersion.evacuationRadiusKm} km</div>
              </div>
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

                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                  Verified at: {new Date(anomaly.geminiInsight.generatedAt).toUTCString()} by Gemini 3.7 Flash
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
                const text = `NTRO THERMAL ALERT:\nAnomaly ID: ${anomaly.id}\nClassification: ${anomaly.classification}\nFacility: ${anomaly.osmProximity.matchedFacilityName}\nFRP: ${anomaly.frp} MW\nCoordinates: ${anomaly.latitude}, ${anomaly.longitude}`;
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
