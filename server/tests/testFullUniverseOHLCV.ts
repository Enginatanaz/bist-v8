import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

async function testAllOHLCV() {
  const universe = InstrumentUniverseService.getInstance();
  const all = universe.getAllInstruments();
  console.log(`Starting OHLCV test for all ${all.length} stocks...`);

  const provider = new BISTRealDataProvider();

  const t0 = Date.now();
  let success = 0;
  let failed = 0;
  const failureList: { symbol: string; reason: string }[] = [];

  // Batch process in chunks of 15
  const chunkSize = 15;
  for (let i = 0; i < all.length; i += chunkSize) {
    const chunk = all.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (stock) => {
        try {
          const candles = await provider.getOHLCV(stock.symbol, '1d', 90);
          if (candles && candles.length >= 5) {
            success++;
          } else {
            failed++;
            failureList.push({ symbol: stock.symbol, reason: 'Candles < 5' });
          }
        } catch (e: any) {
          failed++;
          failureList.push({ symbol: stock.symbol, reason: e.message });
        }
      })
    );
    if ((i + chunkSize) % 60 === 0 || i + chunkSize >= all.length) {
      console.log(`Progress: ${Math.min(i + chunkSize, all.length)}/${all.length} in ${Date.now() - t0}ms (Success: ${success}, Failed: ${failed})`);
    }
  }

  const duration = Date.now() - t0;
  console.log(`\nFINISHED ALL ${all.length} in ${duration}ms!`);
  console.log(`Success: ${success} (${((success / all.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed}`);
  console.log('Failed list sample:', failureList.slice(0, 30));
}

testAllOHLCV().catch(console.error);
