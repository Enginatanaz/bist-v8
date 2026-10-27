import YahooFinance from 'yahoo-finance2';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

async function audit() {
  const universe = InstrumentUniverseService.getInstance();
  const all = universe.getAllInstruments();
  console.log(`Auditing all ${all.length} instruments in universe...`);

  // First, let's test batch quote fetching!
  // Yahoo Finance quote() supports batching: yf.quote(['THYAO.IS', 'GARAN.IS', ...])
  // Batching 50 symbols at a time is supported and FAST!
  const symbols = all.map(s => `${s.symbol}.IS`);
  const chunkSize = 50;
  const quoteResults = new Map<string, any>();
  const failedQuoteSymbols: { sym: string; err: string }[] = [];

  const t0 = Date.now();
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    try {
      const quotes: any[] = await yf.quote(chunk);
      if (Array.isArray(quotes)) {
        for (const q of quotes) {
          if (q && q.symbol) {
            quoteResults.set(q.symbol.replace('.IS', ''), q);
          }
        }
      }
    } catch (e: any) {
      console.log(`Batch quote failed for chunk starting at ${i}:`, e.message);
      // fallback to individual checks for this chunk
      for (const s of chunk) {
        try {
          const q: any = await yf.quote(s);
          if (q && q.symbol) {
            quoteResults.set(q.symbol.replace('.IS', ''), q);
          }
        } catch (indivErr: any) {
          failedQuoteSymbols.push({ sym: s.replace('.IS', ''), err: indivErr.message });
        }
      }
    }
  }

  const quoteTime = Date.now() - t0;
  console.log(`\nBatch Quote Audit finished in ${quoteTime}ms`);
  console.log(`Quotes found: ${quoteResults.size} / ${all.length}`);
  console.log(`Missing quotes: ${all.length - quoteResults.size}`);

  // Let's inspect some missing quotes:
  const missing = all.filter(s => !quoteResults.has(s.symbol) || quoteResults.get(s.symbol)?.regularMarketPrice == null);
  console.log(`\nTotal missing or null price: ${missing.length}`);
  console.log('Sample missing:', missing.slice(0, 30).map(s => ({
    symbol: s.symbol,
    status: s.status,
    segment: s.marketSegment
  })));
}

audit().catch(console.error);
