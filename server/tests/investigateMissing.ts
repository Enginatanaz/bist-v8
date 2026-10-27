import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const missing = [
  'KOZAL', 'KOZAA', 'IPEKE', 'KERVT', 'ALMAD', 'DAGHL', 'DOBUR', 'GRTRK',
  'KARYE', 'LMAC', 'MIPAZ', 'ORCAE', 'PEGYO', 'QNBFB', 'QNBFL', 'VAKGY',
  'YGYO', 'EFORC', 'MARKA', 'METUR', 'ROYAL', 'SELGD', 'SNKRN'
];

async function checkMissing() {
  for (const sym of missing) {
    try {
      const q: any = await yf.quote(`${sym}.IS`);
      console.log(`[FOUND ${sym}]: price=${q?.regularMarketPrice}`);
    } catch (e: any) {
      console.log(`[NOT FOUND ${sym}]: ${e.message}`);
      // try search
      try {
        const s: any = await yf.search(sym);
        const match = s?.quotes?.filter((x: any) => x.symbol?.endsWith('.IS') || x.exchange === 'IST');
        if (match && match.length > 0) {
          console.log(`   -> Search suggests for ${sym}:`, match.map((m: any) => m.symbol));
        }
      } catch {}
    }
  }
}

checkMissing().catch(console.error);
