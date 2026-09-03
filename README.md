# ThermalPulse

ThermalPulse is a geospatial disaster-intelligence dashboard for identifying, explaining, and prioritising satellite thermal anomalies near industrial and strategic infrastructure.

## What It Demonstrates

- NASA FIRMS VIIRS/MODIS ingestion with CSV import and live-feed mode
- OpenStreetMap facility enrichment and distance-based evidence
- Open-Meteo wind observations with explicit unavailable-data handling
- Explainable rule-based fire segregation for industrial fires, flares, mines, wildfires, and crop burning
- Deterministic operational priority scoring with evidence factors and response windows
- Local incident workflow: acknowledge, assign, resolve, and record field notes
- Gemini decision support for anomaly analysis and tactical SITREP generation
- Leaflet GIS layers for detections, facilities, buffers, and plume estimates

## Run Locally

Prerequisite: Node.js 20+

```bash
npm install
npm run dev
```

The application is served at `http://localhost:3000`.

Create `.env.local` with server-side credentials as needed:

```env
GEMINI_API_KEY=your_gemini_key
FIRMS_MAP_KEY=your_nasa_firms_key
```

The interface remains usable in demo mode without external keys. It labels fallback and unavailable data instead of presenting it as live telemetry.

## Validation

```bash
npm run lint
npm run build
```

The end-to-end pipeline checks in `scratch/run_phase9_tests.ts` require the development server and configured service credentials for live API assertions.
