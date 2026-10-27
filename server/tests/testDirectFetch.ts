async function testFetch() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/KOZAL.IS?interval=1d&range=1mo';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('Status:', res.status);
    const json = await res.json();
    console.log('Response:', JSON.stringify(json).slice(0, 300));
  } catch (e: any) {
    console.log('Fetch error:', e.message);
  }
}

testFetch().catch(console.error);
