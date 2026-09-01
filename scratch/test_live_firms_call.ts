// Test POST /api/firms/fetch-live against local running server
// Use key provided in user request or env without printing it

const key = process.argv[2] || process.env.FIRMS_MAP_KEY || '';

async function testFetchLive() {
  if (!key) {
    console.error('No key passed to test runner');
    process.exit(1);
  }

  console.log('Sending POST /api/firms/fetch-live with countryCode: IND, source: VIIRS_NOAA20_NRT, dayRange: 1');
  const res = await fetch('http://localhost:3000/api/firms/fetch-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey: key,
      source: 'VIIRS_NOAA20_NRT',
      countryCode: 'IND',
      dayRange: 1,
    }),
  });

  const status = res.status;
  const data: any = await res.json();

  console.log('HTTP Status:', status);
  console.log('Success:', data.success);
  console.log('Source:', data.source);
  console.log('Simulated:', data.simulated);
  console.log('Count:', data.count);
  console.log('UrlQueried:', data.urlQueried);
  console.log('FetchedAt:', data.fetchedAt);
  
  if (data.rawCsv) {
    const lines = data.rawCsv.trim().split('\n');
    console.log('Raw CSV Header:', lines[0]);
    console.log('Raw CSV Total Lines:', lines.length);
    console.log('Sample Row 1:', lines[1]);
  }
}

testFetchLive().catch(console.error);
