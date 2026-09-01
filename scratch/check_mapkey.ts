import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

async function checkKey(keyToTest?: string) {
  const key = (keyToTest || process.env.FIRMS_MAP_KEY || process.env.NASA_MAP_KEY || process.argv[2] || '').trim();

  if (!key) {
    console.log(JSON.stringify({
      hasKey: false,
      message: 'No MAP_KEY found in environment (FIRMS_MAP_KEY / NASA_MAP_KEY) or command argument.'
    }));
    return;
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/mapserver/mapkey_status/?MAP_KEY=${key}`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    let json: any = null;
    let isValidJson = false;

    try {
      json = JSON.parse(text);
      isValidJson = true;
    } catch {
      isValidJson = false;
    }

    if (isValidJson && json) {
      console.log(JSON.stringify({
        hasKey: true,
        httpStatus: res.status,
        isValidJson: true,
        transaction_limit: json.transaction_limit ?? json.limit ?? 'N/A',
        current_transactions: json.current_transactions ?? json.count ?? json.transactions ?? 'N/A',
        transaction_interval: json.transaction_interval ?? json.interval ?? 'N/A',
        rawPayloadKeys: Object.keys(json),
        rawPayload: json,
      }, null, 2));
    } else {
      console.log(JSON.stringify({
        hasKey: true,
        httpStatus: res.status,
        isValidJson: false,
        responseSnippet: text.slice(0, 200).replace(key, '***KEY***'),
      }, null, 2));
    }
  } catch (err: any) {
    console.log(JSON.stringify({
      hasKey: true,
      error: err.message,
    }));
  }
}

checkKey();
