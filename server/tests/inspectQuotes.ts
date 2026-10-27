import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function inspectQuote() {
  const q: any = await yf.quote('KERVT.IS');
  console.log('KERVT quote keys and sample data:', Object.keys(q || {}), q);
  
  const v1: any = await yf.quote('VKGYO.IS');
  console.log('VKGYO.IS:', v1?.regularMarketPrice);

  const y1: any = await yf.quote('YYGYO.IS');
  console.log('YYGYO.IS:', y1?.regularMarketPrice);

  const qnb1: any = await yf.quote('QNBTR.IS');
  console.log('QNBTR.IS:', qnb1?.regularMarketPrice);
}

inspectQuote().catch(console.error);
