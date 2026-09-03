interface WeatherCacheEntry {
  timestamp: number;
  data: {
    windSpeedKmh: number;
    windDirectionDeg: number;
    observedAt: string;
  } | null;
}

const weatherCache = new Map<string, WeatherCacheEntry>();
const WEATHER_CACHE_TTL_MS = 15 * 60 * 1000; // 15-minute TTL

export async function fetchOpenMeteoWind(
  lat: number,
  lon: number
): Promise<{ windSpeedKmh: number; windDirectionDeg: number; observedAt: string } | null> {
  const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}`;
  const now = Date.now();
  const cached = weatherCache.get(cacheKey);

  if (cached && now - cached.timestamp < WEATHER_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=UTC&forecast_days=1`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: { 'User-Agent': 'NTROThermalPulse/1.0 (Geospatial Thermal Analysis)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[WEATHER] Open-Meteo HTTP ${response.status} for (${lat},${lon})`);
      weatherCache.set(cacheKey, { timestamp: now, data: null });
      return null;
    }

    const json: any = await response.json();
    const current = json?.current;
    if (
      current == null ||
      current.wind_speed_10m == null ||
      current.wind_direction_10m == null
    ) {
      console.warn(`[WEATHER] Open-Meteo returned no current data for (${lat},${lon})`);
      weatherCache.set(cacheKey, { timestamp: now, data: null });
      return null;
    }

    const result = {
      windSpeedKmh: Number(current.wind_speed_10m),
      windDirectionDeg: Number(current.wind_direction_10m),
      observedAt: current.time ?? new Date().toISOString(),
    };

    weatherCache.set(cacheKey, { timestamp: now, data: result });
    return result;
  } catch (err: any) {
    console.warn(`[WEATHER] Open-Meteo fetch error for (${lat},${lon}):`, err?.message || err);
    weatherCache.set(cacheKey, { timestamp: now, data: null });
    return null;
  }
}
