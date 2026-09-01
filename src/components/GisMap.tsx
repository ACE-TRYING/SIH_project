import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  ThermalAnomaly, 
  IndustrialFacility, 
  MapLayerControls, 
  FireClassification 
} from '../types';
import { CLASSIFICATION_METADATA } from '../data/mockGeospatialData';
import { generatePlumeCone } from '../utils/geoUtils';
import { Layers, MapPin, Eye, Wind, ShieldAlert } from 'lucide-react';

interface GisMapProps {
  anomalies: ThermalAnomaly[];
  facilities: IndustrialFacility[];
  selectedAnomaly: ThermalAnomaly | null;
  onSelectAnomaly: (anomaly: ThermalAnomaly) => void;
  layerControls: MapLayerControls;
  onUpdateLayerControls: (controls: Partial<MapLayerControls>) => void;
  selectedFacility: IndustrialFacility | null;
}

export const GisMap: React.FC<GisMapProps> = ({
  anomalies,
  facilities,
  selectedAnomaly,
  onSelectAnomaly,
  layerControls,
  onUpdateLayerControls,
  selectedFacility,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const anomalyMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const facilityMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const bufferLayerRef = useRef<L.LayerGroup | null>(null);
  const plumeLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered initially over Gujarat / Jamnagar strategic refining corridor
    const map = L.map(mapContainerRef.current, {
      center: [22.4, 75.0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom attribution & Zoom control in bottom right
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addAttribution('NTRO GIS | NASA FIRMS VIIRS/MODIS | OpenStreetMap')
      .addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Layer groups
    anomalyMarkersLayerRef.current = L.layerGroup().addTo(map);
    facilityMarkersLayerRef.current = L.layerGroup().addTo(map);
    bufferLayerRef.current = L.layerGroup().addTo(map);
    plumeLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Window / container resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    let tileUrl = '';
    let maxZoom = 19;

    switch (layerControls.baseLayer) {
      case 'satellite':
        // ESRI World Imagery (High-Resolution Satellite)
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        maxZoom = 18;
        break;
      case 'dark':
        // CartoDB Dark Matter (Tactical Night GIS)
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        break;
      case 'terrain':
        // OpenTopoMap
        tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
        maxZoom = 17;
        break;
      case 'osm':
      default:
        // OpenStreetMap Standard
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        break;
    }

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom,
      subdomains: 'abcd',
    }).addTo(map);
  }, [layerControls.baseLayer]);

  // Render Facilities & Buffer Zones
  useEffect(() => {
    if (!mapInstanceRef.current || !facilityMarkersLayerRef.current || !bufferLayerRef.current) return;

    facilityMarkersLayerRef.current.clearLayers();
    bufferLayerRef.current.clearLayers();

    if (layerControls.showOsmFacilities) {
      facilities.forEach((fac) => {
        // Facility Marker Icon
        const iconHtml = `
          <div class="relative group cursor-pointer">
            <div class="w-8 h-8 rounded-lg bg-slate-900/90 border-2 border-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/60 transition-transform transform hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                <path d="M10 6h4"/>
                <path d="M10 10h4"/>
                <path d="M10 14h4"/>
                <path d="M10 18h4"/>
              </svg>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-slate-800 text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
              ${fac.name.split(' ')[0]}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'facility-marker-div',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([fac.lat, fac.lng], { icon: customIcon });

        marker.bindPopup(`
          <div class="p-2 text-slate-900 font-sans text-xs">
            <div class="font-bold text-sm text-slate-950 mb-0.5">${fac.name}</div>
            <div class="text-xs text-cyan-700 font-semibold mb-1">${fac.category.replace('_', ' ')} • ${fac.operator}</div>
            <div class="text-slate-600 mb-2">${fac.locationName}</div>
            <div class="bg-slate-100 p-1.5 rounded border border-slate-200 text-[11px] mb-1">
              <div><strong>Capacity:</strong> ${fac.capacity || 'N/A'}</div>
              <div><strong>Flare Stacks:</strong> ${fac.flareStacksCount ?? 'N/A'}</div>
              <div><strong>Critical Threat Tier:</strong> ${fac.riskTier}</div>
            </div>
          </div>
        `);

        facilityMarkersLayerRef.current?.addLayer(marker);

        // Render Security & Blast Buffer Zone circles
        if (layerControls.showBufferZones) {
          const circle = L.circle([fac.lat, fac.lng], {
            radius: fac.bufferZoneRadiusMeters,
            color: '#06b6d4',
            fillColor: '#06b6d4',
            fillOpacity: 0.08,
            weight: 1.5,
            dashArray: '4, 6',
          });
          bufferLayerRef.current?.addLayer(circle);
        }
      });
    }
  }, [facilities, layerControls.showOsmFacilities, layerControls.showBufferZones]);

  // Render Thermal Anomaly Markers and Plume Cones
  useEffect(() => {
    if (!mapInstanceRef.current || !anomalyMarkersLayerRef.current || !plumeLayerRef.current) return;

    anomalyMarkersLayerRef.current.clearLayers();
    plumeLayerRef.current.clearLayers();

    anomalies.forEach((anomaly) => {
      const meta = CLASSIFICATION_METADATA[anomaly.classification] || CLASSIFICATION_METADATA.URBAN_OTHER;
      const isSelected = selectedAnomaly?.id === anomaly.id;
      const isCritical = anomaly.hazardLevel === 'CRITICAL';
      const isSpike = anomaly.anomalyStatus === 'ACCIDENTAL_SPIKE_FIRE';

      // Pulse animation styling based on classification
      const markerSize = isSelected ? 36 : isCritical ? 30 : Math.min(28, Math.max(18, anomaly.frp * 0.15));

      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: ${markerSize}px; height: ${markerSize}px;">
          ${
            isCritical || isSpike
              ? `<div class="absolute inset-0 rounded-full animate-ping opacity-75" style="background-color: ${meta.markerColor};"></div>`
              : ''
          }
          <div class="relative rounded-full flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-125 ${
            isSelected ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-950 scale-125 z-30' : ''
          }" style="background: radial-gradient(circle, ${meta.markerColor} 0%, rgba(15,23,42,0.9) 100%); width: ${markerSize}px; height: ${markerSize}px; border: 2px solid ${meta.markerColor};">
            <span class="text-[10px] font-mono font-bold text-white">${Math.round(anomaly.frp)}</span>
          </div>
          <div class="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-950/95 border border-slate-700 text-slate-100 text-[10px] px-1.5 py-0.5 rounded shadow-xl font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-40">
            ${anomaly.classification.replace('_', ' ')} (${anomaly.frp} MW)
          </div>
        </div>
      `;

      const divIcon = L.divIcon({
        html: markerHtml,
        className: 'thermal-anomaly-icon',
        iconSize: [markerSize, markerSize],
        iconAnchor: [markerSize / 2, markerSize / 2],
      });

      const marker = L.marker([anomaly.latitude, anomaly.longitude], { icon: divIcon });

      // Click handler
      marker.on('click', () => {
        onSelectAnomaly(anomaly);
      });

      // Interactive Popup
      marker.bindPopup(`
        <div class="p-2.5 font-sans text-xs max-w-xs text-slate-900">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase" style="background: ${meta.markerColor}20; color: ${meta.markerColor}; border: 1px solid ${meta.markerColor}40;">
              ${meta.label}
            </span>
            <span class="font-mono text-[11px] text-slate-500">${anomaly.satellite}</span>
          </div>

          <div class="font-bold text-sm text-slate-950 mb-1 leading-tight">
            ${anomaly.osmProximity?.matchedFacilityName || 'Unenriched Detection'}
          </div>

          <div class="grid grid-cols-2 gap-1.5 my-2 bg-slate-100 p-2 rounded border border-slate-200 font-mono text-[11px]">
            <div><strong>FRP:</strong> <span class="text-rose-600 font-bold">${anomaly.frp} MW</span></div>
            <div><strong>Brightness:</strong> ${anomaly.brightness} K</div>
            <div><strong>Persistence:</strong> ${anomaly.persistenceIndex && anomaly.persistenceIndex > 0 ? `${(anomaly.persistenceIndex * 100).toFixed(0)}%` : 'Unavailable'}</div>
            <div><strong>Hazard:</strong> <span class="font-bold ${isCritical ? 'text-red-600' : 'text-slate-800'}">${anomaly.hazardLevel}</span></div>
          </div>

          <div class="text-[11px] text-slate-600 mb-2">
            <div><strong>Land Cover:</strong> ${anomaly.landCover?.type || 'UNKNOWN'}</div>
            <div><strong>Acquired:</strong> ${anomaly.acq_date} ${anomaly.acq_time} UTC (${anomaly.daynight === 'D' ? 'Day' : 'Night'})</div>
          </div>

          <button id="popup-btn-inspect-${anomaly.id}" class="w-full text-center py-1.5 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium text-xs shadow transition flex items-center justify-center gap-1.5">
            <span>Inspect Anomaly & AI Diagnostics</span>
          </button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-inspect-${anomaly.id}`);
        if (btn) {
          btn.onclick = () => {
            onSelectAnomaly(anomaly);
          };
        }
      });

      anomalyMarkersLayerRef.current?.addLayer(marker);

      // Render Gaussian smoke plume dispersion polygon if enabled
      if (layerControls.showPlumes && (anomaly.plumeDispersion?.estimatedPlumeLengthKm || 0) > 0.5) {
        const plumeCoords = generatePlumeCone(
          anomaly.latitude,
          anomaly.longitude,
          anomaly.plumeDispersion.estimatedPlumeLengthKm,
          anomaly.plumeDispersion.windDirectionDeg
        );

        const plumePoly = L.polygon(plumeCoords, {
          color: meta.markerColor,
          fillColor: meta.markerColor,
          fillOpacity: 0.18,
          weight: 1.2,
          dashArray: '3, 4',
        });

        plumePoly.bindTooltip(
          `Toxic Drift: ${anomaly.plumeDispersion.toxicGasRisk} (${anomaly.plumeDispersion.windSpeedKmH} km/h @ ${anomaly.plumeDispersion.windDirectionDeg}°)`,
          { sticky: true, className: 'bg-slate-950 text-slate-100 text-[10px] font-mono border-slate-800' }
        );

        plumeLayerRef.current?.addLayer(plumePoly);
      }
    });
  }, [anomalies, selectedAnomaly, layerControls.showPlumes]);

  // Auto-fit bounds when anomaly dataset updates
  useEffect(() => {
    if (!mapInstanceRef.current || anomalies.length === 0) return;
    const validCoords = anomalies
      .filter((a) => !isNaN(a.latitude) && !isNaN(a.longitude))
      .map((a) => [a.latitude, a.longitude] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      }
    }
  }, [anomalies]);

  // Pan to selected anomaly or facility
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedAnomaly) {
      mapInstanceRef.current.flyTo([selectedAnomaly.latitude, selectedAnomaly.longitude], 13, {
        duration: 1.2,
      });
    } else if (selectedFacility) {
      mapInstanceRef.current.flyTo([selectedFacility.lat, selectedFacility.lng], 12, {
        duration: 1.2,
      });
    }
  }, [selectedAnomaly, selectedFacility]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-slate-950 overflow-hidden">
      {/* Map DOM Container */}
      <div id="leaflet-map-root" ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Basemap & GIS Layer Toggles */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 bg-slate-900/90 border border-slate-800/90 backdrop-blur p-2.5 rounded-xl shadow-2xl text-slate-200 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-400 pb-1.5 border-b border-slate-800">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>GIS Layers & Basemap</span>
        </div>

        {/* Basemap Selection */}
        <div className="grid grid-cols-2 gap-1 my-1">
          {(
            [
              { id: 'satellite', label: 'Satellite HD' },
              { id: 'dark', label: 'Tactical Dark' },
              { id: 'osm', label: 'Street OSM' },
              { id: 'terrain', label: 'Topography' },
            ] as const
          ).map((b) => (
            <button
              key={b.id}
              id={`btn-basemap-${b.id}`}
              onClick={() => onUpdateLayerControls({ baseLayer: b.id })}
              className={`px-2 py-1 rounded text-[11px] font-medium transition ${
                layerControls.baseLayer === b.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Layer Switches */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <label className="flex items-center justify-between gap-2 cursor-pointer hover:text-white">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Industrial Facilities</span>
            </span>
            <input
              type="checkbox"
              checked={layerControls.showOsmFacilities}
              onChange={(e) => onUpdateLayerControls({ showOsmFacilities: e.target.checked })}
              className="accent-cyan-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between gap-2 cursor-pointer hover:text-white">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              <span>Facility Buffer Zones</span>
            </span>
            <input
              type="checkbox"
              checked={layerControls.showBufferZones}
              onChange={(e) => onUpdateLayerControls({ showBufferZones: e.target.checked })}
              className="accent-cyan-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between gap-2 cursor-pointer hover:text-white">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-rose-400" />
              <span>Toxic Smoke Plumes</span>
            </span>
            <input
              type="checkbox"
              checked={layerControls.showPlumes}
              onChange={(e) => onUpdateLayerControls({ showPlumes: e.target.checked })}
              className="accent-rose-500 rounded"
            />
          </label>
        </div>
      </div>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 border border-slate-800/90 backdrop-blur p-2.5 rounded-xl shadow-2xl text-slate-200 text-xs hidden sm:block max-w-[280px]">
        <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
          <span>Classification Legend</span>
          <span className="text-[10px] text-amber-400">NTRO AI Fused</span>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Industrial Fire</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Gas Flare</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span>Coal Mine Fire</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <span>Power Plant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
            <span>Agri Stubble</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span>Forest Wildfire</span>
          </div>
        </div>
      </div>
    </div>
  );
};
