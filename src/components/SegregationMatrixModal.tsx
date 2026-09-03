import React from 'react';
import { 
  X, 
  Layers, 
  Flame, 
  Activity, 
  Building2, 
  CheckCircle2, 
  ShieldAlert
} from 'lucide-react';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { FireClassification } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SegregationMatrixModalProps {
  onClose: () => void;
}

export const SegregationMatrixModal: React.FC<SegregationMatrixModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                NTRO Multi-Sensor Segregation Architecture
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Methodology for distinguishing Industrial Fires, Gas Flares, Biomass Burns & Wildfires
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Executive Overview */}
          <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>The Core Challenge: Satellite Radiative Ambiguity</span>
            </h3>
            <p>
              Standard NASA FIRMS products (VIIRS 375m / MODIS 1km) detect radiant thermal anomalies (brightness temperature & Fire Radiative Power - FRP) but provide zero semantic classification. A 50 MW thermal detection from orbit could represent an accidental refinery fire explosion, routine gas flaring, stubble burning in Punjab, coal seam combustion in Jharia, or a forest wildfire in Similipal.
            </p>
            <p className="text-cyan-600 dark:text-cyan-300 font-mono text-[11px]">
              NTRO ThermalPulse solves this by executing real-time spatial fusion across 4 independent remote sensing and geospatial layers.
            </p>
          </div>

          {/* The 4-Pillar Fusion Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold">1</span>
                <span>OpenStreetMap (OSM) Infrastructure Co-location</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Real-time reverse spatial proximity query against high-risk industrial polygons: Refineries (<code className="text-cyan-600 dark:text-cyan-300">industrial=refinery</code>), Chemical crackers (<code className="text-cyan-600 dark:text-cyan-300">man_made=flare_stack</code>), Steel mills (<code className="text-cyan-600 dark:text-cyan-300">industrial=steel_mill</code>), and Coal extraction (<code className="text-cyan-600 dark:text-cyan-300">landuse=quarry</code>).
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                <span>Temporal Persistence Index (90-Day Recurrence)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Calculates the frequency of thermal detections at exact coordinates over the previous 90 to 365 days. Routine flares & industrial stacks show high persistence (&gt;75%), whereas stubble burning and wildfires exhibit transient zero-persistence (&lt;10%).
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                <span>Sentinel-2 MSI SWIR & Multispectral Index</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Calculates Short-Wave Infrared (SWIR Band 12 / Band 11 ratio, Normalized Burn Ratio - NBR, and NDVI). High combustion temperature (&gt;700°C) hydrocarbon combustion yields elevated SWIR ratios (&gt;2.5), whereas biomass combustion peaks in mid-infrared wavelengths.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-mono text-[11px] font-bold">4</span>
                <span>Gemini 3.6 Flash Geospatial AI Agent</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px]">
                Evaluates spatial-temporal evidence packages to synthesize natural language tactical SITREPs, containment advisories, and facility disaster mitigation steps for commanders.
              </p>
            </div>
          </div>

          {/* Matrix Reference Table */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-3">
              Deterministic Segregation Classification Rules
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-2">Target Classification</th>
                    <th className="pb-2">OSM Proximity Buffer</th>
                    <th className="pb-2">90d Persistence</th>
                    <th className="pb-2">FRP Threshold</th>
                    <th className="pb-2">Assigned Hazard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {(Object.keys(CLASSIFICATION_METADATA) as FireClassification[]).map((cls) => {
                    const meta = CLASSIFICATION_METADATA[cls];
                    return (
                      <tr key={cls} className="hover:bg-slate-200/50 dark:hover:bg-slate-900/60 transition">
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-700 dark:text-slate-300">
                          {cls === 'INDUSTRIAL_FIRE' || cls === 'PERSISTENT_GAS_FLARE' ? '≤ 3,000 meters' : 'None / Open Area'}
                        </td>
                        <td className="py-2.5 text-cyan-600 dark:text-cyan-300">
                          {cls === 'PERSISTENT_GAS_FLARE' || cls === 'POWER_PLANT_THERMAL' ? '≥ 70% Recurrent' : '< 20% Transient'}
                        </td>
                        <td className="py-2.5 text-rose-600 dark:text-rose-400 font-bold">
                          {cls === 'INDUSTRIAL_FIRE' ? 'High Spikes (>40 MW)' : 'Moderate (10-40 MW)'}
                        </td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">
                          {cls === 'INDUSTRIAL_FIRE' ? 'CRITICAL' : cls === 'PERSISTENT_GAS_FLARE' ? 'HIGH' : 'MODERATE'}
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
