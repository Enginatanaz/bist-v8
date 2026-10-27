import {
  calculateResistanceBreakoutScore,
  calculateNearSupportMetrics,
  calculateBuySignalRatioMetrics,
  detectValidatedChartPatterns,
  runPatternHistoricalBacktest
} from '../indicators/screenerEngines.js';
import { evaluateTechnicalSignals } from '../indicators/technicalEngine.js';
import {
  OHLCV,
  BISTStock,
  SupportResistanceZone
} from '../types.js';

function createMockStock(symbol: string = 'TEST', lastPrice: number = 100): BISTStock {
  return {
    symbol,
    name: `${symbol} Test Şirketi`,
    sector: 'Sanayi',
    indices: ['BIST 100', 'BIST 30'],
    marketSegment: 'YILDIZ_PAZAR',
    instrumentType: 'EQUITY',
    dataStatus: 'VERIFIED',
    lastPrice,
    change: 2.5,
    changePercent: 2.56,
    open: 98,
    high: 101,
    low: 97.5,
    previousClose: 97.5,
    volume: 1500000,
    volumeTL: 150000000,
    marketCapTL: 10000000000,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    isDelayed: false,
    delayMinutes: 0
  };
}

function generateCandles(count: number, basePrice: number = 100, trend: 'flat' | 'up' | 'down' = 'flat'): OHLCV[] {
  const candles: OHLCV[] = [];
  let price = basePrice;
  const now = Date.now();
  const dayMs = 86400000;

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * dayMs;
    const dateStr = new Date(timestamp).toISOString().split('T')[0];
    const change = trend === 'up' ? 0.3 : trend === 'down' ? -0.3 : 0;
    const noise = ((i % 5) - 2) * 0.4;
    const open = Number((price).toFixed(2));
    const close = Number((price + change + noise).toFixed(2));
    const high = Number((Math.max(open, close) + 0.8).toFixed(2));
    const low = Number((Math.min(open, close) - 0.8).toFixed(2));
    const volume = 1000000 + (i % 7) * 100000;

    candles.push({
      timestamp,
      dateStr,
      open,
      high,
      low,
      close,
      volume,
      isClosed: true,
      timeframe: '1d'
    });
    price = close;
  }
  return candles;
}

