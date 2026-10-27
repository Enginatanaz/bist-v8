import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function searchKoza() {
  const queries = ['KOZAL', 'Koza Altin', 'KOZAA', 'IPEKE', 'ISCTR', 'TCELL'];
  for (const q of queries) {
    try {
      const res: any = await yf.search(q);
      const quotes = res?.quotes?.map((item: any) => ({
        symbol: item.symbol,
        shortname: item.shortname,
        exchange: item.exchange,
        quoteType: item.quoteType
      }));
      console.log(`Search '${q}':`, quotes?.filter((x: any) => x.exchange === 'IST' || x.symbol?.endsWith('.IS')));
    } catch (e: any) {
      console.log(`Search '${q}' FAIL:`, e.message);
    }
  }
}

searchKoza().catch(console.error);
