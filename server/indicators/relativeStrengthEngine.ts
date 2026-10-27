import {
  OHLCV,
  BISTStock,
  MarketRegimeType,
  MarketRegimeReport,
  RelativeStrengthMetrics,
  RelativeStrengthPoint,
  ScreenerCategory,
  RelativeStrengthScreenerItem,
  DualTrackConditionType,
  DualTrackConditionStatus,
  DownsideRiskFactor,
  DownsideRiskAssessment,
  RSBacktestParams,
  RSBacktestResult
} from '../types.js';
import {
  calculateEMA,
  calculateRSI,
  detectSupportResistanceZones,
  detectAutoChannels
} from './technicalEngine.js';

/**
 * Align stock and index OHLCV bars by date/timestamp to guarantee equal comparison windows.
 */
export function alignOHLCVCandles(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[]
): { alignedStock: OHLCV[]; alignedIndex: OHLCV[] } {
  if (!stockCandles || stockCandles.length === 0 || !indexCandles || indexCandles.length === 0) {
    return { alignedStock: [], alignedIndex: [] };
  }

  // Index map by date key (YYYY-MM-DD or dateStr)
  const indexMap = new Map<string, OHLCV>();
  for (const c of indexCandles) {
    const key = c.dateStr ? c.dateStr.slice(0, 10) : new Date(c.timestamp).toISOString().slice(0, 10);
    indexMap.set(key, c);
  }

  const alignedStock: OHLCV[] = [];
  const alignedIndex: OHLCV[] = [];

  for (const sc of stockCandles) {
    const key = sc.dateStr ? sc.dateStr.slice(0, 10) : new Date(sc.timestamp).toISOString().slice(0, 10);
    const matchedIndex = indexMap.get(key);
    if (matchedIndex && sc.close > 0 && matchedIndex.close > 0) {
      alignedStock.push(sc);
      alignedIndex.push(matchedIndex);
    }
  }

  return { alignedStock, alignedIndex };
}

/**
 * 1. Calculate Relative Strength series and Alpha metrics.
 * Formula:
 * Relative Alpha = StockReturn - IndexReturn
 * RS Ratio = StockPrice / IndexPrice
 */
export function computeRelativeStrength(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[],
  symbol: string,
  indexSymbol: string = 'XU100',
  timeframe: string = '1d'
): RelativeStrengthMetrics {
  const { alignedStock, alignedIndex } = alignOHLCVCandles(stockCandles, indexCandles);

  if (alignedStock.length === 0) {
    return {
      symbol: symbol.toUpperCase(),
      indexSymbol: indexSymbol.toUpperCase(),
      timeframe,
      periodBars: 0,
      stockReturnPct: 0,
      indexReturnPct: 0,
      relativeAlphaPct: 0,
      rsRatioCurrent: 1,
      rsRatioChangePct: 0,
      rsTrend: 'NEUTRAL',
      rsEmaSlope: 0,
      points: [],
      lastDataTime: new Date().toISOString()
    };
  }

  const baseStockPrice = alignedStock[0].close;
  const baseIndexPrice = alignedIndex[0].close;

  const rawRSRatios = alignedStock.map((s, i) => s.close / alignedIndex[i].close);
  const rsEma = calculateEMA(rawRSRatios, Math.min(20, Math.max(5, Math.floor(rawRSRatios.length / 2))));

  const points: RelativeStrengthPoint[] = alignedStock.map((s, i) => ({
    timestamp: s.timestamp,
    dateStr: s.dateStr,
    stockPrice: s.close,
    indexPrice: alignedIndex[i].close,
    rsRatio: Number((s.close / alignedIndex[i].close).toFixed(6)),
    normalizedStock: Number(((s.close / baseStockPrice) * 100).toFixed(2)),
    normalizedIndex: Number(((alignedIndex[i].close / baseIndexPrice) * 100).toFixed(2)),
    rsEma20: rsEma[i] != null ? Number(rsEma[i]!.toFixed(6)) : undefined
  }));

  const lastIdx = alignedStock.length - 1;
  const stockReturnPct = Number((((alignedStock[lastIdx].close - baseStockPrice) / baseStockPrice) * 100).toFixed(2));
  const indexReturnPct = Number((((alignedIndex[lastIdx].close - baseIndexPrice) / baseIndexPrice) * 100).toFixed(2));
  const relativeAlphaPct = Number((stockReturnPct - indexReturnPct).toFixed(2));

  const firstRS = rawRSRatios[0];
  const lastRS = rawRSRatios[lastIdx];
  const rsRatioChangePct = Number((((lastRS - firstRS) / firstRS) * 100).toFixed(2));

  // RS Trend slope over recent 5 bars
  const slopeWindow = Math.min(5, rawRSRatios.length);
  const rsEmaSlope = slopeWindow > 1
    ? Number((((rawRSRatios[lastIdx] - rawRSRatios[lastIdx - slopeWindow + 1]) / rawRSRatios[lastIdx - slopeWindow + 1]) * 100).toFixed(3))
    : 0;

  let rsTrend: 'EXPANDING' | 'CONTRACTING' | 'NEUTRAL' = 'NEUTRAL';
  if (rsEmaSlope > 0.3 && relativeAlphaPct > 0) {
    rsTrend = 'EXPANDING';
  } else if (rsEmaSlope < -0.3 && relativeAlphaPct < 0) {
    rsTrend = 'CONTRACTING';
  }

  return {
    symbol: symbol.toUpperCase(),
    indexSymbol: indexSymbol.toUpperCase(),
    timeframe,
    periodBars: alignedStock.length,
    stockReturnPct,
    indexReturnPct,
    relativeAlphaPct,
    rsRatioCurrent: Number(lastRS.toFixed(6)),
    rsRatioChangePct,
    rsTrend,
    rsEmaSlope,
    points,
    lastDataTime: alignedStock[lastIdx].dateStr || new Date(alignedStock[lastIdx].timestamp).toISOString()
  };
}

