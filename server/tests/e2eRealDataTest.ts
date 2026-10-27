import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { calculateSupportResistanceModel, detectSupportResistanceDataset } from '../indicators/technicalEngine.js';

interface RealDataTestResult {
  symbol: string;
  provider: string;
  timeframe: string;
  period: string;
  dataStartDate: string | null;
  dataEndDate: string | null;
  validCandleCount: number;
  totalSupports: number;
  totalResistances: number;
  activeSupports: number;
  brokenSupports: number;
  activeResistances: number;
  brokenResistances: number;
  retestSupports: number;
  retestResistances: number;
  calculationStatus: string;
  drawnSupportsCount: number;
  drawnResistancesCount: number;
  outOfRangeSupportsCount: number;
  outOfRangeResistancesCount: number;
  supportColorConfirmed: boolean;
  resistanceColorConfirmed: boolean;
  negativeDistancePreserved: boolean;
  warnings: string[];
  nearestSupport: { price: number; distancePct: number; status: string } | null;
  nearestResistance: { price: number; distancePct: number; status: string } | null;
}

async function runRealDataE2ETest() {
  console.log('========================================================================');
  console.log('   BIST AKILLI ANALIZ MERKEZI - GERÇEK PIYASA VERISI UÇTAN UCA TEST    ');
  console.log('========================================================================\n');

  const provider = new BISTRealDataProvider();
  const testCases = [
    { symbol: 'THYAO', timeframe: '1d', period: '1y', candleLimit: 260 },
    { symbol: 'THYAO', timeframe: '1h', period: '1mo', candleLimit: 200 },
    { symbol: 'ASELS', timeframe: '1d', period: '1y', candleLimit: 260 },
    { symbol: 'GARAN', timeframe: '1d', period: '1y', candleLimit: 260 },
    { symbol: 'EREGL', timeframe: '1d', period: '1y', candleLimit: 260 },
    { symbol: 'KCHOL', timeframe: '1d', period: '1y', candleLimit: 260 }
  ];

  const results: RealDataTestResult[] = [];

  for (const tc of testCases) {
    console.log(`\n>>> [TEST] ${tc.symbol} (${tc.timeframe.toUpperCase()} / ${tc.period}) gerçek veri testi başlatılıyor...`);
    try {
      const ohlcv = await provider.getOHLCV(tc.symbol, tc.timeframe, tc.candleLimit, tc.period);

      if (!ohlcv || ohlcv.length === 0) {
        console.error(`[FAIL] ${tc.symbol}: Sağlayıcıdan veri gelmedi.`);
        continue;
      }

      const dataset = detectSupportResistanceDataset(ohlcv, tc.period, tc.timeframe, tc.symbol);
      const model = dataset.model;

      const supports = model.supports;
      const resistances = model.resistances;

      const activeSupports = supports.filter(s => s.status === 'active');
      const brokenSupports = supports.filter(s => s.status === 'broken');
      const retestSupports = supports.filter(s => s.status === 'retest');

      const activeResistances = resistances.filter(r => r.status === 'active');
      const brokenResistances = resistances.filter(r => r.status === 'broken');
      const retestResistances = resistances.filter(r => r.status === 'retest');

      // Renk doğrulaması: Destek daima kırmızı (#ef4444), Direnç daima yeşil (#10b981)
      const supportColorConfirmed = supports.length === 0 || supports.every(s => s.colorHex === '#ef4444' && s.type === 'SUPPORT');
      const resistanceColorConfirmed = resistances.length === 0 || resistances.every(r => r.colorHex === '#10b981' && r.type === 'RESISTANCE');

      // Negatif mesafe korunumu doğrulaması (Kırılan seviyelerde mesafe negatif kalmalı, asla pozitife çevrilmemeli)
      const negativeDistSuppPassed = brokenSupports.length === 0 || brokenSupports.every(s => s.distancePercent <= 0.05); // tolerans
      const negativeDistResPassed = brokenResistances.length === 0 || brokenResistances.every(r => r.distancePercent <= 0.05);
      const negativeDistancePreserved = negativeDistSuppPassed && negativeDistResPassed;

      // Grafikte çizim simülasyonu (FinancialChart görünür aralık math)
      const lastPrice = ohlcv[ohlcv.length - 1].close;
      const recentBars = ohlcv.slice(-Math.min(90, ohlcv.length));
      let minP = Math.min(...recentBars.map(b => b.low));
      let maxP = Math.max(...recentBars.map(b => b.high));
      
      // Auto-accommodate nearby zones logic (<10% distance)
      dataset.zones.forEach(z => {
        const p = z.price ?? z.pivotPrice;
        if (p && Math.abs(p - lastPrice) / (lastPrice || 1) <= 0.10) {
          if (p < minP) minP = p;
          if (p > maxP) maxP = p;
        }
      });
      const pad = (maxP - minP) * 0.06 || 1;
      const chartMin = minP - pad;
      const chartMax = maxP + pad;

      let drawnSupp = 0;
      let outOfRangeSupp = 0;
      supports.forEach(s => {
        if (s.price >= chartMin && s.price <= chartMax) drawnSupp++;
        else outOfRangeSupp++;
      });

      let drawnRes = 0;
      let outOfRangeRes = 0;
      resistances.forEach(r => {
        if (r.price >= chartMin && r.price <= chartMax) drawnRes++;
        else outOfRangeRes++;
      });

      const nearestSup = activeSupports.length > 0 ? activeSupports[0] : (supports[0] || null);
      const nearestRes = activeResistances.length > 0 ? activeResistances[0] : (resistances[0] || null);

      const resObj: RealDataTestResult = {
        symbol: tc.symbol,
        provider: provider.name,
        timeframe: tc.timeframe,
        period: tc.period,
        dataStartDate: model.metadata.dataStartTime,
        dataEndDate: model.metadata.dataEndTime,
        validCandleCount: ohlcv.length,
        totalSupports: supports.length,
        totalResistances: resistances.length,
        activeSupports: activeSupports.length,
        brokenSupports: brokenSupports.length,
        activeResistances: activeResistances.length,
        brokenResistances: brokenResistances.length,
        retestSupports: retestSupports.length,
        retestResistances: retestResistances.length,
        calculationStatus: model.metadata.calculationStatus,
        drawnSupportsCount: drawnSupp,
        drawnResistancesCount: drawnRes,
        outOfRangeSupportsCount: outOfRangeSupp,
        outOfRangeResistancesCount: outOfRangeRes,
        supportColorConfirmed,
        resistanceColorConfirmed,
        negativeDistancePreserved,
        warnings: model.metadata.warnings,
        nearestSupport: nearestSup ? { price: nearestSup.price, distancePct: nearestSup.distancePercent, status: nearestSup.status } : null,
        nearestResistance: nearestRes ? { price: nearestRes.price, distancePct: nearestRes.distancePercent, status: nearestRes.status } : null
      };

      results.push(resObj);

      console.log(`   [OK] ${tc.symbol} Tamamlandı:`);
      console.log(`        Tarih Aralığı: ${resObj.dataStartDate} -> ${resObj.dataEndDate}`);
      console.log(`        Mum Sayısı: ${resObj.validCandleCount} | Son Fiyat: ${lastPrice.toFixed(2)} TL`);
      console.log(`        Destekler (Kırmızı): Toplam ${resObj.totalSupports} (Aktif: ${resObj.activeSupports}, Kırık: ${resObj.brokenSupports}, Retest: ${resObj.retestSupports})`);
      console.log(`        Dirençler (Yeşil):   Toplam ${resObj.totalResistances} (Aktif: ${resObj.activeResistances}, Kırık: ${resObj.brokenResistances}, Retest: ${resObj.retestResistances})`);
      console.log(`        Durum: ${resObj.calculationStatus} | Renk Teyidi: ${resObj.supportColorConfirmed && resObj.resistanceColorConfirmed ? 'EVET' : 'HAYIR'}`);
      console.log(`        Grafikte Çizilen: Destek ${resObj.drawnSupportsCount}, Direnç ${resObj.drawnResistancesCount} (Grafik Dışı: ${resObj.outOfRangeSupportsCount}D, ${resObj.outOfRangeResistancesCount}R)`);
      if (nearestSup) {
        console.log(`        En Yakın Destek: ${nearestSup.price.toFixed(2)} TL (%${nearestSup.distancePercent.toFixed(2)}) [${nearestSup.status}]`);
      }
      if (nearestRes) {
        console.log(`        En Yakın Direnç: ${nearestRes.price.toFixed(2)} TL (%${nearestRes.distancePercent.toFixed(2)}) [${nearestRes.status}]`);
      }
    } catch (err: any) {
      console.error(`   [HATA] ${tc.symbol} test edilirken hata:`, err.message);
    }
  }

  console.log('\n========================================================================');
  console.log('              ÖZET RAPOR VE SONUÇ MATRIX TABLOSU                        ');
  console.log('========================================================================');
  console.table(results.map(r => ({
    Hisse: r.symbol,
    Dilim: r.timeframe,
    Mum: r.validCandleCount,
    'Top. Destek': r.totalSupports,
    'Aktif Destek': r.activeSupports,
    'Kırık Destek': r.brokenSupports,
    'Top. Direnç': r.totalResistances,
    'Aktif Direnç': r.activeResistances,
    'Kırık Direnç': r.brokenResistances,
    'Durum': r.calculationStatus,
    'Çizilen (D/R)': `${r.drawnSupportsCount} / ${r.drawnResistancesCount}`,
    'Kırmızı/Yeşil': r.supportColorConfirmed && r.resistanceColorConfirmed ? 'UYUMLU' : 'HATA'
  })));

  return results;
}

runRealDataE2ETest().then(() => {
  console.log('\nUçtan uca gerçek veri testi başarıyla tamamlandı.');
}).catch(err => {
  console.error('Test çalıştırma hatası:', err);
});
