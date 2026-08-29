import React from 'react';
import { 
  X, 
  Layers, 
  Flame, 
  Activity, 
  Building2, 
  Satellite, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { FireClassification } from '../types';

interface SegregationMatrixModalProps {
  onClose: () => void;
}

export const SegregationMatrixModal: React.FC<SegregationMatrixModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[92vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                NTRO Multi-Sensor Fire & Thermal Segregation Architecture
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Methodology for distinguishing Industrial Fires, Gas Flares, Biomass Burns & Wildfires
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Executive Overview */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>The Problem: NASA FIRMS Satellite Thermal Ambiguity</span>
            </h3>
            <p>
              Standard NASA FIRMS products (VIIRS 375m / MODIS 1km) detect radiant thermal anomalies (brightness temperature & Fire Radiative Power - FRP) but provide zero semantic classification. A 50 MW thermal detection from orbit could represent an accidental refinery fire explosion, routine gas flaring, stubble burning in Punjab, coal seam combustion in Jharia, or a forest wildfire in Similipal.
            </p>
            <p className="text-cyan-300 font-mono text-[11px]">
              NTRO ThermalPulse solves this by executing real-time spatial fusion across 4 independent remote sensing and geospatial layers.
            </p>
          </div>

          {/* The 4-Pillar Fusion Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono text-[11px] font-bold">1</span>
                <span>OpenStreetMap (OSM) Infrastructure Co-location</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Real-time reverse spatial proximity query against high-risk industrial polygons: Refineries (<code className="text-cyan-300">industrial=refinery</code>), Chemical crackers (<code className="text-cyan-300">man_made=flare_stack</code>), Steel mills (<code className="text-cyan-300">industrial=steel_mill</code>), and Coal extraction (<code className="text-cyan-300">landuse=quarry</code>).
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[11px] font-bold">2</span>
                <span>Temporal Persistence Index (90-Day Recurrence)</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Calculates the frequency of thermal detections at exact coordinates over the previous 90 to 365 days. Routine flares & industrial stacks show high persistence (&gt;75%), whereas stubble burning and wildfires exhibit transient zero-persistence (&lt;10%).
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-mono text-[11px] font-bold">3</span>
                <span>Sentinel-2 MSI SWIR & Multispectral Index</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Calculates Short-Wave Infrared (SWIR Band 12 / Band 11 ratio, Normalized Burn Ratio - NBR, and NDVI). High combustion temperature (&gt;700°C) hydro-carbon combustion yields elevated SWIR ratios (&gt;2.5), whereas biomass combustion peaks in mid-infrared wavelengths.
              </p>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-bold text-white flex items-center gap-2 text-xs">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-mono text-[11px] font-bold">4</span>
                <span>Gemini 3.7 Flash Geospatial AI Agent</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Evaluates anomalous FRP departures against facility historical baselines. If a refinery flare with a 30 MW baseline suddenly surges to 218 MW, the AI flags an accidental overpressure / explosion, computes Gaussian toxic plume drift, and generates an emergency SITREP.
              </p>
            </div>
          </div>

          {/* Classification Comparison Matrix Table */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-100">
              Comparative Feature Matrix Across Thermal Classes
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2">Class</th>
                    <th className="pb-2">OSM Proximity</th>
                    <th className="pb-2">Persistence</th>
                    <th className="pb-2">SWIR Ratio</th>
                    <th className="pb-2">Typical FRP</th>
                    <th className="pb-2">Hazard Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr className="text-slate-200">
                    <td className="py-2 text-rose-400 font-bold">Industrial Fire / Explosion</td>
                    <td className="py-2 text-emerald-400">&lt; 300m to Facility</td>
                    <td className="py-2 text-amber-400">Baseline + &gt;250% Spike</td>
                    <td className="py-2 text-rose-400">&gt; 3.0 (Extreme)</td>
                    <td className="py-2 text-rose-400">100 - 500+ MW</td>
                    <td className="py-2 font-bold text-red-500">CRITICAL</td>
                  </tr>

                  <tr className="text-slate-200">
                    <td className="py-2 text-amber-400 font-bold">Persistent Gas Flare</td>
                    <td className="py-2 text-emerald-400">&lt; 100m to Flare Stack</td>
                    <td className="py-2 text-cyan-400">&gt; 80% (Chronic)</td>
                    <td className="py-2 text-amber-300">1.8 - 2.8</td>
                    <td className="py-2 text-amber-400">20 - 60 MW</td>
                    <td className="py-2 text-slate-300">LOW - MODERATE</td>
                  </tr>

                  <tr className="text-slate-200">
                    <td className="py-2 text-orange-400 font-bold">Coal Mine Seam Fire</td>
                    <td className="py-2 text-cyan-300">&lt; 500m to Open Pit</td>
                    <td className="py-2 text-cyan-400">&gt; 90% (Multi-year)</td>
                    <td className="py-2 text-orange-300">2.2 - 2.9</td>
                    <td className="py-2 text-orange-400">40 - 120 MW</td>
                    <td className="py-2 font-bold text-orange-400">HIGH (Toxic PM2.5)</td>
                  </tr>

                  <tr className="text-slate-200">
                    <td className="py-2 text-lime-400 font-bold">Agricultural Stubble</td>
                    <td className="py-2 text-slate-500">&gt; 5 km (Cropland)</td>
                    <td className="py-2 text-slate-500">&lt; 5% (Transient)</td>
                    <td className="py-2 text-lime-300">1.1 - 1.4</td>
                    <td className="py-2 text-lime-400">20 - 100 MW</td>
                    <td className="py-2 text-yellow-400">MODERATE</td>
                  </tr>

                  <tr className="text-slate-200">
                    <td className="py-2 text-red-500 font-bold">Forest Wildfire</td>
                    <td className="py-2 text-slate-500">&gt; 10 km (Forest Canopy)</td>
                    <td className="py-2 text-slate-500">&lt; 5% (Spreading)</td>
                    <td className="py-2 text-red-300">1.1 - 1.3</td>
                    <td className="py-2 text-red-400">50 - 400+ MW</td>
                    <td className="py-2 font-bold text-red-400">HIGH</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