/**
 * 2. Market Regime Classification (5 Levels)
 * Categories:
 * - STRONG_BULL: Güçlü yükseliş
 * - WEAK_BULL: Zayıf yükseliş
 * - SIDEWAYS: Yatay
 * - WEAK_BEAR: Zayıf düşüş
 * - STRONG_BEAR: Güçlü düşüş
 * Uses EMA20, EMA20 slope, price distance to EMA20, RSI, and Higher-Highs/Lower-Lows structure.
 */
export function classifyMarketRegime(
  indexCandles: OHLCV[],
  indexSymbol: string = 'XU100',
  indexName: string = 'BIST 100 Endeksi'
): MarketRegimeReport {
  const defaultReport: MarketRegimeReport = {
    indexSymbol: indexSymbol.toUpperCase(),
    indexName,
    regime: 'SIDEWAYS',
    regimeLabel: 'Yatay Piyasa',
    currentPrice: 10000,
    ema20: 10000,
    ema20Slope: 0,
    priceToEma20Pct: 0,
    rsi14: 50,
    priceStructure: 'RANGE_BOUND',
    description: 'Yeterli veri bulunamadı.',
    methodologyExplanation: 'EMA20 seviyesi, EMA20 eğimi ve tepe-dip fiyat yapısı analizi.',
    thresholds: {
      strongBullEmaSlopeMin: 0.12,
      strongBearEmaSlopeMax: -0.12,
      sidewaysSlopeThreshold: 0.08,
      priceToEmaTolerancePct: 0.8
    },
    lastDataTime: new Date().toISOString()
  };

  if (!indexCandles || indexCandles.length < 10) {
    return defaultReport;
  }

  const closes = indexCandles.map(c => c.close);
  const ema20Series = calculateEMA(closes, 20);
  const rsiSeries = calculateRSI(closes, 14);

  const lastIdx = indexCandles.length - 1;
  const currentPrice = closes[lastIdx];
  const ema20 = ema20Series[lastIdx] ?? currentPrice;
  const rsi14 = rsiSeries[lastIdx] ?? 50;

  // EMA20 slope over past 5 bars (% change of EMA20)
  const slopeLookback = Math.min(5, lastIdx);
  const prevEma20 = ema20Series[lastIdx - slopeLookback] ?? ema20;
  const ema20Slope = prevEma20 > 0
    ? Number((((ema20 - prevEma20) / prevEma20) * 100).toFixed(3))
    : 0;

  // Price distance to EMA20
  const priceToEma20Pct = Number((((currentPrice - ema20) / ema20) * 100).toFixed(2));

  // Price structure: analyze highs/lows of last 15 bars
  const windowSize = Math.min(15, indexCandles.length);
  const recentSlice = indexCandles.slice(indexCandles.length - windowSize);
  const firstHalf = recentSlice.slice(0, Math.floor(windowSize / 2));
  const secondHalf = recentSlice.slice(Math.floor(windowSize / 2));

  const maxFirstHalf = Math.max(...firstHalf.map(c => c.high));
  const maxSecondHalf = Math.max(...secondHalf.map(c => c.high));
  const minFirstHalf = Math.min(...firstHalf.map(c => c.low));
  const minSecondHalf = Math.min(...secondHalf.map(c => c.low));

  let priceStructure: 'HIGHER_HIGHS' | 'LOWER_LOWS' | 'RANGE_BOUND' = 'RANGE_BOUND';
  if (maxSecondHalf > maxFirstHalf && minSecondHalf > minFirstHalf) {
    priceStructure = 'HIGHER_HIGHS';
  } else if (maxSecondHalf < maxFirstHalf && minSecondHalf < minFirstHalf) {
    priceStructure = 'LOWER_LOWS';
  }

  // 5-Level Classification Logic
  let regime: MarketRegimeType = 'SIDEWAYS';
  let regimeLabel = 'Yatay Piyasa';
  let description = '';

  if (priceToEma20Pct > 0.8 && ema20Slope > 0.12 && priceStructure === 'HIGHER_HIGHS' && rsi14 > 52) {
    regime = 'STRONG_BULL';
    regimeLabel = 'Güçlü Yükseliş Rejimi';
    description = `Endeks EMA20 (+%${priceToEma20Pct}) üzerinde, EMA20 eğimi güçlü pozitif (+%${ema20Slope}) ve fiyat tepeleri yükselmektedir.`;
  } else if (priceToEma20Pct >= 0 && ema20Slope > 0) {
    regime = 'WEAK_BULL';
    regimeLabel = 'Zayıf Yükseliş Rejimi';
    description = `Endeks EMA20 üzerinde tutunuyor ancak momentum sınırlı veya yükseliş eğimi ılımlı (+%${ema20Slope}).`;
  } else if (priceToEma20Pct < -0.8 && ema20Slope < -0.12 && priceStructure === 'LOWER_LOWS' && rsi14 < 45) {
    regime = 'STRONG_BEAR';
    regimeLabel = 'Güçlü Düşüş Rejimi';
    description = `Endeks EMA20 altında (%${priceToEma20Pct}), EMA20 eğimi belirgin negatif (%${ema20Slope}) ve fiyat dipleri alçalmaktadır.`;
  } else if (priceToEma20Pct < 0 || ema20Slope < 0) {
    regime = 'WEAK_BEAR';
    regimeLabel = 'Zayıf Düşüş Rejimi';
    description = `Endeks EMA20 seviyesini aşağı yönlü zorluyor, düşüş eğilimi baskın (%${ema20Slope}).`;
  } else {
    regime = 'SIDEWAYS';
    regimeLabel = 'Yatay / Konsolidasyon Rejimi';
    description = `Endeks EMA20 etrafında dalgalanıyor (|eğim| <= %0.08), net bir yönlü trend bulunmuyor.`;
  }

  const methodologyExplanation = 
    `Piyasa rejimi, endeksin 20 barlık Üstel Hareketli Ortalaması (EMA20), son 5 bardaki EMA20 eğim yüzdesi, ` +
    `fiyatın EMA20'ye mesafesi ve tepe/dip fiyat yapısı kullanılarak 5 nesnel kademede sınıflandırılır. ` +
    `Tek bir göstergeye dayanmaz; mutlak gelecek tahmini içermez.`;

  return {
    indexSymbol: indexSymbol.toUpperCase(),
    indexName,
    regime,
    regimeLabel,
    currentPrice: Number(currentPrice.toFixed(2)),
    ema20: Number(ema20.toFixed(2)),
    ema20Slope,
    priceToEma20Pct,
    rsi14: Number(rsi14.toFixed(1)),
    priceStructure,
    description,
    methodologyExplanation,
    thresholds: {
      strongBullEmaSlopeMin: 0.12,
      strongBearEmaSlopeMax: -0.12,
      sidewaysSlopeThreshold: 0.08,
      priceToEmaTolerancePct: 0.8
    },
    lastDataTime: indexCandles[lastIdx].dateStr || new Date(indexCandles[lastIdx].timestamp).toISOString()
  };
}

