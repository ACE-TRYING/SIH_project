import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  ShieldAlert, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { ThermalAnomaly, IndustrialFacility, GISFilterState } from '../types';

interface TacticalBriefModalProps {
  anomalies: ThermalAnomaly[];
  activeFacility: IndustrialFacility | null;
  filters: GISFilterState;
  onClose: () => void;
}

export const TacticalBriefModal: React.FC<TacticalBriefModalProps> = ({
  anomalies,
  activeFacility,
  filters,
  onClose,
}) => {
  const [briefText, setBriefText] = useState<string>('');
  const [briefSource, setBriefSource] = useState<'gemini' | 'fallback' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const generateBrief = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gemini/tactical-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomalies,
          activeFacility,
          filterSummary: {
            classifications: filters.classifications,
            minFrp: filters.minFrp,
            minPersistence: filters.minPersistence,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate tactical briefing.');
      }

      const data = await response.json();
      setBriefText(data.brief);
      setBriefSource(data.source === 'gemini' && !data.simulated ? 'gemini' : 'fallback');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with Gemini intelligence engine.');
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    if (!briefText && !isLoading) {
      generateBrief();
    }
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const blob = new Blob([briefText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NTRO_SITREP_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[92vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold">
                  RESTRICTED // NTRO DISASTER MANAGEMENT
                </span>
                {briefSource && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                    briefSource === 'gemini'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                  }`}>
                    {briefSource === 'gemini' ? 'Gemini AI SITREP' : 'Fallback SITREP'}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                NTRO Tactical Geospatial Situation Report (SITREP)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateBrief}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition shadow-sm"
              title="Regenerate SITREP"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 text-slate-800 dark:text-slate-200 font-sans text-xs space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="font-bold text-sm text-slate-900 dark:text-slate-200">
                Gemini 3.6 Flash Synthesizing Satellite & Weather Telemetry...
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Correlating VIIRS 375m FRP, OpenStreetMap infrastructure, and Open-Meteo wind vectors.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300">
              <div className="font-bold mb-1">Failed to generate briefing</div>
              <div>{error}</div>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none prose-sm leading-relaxed font-sans bg-slate-50 dark:bg-slate-950/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-inner whitespace-pre-wrap text-slate-800 dark:text-slate-200">
              {briefText}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            Authoritative Dispatch • National Technical Research Organisation
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition shadow-sm"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
