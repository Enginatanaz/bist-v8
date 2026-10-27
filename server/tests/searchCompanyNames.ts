import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function searchAll() {
  const terms = ['Kerevitas', 'Altinyag', 'Grainturk', 'Milpa', 'Metemtur', 'Selcuk Gida', 'Senkron'];
  for (const t of terms) {
    try {
      const res: any = await yf.search(t);
      console.log(`Search '${t}':`, res?.quotes?.map((q: any) => ({ symbol: q.symbol, shortname: q.shortname, exchange: q.exchange })));
    } catch (e: any) {
      console.log(`Search '${t}' FAIL:`, e.message);
    }
  }
}

searchAll().catch(console.error);