/**
 * 3. Evaluate 8 Market-State Screener Categories
 */
export function evaluateScreenerCategories(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[],
  stock: BISTStock,
  timeframe: string = '1d'
): { matchedCategories: ScreenerCategory[]; screenerItem: RelativeStrengthScreenerItem } {
  const { alignedStock, alignedIndex } = alignOHLCVCandles(stockCandles, indexCandles);

  const matchedCategories: ScreenerCategory[] = [];

  if (alignedStock.length < 15) {
    return {
      matchedCategories,
      screenerItem: {
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        currentPrice: stock.lastPrice,
        changePercent: stock.changePercent,
        stockReturnPct: 0,
        indexReturnPct: 0,
        relativeAlphaPct: 0,
        category: 'INDEX_UP_STOCK_STRONGER',
        categoryTitle: 'Yetersiz Veri',
        rsScore: 50,
        technicalReason: 'Analiz için en az 15 senkronize bar gereklidir.',
        isConfirmed: false,
        timeframe,
        indicators: {
          ema5: null,
          ema20: null,
          rsi14: null,
          volumeRatio: null
        }
      }
    };
  }

  const lookback = Math.min(20, alignedStock.length - 1);
  const lastIdx = alignedStock.length - 1;
  const startIdx = lastIdx - lookback;

  const stockStart = alignedStock[startIdx].close;
  const stockEnd = alignedStock[lastIdx].close;
  const indexStart = alignedIndex[startIdx].close;
  const indexEnd = alignedIndex[lastIdx].close;

  const stockReturnPct = Number((((stockEnd - stockStart) / stockStart) * 100).toFixed(2));
  const indexReturnPct = Number((((indexEnd - indexStart) / indexStart) * 100).toFixed(2));
  const relativeAlphaPct = Number((stockReturnPct - indexReturnPct).toFixed(2));

  // RS series and slope
  const rsRatios = alignedStock.map((s, i) => s.close / alignedIndex[i].close);
  const rsEma = calculateEMA(rsRatios, 10);
  const curRS = rsRatios[lastIdx];
  const prevRS = rsRatios[Math.max(0, lastIdx - 5)];
  const rsSlope = Number((((curRS - prevRS) / prevRS) * 100).toFixed(2));

  // Technical calculations on stock
  const closes = alignedStock.map(c => c.close);
  const ema5 = calculateEMA(closes, 5)[lastIdx] ?? null;
  const ema20 = calculateEMA(closes, 20)[lastIdx] ?? null;
  const rsi14 = calculateRSI(closes, 14)[lastIdx] ?? null;

  // Support / Resistance
  const zones = detectSupportResistanceZones(alignedStock, '1mo', timeframe);
  const supports = zones.filter(z => z.type === 'SUPPORT');
  const nearestSupport = supports.length > 0 ? supports[0].pivotPrice : null;
  const distanceToSupportPct = nearestSupport != null && stockEnd > 0
    ? Number((((stockEnd - nearestSupport) / stockEnd) * 100).toFixed(2))
    : null;

  // Volume ratio
  const volumes = alignedStock.map(c => c.volume);
  const recentVol = volumes[lastIdx];
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(20, volumes.length));
  const volumeRatio = avgVol > 0 ? Number((recentVol / avgVol).toFixed(2)) : 1.0;

  // 1. Endeks yükselirken endeksten daha güçlü hisseler
  if (indexReturnPct > 0.5 && relativeAlphaPct > 0.5) {
    matchedCategories.push('INDEX_UP_STOCK_STRONGER');
  }

  // 2. Endeks yükselirken göreceli gücü artan hisseler
  if (indexReturnPct > 0 && rsSlope > 0.5 && curRS >= (rsEma[lastIdx] ?? curRS)) {
    matchedCategories.push('INDEX_UP_RS_EXPANDING');
  }

  // 3. Endeks yatayken güç kazanan hisseler
  if (Math.abs(indexReturnPct) <= 1.0 && stockReturnPct >= 1.0 && relativeAlphaPct > 0.5) {
    matchedCategories.push('INDEX_SIDEWAYS_STOCK_GAINING');
  }

  // 4. Endeks düşerken daha az gerileyen hisseler
  if (indexReturnPct < -0.8 && stockReturnPct < 0 && relativeAlphaPct > 0.5) {
    matchedCategories.push('INDEX_DOWN_STOCK_LESS_DROP');
  }

  // 5. Endeks düşerken yükselişini sürdüren hisseler
  if (indexReturnPct < -0.8 && stockReturnPct > 0) {
    matchedCategories.push('INDEX_DOWN_STOCK_RISING');
  }

  // 6. Endeks düşüşüne direnç gösteren hisseler (destek üzerinde tutunuyor ve alfa pozitif)
  if (indexReturnPct < -0.8 && (distanceToSupportPct == null || distanceToSupportPct >= 0) && relativeAlphaPct > 1.0) {
    matchedCategories.push('INDEX_DOWN_STOCK_RESILIENT');
  }

  // 7. Endekse kıyasla zayıflayan hisseler
  if (relativeAlphaPct < -1.5 && rsSlope < -0.3) {
    matchedCategories.push('INDEX_RELATIVELY_WEAK');
  }

  // 8. Düşüş riski artan hisseler (çoklu teknik risk teyidi)
  const isBelowEma20 = ema20 != null && stockEnd < ema20;
  const isRSDropping = rsSlope < -0.5;
  const isSupportBroken = distanceToSupportPct != null && distanceToSupportPct < 0;
  const isBearVolume = stockEnd < alignedStock[lastIdx].open && volumeRatio > 1.2;

  let riskFactorsCount = 0;
  if (isBelowEma20) riskFactorsCount++;
  if (isRSDropping) riskFactorsCount++;
  if (isSupportBroken) riskFactorsCount++;
  if (isBearVolume) riskFactorsCount++;
  if (indexReturnPct < -1.0) riskFactorsCount++;

  if (riskFactorsCount >= 3) {
    matchedCategories.push('DOWNSIDE_RISK_INCREASING');
  }

  // Calculate RS Score (0-100)
  let rsScore = Math.max(0, Math.min(100, Math.round(50 + relativeAlphaPct * 4 + rsSlope * 5)));
  if (matchedCategories.includes('DOWNSIDE_RISK_INCREASING')) {
    rsScore = Math.min(rsScore, 35);
  }

  const primaryCategory = matchedCategories[0] || 'INDEX_UP_STOCK_STRONGER';
  const categoryTitles: Record<ScreenerCategory, string> = {
    INDEX_UP_STOCK_STRONGER: 'Endeks Yükselirken Endeksten Güçlü',
    INDEX_UP_RS_EXPANDING: 'Endeks Yükselirken Göreceli Gücü Artan',
    INDEX_SIDEWAYS_STOCK_GAINING: 'Endeks Yatayken Güç Kazanan',
    INDEX_DOWN_STOCK_LESS_DROP: 'Endeks Düşerken Daha Az Gerileyen',
    INDEX_DOWN_STOCK_RISING: 'Endeks Düşerken Yükselişini Sürdüren',
    INDEX_DOWN_STOCK_RESILIENT: 'Endeks Düşüşüne Direnç Gösteren',
    INDEX_RELATIVELY_WEAK: 'Endekse Kıyasla Zayıflayan',
    DOWNSIDE_RISK_INCREASING: 'Düşüş Riski Artan'
  };

  const technicalReason = 
    `Zaman dilimi: ${timeframe}, Hisse Getirisi: %${stockReturnPct}, Endeks: %${indexReturnPct}, ` +
    `Alfa: %${relativeAlphaPct > 0 ? '+' : ''}${relativeAlphaPct}, RS Eğimi: %${rsSlope}. ` +
    `Tek mum rengi değil, senkronize ${lookback} barlık getiri farkı ile doğrulanmıştır.`;

  return {
    matchedCategories,
    screenerItem: {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      currentPrice: stockEnd,
      changePercent: stock.changePercent,
      stockReturnPct,
      indexReturnPct,
      relativeAlphaPct,
      category: primaryCategory,
      categoryTitle: categoryTitles[primaryCategory],
      rsScore,
      technicalReason,
      isConfirmed: true,
      timeframe,
      indicators: {
        ema5: ema5 != null ? Number(ema5.toFixed(2)) : null,
        ema20: ema20 != null ? Number(ema20.toFixed(2)) : null,
        rsi14: rsi14 != null ? Number(rsi14.toFixed(1)) : null,
        volumeRatio,
        supportPrice: nearestSupport != null ? Number(nearestSupport.toFixed(2)) : null,
        distanceToSupportPct
      }
    }
  };
}