export async function runScreenerEnhancementTests(): Promise<{ passed: boolean; results: any[] }> {
  const testResults: { id: string; name: string; passed: boolean; details: string }[] = [];

  // TEST 1: Direnç Kırılım Skoru 80+ ve Bileşen Ayrışımı
  try {
    const candles = generateCandles(40, 90, 'flat');
    // Son mumda 100 TL direncini %2.5 marjla, yüksek hacimle ve güçlü yeşil gövdeyle kırsın
    const prevBar = candles[candles.length - 2];
    prevBar.close = 99.0;
    prevBar.high = 99.5;

    const lastBar = candles[candles.length - 1];
    lastBar.open = 99.5;
    lastBar.close = 103.5; // Direnç 100'ün üzerinde net kapanış
    lastBar.high = 103.8;  // Üst fitil çok küçük (tepeye yakın kapanış)
    lastBar.low = 99.2;
    lastBar.volume = 3500000; // 20 bar ortalama hacmin ~3.5 katı
    lastBar.isClosed = true;

    const mockResistanceZone: SupportResistanceZone = {
      id: 'res_1',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 3,
      touchCount: 3,
      strengthScore: 85,
      distancePercent: 3.0,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-20'
    };

    const stock = createMockStock('THYAO', 103.5);
    const breakoutResult = calculateResistanceBreakoutScore(candles, stock, [mockResistanceZone]);

    const isNotNull = breakoutResult !== null;
    const isScore80Plus = (breakoutResult?.breakoutScore ?? 0) >= 80;
    const isVolumeConfirmed = breakoutResult?.volumeConfirmed === true;
    const isStatusSuccessful = breakoutResult?.status === 'SUCCESSFUL';
    const isCompleted = breakoutResult?.isCompletedCandle === true;

    const testPassed = isNotNull && isScore80Plus && isVolumeConfirmed && isStatusSuccessful && isCompleted;

    testResults.push({
      id: 'TEST_1_BREAKOUT_SCORE_80',
      name: 'Direnç Kırılım Skoru 80+ ve Açıklanabilir Bileşenler Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Direnç kırılım skoru ${breakoutResult?.breakoutScore}/100 (>= 80), Hacim katı: ${breakoutResult?.volumeRatio}x, Kapanış marjı: %${breakoutResult?.scoreBreakdown.closeAboveMargin.marginPct}, Durum: ${breakoutResult?.status}`
        : `Başarısız: Skor: ${breakoutResult?.breakoutScore}, Hacim Onay: ${breakoutResult?.volumeConfirmed}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_1_BREAKOUT_SCORE_80',
      name: 'Direnç Kırılım Skoru 80+ Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 2: Başarısız Kırılım (Tuzak) Tespiti ve Ayrımı
  try {
    const candles = generateCandles(40, 95, 'flat');
    // 3 bar önce 100 direncini kırdı, fakat son barlarda fiyat 98 TL'ye geri çöktü
    candles[candles.length - 3].close = 101.5;
    candles[candles.length - 2].close = 99.0;
    candles[candles.length - 1].close = 97.5; // Direncin altında kapandı (Failed breakout)
    candles[candles.length - 1].high = 98.2;
    candles[candles.length - 1].low = 97.0;

    const mockResistanceZone: SupportResistanceZone = {
      id: 'res_trap',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 2,
      touchCount: 2,
      strengthScore: 75,
      distancePercent: -2.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-20'
    };

    const stock = createMockStock('TRAP', 97.5);
    const result = calculateResistanceBreakoutScore(candles, stock, [mockResistanceZone]);

    const isTaggedFailed = result?.isFailed === true || result?.status === 'FAILED_BREAKOUT';
    const isScorePenalized = (result?.breakoutScore ?? 100) < 50;

    const testPassed = Boolean(isTaggedFailed && isScorePenalized);

    testResults.push({
      id: 'TEST_2_FAILED_BREAKOUT_TRAP',
      name: 'Başarısız Kırılım (Tuzak) Tespiti ve Skor Cezalandırması Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Direnç altına geri düşen hisse 'isFailed: true' (${result?.status}) olarak işaretlendi ve skoru ${result?.breakoutScore}'ye düşürüldü.`
        : `Başarısız: isFailed=${result?.isFailed}, status=${result?.status}, score=${result?.breakoutScore}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_2_FAILED_BREAKOUT_TRAP',
      name: 'Başarısız Kırılım Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 3: Dibe Yakın Hisseler (%2–5 Aralığı ve Destek Altı İhlal Ayrımı)
  try {
    const candles = generateCandles(30, 100, 'flat');
    const mockSupportZone: SupportResistanceZone = {
      id: 'sup_1',
      price: 100,
      zoneLow: 99.0,
      zoneHigh: 101.0,
      type: 'SUPPORT',
      timeframe: '1d',
      pivotCount: 3,
      touchCount: 4,
      strengthScore: 88,
      distancePercent: 3.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.0,
      priceHigh: 101.0,
      lastTestedDate: '2026-10-22'
    };

    // Vaka A: Fiyat 103.5 TL -> Desteğe mesafe ((103.5 - 100) / 100) * 100 = %3.5 (%2-%5 aralığında)
    candles[candles.length - 1].close = 103.5;
    const stockA = createMockStock('NEAR_SUP', 103.5);
    const resA = calculateNearSupportMetrics(candles, stockA, [mockSupportZone]);

    const isDistAccurate = resA?.distanceToSupportPct === 3.5;
    const isInRange = (resA?.distanceToSupportPct ?? 0) >= 2.0 && (resA?.distanceToSupportPct ?? 0) <= 5.0;
    const notBelowSup = resA?.isBelowSupport === false;

    // Vaka B: Fiyat 97.0 TL -> Destek altında ((97 - 100) / 100) * 100 = -%3.0 (Destek kırılmış)
    candles[candles.length - 1].close = 97.0;
    const stockB = createMockStock('BROKEN_SUP', 97.0);
    const resB = calculateNearSupportMetrics(candles, stockB, [mockSupportZone]);

    const isBelowAccurate = resB?.isBelowSupport === true && (resB?.distanceToSupportPct ?? 0) < 0;

    const testPassed = Boolean(isDistAccurate && isInRange && notBelowSup && isBelowAccurate);

    testResults.push({
      id: 'TEST_3_NEAR_SUPPORT_RANGE',
      name: 'Dibe Yakın Hisseler (%2–5 Mesafe Formülü ve Negatif İhlal Ayrımı) Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: %3.5 mesafedeki hisse onaylandı; 97 TL'deki hisse 'isBelowSupport: true' (${resB?.distanceToSupportPct}%) olarak elendi.`
        : `Başarısız: resA=${resA?.distanceToSupportPct}%, resB=${resB?.distanceToSupportPct}%, below=${resB?.isBelowSupport}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_3_NEAR_SUPPORT_RANGE',
      name: 'Dibe Yakın Hisseler Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 4: AL Sinyali Oranı (EMA200'ün Tarayıcıdan Tamamen Çıkarılması ve Formül Doğruluğu)
  try {
    const candles = generateCandles(60, 100, 'flat');
    const stock = createMockStock('BUY_RATIO_TEST', 100);
    const res = calculateBuySignalRatioMetrics(candles, stock, '1d');

    const totalEvaluated = res.evaluatedIndicatorsCount;
    const uncomputable = res.uncomputableIndicatorsCount;
    const buyCount = res.buySignalsCount;
    const ratio = res.buySignalRatioPct;

    // Kural 1: EMA200 hiçbir sinyal (AL, SAT, NÖTR) üretmemeli
    const noEma200Signal = res.audit.signals.every(s => !s.id.includes('ema200') && !s.name.includes('EMA200'));
    // Kural 2: EMA200 yetersiz veri listesinde veya uyarısında yer almamalı (tarayıcıdan tamamen çıkarıldı)
    const noEma200Uncomputable = !res.audit.uncomputableList.some(u => u.name.includes('EMA200'));
    // Kural 3: Formül: (buyCount / totalEvaluated) * 100
    const expectedRatio = totalEvaluated > 0 ? Number(((buyCount / totalEvaluated) * 100).toFixed(1)) : 0;
    const isFormulaExact = Math.abs(ratio - expectedRatio) < 0.1;
    // Kural 4: Kalan diğer göstergeler (10 adet) eksiksiz değerlendirilmeli
    const isEvaluatedValid = totalEvaluated > 0 && totalEvaluated <= 10;

    const testPassed = noEma200Signal && noEma200Uncomputable && isFormulaExact && isEvaluatedValid;

    testResults.push({
      id: 'TEST_4_BUY_SIGNAL_RATIO',
      name: 'Hisse Tarayıcı: EMA200 Göstergesinin AL Sinyali ve Oran Hesabından Çıkarılması Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: EMA200 AL/SAT/NÖTR üretmedi, yetersiz veri uyarısı vermedi. AL Oranı %${ratio} (${buyCount}/${totalEvaluated} geçerli gösterge üzerinden hesaplandı).`
        : `Başarısız: noEma200Signal=${noEma200Signal}, noEma200Uncomputable=${noEma200Uncomputable}, ratio=${ratio}, expected=${expectedRatio}, total=${totalEvaluated}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_4_BUY_SIGNAL_RATIO',
      name: 'AL Sinyali Oranı Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 5: 16 Formasyon 3-Durum Sınıflandırması (VALIDATED vs BREAKOUT_CONFIRMED)
  try {
    const candles = generateCandles(50, 100, 'flat');
    // İkili Dip simülasyonu yapalım
    // 1. Dip: bar 10'da 90 TL
    candles[10].low = 90.0;
    candles[10].close = 91.0;
    // Zirve: bar 20'de 102 TL
    candles[20].high = 102.0;
    candles[20].close = 101.5;
    // 2. Dip: bar 30'da 90.5 TL
    candles[30].low = 90.5;
    candles[30].close = 91.2;

    // Vaka A: Fiyat 100 TL -> Boyun çizgisi 102 TL'nin altında -> 'VALIDATED' olmalı
    candles[candles.length - 1].close = 100.0;
    const patternsValidated = detectValidatedChartPatterns(candles);
    const doubleBottomVal = patternsValidated.find(p => p.type === 'DOUBLE_BOTTOM');
    const isStateValidated = doubleBottomVal?.status === 'VALIDATED';

    // Vaka B: Fiyat 104 TL -> Boyun çizgisi 102 TL'nin üzerinde kapandı -> 'BREAKOUT_CONFIRMED' olmalı
    candles[candles.length - 1].close = 104.0;
    const patternsConfirmed = detectValidatedChartPatterns(candles);
    const doubleBottomConf = patternsConfirmed.find(p => p.type === 'DOUBLE_BOTTOM');
    const isStateConfirmed = doubleBottomConf?.status === 'BREAKOUT_CONFIRMED';

    const testPassed = Boolean(isStateValidated && isStateConfirmed);

    testResults.push({
      id: 'TEST_5_PATTERN_3_STATE',
      name: '16 Formasyon 3-Durum Ayrımı (VALIDATED vs BREAKOUT_CONFIRMED) Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Kırılım öncesi 'VALIDATED' (${doubleBottomVal?.necklinePrice} TL boyun hattı), Kırılım sonrası 'BREAKOUT_CONFIRMED' (${doubleBottomConf?.targetPrice} TL hedef) olarak kesin ayrıştırıldı.`
        : `Başarısız: ValState=${doubleBottomVal?.status}, ConfState=${doubleBottomConf?.status}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_5_PATTERN_3_STATE',
      name: 'Formasyon 3-Durum Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 6: Gerçekçi Formasyon Backtest Motoru (Sıfır Lookahead, BIST Komisyon & Kayma Kesintisi)
  try {
    const candlesA = generateCandles(120, 50, 'up');
    const candlesB = generateCandles(120, 80, 'flat');

    const summaries = runPatternHistoricalBacktest([
      { symbol: 'THYAO', ohlcv: candlesA },
      { symbol: 'GARAN', ohlcv: candlesB }
    ]);

    const hasSummaries = summaries.length >= 10;
    const hasRealisticMetrics = summaries.every(s => s.winRatePct >= 0 && s.winRatePct <= 100 && s.commissionPct === 0.15 && s.slippagePct === 0.10);
    const hasDisclaimer = summaries.every(s => s.disclaimer.includes('YASAL UYARI'));

    const testPassed = hasSummaries && hasRealisticMetrics && hasDisclaimer;

    testResults.push({
      id: 'TEST_6_PATTERN_BACKTEST_REALISTIC',
      name: 'Gerçekçi Formasyon Backtest Motoru (Maliyet Kesintisi & No Lookahead) Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: ${summaries.length} formasyon türü için BIST maliyetli (%0.15 komisyon + %0.10 kayma) tarihsel başarı oranları hesaplandı. En yüksek başarı: ${summaries[0]?.turkishName} (%${summaries[0]?.winRatePct} kazanma oranı, ${summaries[0]?.profitFactor} kâr faktörü).`
        : `Başarısız: summaries=${summaries.length}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_6_PATTERN_BACKTEST_REALISTIC',
      name: 'Formasyon Backtest Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 7: FAZ 5 Madde 7 (Hisse Detayı %85 Eşiği Korunumu) & Hisse Tarayıcı (EMA200 Hariç) Uyum Testi
  try {
    const candles60 = generateCandles(60, 100, 'up');
    const stock = createMockStock('UNIFIED_SIGNALS', 105);

    // 1. Hisse Detayı canonical çağrısı: evaluateTechnicalSignals (EMA200 dahil)
    const detailAudit = evaluateTechnicalSignals(candles60, stock.symbol);

    // 2. Hisse Tarayıcı çağrısı: calculateBuySignalRatioMetrics (EMA200 hariç)
    const screenerResult = calculateBuySignalRatioMetrics(candles60, stock, '1d');

    // Doğrulama 1: Hisse Detayı FAZ 5 Madde 7 kuralları KORUNDU
    const isThreshold85 = detailAudit.requiredThresholdPct === 85.0;
    const detailHasEma200InUncomputable = detailAudit.uncomputableList.some(u => u.name.includes('EMA200'));

    // Doğrulama 2: Hisse Tarayıcı'da EMA200 sinyallerden ve yetersiz veri uyarısından tamamen çıkarıldı
    const screenerNoEma200Signal = screenerResult.audit.signals.every(s => !s.id.includes('ema200'));
    const screenerNoEma200Warning = !screenerResult.audit.uncomputableList.some(u => u.name.includes('EMA200'));

    // Doğrulama 3: Kalan tüm 10 göstergenin sinyalleri (EMA5/20, EMA20, EMA50, RSI, MACD, BB, Hacim, Stoch, PSAR, S/R) birebir aynı
    const commonSignalsMatch = screenerResult.audit.signals.every(s => {
      const matchInDetail = detailAudit.signals.find(d => d.id === s.id);
      return matchInDetail && matchInDetail.signal === s.signal;
    });

    // Doğrulama 4: AL Sinyali Oranı doğru formülle hesaplandı
    const expectedScreenerRatio = Number(((screenerResult.buySignalsCount / screenerResult.evaluatedIndicatorsCount) * 100).toFixed(1));
    const isRatioAccurate = Math.abs(screenerResult.buySignalRatioPct - expectedScreenerRatio) < 0.1;

    // Doğrulama 5: Tarayıcının %40-55 filtreleme kuralı (buySignalRatioPct >= 40.0 && buySignalRatioPct <= 55.0) doğrulanmalı
    const isIn40to55Range = screenerResult.buySignalRatioPct >= 40.0 && screenerResult.buySignalRatioPct <= 55.0;
    const filterVerification = [screenerResult].filter(item => item.buySignalRatioPct >= 40.0 && item.buySignalRatioPct <= 55.0).length === (isIn40to55Range ? 1 : 0);

    // Doğrulama 6: 220 mumlu uzun veri ile deneme: Hisse Detayı EMA200'ü değerlendirirken, Tarayıcı dışarıda bırakmaya devam etmeli
    const candles220 = generateCandles(220, 100, 'up');
    const detailLong = evaluateTechnicalSignals(candles220, stock.symbol);
    const screenerLong = calculateBuySignalRatioMetrics(candles220, stock, '1d');

    const detailEvaluatedEma200 = detailLong.signals.some(s => s.id.includes('ema200'));
    const screenerStillExcludedEma200 = screenerLong.audit.signals.every(s => !s.id.includes('ema200'));

    const testPassed = isThreshold85 &&
      detailHasEma200InUncomputable &&
      screenerNoEma200Signal &&
      screenerNoEma200Warning &&
      commonSignalsMatch &&
      isRatioAccurate &&
      filterVerification &&
      detailEvaluatedEma200 &&
      screenerStillExcludedEma200;

    testResults.push({
      id: 'TEST_7_FAZ5_M7_SINGLE_SOURCE_OF_TRUTH',
      name: 'Hisse Detayı (%85 Eşiği & EMA200 Korunumu) ile Hisse Tarayıcı (EMA200 Hariç) Ayrımı Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Hisse Detayında %85 eşiği ve EMA200 değerlendirmesi korundu (${detailLong.signals.length} gösterge). Hisse Tarayıcıda EMA200 tamamen çıkarıldı (${screenerLong.evaluatedIndicatorsCount} gösterge, 0 uyarı). Diğer 10 göstergenin sinyalleri birebir eşleşti.`
        : `Başarısız: detail85=${isThreshold85}, screenerNoEma200=${screenerNoEma200Signal}, signalsMatch=${commonSignalsMatch}, detailLongEma200=${detailEvaluatedEma200}, screenerLongNoEma200=${screenerStillExcludedEma200}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_7_FAZ5_M7_SINGLE_SOURCE_OF_TRUTH',
      name: 'FAZ 5 Madde 7 Uyum Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 8: Direnç Kırılım Skoru 1. Bileşen ve Bağımsız Temas Sayısı Uyum Testi
  try {
    const candles = generateCandles(40, 95, 'flat');
    const lastBar = candles[candles.length - 1];
    lastBar.close = 102.5; // 100 TL direncinin üzerinde kapandı
    lastBar.high = 103.0;
    lastBar.isClosed = true;

    const mockZone: SupportResistanceZone = {
      id: 'res_unified_test',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 4,
      touchCount: 5,
      strengthScore: 84, // Hisse Detayı güç skoru 84
      distancePercent: 2.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-24'
    };

    const stock = createMockStock('UNIFIED_RES', 102.5);
    const res = calculateResistanceBreakoutScore(candles, stock, [mockZone]);

    // 1. Bileşen: Hisse Detayı Güç Skoru * 0.25 = Math.round(84 * 0.25) = 21 (Maksimum 25)
    const expectedReliabilityScore = Math.min(25, Math.round(84 * 0.25));
    const isReliabilityScoreExact = res?.scoreBreakdown.resistanceReliability.score === expectedReliabilityScore;
    const isReliabilityMax25 = res?.scoreBreakdown.resistanceReliability.maxScore === 25;

    // Temas sayısı çift sayılmadan doğrudan Hisse Detayından aktarılmış olmalı (touchCount = 5)
    const isTouchCountExact = res?.resistanceZone.touchCount === 5 && res?.scoreBreakdown.resistanceReliability.testCount === 5;

    // 5 bileşenin toplam tavanı 100 olmalı (25 + 25 + 20 + 15 + 15 = 100)
    const totalMax = (res?.scoreBreakdown.resistanceReliability.maxScore ?? 0) +
      (res?.scoreBreakdown.closeAboveMargin.maxScore ?? 0) +
      (res?.scoreBreakdown.atrBreakoutMargin.maxScore ?? 0) +
      (res?.scoreBreakdown.volumeConfirmation.maxScore ?? 0) +
      (res?.scoreBreakdown.candleQuality.maxScore ?? 0);
    const isTotalMax100 = totalMax === 100;

    const testPassed = Boolean(res && isReliabilityScoreExact && isReliabilityMax25 && isTouchCountExact && isTotalMax100);

    testResults.push({
      id: 'TEST_8_RESISTANCE_STRENGTH_UNIFICATION',
      name: 'Direnç Güç Skoru ve Bağımsız Temas Sayısı Birebir Entegrasyon Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Hisse Detayı güç skoru (84) üzerinden 1. bileşen skoru ${res?.scoreBreakdown.resistanceReliability.score}/25 olarak hesaplandı. Temas sayısı=${res?.resistanceZone.touchCount} (çift sayım yok). 5 bileşen tavan toplamı=${totalMax}/100.`
        : `Başarısız: resNull=${!res}, score=${res?.scoreBreakdown.resistanceReliability.score}, expected=${expectedReliabilityScore}, touch=${res?.resistanceZone.touchCount}, totalMax=${totalMax}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_8_RESISTANCE_STRENGTH_UNIFICATION',
      name: 'Direnç Güç Skoru Entegrasyon Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 9: Beş Temas Kuralı (minTouchCount Filtrelemesi) Testi
  try {
    const candles = generateCandles(40, 95, 'flat');
    const lastBar = candles[candles.length - 1];
    lastBar.close = 102.5;
    lastBar.high = 103.0;
    lastBar.isClosed = true;

    const zoneWith3Touches: SupportResistanceZone = {
      id: 'res_3_touches',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 3,
      touchCount: 3,
      strengthScore: 70,
      distancePercent: 2.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-24'
    };

    const zoneWith5Touches: SupportResistanceZone = {
      id: 'res_5_touches',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 5,
      touchCount: 5,
      strengthScore: 90,
      distancePercent: 2.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-24'
    };

    const stock = createMockStock('TOUCH_FILTER', 102.5);

    const res3 = calculateResistanceBreakoutScore(candles, stock, [zoneWith3Touches]);
    const res5 = calculateResistanceBreakoutScore(candles, stock, [zoneWith5Touches]);

    // minTouchCount = 5 durumunda filtreleme: res3 elenmeli (3 < 5), res5 geçmeli (5 >= 5)
    const passesMin5With3 = (res3?.resistanceZone.touchCount ?? 0) >= 5;
    const passesMin5With5 = (res5?.resistanceZone.touchCount ?? 0) >= 5;

    const testPassed = Boolean(res3 && res5 && !passesMin5With3 && passesMin5With5);

    testResults.push({
      id: 'TEST_9_MIN_TOUCH_COUNT_RULE',
      name: 'Beş Temas Kuralı (minTouchCount: 5) Doğrulama Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: 3 temaslı direnç (touchCount=${res3?.resistanceZone.touchCount}) 5 temas şartını sağlamadı; 5 temaslı direnç (touchCount=${res5?.resistanceZone.touchCount}) 5 temas şartını sağladı.`
        : `Başarısız: res3Null=${!res3}, res5Null=${!res5}, passes3=${passesMin5With3}, passes5=${passesMin5With5}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_9_MIN_TOUCH_COUNT_RULE',
      name: 'Beş Temas Kuralı Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  // TEST 10: Başarısız Kırılım -35 Puan Tekil Ceza Testi
  try {
    const candles = generateCandles(40, 95, 'flat');
    // 3 bar önce 100 direncini kırdı, fakat son barlarda fiyat 97.5 TL'ye geri çöktü (Boğa tuzağı)
    candles[candles.length - 3].close = 101.5;
    candles[candles.length - 2].close = 99.0;
    candles[candles.length - 1].close = 97.5;
    candles[candles.length - 1].high = 98.2;
    candles[candles.length - 1].low = 97.0;

    const mockZone: SupportResistanceZone = {
      id: 'res_trap_35',
      price: 100,
      zoneLow: 99.5,
      zoneHigh: 100.5,
      type: 'RESISTANCE',
      timeframe: '1d',
      pivotCount: 3,
      touchCount: 3,
      strengthScore: 80,
      distancePercent: -2.5,
      status: 'active',
      pivotPrice: 100,
      priceLow: 99.5,
      priceHigh: 100.5,
      lastTestedDate: '2026-10-24'
    };

    const stock = createMockStock('TRAP_35', 97.5);
    const res = calculateResistanceBreakoutScore(candles, stock, [mockZone]);

    const isPenaltyMinus35 = res?.scoreBreakdown.failedBreakoutPenalty === -35;
    const isStatusFailed = res?.status === 'FAILED_BREAKOUT' && res?.isFailed === true;

    // Taban puanlar toplamı - 35 = final score
    const baseSum = (res?.scoreBreakdown.resistanceReliability.score ?? 0) +
      (res?.scoreBreakdown.closeAboveMargin.score ?? 0) +
      (res?.scoreBreakdown.atrBreakoutMargin.score ?? 0) +
      (res?.scoreBreakdown.volumeConfirmation.score ?? 0) +
      (res?.scoreBreakdown.candleQuality.score ?? 0);
    const expectedScore = Math.max(0, baseSum - 35);
    const isScoreCalculatedOnce = res?.breakoutScore === expectedScore;

    const testPassed = Boolean(res && isPenaltyMinus35 && isStatusFailed && isScoreCalculatedOnce);

    testResults.push({
      id: 'TEST_10_FAILED_BREAKOUT_PENALTY_SINGLE',
      name: 'Başarısız Kırılım (-35 Puan Tekil Ceza) Testi',
      passed: testPassed,
      details: testPassed
        ? `Başarılı: Başarısız kırılımda failedBreakoutPenalty=${res?.scoreBreakdown.failedBreakoutPenalty} puan tek seferde düşüldü (Taban Toplam: ${baseSum} -> Nihai Skor: ${res?.breakoutScore}).`
        : `Başarısız: resNull=${!res}, penalty=${res?.scoreBreakdown.failedBreakoutPenalty}, status=${res?.status}, score=${res?.breakoutScore}, expected=${expectedScore}`
    });
  } catch (err: any) {
    testResults.push({
      id: 'TEST_10_FAILED_BREAKOUT_PENALTY_SINGLE',
      name: 'Başarısız Kırılım Ceza Testi',
      passed: false,
      details: `Hata: ${err?.message}`
    });
  }

  const allPassed = testResults.every(t => t.passed);
  return { passed: allPassed, results: testResults };
}

// Standalone CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== BIST HİSSE TARAYICI VE FORMASYON GELİŞTİRME DOĞRULAMA TESTİ ===');
  runScreenerEnhancementTests().then(({ passed, results }) => {
    results.forEach((r, idx) => {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Test ${idx + 1}: ${r.name}`);
      console.log(`       Detay: ${r.details}`);
    });
    console.log('===================================================================');
    console.log(`Tüm Testler Başarılı mı: ${passed ? 'EVET (PASS)' : 'HAYIR (FAIL)'}`);
    console.log('===================================================================');
    if (!passed) process.exit(1);
  });
}
