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
import { parseFirmsCsvRow } from '../utils/geoUtils';

interface DataManagementModalProps {
  anomalies: ThermalAnomaly[];
  onImportAnomalies: (newAnomalies: ThermalAnomaly[], mode: 'replace' | 'append') => void;
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
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Live NASA FIRMS API Query
  const handleFetchFirmsLive = async () => {
    if (!apiKey.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your NASA FIRMS MAP_KEY to fetch live telemetry.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/firms/fetch-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          source,
          countryCode,
          dayRange,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to query NASA FIRMS API.');
      }

      const data = await res.json();
      const rawCsv = data.rawCsv as string;

      // Parse CSV
      const lines = rawCsv.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        throw new Error('NASA FIRMS returned no active thermal fire records for this query window.');
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedAnomalies: ThermalAnomaly[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        const parsed = parseFirmsCsvRow(rowObj, i);
        if (parsed) {
          parsedAnomalies.push(parsed);
        }
      }

      if (parsedAnomalies.length === 0) {
        throw new Error('Unable to parse valid coordinates from NASA FIRMS CSV payload.');
      }

      onImportAnomalies(parsedAnomalies, 'replace');
      setStatusMessage({
        type: 'success',
        text: `Successfully ingested and classified ${parsedAnomalies.length} live NASA FIRMS thermal anomalies for ${countryCode}!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error executing NASA FIRMS API request.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CSV / GeoJSON File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
          const json = JSON.parse(content);
          // Handle GeoJSON FeatureCollection
          if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
            const parsed: ThermalAnomaly[] = json.features.map((f: any, idx: number) => {
              const props = f.properties || {};
              const coords = f.geometry?.coordinates || [0, 0];
              return parseFirmsCsvRow(
                {
                  latitude: String(coords[1]),
                  longitude: String(coords[0]),
                  ...props,
                },
                idx
              );
            }).filter(Boolean);

            onImportAnomalies(parsed, 'append');
            setStatusMessage({
              type: 'success',
              text: `Imported ${parsed.length} anomalies from GeoJSON file.`,
            });
            return;
          }
        }

        // Parse CSV
        const lines = content.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          const parsed: ThermalAnomaly[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim());
            const rowObj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = values[idx] || '';
            });

            const anomaly = parseFirmsCsvRow(rowObj, i);
            if (anomaly) parsed.push(anomaly);
          }

          onImportAnomalies(parsed, 'append');
          setStatusMessage({
            type: 'success',
            text: `Successfully imported and AI-classified ${parsed.length} anomalies from ${file.name}.`,
          });
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `File parsing error: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Export GeoJSON
  const handleExportGeoJSON = () => {
    const featureCollection = {
      type: 'FeatureCollection',
      name: 'NTRO_Classified_Thermal_Anomalies',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: anomalies.map((a) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [a.longitude, a.latitude],
        },
        properties: {
          id: a.id,
          classification: a.classification,
          frp_mw: a.frp,
          brightness_k: a.brightness,
          satellite: a.satellite,
          acq_date: a.acq_date,
          acq_time: a.acq_time,
          facility_name: a.osmProximity.matchedFacilityName,
          facility_type: a.osmProximity.facilityType,
          persistence_index: a.persistenceIndex,
          hazard_level: a.hazardLevel,
          swir_b12_b11: a.multispectral.swirRatio_B12_B11,
          plume_length_km: a.plumeDispersion.estimatedPlumeLengthKm,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NTRO_Thermal_Anomalies_${new Date().toISOString().split('T')[0]}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'id',
      'latitude',
      'longitude',
      'classification',
      'frp',
      'brightness',
      'satellite',
      'acq_date',
      'acq_time',
      'facility_name',
      'facility_type',
      'distance_meters',
      'persistence_index',
      'hazard_level',
    ];

    const rows = anomalies.map((a) => [
      a.id,
      a.latitude,
      a.longitude,
      a.classification,
      a.frp,
      a.brightness,
      a.satellite,
      a.acq_date,
      a.acq_time,
      `"${a.osmProximity.matchedFacilityName}"`,
      a.osmProximity.facilityType,
      a.osmProximity.distanceMeters,
      a.persistenceIndex,
      a.hazardLevel,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NTRO_Thermal_Detections_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-6">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                NASA FIRMS Live API & Geospatial Data Ingestion
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Connect NASA Earthdata MAP_KEY or import custom thermal datasets
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

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-5 text-xs">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Section 1: NASA FIRMS Live API Endpoint */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <Key className="w-4 h-4 text-amber-400" />
                <span>NASA FIRMS API Key (MAP_KEY) Integration</span>
              </div>
              <a
                href="https://firms.modaps.eosdis.nasa.gov/api/map_key/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Get Free NASA MAP_KEY</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] text-slate-400 font-mono mb-1">
                  NASA FIRMS MAP_KEY
                </label>
                <input
                  type="password"
                  placeholder="Enter 32-character NASA FIRMS MAP_KEY..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Sensor Feed</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  >
                    <option value="VIIRS_NOAA20_NRT">VIIRS NOAA-20 (375m NRT)</option>
                    <option value="VIIRS_SNPP_NRT">VIIRS S-NPP (375m NRT)</option>
                    <option value="MODIS_NRT">MODIS Terra/Aqua (1km)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Country / ISO-3</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  >
                    <option value="IND">India (IND)</option>
                    <option value="SAU">Saudi Arabia (SAU)</option>
                    <option value="USA">United States (USA)</option>
                    <option value="SGP">Singapore (SGP)</option>
                    <option value="NLD">Netherlands (NLD)</option>
                    <option value="ARE">UAE (ARE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-mono mb-1">Window Range</label>
                  <select
                    value={dayRange}
                    onChange={(e) => setDayRange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                  >
                    <option value={1}>Past 24 Hours</option>
                    <option value={2}>Past 48 Hours</option>
                    <option value={5}>Past 5 Days</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleFetchFirmsLive}
                disabled={isLoading}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Querying NASA EOSDIS Data Center...</span>
                  </>
                ) : (
                  <>
                    <Satellite className="w-3.5 h-3.5" />
                    <span>Fetch & AI-Classify Live FIRMS Telemetry</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: CSV / GeoJSON Upload */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-indigo-400" />
              <span>Import FIRMS CSV or GeoJSON Archive</span>
            </div>

            <label className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-900/40">
              <FileSpreadsheet className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-slate-300 font-medium text-xs">Click to browse or drop FIRMS CSV / GeoJSON</span>
              <span className="text-[10px] text-slate-500">Supports standard VIIRS / MODIS CSV column headers</span>
              <input
                type="file"
                accept=".csv,.json,.geojson"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Section 3: GIS Data Export */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2.5">
            <div className="font-semibold text-slate-200 flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Classified GIS Outputs</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportGeoJSON}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs transition"
              >
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Export GeoJSON (QGIS/ArcGIS)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium text-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export Classified CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
