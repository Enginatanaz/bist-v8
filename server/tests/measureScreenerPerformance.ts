import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

async function measure() {
  const universe = InstrumentUniverseService.getInstance();
  const all = universe.getAllInstruments();
  console.log(`Total instruments in universe: ${all.length}`);

  const provider = new BISTRealDataProvider();

  // Test 10 representative symbols from different segments:
  // e.g. bluechips, midcaps, new IPOs, etc.
  const testSymbols = ['THYAO', 'GARAN', 'ASELS', 'EREGL', 'TUPRS', 'BIMAS', 'AKBNK', 'SASA', 'KOZAL', 'ENKAI'];

  console.log(`\nTesting fetching OHLCV for 10 core symbols...`);
  const t0 = Date.now();
  let successCount = 0;
  let failCount = 0;
  const errors: { sym: string; err: string }[] = [];

  for (const sym of testSymbols) {
    const s0 = Date.now();
    try {
      const candles = await provider.getOHLCV(sym, '1d', 90);
      const elapsed = Date.now() - s0;
      console.log(`  [OK] ${sym}: ${candles.length} candles in ${elapsed}ms`);
      successCount++;
    } catch (err: any) {
      const elapsed = Date.now() - s0;
      console.log(`  [FAIL] ${sym} in ${elapsed}ms: ${err.message}`);
      failCount++;
      errors.push({ sym, err: err.message });
    }
  }

  const totalElapsed = Date.now() - t0;
  console.log(`\nSummary: 10 symbols took ${totalElapsed}ms (Success: ${successCount}, Fail: ${failCount})`);
  console.log(`Average per symbol: ${(totalElapsed / testSymbols.length).toFixed(0)}ms`);
}

measure().catch(console.error);