/**
 * 4. Dual Tracking & Condition Evaluation (e.g. EREGL vs XU100)
 */
export function evaluateDualTrackConditions(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[]
): DualTrackConditionStatus[] {
  const { alignedStock, alignedIndex } = alignOHLCVCandles(stockCandles, indexCandles);

  if (alignedStock.length < 20) {
    return [];
  }

  const lastIdx = alignedStock.length - 1;
  const prevIdx = lastIdx - 1;

  const stockCloses = alignedStock.map(c => c.close);
  const indexCloses = alignedIndex.map(c => c.close);

  const stockEma5 = calculateEMA(stockCloses, 5);
  const stockEma20 = calculateEMA(stockCloses, 20);
  const indexEma20 = calculateEMA(indexCloses, 20);

  const stockPrice = stockCloses[lastIdx];
  const indexPrice = indexCloses[lastIdx];

  // 1. Endeks EMA20 altına indi
  const indexBelowEma20 = indexEma20[lastIdx] != null && indexPrice < indexEma20[lastIdx]!;

  // 2. Hisse EMA20 altına indi
  const stockBelowEma20 = stockEma20[lastIdx] != null && stockPrice < stockEma20[lastIdx]!;

  // 3. EMA5, EMA20'yi aşağı kesti (Death Cross / Bearish Cross)
  const prevE5 = stockEma5[prevIdx] ?? stockPrice;
  const prevE20 = stockEma20[prevIdx] ?? stockPrice;
  const curE5 = stockEma5[lastIdx] ?? stockPrice;
  const curE20 = stockEma20[lastIdx] ?? stockPrice;
  const emaCrossDown = prevE5 >= prevE20 && curE5 < curE20;

  // 4. Hisse önemli desteğini kırdı
  const zones = detectSupportResistanceZones(alignedStock, '1mo', '1d');
  const supports = zones.filter(z => z.type === 'SUPPORT');
  const nearestSupport = supports.length > 0 ? supports[0].pivotPrice : null;
  const stockBrokeSupport = nearestSupport != null && stockPrice < nearestSupport;

  // 5. Hisse endekse göre güç kaybetti (RS geriledi)
  const rsRatios = alignedStock.map((s, i) => s.close / alignedIndex[i].close);
  const rsSlope5 = rsRatios.length > 5
    ? (rsRatios[lastIdx] - rsRatios[lastIdx - 5]) / rsRatios[lastIdx - 5]
    : 0;
  const stockLostRS = rsSlope5 < -0.01;

  // 6. Göreceli güç göstergesi geriledi (son 3 barda ardışık düşüş)
  const rsRetreat = rsRatios.length > 3 &&
    rsRatios[lastIdx] < rsRatios[lastIdx - 1] &&
    rsRatios[lastIdx - 1] < rsRatios[lastIdx - 2];

  // 7. Yükselen kanal aşağı kırıldı
  const channels = detectAutoChannels(alignedStock);
  const upChannel = channels.find(ch => ch.type === 'CHANNEL_UP');
  const upwardChannelBroken = upChannel != null && stockPrice < upChannel.lowerPriceNow;

  // 8. Dirençten başarısız dönüş gerçekleşti (fitil dirençten red yedi)
  const resistances = zones.filter(z => z.type === 'RESISTANCE');
  const nearestRes = resistances.length > 0 ? resistances[0].pivotPrice : null;
  const candle = alignedStock[lastIdx];
  const resistanceRejection = nearestRes != null &&
    candle.high >= nearestRes * 0.995 &&
    candle.close < nearestRes * 0.985 &&
    (candle.high - Math.max(candle.open, candle.close)) > (Math.abs(candle.close - candle.open) * 0.8);

  // 9. Hacim artışıyla destek kırıldı
  const volumes = alignedStock.map(c => c.volume);
  const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volRatio = avgVol > 0 ? candle.volume / avgVol : 1;
  const supportBreakWithVolume = stockBrokeSupport && volRatio >= 1.3;

  const dateStr = candle.dateStr || new Date(candle.timestamp).toISOString().slice(0, 10);

  return [
    {
      condition: 'INDEX_BELOW_EMA20',
      title: 'Endeks EMA20 Altına İndi',
      description: 'Endeks kapanış fiyatı 20 günlük EMA ortalamasının altına geriledi.',
      isTriggered: indexBelowEma20,
      valueDescription: `Endeks: ${indexPrice.toFixed(2)} | EMA20: ${(indexEma20[lastIdx] ?? 0).toFixed(2)}`,
      triggeredAt: indexBelowEma20 ? dateStr : undefined
    },
    {
      condition: 'STOCK_BELOW_EMA20',
      title: 'Hisse EMA20 Altına İndi',
      description: 'Hisse kapanış fiyatı 20 periyotluk EMA dinamik trend desteğinin altına sarktı.',
      isTriggered: stockBelowEma20,
      valueDescription: `Hisse: ${stockPrice.toFixed(2)} TL | EMA20: ${(stockEma20[lastIdx] ?? 0).toFixed(2)} TL`,
      triggeredAt: stockBelowEma20 ? dateStr : undefined
    },
    {
      condition: 'EMA5_CROSS_EMA20_DOWN',
      title: 'EMA5, EMA20\'yi Aşağı Kesti (Ayı Kesişimi)',
      description: 'Kısa vadeli EMA5, orta vadeli EMA20 ortalamasını aşağı yönlü keserek trend değişim sinyali verdi.',
      isTriggered: emaCrossDown,
      valueDescription: `EMA5: ${(stockEma5[lastIdx] ?? 0).toFixed(2)} TL | EMA20: ${(stockEma20[lastIdx] ?? 0).toFixed(2)} TL`,
      triggeredAt: emaCrossDown ? dateStr : undefined
    },
    {
      condition: 'STOCK_BROKE_SUPPORT',
      title: 'Hisse Önemli Desteğini Kırdı',
      description: 'Hisse kapanış fiyatı en yakın teyitli destek seviyesinin altına indi.',
      isTriggered: stockBrokeSupport,
      valueDescription: `Fiyat: ${stockPrice.toFixed(2)} TL | Kırılan Destek: ${nearestSupport ? nearestSupport.toFixed(2) + ' TL' : 'Mevcut Değil'}`,
      triggeredAt: stockBrokeSupport ? dateStr : undefined
    },
    {
      condition: 'STOCK_LOST_RS',
      title: 'Hisse Endekse Göre Güç Kaybetti',
      description: 'Hissenin endekse göre göreceli gücü son 5 barda negatif eğime geçti.',
      isTriggered: stockLostRS,
      valueDescription: `5 Barlık RS Değişimi: %${(rsSlope5 * 100).toFixed(2)}`,
      triggeredAt: stockLostRS ? dateStr : undefined
    },
    {
      condition: 'RS_INDICATOR_RETREAT',
      title: 'Göreceli Güç Göstergesi Geriledi',
      description: 'Hissenin endekse oranı (RS serisi) son 3 barda ardışık zayıfladı.',
      isTriggered: rsRetreat,
      valueDescription: `Son RS: ${rsRatios[lastIdx].toFixed(6)} | Önceki RS: ${rsRatios[lastIdx - 1]?.toFixed(6) ?? '-'}`,
      triggeredAt: rsRetreat ? dateStr : undefined
    },
    {
      condition: 'UPWARD_CHANNEL_BROKEN',
      title: 'Yükselen Kanal Aşağı Kırıldı',
      description: 'Otomatik regresyon kanalının alt bandı aşağı yönlü ihlal edildi.',
      isTriggered: upwardChannelBroken,
      valueDescription: upChannel ? `Kanal Altı: ${upChannel.lowerPriceNow.toFixed(2)} TL | Kapanış: ${stockPrice.toFixed(2)} TL` : 'Kanal Yok',
      triggeredAt: upwardChannelBroken ? dateStr : undefined
    },
    {
      condition: 'RESISTANCE_REJECTION',
      title: 'Dirençten Başarısız Dönüş Gerçekleşti',
      description: 'Fiyat direnç seviyesine fitil atıp güçlü satış baskısıyla geri çekildi.',
      isTriggered: resistanceRejection,
      valueDescription: `Zirve: ${candle.high.toFixed(2)} TL | Direnç: ${nearestRes ? nearestRes.toFixed(2) + ' TL' : '-'} | Kapanış: ${stockPrice.toFixed(2)} TL`,
      triggeredAt: resistanceRejection ? dateStr : undefined
    },
    {
      condition: 'SUPPORT_BREAK_WITH_VOLUME',
      title: 'Hacim Artışıyla Destek Kırıldı',
      description: 'Destek seviyesi, 20 barlık ortalamanın en az %30 üzerindeki yüksek hacimle kırıldı.',
      isTriggered: supportBreakWithVolume,
      valueDescription: `Hacim Oranı: ${volRatio.toFixed(2)}x (Eşik >= 1.3x) | Destek Kırılımı Teyitli`,
      triggeredAt: supportBreakWithVolume ? dateStr : undefined
    }
  ];
}

