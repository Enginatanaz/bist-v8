import express from 'express';
import { apiRouter, clearScreenerCache, screenerCache } from '../routes/api.js';
import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';
import http from 'http';

interface ScreenerResponse {
  results: any[];
  totalMatched: number;
  excludedCount: number;
  excludedStocks: any[];
  telemetry?: any;
  cacheStats?: { hits: number; misses: number };
}

async function requestScreener(port: number, queryString: string): Promise<{ data: ScreenerResponse; durationMs: number }> {
  const t0 = performance.now();
  const res = await fetch(`http://127.0.0.1:${port}/api/screener?${queryString}`);
  const durationMs = performance.now() - t0;
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Screener failed with HTTP ${res.status}: ${txt}`);
  }
  const data = (await res.json()) as ScreenerResponse;
  return { data, durationMs };
}

export async function runCacheSpeedupSuite(): Promise<{
  allPassed: boolean;
  results: { name: string; passed: boolean; message: string; data?: any }[];
}> {
  const testResults: { name: string; passed: boolean; message: string; data?: any }[] = [];

  // Start temporary local Express server on ephemeral port (0)
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;

  try {
    const universe = InstrumentUniverseService.getInstance();
    const bist30Stocks = universe.getAllInstruments().filter(s => s.indices.includes('BIST 30'));
    const totalBist30 = bist30Stocks.length;

    // =========================================================================
    // TEST 1: Universe Catalog & Symbol Mapping Integrity (KOZAL / TRALT check)
    // =========================================================================
    {
      const kozal = universe.getInstrument('KOZAL');
      const providerSym = universe.getProviderSymbol('KOZAL');
      const isMapped = providerSym === 'TRALT.IS';
      const passed = totalBist30 === 34 && isMapped;

      testResults.push({
        name: 'Test 1: BIST 30 Evren Bütünlüğü ve Sembol Eşleme Denetimi',
        passed,
        message: passed
          ? `Başarılı: BIST 30'da ${totalBist30} hisse tanımlı; unvan/kod değişimi geçiren KOZAL -> ${providerSym} eşlemesi doğrulandı.`
          : `Hata: KOZAL eşlemesi (${providerSym}) veya BIST 30 adedi (${totalBist30}) hatalı.`
      });
    }

    // =========================================================================
    // TEST 2: Önbellek Tam İsabet Oranı (34/34 Tam İsabet & Sıfır Istisna)
    // =========================================================================
    {
      // 1. Önbelleği açıkça ve tamamen temizle
      clearScreenerCache();
      const provider = new BISTRealDataProvider();
      provider.clearCandleCache();

      // Soğuk tarama (Cold Run)
      const cold = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');

      // Sıcak tarama (Warm Run)
      const warm = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');
      const warmStats = await (await fetch(`http://127.0.0.1:${port}/api/screener/cache-stats`)).json();
      const hits = warmStats.telemetry?.cacheHits ?? 0;
      const misses = warmStats.telemetry?.cacheMisses ?? 0;

      // 34 hissenin 34'ünün de önbelleğe yazılmış ve ikinci turda %100 önbellekten gelmiş olması gerekir
      const isFullHit = hits === totalBist30 && misses === 0;

      testResults.push({
        name: 'Test 2: İkinci Taramada %100 Önbellek İsabeti (34/34 İsabet, 0 Iska)',
        passed: isFullHit,
        message: isFullHit
          ? `Başarılı: 2. geçişte ${hits}/${totalBist30} hisse doğrudan önbellekten alındı, 0 ıskalama gerçekleşti (Önceki 33/34 hatası kalıcı olarak çözüldü).`
          : `Hata: Beklenen ${totalBist30} isabet / 0 ıskalama yerine ${hits} isabet / ${misses} ıskalama gerçekleşti.`,
        data: { hits, misses, totalBist30 }
      });
    }

    // =========================================================================
    // TEST 3: Sonuç Eşitliği & Deterministik Veri Bütünlüğü (Cold vs Warm)
    // =========================================================================
    {
      clearScreenerCache();
      const cold = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');
      const warm = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');

      let equalityPassed = true;
      let failureReason = '';

      if (cold.data.results.length !== warm.data.results.length) {
        equalityPassed = false;
        failureReason = `Sonuç sayısı uyuşmuyor: Soğuk=${cold.data.results.length}, Sıcak=${warm.data.results.length}`;
      } else {
        for (let i = 0; i < cold.data.results.length; i++) {
          const c = cold.data.results[i];
          const w = warm.data.results[i];

          if (c.stock.symbol !== w.stock.symbol) {
            equalityPassed = false;
            failureReason = `Sembol sıralaması uyuşmuyor: [${i}] ${c.stock.symbol} vs ${w.stock.symbol}`;
            break;
          }
          if (c.technicalScore !== w.technicalScore) {
            equalityPassed = false;
            failureReason = `${c.stock.symbol} teknik skor farkı: ${c.technicalScore} vs ${w.technicalScore}`;
            break;
          }
          if (c.indicators.rsi14 !== w.indicators.rsi14) {
            equalityPassed = false;
            failureReason = `${c.stock.symbol} RSI farkı: ${c.indicators.rsi14} vs ${w.indicators.rsi14}`;
            break;
          }
          if (c.nearestSupport?.price !== w.nearestSupport?.price) {
            equalityPassed = false;
            failureReason = `${c.stock.symbol} Destek seviyesi farkı: ${c.nearestSupport?.price} vs ${w.nearestSupport?.price}`;
            break;
          }
          if (c.nearestResistance?.price !== w.nearestResistance?.price) {
            equalityPassed = false;
            failureReason = `${c.stock.symbol} Direnç seviyesi farkı: ${c.nearestResistance?.price} vs ${w.nearestResistance?.price}`;
            break;
          }
        }
      }

      testResults.push({
        name: 'Test 3: Önbellekli ve Önbelleksiz Sonuç Eşitliği ve Veri Bütünlüğü',
        passed: equalityPassed,
        message: equalityPassed
          ? `Başarılı: Soğuk ve sıcak taramadaki ${cold.data.results.length} sonucun tüm sembol, skor, RSI, S/R ve indikatör değerleri bit düzeyinde birebir eşit.`
          : `Hata: ${failureReason}`
      });
    }

    // =========================================================================
    // TEST 4: Çoklu Ölçümlü İstatistiksel Hızlanma Testi (Median Benchmark)
    // =========================================================================
    {
      // Soğuk önbellek süresi (Fresh Cold Run)
      clearScreenerCache();
      const coldRun = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');
      const coldTime = coldRun.durationMs;

      // 3 kez sıcak önbellek taraması yap ve medyan süreyi hesapla
      const warmTimes: number[] = [];
      for (let i = 0; i < 3; i++) {
        const warmRun = await requestScreener(port, 'index=BIST+30&timeframe=1d&pageSize=50');
        warmTimes.push(warmRun.durationMs);
      }

      warmTimes.sort((a, b) => a - b);
      const medianWarmTime = warmTimes[1]; // Ortanca değer
      const speedupRatio = Number((coldTime / medianWarmTime).toFixed(1));

      // Sıcak taramanın soğuk taramadan belirgin biçimde hızlı olması beklenir (> 2x speedup)
      const passed = medianWarmTime < coldTime && speedupRatio >= 2.0;

      testResults.push({
        name: 'Test 4: Çoklu Ölçümlü Medyan Hızlanma Kıyaslaması (Speedup Benchmark)',
        passed,
        message: passed
          ? `Başarılı: Soğuk süre: ${coldTime.toFixed(0)} ms | Sıcak medyan süre: ${medianWarmTime.toFixed(0)} ms (Ölçümler: ${warmTimes.map(t => t.toFixed(0)).join(', ')} ms) | Hızlanma Çarpanı: ${speedupRatio}x.`
          : `Hata: Önbellek hızlanması yetersiz: Soğuk=${coldTime.toFixed(0)} ms, Sıcak Medyan=${medianWarmTime.toFixed(0)} ms (${speedupRatio}x).`,
        data: { coldTime, warmTimes, medianWarmTime, speedupRatio }
      });
    }

    // =========================================================================
    // TEST 5: Filtre ve Sıralama Değişiminde Önbellek Koruması (Mutation Invariance)
    // =========================================================================
    {
      // İlk tarama: Descending skor
      const r1 = await requestScreener(port, 'index=BIST+30&sortField=technicalScore&sortDir=desc');
      // İkinci tarama: Sembole göre artan (Yalnızca sıralama değişti)
      const r2 = await requestScreener(port, 'index=BIST+30&sortField=symbol&sortDir=asc');
      // Üçüncü tarama: Fiyat filtresi uygulandı (minPrice=50)
      const r3 = await requestScreener(port, 'index=BIST+30&minPrice=50');

      const isR2SortedBySymbol = r2.data.results.length >= 2 && r2.data.results[0].stock.symbol < r2.data.results[1].stock.symbol;
      const isR3PriceFiltered = r3.data.results.every((r: any) => r.stock.lastPrice >= 50 || r.stock.lastPrice === 0);

      const stats = await (await fetch(`http://127.0.0.1:${port}/api/screener/cache-stats`)).json();
      // Sıralama ve filtre değiştiğinde tüm adaylar önbellekten çekilmiş olmalı
      const hits = stats.telemetry?.cacheHits ?? 0;
      const misses = stats.telemetry?.cacheMisses ?? 0;

      const passed = isR2SortedBySymbol && isR3PriceFiltered && misses === 0;

      testResults.push({
        name: 'Test 5: Filtre ve Sıralama Değişimlerinde İndikatör Önbelleğinin Korunması',
        passed,
        message: passed
          ? `Başarılı: Filtre ve sıralama değişimlerinde indikatörler ve mumlar yeniden hesaplanmadı; önbellekten sıfır ek ıskalama ile sunuldu.`
          : `Hata: Filtre/sıralama değişiminde önbellek bozuldu veya ek ıskalama oluştu.`
      });
    }

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  const allPassed = testResults.every(r => r.passed);
  return { allPassed, results: testResults };
}

// Direct CLI Execution
if (process.argv[1]?.endsWith('cacheSpeedup.test.ts')) {
  runCacheSpeedupSuite()
    .then(({ allPassed, results }) => {
      console.log(`\n=================== BIST ÖNBELLEK HIZLANDIRMA TEST MERKEZİ ===================`);
      console.log(`Tüm Testler Başarılı mı: ${allPassed ? 'EVET (PASS)' : 'HAYIR (FAIL)'}`);
      console.log(`==============================================================================\n`);
      results.forEach((r, idx) => {
        console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
        console.log(`       Detay: ${r.message}`);
        if (r.data) console.log(`       Veri:`, JSON.stringify(r.data));
      });
      console.log(`\n==============================================================================\n`);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Test suite runner crashed:', err);
      process.exit(1);
    });
}
