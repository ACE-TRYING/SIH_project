import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  Download, 
  Satellite, 
  Key, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { ThermalAnomaly } from '../types';
import { parseFirmsCsvRow, splitCsvLine } from '../utils/geoUtils';

interface DataManagementModalProps {
  anomalies: ThermalAnomaly[];
  onImportAnomalies: (newAnomalies: ThermalAnomaly[], mode: 'replace' | 'append', sourceLabel?: string, isLive?: boolean) => void;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  anomalies,
  onImportAnomalies,
  onClose,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [source, setSource] = useState<'VIIRS_NOAA20_NRT' | 'VIIRS_SNPP_NRT' | 'MODIS_NRT'>('VIIRS_NOAA20_NRT');
  const [countryCode, setCountryCode] = useState<string>('IND');
  const [dayRange, setDayRange] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Live NASA FIRMS API Query & OSM Enrichment
  const enrichWithOsm = async (anomalies: ThermalAnomaly[]): Promise<ThermalAnomaly[]> => {
    if (!anomalies || anomalies.length === 0) return [];
    try {
      const res = await fetch('/api/osm/enrich-anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anomalies, maxEnrich: 15 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.anomalies)) {
          return data.anomalies;
        }
      }
    } catch (e) {
      console.warn('[OSM Enrichment] Client fetch error:', e);
    }
    return anomalies;
  };

  const enrichWithWeather = async (anomalies: ThermalAnomaly[]): Promise<ThermalAnomaly[]> => {
    if (!anomalies || anomalies.length === 0) return anomalies;

    const ranked = [...anomalies]
      .map((a, idx) => ({ idx, frp: Number(a.frp || 0) }))
      .sort((a, b) => b.frp - a.frp)
      .slice(0, 15)
      .map((item) => item.idx);

    const result = [...anomalies];

    for (const idx of ranked) {
      const a = result[idx];
      try {
        const res = await fetch('/api/weather/current', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude: a.latitude, longitude: a.longitude }),
        });
        const data = await res.json();
        if (data.success && data.status === 'REAL') {
          result[idx] = {
            ...a,
            weather: {
              source: 'OPEN_METEO',
              windSpeedKmh: data.windSpeedKmh,
              windDirectionDeg: data.windDirectionDeg,
              observedAt: data.observedAt,
              status: 'REAL',
            },
          };
        } else {
          result[idx] = {
            ...a,
            weather: { source: 'OPEN_METEO', status: 'UNAVAILABLE' },
          };
        }
      } catch {
        result[idx] = {
          ...a,
          weather: { source: 'OPEN_METEO', status: 'UNAVAILABLE' },
        };
      }
    }

    return result;
  };

  const handleFetchLiveFirms = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Connecting to NASA FIRMS API & querying satellite area feed...' });

    try {
      const response = await fetch('/api/firms/fetch-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          source,
          countryCode,
          dayRange,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatusMessage({
          type: 'error',
          text: data.error || `NASA FIRMS returned error ${response.status}`,
        });
        setIsLoading(false);
        return;
      }

      const csvLines = (data.rawCsv || '').split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (csvLines.length <= 1) {
        setStatusMessage({
          type: 'info',
          text: `Query succeeded, but 0 thermal anomalies were detected over ${countryCode} for the selected ${dayRange}-day window.`,
        });
        setIsLoading(false);
        return;
      }

      const headers = splitCsvLine(csvLines[0]).map((h) => h.trim().toLowerCase());
      const parsed: ThermalAnomaly[] = [];
      for (let i = 1; i < csvLines.length; i++) {
        const values = splitCsvLine(csvLines[i]);
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        const item = parseFirmsCsvRow(rowObj, i);
        if (item) parsed.push(item);
      }

      if (parsed.length === 0) {
        setStatusMessage({
          type: 'error',
          text: 'Failed to parse thermal anomaly coordinates from NASA CSV output.',
        });
        setIsLoading(false);
        return;
      }

      setStatusMessage({
        type: 'info',
        text: `Parsed ${parsed.length} live FIRMS detections. Enriching with OpenStreetMap infrastructure and Open-Meteo weather...`,
      });

      const osmEnriched = await enrichWithOsm(parsed);
      const fullyEnriched = await enrichWithWeather(osmEnriched);

      onImportAnomalies(fullyEnriched, 'replace', `NASA FIRMS LIVE (${countryCode})`, true);

      setStatusMessage({
        type: 'success',
        text: `Successfully ingested ${fullyEnriched.length} LIVE satellite detections from NASA FIRMS! OSM infrastructure and weather telemetry linked.`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Network failure while connecting to NASA FIRMS server proxy.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

        if (lines.length <= 1) {
          setStatusMessage({ type: 'error', text: 'Uploaded CSV file contains no data rows.' });
          setIsLoading(false);
          return;
        }

        const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
        const parsed: ThermalAnomaly[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = splitCsvLine(lines[i]);
          const rowObj: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = values[idx] || '';
          });
          const item = parseFirmsCsvRow(rowObj, i);
          if (item) parsed.push(item);
        }

        if (parsed.length === 0) {
          setStatusMessage({ type: 'error', text: 'Could not extract valid FIRMS records from CSV.' });
          setIsLoading(false);
          return;
        }

        setStatusMessage({ type: 'info', text: `Parsed ${parsed.length} records. Enriching with OpenStreetMap...` });
        const enriched = await enrichWithOsm(parsed);

        onImportAnomalies(enriched, 'replace', `Custom CSV (${file.name})`, false);

        setStatusMessage({
          type: 'success',
          text: `Successfully imported ${enriched.length} thermal anomalies from file "${file.name}".`,
        });
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Failed to process CSV file.' });
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleExportCsv = () => {
    if (anomalies.length === 0) return;

    const headers = ['id', 'latitude', 'longitude', 'frp', 'brightness', 'classification', 'hazardLevel', 'facility', 'confidence', 'acq_date', 'acq_time'];
    const rows = anomalies.map((a) => [
      a.id,
      a.latitude,
      a.longitude,
      a.frp,
      a.brightness,
      a.classification,
      a.hazardLevel,
      `"${a.osmProximity?.matchedFacilityName || 'Unenriched'}"`,
      a.confidence,
      a.acq_date,
      a.acq_time,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `NTRO_ThermalPulse_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-3xl h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                NASA FIRMS Live API & Data Management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Ingest live satellite telemetry, upload CSV files, or export dataset
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 font-mono ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-700 dark:text-cyan-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: NASA FIRMS Live API Ingestion */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Option 1: NASA FIRMS Live API Key Query</span>
              </div>
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono"
              >
                <span>Get Free NASA MAP_KEY</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">
                  NASA FIRMS MAP_KEY:
                </label>
                <input
                  type="password"
                  placeholder="Enter 32-character MAP_KEY..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">Sensor Source:</label>
                  <select
                    value={source}
                    onChange={(e: any) => setSource(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="VIIRS_NOAA20_NRT">VIIRS (NOAA-20) 375m</option>
                    <option value="VIIRS_SNPP_NRT">VIIRS (S-NPP) 375m</option>
                    <option value="MODIS_NRT">MODIS Array 1km</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">Country / Sector:</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="IND">India (IND)</option>
                    <option value="USA">United States (USA)</option>
                    <option value="SAU">Saudi Arabia (SAU)</option>
                    <option value="ARE">UAE (ARE)</option>
                    <option value="KWT">Kuwait (KWT)</option>
                    <option value="AUS">Australia (AUS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1">Day Range Window:</label>
                  <select
                    value={dayRange}
                    onChange={(e) => setDayRange(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value={1}>Past 24 Hours (1 Day)</option>
                    <option value={2}>Past 48 Hours (2 Days)</option>
                    <option value={5}>Past 5 Days</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleFetchLiveFirms}
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{isLoading ? 'Fetching LIVE NASA Telemetry...' : 'Fetch & Ingest LIVE NASA FIRMS Feed'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Upload CSV */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-500" />
              <span>Option 2: Import Custom FIRMS CSV File</span>
            </div>

            <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6 text-center hover:border-cyan-500 transition bg-white dark:bg-slate-900">
              <input
                type="file"
                accept=".csv"
                id="csv-upload-input"
                onChange={handleCsvFileUpload}
                className="hidden"
              />
              <label htmlFor="csv-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Click to choose or drag FIRMS CSV file</span>
                <span className="text-[10px] text-slate-400 font-mono">Supports standard NASA FIRMS CSV format</span>
              </label>
            </div>
          </div>

          {/* Section 3: Export Current Dataset */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <div className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-500" />
                <span>Export Monitored Dataset</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Export {anomalies.length} active thermal anomalies with OSM classifications
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={anomalies.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
