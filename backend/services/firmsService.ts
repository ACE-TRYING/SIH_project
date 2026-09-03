export const COUNTRY_BOUNDING_BOXES: Record<string, string> = {
  IND: '68,6,98,36',       // India
  USA: '-125,24,-66,50',   // United States (contiguous)
  SAU: '34,16,56,33',      // Saudi Arabia
  CAN: '-141,41,-52,83',   // Canada
  AUS: '112,-44,154,-10',  // Australia
  BRA: '-74,-34,-34,5',    // Brazil
  RUS: '19,41,180,82',     // Russia
  CHN: '73,18,135,54',     // China
  IDN: '95,-11,141,6',     // Indonesia
  ARE: '51,22,57,26',      // United Arab Emirates
  KWT: '46,28,49,31',      // Kuwait
  QAT: '50,24,52,27',      // Qatar
  IRQ: '38,29,49,38',      // Iraq
  IRN: '44,25,64,40',      // Iran
  GBR: '-8,49,2,61',       // United Kingdom
  DEU: '5,47,15,55',       // Germany
};

const SUPPORTED_FIRMS_SOURCES = new Set([
  'VIIRS_NOAA20_NRT',
  'VIIRS_NOAA21_NRT',
  'VIIRS_SNPP_NRT',
  'MODIS_NRT',
  'LANDSAT_NRT',
]);

export function normalizeFirmsSource(source: string): string {
  const s = (source || '').trim();
  if (SUPPORTED_FIRMS_SOURCES.has(s)) return s;
  const upper = s.toUpperCase();
  if (upper === 'VIIRS_NOAA20' || upper === 'NOAA20') return 'VIIRS_NOAA20_NRT';
  if (upper === 'VIIRS_NOAA21' || upper === 'NOAA21') return 'VIIRS_NOAA21_NRT';
  if (upper === 'VIIRS_SNPP' || upper === 'SNPP') return 'VIIRS_SNPP_NRT';
  if (upper === 'MODIS' || upper === 'MODIS_TERRA' || upper === 'MODIS_AQUA') return 'MODIS_NRT';
  return 'VIIRS_NOAA20_NRT';
}

export async function validateFirmsKey(apiKey?: string) {
  const resolvedKey = (apiKey || process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY || '').trim();

  if (!resolvedKey) {
    return {
      status: 400,
      data: {
        success: false,
        error: 'No NASA FIRMS MAP_KEY provided to validate.',
      },
    };
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${resolvedKey}`;
  const firmsRes = await fetch(url);
  const text = await firmsRes.text();

  let json: any = null;
  let isValidJson = false;

  try {
    json = JSON.parse(text);
    isValidJson = true;
  } catch {
    isValidJson = false;
  }

  if (isValidJson && json && (json.transaction_limit || json.limit !== undefined)) {
    return {
      status: 200,
      data: {
        success: true,
        httpStatus: firmsRes.status,
        isValidJson: true,
        transaction_limit: json.transaction_limit ?? json.limit ?? 'N/A',
        current_transactions: json.current_transactions ?? json.count ?? json.transactions ?? 'N/A',
        transaction_interval: json.transaction_interval ?? json.interval ?? 'N/A',
        isValidKey: true,
      },
    };
  }

  const isInvalid = !firmsRes.ok || !isValidJson || text.toLowerCase().includes('invalid') || text.toLowerCase().includes('exceeded');
  return {
    status: firmsRes.ok && !isInvalid ? 200 : 400,
    data: {
      success: !isInvalid,
      httpStatus: firmsRes.status,
      isValidJson,
      isValidKey: !isInvalid,
      transaction_limit: 'N/A',
      current_transactions: 'N/A',
      transaction_interval: 'N/A',
      message: isInvalid ? 'The provided NASA FIRMS MAP_KEY is invalid or transaction limit exceeded.' : 'Status retrieved',
    },
  };
}

export async function fetchLiveFirmsData(params: {
  apiKey?: string;
  source?: string;
  countryCode?: string;
  dayRange?: number;
}) {
  const { apiKey, source = 'VIIRS_NOAA20_NRT', countryCode = 'IND', dayRange = 1 } = params;
  const resolvedKey = (apiKey || process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY || '').trim();

  if (!resolvedKey) {
    return {
      status: 400,
      data: {
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: 'NASA FIRMS API Key (MAP_KEY) is required. Please enter your MAP_KEY in Data Management.',
      },
    };
  }

  const cleanCountry = (countryCode || 'IND').trim().toUpperCase();
  const bbox = COUNTRY_BOUNDING_BOXES[cleanCountry] || COUNTRY_BOUNDING_BOXES['IND'];
  const cleanSource = normalizeFirmsSource(source || 'VIIRS_NOAA20_NRT');
  const cleanDayRange = Math.min(10, Math.max(1, parseInt(String(dayRange), 10) || 1));

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${resolvedKey}/${cleanSource}/${bbox}/${cleanDayRange}`;
  const firmsResponse = await fetch(url);

  if (!firmsResponse.ok) {
    return {
      status: firmsResponse.status,
      data: {
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: `NASA FIRMS API returned HTTP ${firmsResponse.status}: ${firmsResponse.statusText}`,
      },
    };
  }

  const csvText = await firmsResponse.text();
  const lower = csvText.toLowerCase();
  if (
    lower.includes('invalid map_key') ||
    lower.includes('invalid map key') ||
    lower.includes('invalid key') ||
    lower.includes('unauthorized') ||
    lower.includes('invalid source') ||
    lower.includes('invalid country') ||
    lower.includes('invalid area') ||
    lower.includes('transaction limit') ||
    lower.includes('rate limit') ||
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html')
  ) {
    const sanitizedError = csvText.trim().split(resolvedKey).join('***KEY***');
    return {
      status: 400,
      data: {
        success: false,
        source: 'NASA_FIRMS',
        simulated: false,
        error: `NASA FIRMS rejected the request: ${sanitizedError}`,
      },
    };
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const parsedCount = Math.max(0, lines.length - 1);

  return {
    status: 200,
    data: {
      success: true,
      source: 'NASA_FIRMS_LIVE',
      simulated: false,
      count: parsedCount,
      rawCsv: csvText,
      urlQueried: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/***KEY***/${cleanSource}/${bbox}/${cleanDayRange}`,
      fetchedAt: new Date().toISOString(),
    },
  };
}