/**
 * 5. Downside Risk Assessment (Explainable Multi-Factor Risk Scoring)
 * Strictly does NOT claim predictive certainty.
 */
export function assessDownsideRisk(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[],
  symbol: string,
  indexSymbol: string = 'XU100',
  timeframe: string = '1d'
): DownsideRiskAssessment {
  const conditions = evaluateDualTrackConditions(stockCandles, indexCandles);
  const regimeReport = classifyMarketRegime(indexCandles, indexSymbol);

  const getCond = (c: DualTrackConditionType) => conditions.find(item => item.condition === c);

  const brokeSupport = getCond('STOCK_BROKE_SUPPORT')?.isTriggered ?? false;
  const belowEma20 = getCond('STOCK_BELOW_EMA20')?.isTriggered ?? false;
  const lostRS = getCond('STOCK_LOST_RS')?.isTriggered ?? false;
  const channelBroken = getCond('UPWARD_CHANNEL_BROKEN')?.isTriggered ?? false;
  const volSupportBreak = getCond('SUPPORT_BREAK_WITH_VOLUME')?.isTriggered ?? false;
  const indexWeak = regimeReport.regime === 'WEAK_BEAR' || regimeReport.regime === 'STRONG_BEAR';

  const factors: DownsideRiskFactor[] = [
    {
      id: 'F_SUPPORT_BREAK',
      title: 'Teknik Destek Kırılımı',
      weight: 25,
      isTriggered: brokeSupport,
      detail: brokeSupport
        ? 'Kapanış fiyatı tespit edilen teyitli destek seviyesinin altına indi.'
        : 'Destek seviyeleri üzerinde güvenli bölgede işlem görüyor.',
      severity: brokeSupport ? 'CRITICAL' : 'LOW'
    },
    {
      id: 'F_EMA20_BREAK',
      title: 'EMA20 Altına Geçiş',
      weight: 20,
      isTriggered: belowEma20,
      detail: belowEma20
        ? 'Fiyat 20 periyotluk ana hareketli ortalamanın altında zayıf trendde.'
        : 'Fiyat dinamik EMA20 desteği üzerinde güç koruyor.',
      severity: belowEma20 ? 'HIGH' : 'LOW'
    },
    {
      id: 'F_RS_DETERIORATION',
      title: 'Göreceli Güç Kaybı (RS Gerilemesi)',
      weight: 20,
      isTriggered: lostRS,
      detail: lostRS
        ? 'Hisse getirisi referans endekse göre zayıflamakta (negatif alfa).'
        : 'Hisse endekse kıyasla göreceli gücünü muhafaza ediyor.',
      severity: lostRS ? 'HIGH' : 'LOW'
    },
    {
      id: 'F_INDEX_WEAKNESS',
      title: 'Endeksin Zayıflaması / Negatif Piyasa Rejimi',
      weight: 15,
      isTriggered: indexWeak,
      detail: indexWeak
        ? `Referans endeks (${indexSymbol}) negatif rejimde (${regimeReport.regimeLabel}).`
        : `Referans endeks (${indexSymbol}) destekleyici veya yatay rejimde.`,
      severity: indexWeak ? 'MEDIUM' : 'LOW'
    },
    {
      id: 'F_CHANNEL_BREAKDOWN',
      title: 'Yükselen Kanal Kırılımı',
      weight: 10,
      isTriggered: channelBroken,
      detail: channelBroken
        ? 'Regresyon kanalının alt bandı kırıldı, momentum kaybı mevcut.'
        : 'Kanal içi düzenli fiyat hareketi sürüyor.',
      severity: channelBroken ? 'MEDIUM' : 'LOW'
    },
    {
      id: 'F_VOLUME_CONFIRMATION',
      title: 'Hacimle Doğrulanan Düşüş Baskısı',
      weight: 10,
      isTriggered: volSupportBreak,
      detail: volSupportBreak
        ? 'Ortalama üzeri yüksek hacim ile destek ihlali gerçekleşti.'
        : 'Yüksek hacimli bir panik satışı veya destek kırılımı görülmedi.',
      severity: volSupportBreak ? 'CRITICAL' : 'LOW'
    }
  ];

  let riskScore = 0;
  for (const f of factors) {
    if (f.isTriggered) {
      riskScore += f.weight;
    }
  }

  let riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK' = 'DÜŞÜK';
  let riskLevelColor = '#10b981'; // green

  if (riskScore >= 75) {
    riskLevel = 'KRİTİK';
    riskLevelColor = '#ef4444'; // red
  } else if (riskScore >= 50) {
    riskLevel = 'YÜKSEK';
    riskLevelColor = '#f97316'; // orange
  } else if (riskScore >= 25) {
    riskLevel = 'ORTA';
    riskLevelColor = '#f59e0b'; // amber
  }

  const triggeredCount = factors.filter(f => f.isTriggered).length;
  const summary = `${factors.length} temel risk faktöründen ${triggeredCount} tanesi aktif. Toplam Risk Skoru: ${riskScore}/100 (${riskLevel}).`;

  const disclaimer = 
    `UYARI: Bu sistem gelecekteki kesin fiyat hareketlerini veya düşüşleri tahmin ettiğini iddia etmez. ` +
    `Yukarıda listelenen teknik faktörler, hissenin piyasa ve teknik koşullara göre karşılaşabileceği olası ` +
    `risk faktörlerinin şeffaf ve açıklanabilir bir özetidir. Yatırım kararlarınızı yalnızca bu skora dayandırmayınız.`;

  const currentPrice = stockCandles[stockCandles.length - 1]?.close || 0;

  return {
    symbol: symbol.toUpperCase(),
    indexSymbol: indexSymbol.toUpperCase(),
    currentPrice,
    riskScore,
    riskLevel,
    riskLevelColor,
    disclaimer,
    factors,
    summary,
    timeframe,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * 6. Historical Performance Validation (Backtest Relative Strength Strategy)
 * Strategy: "Endekse Göre Güçlü Hisse Momentum Stratejisi"
 * Strict Constraints:
 * - Deducts BIST Commission (%0.15) and Slippage (%0.10) per trade.
 * - Strict Zero Lookahead Bias (sequential bar execution).
 */
export function runRSStrategyBacktest(
  stockCandles: OHLCV[],
  indexCandles: OHLCV[],
  params: RSBacktestParams
): RSBacktestResult {
  const { alignedStock, alignedIndex } = alignOHLCVCandles(stockCandles, indexCandles);

  const initialCapital = params.initialCapital || 100000;
  const commissionPct = params.commissionPct ?? 0.15;
  const slippagePct = params.slippagePct ?? 0.10;
  const alphaThresholdPct = params.alphaThresholdPct ?? 0.5;
  const stopLossPct = params.stopLossPct ?? 4.0;
  const takeProfitPct = params.takeProfitPct ?? 8.0;

  if (alignedStock.length < 30) {
    return {
      symbol: params.symbol.toUpperCase(),
      indexSymbol: params.indexSymbol.toUpperCase(),
      timeframe: params.timeframe,
      testPeriod: {
        startDate: '',
        endDate: '',
        totalBars: alignedStock.length
      },
      initialCapital,
      finalCapital: initialCapital,
      stockReturnPct: 0,
      indexReturnPct: 0,
      relativeAlphaPct: 0,
      strategyReturnPct: 0,
      strategyAlphaVsIndex: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRatePct: 0,
      profitFactor: 0,
      maxDrawdownPct: 0,
      totalCommissionsTL: 0,
      totalSlippageTL: 0,
      equityCurve: [],
      trades: [],
      disclaimer: 'Backtest için en az 30 senkronize bar gereklidir.'
    };
  }

  const stockCloses = alignedStock.map(c => c.close);
  const indexCloses = alignedIndex.map(c => c.close);

  const stockEma20 = calculateEMA(stockCloses, 20);
  const rsRatios = alignedStock.map((s, i) => s.close / alignedIndex[i].close);
  const rsEma = calculateEMA(rsRatios, 10);

  let cash = initialCapital;
  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';
  let shares = 0;
  let totalCommissionsTL = 0;
  let totalSlippageTL = 0;
  let peakValue = initialCapital;
  let maxDrawdownPct = 0;

  const trades: RSBacktestResult['trades'] = [];
  const equityCurve: RSBacktestResult['equityCurve'] = [];

  const baseStock = stockCloses[20];
  const baseIndex = indexCloses[20];

  for (let t = 20; t < alignedStock.length; t++) {
    const curStock = stockCloses[t];
    const curDate = alignedStock[t].dateStr || new Date(alignedStock[t].timestamp).toISOString().slice(0, 10);
    const ema20Val = stockEma20[t] ?? curStock;
    const curRS = rsRatios[t];
    const curRSEma = rsEma[t] ?? curRS;

    // Relative performance over last 10 bars
    const stock10Return = ((curStock - stockCloses[t - 10]) / stockCloses[t - 10]) * 100;
    const index10Return = ((indexCloses[t] - indexCloses[t - 10]) / indexCloses[t - 10]) * 100;
    const alpha10 = stock10Return - index10Return;

    // Check exit if in position
    if (inPosition) {
      const returnPct = ((curStock - entryPrice) / entryPrice) * 100;
      let shouldExit = false;
      let exitReason = 'SIGNAL_EXIT';

      if (returnPct <= -stopLossPct) {
        shouldExit = true;
        exitReason = 'STOP_LOSS';
      } else if (returnPct >= takeProfitPct) {
        shouldExit = true;
        exitReason = 'TAKE_PROFIT';
      } else if (curStock < ema20Val || curRS < curRSEma) {
        shouldExit = true;
        exitReason = 'RS_EMA_BREAK';
      } else if (t === alignedStock.length - 1) {
        shouldExit = true;
        exitReason = 'END_OF_DATA';
      }

      if (shouldExit) {
        // Exit execution with costs
        const slippageTL = curStock * (slippagePct / 100) * shares;
        const netExitPrice = curStock - (curStock * (slippagePct / 100));
        const exitGross = netExitPrice * shares;
        const commissionTL = exitGross * (commissionPct / 100);

        totalCommissionsTL += commissionTL;
        totalSlippageTL += slippageTL;

        cash = exitGross - commissionTL;
        const pnlTL = (netExitPrice - entryPrice) * shares - commissionTL;
        const tradeReturnPct = Number((((netExitPrice - entryPrice) / entryPrice) * 100).toFixed(2));

        trades.push({
          id: `T_${trades.length + 1}`,
          entryDate,
          entryPrice: Number(entryPrice.toFixed(2)),
          exitDate: curDate,
          exitPrice: Number(netExitPrice.toFixed(2)),
          returnPct: tradeReturnPct,
          relativeAlphaPct: Number((tradeReturnPct - index10Return).toFixed(2)),
          exitReason,
          pnlTL: Number(pnlTL.toFixed(2))
        });

        inPosition = false;
        shares = 0;
      }
    } else {
      // Entry Signal: Stock > EMA20, RS > RS_EMA, alpha > alphaThresholdPct
      const entrySignal = curStock > ema20Val && curRS > curRSEma && alpha10 >= alphaThresholdPct;

      if (entrySignal && t < alignedStock.length - 1) {
        // Buy execution with costs
        const effectivePrice = curStock * (1 + slippagePct / 100);
        const slippageTL = curStock * (slippagePct / 100) * Math.floor(cash / effectivePrice);
        shares = Math.floor(cash / effectivePrice);

        if (shares > 0) {
          const tradeCost = shares * effectivePrice;
          const commissionTL = tradeCost * (commissionPct / 100);

          totalCommissionsTL += commissionTL;
          totalSlippageTL += slippageTL;

          cash -= (tradeCost + commissionTL);
          entryPrice = effectivePrice;
          entryDate = curDate;
          inPosition = true;
        }
      }
    }

    // Portfolio valuation
    const currentVal = inPosition ? cash + shares * curStock : cash;
    if (currentVal > peakValue) {
      peakValue = currentVal;
    }
    const currentDD = peakValue > 0 ? ((peakValue - currentVal) / peakValue) * 100 : 0;
    if (currentDD > maxDrawdownPct) {
      maxDrawdownPct = currentDD;
    }

    equityCurve.push({
      dateStr: curDate,
      strategyValue: Number(currentVal.toFixed(2)),
      stockValue: Number(((curStock / baseStock) * initialCapital).toFixed(2)),
      indexValue: Number(((indexCloses[t] / baseIndex) * initialCapital).toFixed(2))
    });
  }

  const finalCapital = equityCurve[equityCurve.length - 1]?.strategyValue ?? initialCapital;
  const strategyReturnPct = Number((((finalCapital - initialCapital) / initialCapital) * 100).toFixed(2));

  const startStock = stockCloses[20];
  const endStock = stockCloses[stockCloses.length - 1];
  const stockReturnPct = Number((((endStock - startStock) / startStock) * 100).toFixed(2));

  const startIndex = indexCloses[20];
  const endIndex = indexCloses[indexCloses.length - 1];
  const indexReturnPct = Number((((endIndex - startIndex) / startIndex) * 100).toFixed(2));

  const relativeAlphaPct = Number((stockReturnPct - indexReturnPct).toFixed(2));
  const strategyAlphaVsIndex = Number((strategyReturnPct - indexReturnPct).toFixed(2));

  const winningTrades = trades.filter(t => t.returnPct > 0).length;
  const losingTrades = trades.filter(t => t.returnPct <= 0).length;
  const winRatePct = trades.length > 0 ? Number(((winningTrades / trades.length) * 100).toFixed(1)) : 0;

  const grossProfits = trades.filter(t => t.pnlTL > 0).reduce((acc, t) => acc + t.pnlTL, 0);
  const grossLosses = Math.abs(trades.filter(t => t.pnlTL < 0).reduce((acc, t) => acc + t.pnlTL, 0));
  const profitFactor = grossLosses > 0 ? Number((grossProfits / grossLosses).toFixed(2)) : grossProfits > 0 ? 99 : 0;

  const disclaimer = 
    `Geçmiş performans gelecekteki sonuçların garantisi değildir. BIST işlem komisyonu (%${commissionPct}) ` +
    `ve kayma payı (%${slippagePct}) işlem bazında düşülmüştür. Gelecek verisi sızıntısı (lookahead bias) ` +
    `içermeyecek şekilde ardışık mumlarla test edilmiştir.`;

  return {
    symbol: params.symbol.toUpperCase(),
    indexSymbol: params.indexSymbol.toUpperCase(),
    timeframe: params.timeframe,
    testPeriod: {
      startDate: alignedStock[20].dateStr || '',
      endDate: alignedStock[alignedStock.length - 1].dateStr || '',
      totalBars: alignedStock.length - 20
    },
    initialCapital,
    finalCapital: Number(finalCapital.toFixed(2)),
    stockReturnPct,
    indexReturnPct,
    relativeAlphaPct,
    strategyReturnPct,
    strategyAlphaVsIndex,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRatePct,
    profitFactor,
    maxDrawdownPct: Number(maxDrawdownPct.toFixed(2)),
    totalCommissionsTL: Number(totalCommissionsTL.toFixed(2)),
    totalSlippageTL: Number(totalSlippageTL.toFixed(2)),
    equityCurve,
    trades,
    disclaimer
  };
}
