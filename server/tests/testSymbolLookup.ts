import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function checkSymbols() {
  const symbols = ['KOZAL.IS', 'KOZAA.IS', 'IPEKE.IS', 'ISCTR.IS', 'SISE.IS', 'KCHOL.IS', 'SAHOL.IS'];
  for (const s of symbols) {
    try {
      const q: any = await yf.quote(s);
      console.log(`quote ${s}: price = ${q?.regularMarketPrice}, currency = ${q?.currency}`);
    } catch (e: any) {
      console.log(`quote ${s} FAIL: ${e.message}`);
    }

    try {
      const chart: any = await yf.chart(s, { period1: new Date(Date.now() - 30 * 86400000), interval: '1d' });
      console.log(`chart ${s}: quotes count = ${chart?.quotes?.length}`);
    } catch (e: any) {
      console.log(`chart ${s} FAIL: ${e.message}`);
    }
  }
}

checkSymbols().catch(console.error);
