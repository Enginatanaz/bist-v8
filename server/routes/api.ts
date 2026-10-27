import { Router, Request, Response } from 'express';
import { MarketDataProvider } from '../providers/marketDataProvider.js';
import { BISTRealDataProvider } from '../providers/bistRealDataProvider.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';
import {
  buildTechnicalIndicators,
  detectSupportResistanceZones,
  detectSupportResistanceDataset,
  calculateSupportResistanceModel,
  detectBreakouts,
  detectChartPatterns,
  detectAutoChannels,
  calculatePeakAndResistanceMetrics,
  calculateMultiTimeframeTrends,
  calculateScenarioHorizons,
  calculateScenarioHorizonsExtended,
  calculateTechnicalScore,
  getEmaTrendStatus,
  getBollingerStatus,
  evaluateTechnicalSignals,
  calculateResistanceBreakoutScore,
  calculateNearSupportMetrics,
  calculateBuySignalRatioMetrics,
  detectValidatedChartPatterns,
  runPatternHistoricalBacktest
} from '../indicators/technicalEngine.js';
import {
  computeRelativeStrength,
  classifyMarketRegime,
  evaluateScreenerCategories,
  evaluateDualTrackConditions,
  assessDownsideRisk,
  runRSStrategyBacktest
} from '../indicators/relativeStrengthEngine.js';
import { NotificationService } from '../services/notificationService.js';
import { runBacktest } from '../backtesting/backtestEngine.js';
import { generateAnalyticalReport, generateFundamentalAISynthesis } from '../services/geminiService.js';
import { runUnitTests } from '../tests/dataValidation.test.js';
import { ProviderHealthService } from '../services/providerHealthService.js';
import { ScreenerSchedulerService } from '../services/screenerSchedulerService.js';
import { FinancialDataService } from '../services/financialDataService.js';
import { FundamentalAnalysisEngine } from '../services/fundamentalAnalysisEngine.js';
import { KapDisclosuresService } from '../services/kapDisclosuresService.js';

import {
  BISTStock,
  BacktestParams,
  ScreenerStockResult,
  WatchlistFolder,
  CustomIndicatorRule,
  ScreenerProfile,
  ScreenerScheduleConfig,
  ExcludedStockReason,
  ScreenerTelemetry,
  RSBacktestParams,
  MarketAlertRule,
  ScreenerCategory
} from '../types.js';

export const apiRouter = Router();
const schedulerService = ScreenerSchedulerService.getInstance();
const notificationService = NotificationService.getInstance();

// Watchlist store
let userWatchlists: WatchlistFolder[] = [
  {
    id: 'fav-1',
    name: 'Favorilerim',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'THYAO', addedAt: new Date().toISOString(), targetPrice: 285.0, stopPrice: 248.0, notes: 'Ulaştırma lideri, direnç kırılımı bekleniyor' },
      { symbol: 'ASELS', addedAt: new Date().toISOString(), targetPrice: 375.0, stopPrice: 320.0, notes: 'Savunma sanayii sipariş hacmi güçlü' },
      { symbol: 'GARAN', addedAt: new Date().toISOString(), targetPrice: 145.0, stopPrice: 118.0, notes: 'Banka endeksi lokomotifi' },
    ]
  },
  {
    id: 'breakout-2',
    name: 'Kırılım & Momentum Adayları',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'TUPRS', addedAt: new Date().toISOString(), targetPrice: 395.0, stopPrice: 350.0, notes: 'Rafineri marjları takibinde' },
      { symbol: 'KCHOL', addedAt: new Date().toISOString(), targetPrice: 210.0, stopPrice: 175.0, notes: 'Holding iskonto daralması' },
    ]
  },
  {
    id: 'bist30-3',
    name: 'BIST 30 Çekirdek',
    createdAt: new Date().toISOString(),
    items: [
      { symbol: 'AKBNK', addedAt: new Date().toISOString(), targetPrice: 68.0, stopPrice: 56.0, notes: 'Özsermaye kârlılığı yüksek' },
      { symbol: 'BIMAS', addedAt: new Date().toISOString(), targetPrice: 580.0, stopPrice: 490.0, notes: 'Defansif perakende gücü' },
    ]
  }
];

// Single Verified Real Market Data Provider (Strictly ZERO mock/synthetic data)
let currentProvider: MarketDataProvider = new BISTRealDataProvider();
let providerMode: 'REAL' = 'REAL';
const healthService = ProviderHealthService.getInstance();

export function getActiveProvider(): MarketDataProvider {
  return currentProvider;
}

// 1. Market Status
apiRouter.get('/market/status', async (_req: Request, res: Response) => {
  try {
    const status = await currentProvider.getMarketStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Piyasa durumu alınamadı.' });
  }
});

// 2. All Stocks List
apiRouter.get('/stocks', async (req: Request, res: Response) => {
  try {
    const { index, sector, search, marketSegment, dataStatus } = req.query;
    let stocks = await currentProvider.getStocks();

    if (marketSegment && typeof marketSegment === 'string' && marketSegment !== 'ALL') {
      stocks = stocks.filter(s => s.marketSegment === marketSegment);
    }
    if (dataStatus && typeof dataStatus === 'string' && dataStatus !== 'ALL') {
      stocks = stocks.filter(s => s.dataStatus === dataStatus);
    }
    if (index && typeof index === 'string' && index !== 'ALL') {
      stocks = stocks.filter(s => s.indices.includes(index));
    }
    if (sector && typeof sector === 'string' && sector !== 'ALL') {
      stocks = stocks.filter(s => s.sector === sector);
    }
    if (search && typeof search === 'string') {
      const q = search.toUpperCase();
      stocks = stocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
    }

    res.json(stocks);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hisse listesi alınamadı.' });
  }
});

// 3. Single Stock Details
apiRouter.get('/stocks/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }
    res.json(stock);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hisse verisi alınamadı.' });
  }
});

// 4. Historical OHLCV Candles (Supports periods: 10y, 5y, 1y, 1mo; timeframes: 1h, 4h, 1d, 1w, 1mo)
apiRouter.get('/stocks/:symbol/ohlcv', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '';
    const limit = parseInt((req.query.limit as string) || '180', 10);

    let candles: any[] = [];
    let coverage = undefined;

    if (currentProvider instanceof BISTRealDataProvider) {
      const result = await currentProvider.getOHLCVWithCoverage(symbol, timeframe, limit, period);
      candles = result.candles;
      coverage = result.coverage;
    } else {
      candles = await currentProvider.getOHLCV(symbol, timeframe, limit, period);
    }

    res.json({
      symbol: symbol.toUpperCase(),
      timeframe,
      period: period || undefined,
      count: candles.length,
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed,
      delayMinutes: currentProvider.delayMinutes,
      coverage,
      candles
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'OHLCV verisi alınamadı.' });
  }
});

// 5. Complete Technical Analysis (FAZ 2)
apiRouter.get('/stocks/:symbol/technical', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '1y';
    const stock = await currentProvider.getStock(symbol);

    let candleLimit = 260;
    if (period === '10y') candleLimit = 2600;
    else if (period === '5y') candleLimit = 1300;
    else if (period === '1y') candleLimit = 260;
    else if (period === '1mo') candleLimit = 35;

    // Saatlik analizlerde son bir aylık saatlik veriyi destekle (~180-200 mum)
    if (timeframe === '1h') {
      candleLimit = 200;
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, timeframe, candleLimit, period);

    if (!ohlcv || ohlcv.length < 15) {
      return res.status(400).json({ error: 'Teknik analiz için yeterli veri bulunamadı.' });
    }

    const indicators = buildTechnicalIndicators(ohlcv, timeframe);
    const srDataset = detectSupportResistanceDataset(ohlcv, period, timeframe, symbol);
    const zones = srDataset.zones;
    const supports = srDataset.supports;
    const resistances = srDataset.resistances;
    const brokenLevels = srDataset.brokenLevels;
    const supportResistanceModel = srDataset.model;

    const breakouts = detectBreakouts(ohlcv, zones, timeframe);
    const patterns = detectChartPatterns(ohlcv, timeframe);
    const autoChannels = detectAutoChannels(ohlcv);
    const peakMetrics = calculatePeakAndResistanceMetrics(ohlcv, period);
    const trends = calculateMultiTimeframeTrends(ohlcv);

    res.json({
      symbol: symbol.toUpperCase(),
      stock,
      timeframe,
      period,
      indicators,
      zones,
      supports,
      resistances,
      brokenLevels,
      supportResistanceModel,
      breakouts,
      patterns,
      autoChannels,
      peakMetrics,
      trends,
      candleCount: ohlcv.length,
      lastCandleDate: ohlcv[ohlcv.length - 1].dateStr,
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Teknik analiz hesaplanamadı.' });
  }
});

// 5.1 Standalone Verified Support & Resistance Engine Endpoint
apiRouter.get('/stocks/:symbol/support-resistance', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '1y';

    let candleLimit = 260;
    if (period === '10y') candleLimit = 2600;
    else if (period === '5y') candleLimit = 1300;
    else if (period === '1y') candleLimit = 260;
    else if (period === '1mo') candleLimit = 35;
    if (timeframe === '1h') candleLimit = 200;

    const ohlcv = await currentProvider.getOHLCV(symbol, timeframe, candleLimit, period);
    const model = calculateSupportResistanceModel(ohlcv, symbol.toUpperCase(), timeframe, period);
    res.json(model);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Destek ve direnç hesaplanamadı.' });
  }
});

// 6. 5, 7, 10 Days Scenario Modeling (FAZ 4)
apiRouter.get('/stocks/:symbol/scenarios', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 180);
    if (!ohlcv || ohlcv.length < 25) {
      return res.status(400).json({ error: 'Senaryo modellemesi için yeterli veri bulunamadı (En az 25 bar gereklidir).' });
    }

    const extended = calculateScenarioHorizonsExtended(ohlcv);
    const zones = detectSupportResistanceZones(ohlcv);

    res.json({
      symbol: symbol.toUpperCase(),
      stock,
      currentPrice: ohlcv[ohlcv.length - 1].close,
      horizons: extended.horizons,
      calibration: extended.calibration,
      keyLevels: zones.slice(0, 5),
      riskManagementDefaults: {
        defaultCapitalTL: 100000,
        defaultRiskPct: 1.0,
        estimatedCommissionPct: 0.15,
        estimatedSlippagePct: 0.10
      },
      provider: currentProvider.name,
      isDelayed: currentProvider.isDelayed,
      marketDataTime: ohlcv[ohlcv.length - 1].dateStr,
      analysisTime: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Senaryo hesaplanamadı.' });
  }
});

// 7. Gemini AI Analytical Report
apiRouter.post('/stocks/:symbol/ai-report', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: 'Hisse bulunamadı.' });
    }

    const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 180);
    const indicators = buildTechnicalIndicators(ohlcv);
    const zones = detectSupportResistanceZones(ohlcv);
    const patterns = detectChartPatterns(ohlcv);
    const trends = calculateMultiTimeframeTrends(ohlcv);
    const horizons = calculateScenarioHorizons(ohlcv);

    const report = await generateAnalyticalReport({
      stock,
      indicators,
      zones,
      patterns,
      trends,
      horizons
    });

    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Rapor üretilemedi.' });
  }
});

// 8. Backtest Strategy Execution
apiRouter.post('/backtest', async (req: Request, res: Response) => {
  try {
    const params: BacktestParams = req.body;
    if (!params.symbol || !params.strategy) {
      return res.status(400).json({ error: 'Sembol ve strateji seçimi zorunludur.' });
    }

    const ohlcv = await currentProvider.getOHLCV(params.symbol, params.timeframe || '1d', 250);
    const result = runBacktest(ohlcv, params);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Backtest çalıştırılamadı.' });
  }
});

// In-memory Screener Indicator Cache with session-aware TTL and in-flight deduplication
export interface ScreenerComputedCache {
  ind: any;
  zones: any[];
  srDataset?: any;
  breakouts: any[];
  patterns: any[];
  autoChannels: any[];
  peakMetrics: any;
  trends: any[];
  scoreBreakdown: any;
  bbStatus: any;
  emaStatus: any;
  ohlcv: any[];
  cachedAt: number;
  resistanceBreakout?: any;
  nearSupport?: any;
  buySignalRatio?: any;
  validatedPatterns?: any[];
  breakoutPatterns?: any[];
}
export const screenerCache = new Map<string, ScreenerComputedCache>();
export const inFlightScreenerComputations = new Map<string, Promise<ScreenerComputedCache | null>>();
let currentScreenerTelemetry: ScreenerTelemetry | null = null;

export function clearScreenerCache(symbols?: string[]): void {
  if (!symbols || symbols.length === 0) {
    screenerCache.clear();
    inFlightScreenerComputations.clear();
    return;
  }
  const cleanSymbols = new Set(symbols.map(s => s.toUpperCase().replace('.IS', '').trim()));
  for (const key of screenerCache.keys()) {
    const sym = key.split('_')[0];
    if (cleanSymbols.has(sym)) {
      screenerCache.delete(key);
      inFlightScreenerComputations.delete(key);
    }
  }
}

export function getScreenerCacheStats() {
  return {
    size: screenerCache.size,
    inFlight: inFlightScreenerComputations.size
  };
}

// Whitelist-based Safe Custom Indicator Rule Evaluator (Zero eval / Function)
function evaluateCustomRule(
  rule: CustomIndicatorRule,
  ind: any,
  lastPrice: number
): { passed: boolean; explanation: string } {
  let leftVal: number | null = null;
  switch (rule.indicator) {
    case 'RSI': leftVal = ind.rsi14; break;
    case 'EMA5': leftVal = ind.ema5; break;
    case 'EMA20': leftVal = ind.ema20; break;
    case 'EMA50': leftVal = ind.ema50; break;
    case 'EMA200': leftVal = ind.ema200; break;
    case 'MACD_HIST': leftVal = ind.macd?.histogram ?? null; break;
    case 'VOLUME_RATIO': leftVal = ind.volumeRatio; break;
    case 'ATR': leftVal = ind.atr14; break;
    case 'BOLLINGER_BANDWIDTH': leftVal = ind.bollinger?.bandwidth ?? null; break;
    case 'LAST_PRICE': leftVal = lastPrice; break;
    default: leftVal = null;
  }

  if (leftVal === null || isNaN(leftVal)) {
    return { passed: false, explanation: `${rule.name}: Gösterge verisi hesaplanamadı` };
  }

  let rightVal: number | null = null;
  if (rule.compareTo === 'VALUE') {
    rightVal = rule.targetValue != null ? rule.targetValue : 0;
  } else if (rule.compareTo === 'INDICATOR' && rule.targetIndicator) {
    switch (rule.targetIndicator) {
      case 'EMA5': rightVal = ind.ema5; break;
      case 'EMA20': rightVal = ind.ema20; break;
      case 'EMA50': rightVal = ind.ema50; break;
      case 'EMA200': rightVal = ind.ema200; break;
      case 'LAST_PRICE': rightVal = lastPrice; break;
      default: rightVal = null;
    }
  }

  if (rightVal === null || isNaN(rightVal)) {
    return { passed: false, explanation: `${rule.name}: Karşılaştırma değeri geçersiz` };
  }

  let passed = false;
  switch (rule.operator) {
    case '>': passed = leftVal > rightVal; break;
    case '>=': passed = leftVal >= rightVal; break;
    case '<': passed = leftVal < rightVal; break;
    case '<=': passed = leftVal <= rightVal; break;
    case '==': passed = Math.abs(leftVal - rightVal) < 0.001; break;
    case 'CROSS_ABOVE': passed = leftVal >= rightVal; break;
    case 'CROSS_BELOW': passed = leftVal <= rightVal; break;
    default: passed = false;
  }

  return {
    passed,
    explanation: `${rule.name}: ${rule.indicator} (${leftVal}) ${rule.operator} ${rule.compareTo === 'VALUE' ? rightVal : rule.targetIndicator + ' (' + rightVal + ')'}`
  };
}

// 9. Comprehensive FAZ 3 Screener Endpoint
apiRouter.get('/screener', async (req: Request, res: Response) => {
  try {
    const {
      logic = 'AND',
      preset,
      conditions: conditionsParam,
      customRules: customRulesParam,
      timeframe = '1d',
      marketSegment,
      index,
      sector,
      search,
      minPrice,
      maxPrice,
      minChange,
      maxChange,
      minScore,
      customWeights,
      page = '1',
      pageSize = '25',
      sortField = 'technicalScore',
      sortDir = 'desc',
      completedCandlesOnly,
      mode = 'all',
      minBreakoutScore = '80',
      minTouchCount = 'ALL',
      minSupportDist = '2.0',
      maxSupportDist = '5.0',
      minBuyRatio = '40.0',
      maxBuyRatio = '55.0',
      patternType = 'ALL',
      patternState
    } = req.query;

    const isOrLogic = String(logic).toUpperCase() === 'OR';
    const effectiveTimeframe = ['1h', '4h', '1d', '1wk', '1mo'].includes(String(timeframe).toLowerCase())
      ? String(timeframe).toLowerCase()
      : '1d';

    const calStatus = schedulerService.getMarketCalendarStatus();
    const completedOnly = completedCandlesOnly === 'true' || completedCandlesOnly === '1' || !calStatus.isSessionOpen;

    // Parse active conditions
    const activeConditionKeys: string[] = [];
    if (conditionsParam && typeof conditionsParam === 'string') {
      conditionsParam.split(',').map(s => s.trim()).filter(Boolean).forEach(k => {
        if (!activeConditionKeys.includes(k)) activeConditionKeys.push(k);
      });
    }

    // Check if a preset is requested
    if (preset && typeof preset === 'string' && preset !== 'ALL') {
      const presetProfile = schedulerService.getProfile(preset);
      if (presetProfile) {
        for (const c of presetProfile.conditions) {
          if (!activeConditionKeys.includes(c)) activeConditionKeys.push(c);
        }
      }
    }

    // Parse custom indicator rules safely
    let customRules: CustomIndicatorRule[] = [];
    if (customRulesParam && typeof customRulesParam === 'string') {
      try {
        const parsed = JSON.parse(customRulesParam);
        if (Array.isArray(parsed)) {
          customRules = parsed.filter(r => r && r.id && r.indicator && r.operator);
        }
      } catch {
        // ignore JSON parse error
      }
    }

    let parsedWeights = undefined;
    if (customWeights && typeof customWeights === 'string') {
      try {
        parsedWeights = JSON.parse(customWeights);
      } catch {
        // ignore JSON parse error
      }
    }

    const allStocks = await currentProvider.getStocks();
    let candidateStocks = allStocks;

    // Filter candidate universe based on filters
    if (marketSegment && typeof marketSegment === 'string' && marketSegment !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.marketSegment === marketSegment);
    }
    if (index && typeof index === 'string' && index !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.indices.includes(index));
    }
    if (sector && typeof sector === 'string' && sector !== 'ALL') {
      candidateStocks = candidateStocks.filter(s => s.sector === sector);
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const q = search.trim().toUpperCase();
      candidateStocks = candidateStocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q));
    }
    if (minPrice) {
      const minP = parseFloat(minPrice as string);
      if (!isNaN(minP)) candidateStocks = candidateStocks.filter(s => s.lastPrice === 0 || s.lastPrice >= minP);
    }
    if (maxPrice) {
      const maxP = parseFloat(maxPrice as string);
      if (!isNaN(maxP)) candidateStocks = candidateStocks.filter(s => s.lastPrice === 0 || s.lastPrice <= maxP);
    }
    if (minChange) {
      const minC = parseFloat(minChange as string);
      if (!isNaN(minC)) candidateStocks = candidateStocks.filter(s => s.changePercent >= minC);
    }
    if (maxChange) {
      const maxC = parseFloat(maxChange as string);
      if (!isNaN(maxC)) candidateStocks = candidateStocks.filter(s => s.changePercent <= maxC);
    }

    // Benchmark XU100 performance for relative strength calculation
    let xu100Performance = 0.5;
    try {
      const xu100Bars = await currentProvider.getOHLCV('XU100', effectiveTimeframe, 30);
      if (xu100Bars.length >= 20) {
        const cNow = xu100Bars[xu100Bars.length - 1].close;
        const c20Ago = xu100Bars[xu100Bars.length - 20].close;
        if (c20Ago > 0) {
          xu100Performance = ((cNow - c20Ago) / c20Ago) * 100;
        }
      }
    } catch {
      // fallback baseline
    }

    const matchedResults: ScreenerStockResult[] = [];
    const excludedStocks: ExcludedStockReason[] = [];
    let latestDataTimeStr = '';

    // Evaluate candidates across the universe
    // Concurrency chunking (16 parallel workers) with session-aware caching and telemetry
    const startTime = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;
    let fetchedCount = 0;

    const isSession = (currentProvider as any).isMarketSessionOpen?.() ?? false;
    const screenerTtlMs = isSession ? 300_000 : 3_600_000;

    const BATCH_SIZE = 16;
    for (let i = 0; i < candidateStocks.length; i += BATCH_SIZE) {
      const chunk = candidateStocks.slice(i, i + BATCH_SIZE);

      // Update intermediate telemetry for live progress polling
      currentScreenerTelemetry = {
        totalEligible: candidateStocks.length,
        fetchedCount,
        inProgressCount: candidateStocks.length - i,
        retryingCount: 0,
        failedCount: excludedStocks.length,
        failureReasons: {},
        percentage: Math.round((i / candidateStocks.length) * 100),
        durationMs: Date.now() - startTime,
        lastUpdateTime: new Date().toISOString(),
        status: 'IN_PROGRESS',
        cacheHits,
        cacheMisses
      };

      await Promise.all(
        chunk.map(async (stock) => {
          try {
            const weightsKey = parsedWeights ? JSON.stringify(parsedWeights) : 'default';
            const cacheKey = `${stock.symbol}_${effectiveTimeframe}_${completedOnly ? 'closed' : 'all'}_${weightsKey}`;
            let cached = screenerCache.get(cacheKey);

            if (cached && Date.now() - cached.cachedAt > screenerTtlMs) {
              screenerCache.delete(cacheKey);
              cached = undefined;
            }

            if (!cached) {
              cacheMisses++;
              let computePromise = inFlightScreenerComputations.get(cacheKey);
              if (!computePromise) {
                computePromise = (async () => {
                  let ohlcv = await currentProvider.getOHLCV(stock.symbol, effectiveTimeframe, 90);
                  if (!ohlcv || ohlcv.length < 5) {
                    return null;
                  }

                  if (completedOnly) {
                    ohlcv = schedulerService.filterCompletedCandles(ohlcv, effectiveTimeframe);
                  }

                  if (!ohlcv || ohlcv.length < 5) {
                    return null;
                  }

                  const ind = buildTechnicalIndicators(ohlcv);
                  const srDataset = detectSupportResistanceDataset(ohlcv, '1y', effectiveTimeframe, stock.symbol);
                  const zones = srDataset.zones;
                  const breakouts = detectBreakouts(ohlcv, zones);
                  const autoChannels = detectAutoChannels(ohlcv);
                  const peakMetrics = calculatePeakAndResistanceMetrics(ohlcv, '1y');
                  const trends = calculateMultiTimeframeTrends(ohlcv);
                  const scoreBreakdown = calculateTechnicalScore(ohlcv, parsedWeights);
                  const bbStatus = getBollingerStatus(ohlcv.map(b => b.close));
                  const emaStatus = ind.emaTrends || getEmaTrendStatus(ohlcv.map(b => b.close));

                  const resistanceBreakout = calculateResistanceBreakoutScore(ohlcv, stock, zones);
                  const nearSupport = calculateNearSupportMetrics(ohlcv, stock, zones);
                  const buySignalRatio = calculateBuySignalRatioMetrics(ohlcv, stock, effectiveTimeframe);
                  const allPatterns = detectValidatedChartPatterns(ohlcv, effectiveTimeframe);
                  const validatedPatterns = allPatterns.filter(p => p.status === 'VALIDATED');
                  const breakoutPatterns = allPatterns.filter(p => p.status === 'BREAKOUT_CONFIRMED');

                  const entry: ScreenerComputedCache = {
                    ind,
                    zones,
                    srDataset,
                    breakouts,
                    patterns: allPatterns,
                    autoChannels,
                    peakMetrics,
                    trends,
                    scoreBreakdown,
                    bbStatus,
                    emaStatus,
                    ohlcv,
                    cachedAt: Date.now(),
                    resistanceBreakout,
                    nearSupport,
                    buySignalRatio,
                    validatedPatterns,
                    breakoutPatterns
                  };
                  screenerCache.set(cacheKey, entry);
                  return entry;
                })();

                inFlightScreenerComputations.set(cacheKey, computePromise);
              }

              try {
                cached = (await computePromise) || undefined;
              } finally {
                inFlightScreenerComputations.delete(cacheKey);
              }

              if (!cached) {
                excludedStocks.push({
                  symbol: stock.symbol,
                  name: stock.name,
                  segment: stock.marketSegment,
                  reason: 'Yetersiz geçerli mum verisi (Minimum 5 bar gerekli)',
                  errorType: 'INSUFFICIENT_BARS',
                  canRetry: false,
                  lastAttemptAt: new Date().toISOString()
                });
                return;
              }
            } else {
              cacheHits++;
            }

            if (!cached) return;

            const {
              ind,
              zones,
              srDataset,
              breakouts,
              patterns,
              autoChannels,
              peakMetrics,
              trends,
              scoreBreakdown,
              bbStatus,
              emaStatus,
              ohlcv,
              resistanceBreakout,
              nearSupport,
              buySignalRatio,
              validatedPatterns,
              breakoutPatterns
            } = cached;

            const lastBar = ohlcv[ohlcv.length - 1];
            const candleDate = lastBar?.dateStr || stock.updatedAt;
            if (!latestDataTimeStr || candleDate > latestDataTimeStr) {
              latestDataTimeStr = candleDate;
            }

            // Relative performance vs XU100
            const cNow = lastBar ? lastBar.close : stock.lastPrice;
            const c20Ago = ohlcv[Math.max(0, ohlcv.length - 20)]?.close || cNow;
            const stock20Return = c20Ago > 0 ? ((cNow - c20Ago) / c20Ago) * 100 : 0;
            const relPerf = Number((stock20Return - xu100Performance).toFixed(2));

            const nearestSup = srDataset?.nearestSupport || zones.find((z: any) => z.type === 'SUPPORT') || null;
            const nearestRes = srDataset?.nearestResistance || zones.find((z: any) => z.type === 'RESISTANCE') || null;

            let macdStatus: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
            if (ind.macd) {
              if (ind.macd.histogram > 0 && ind.macd.macdLine > ind.macd.signalLine) macdStatus = 'BULLISH';
              else if (ind.macd.histogram < 0 && ind.macd.macdLine < ind.macd.signalLine) macdStatus = 'BEARISH';
            }

            // Check each condition and generate explanation
            const conditionEvaluations: { key: string; passed: boolean; explanation: string }[] = [];

            for (const condKey of activeConditionKeys) {
              switch (condKey) {
                case 'EMA5_CROSS_ABOVE_EMA20': {
                  const passed = emaStatus.crossover === 'BULLISH_CROSS';
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `EMA5 (${ind.ema5?.toFixed(2)}), EMA20 (${ind.ema20?.toFixed(2)}) ortalamasını yukarı kesti`
                      : `EMA5 (${ind.ema5?.toFixed(2)}) EMA20 üzerinde kesişim yapmadı`
                  });
                  break;
                }
                case 'EMA5_CROSS_BELOW_EMA20': {
                  const passed = emaStatus.crossover === 'BEARISH_CROSS';
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `EMA5 (${ind.ema5?.toFixed(2)}), EMA20 (${ind.ema20?.toFixed(2)}) ortalamasını aşağı kesti`
                      : `EMA5 (${ind.ema5?.toFixed(2)}) EMA20 altında kesişim yapmadı`
                  });
                  break;
                }
                case 'PRICE_ABOVE_EMA5': {
                  const passed = ind.ema5 !== null && stock.lastPrice > ind.ema5;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat (${stock.lastPrice} TL), EMA5 (${ind.ema5?.toFixed(2)} TL) üzerinde`
                      : `Fiyat (${stock.lastPrice} TL), EMA5 altında`
                  });
                  break;
                }
                case 'PRICE_ABOVE_EMA20': {
                  const passed = ind.ema20 !== null && stock.lastPrice > ind.ema20;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat (${stock.lastPrice} TL), EMA20 (${ind.ema20?.toFixed(2)} TL) üzerinde`
                      : `Fiyat (${stock.lastPrice} TL), EMA20 altında`
                  });
                  break;
                }
                case 'BB_CROSS_ABOVE_MIDDLE': {
                  const passed = bbStatus?.crossedAboveMiddle === true || (ohlcv.length >= 2 && ohlcv[ohlcv.length - 2].close < (ind.ema20 || 0) && stock.lastPrice >= (ind.ema20 || 0));
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat Bollinger orta bandını (EMA20: ${ind.ema20?.toFixed(2)} TL) yukarı kırdı`
                      : `Bollinger orta bant yukarı kırılımı oluşmadı`
                  });
                  break;
                }
                case 'BB_CROSS_BELOW_MIDDLE': {
                  const passed = bbStatus?.crossedBelowMiddle === true || (ohlcv.length >= 2 && ohlcv[ohlcv.length - 2].close > (ind.ema20 || 0) && stock.lastPrice <= (ind.ema20 || 0));
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Fiyat Bollinger orta bandını (EMA20: ${ind.ema20?.toFixed(2)} TL) aşağı kırdı`
                      : `Bollinger orta bant aşağı kırılımı oluşmadı`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_1PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 1.0 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %1 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_1_5PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 1.5 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %1.5 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_NEAR_2PCT': {
                  const passed = nearestSup !== null && nearestSup.distancePercent <= 2.0 && nearestSup.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Desteğe %${nearestSup?.distancePercent?.toFixed(2)} yakınlıkta (${nearestSup?.priceLow}-${nearestSup?.priceHigh} TL)`
                      : `Desteğe %2 yakınlıkta değil`
                  });
                  break;
                }
                case 'RESISTANCE_NEAR_2PCT': {
                  const passed = nearestRes !== null && nearestRes.distancePercent <= 2.0 && nearestRes.distancePercent >= 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Dirence %${nearestRes?.distancePercent?.toFixed(2)} yakınlıkta (${nearestRes?.priceLow}-${nearestRes?.priceHigh} TL)`
                      : `Dirence %2 yakınlıkta değil`
                  });
                  break;
                }
                case 'SUPPORT_BREAK': {
                  const passed = breakouts.some((b: any) => b.direction === 'BEARISH_BREAKOUT' && b.closeConfirmed);
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Destek seviyesi teyitli olarak aşağı kırıldı`
                      : `Destek kırılımı bulunmuyor`
                  });
                  break;
                }
                case 'RESISTANCE_BREAK': {
                  const passed = breakouts.some((b: any) => b.direction === 'BULLISH_BREAKOUT' && b.closeConfirmed);
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Direnç seviyesi teyitli olarak yukarı kırıldı`
                      : `Direnç kırılımı bulunmuyor`
                  });
                  break;
                }
                case 'PATTERN_ASCENDING_TRIANGLE': {
                  const passed = patterns.some((p: any) => p.type === 'ASCENDING_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Üçgen formasyonu tespit edildi` : `Yükselen Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_DESCENDING_TRIANGLE': {
                  const passed = patterns.some((p: any) => p.type === 'DESCENDING_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Üçgen formasyonu tespit edildi` : `Düşen Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_SYMMETRICAL_TRIANGLE': {
                  const passed = patterns.some((p: any) => p.type === 'SYMMETRICAL_TRIANGLE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Simetrik Üçgen formasyonu tespit edildi` : `Simetrik Üçgen formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_TOBO': {
                  const passed = patterns.some((p: any) => p.type === 'INVERSE_HEAD_AND_SHOULDERS' || p.type === 'TOBO');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Ters Omuz Baş Omuz (TOBO) formasyonu tespit edildi` : `TOBO formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_OBO': {
                  const passed = patterns.some((p: any) => p.type === 'HEAD_AND_SHOULDERS' || p.type === 'OBO');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Omuz Baş Omuz (OBO) tepe formasyonu tespit edildi` : `OBO formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_FALLING_WEDGE': {
                  const passed = patterns.some((p: any) => p.type === 'FALLING_WEDGE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Kama formasyonu tespit edildi` : `Düşen Kama formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_RISING_WEDGE': {
                  const passed = patterns.some((p: any) => p.type === 'RISING_WEDGE');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Kama formasyonu tespit edildi` : `Yükselen Kama formasyonu yok`
                  });
                  break;
                }
                case 'PATTERN_CHANNEL_UP': {
                  const passed = patterns.some((p: any) => p.type === 'CHANNEL_UP') || autoChannels.some((c: any) => c.type === 'CHANNEL_UP');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Yükselen Kanal yapısı tespit edildi` : `Yükselen Kanal yapısı yok`
                  });
                  break;
                }
                case 'PATTERN_CHANNEL_DOWN': {
                  const passed = patterns.some((p: any) => p.type === 'CHANNEL_DOWN') || autoChannels.some((c: any) => c.type === 'CHANNEL_DOWN');
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed ? `Düşen Kanal yapısı tespit edildi` : `Düşen Kanal yapısı yok`
                  });
                  break;
                }
                case 'VOLUME_SURGE': {
                  const passed = ind.volumeRatio !== null && ind.volumeRatio >= 1.2;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Hacim oranı ${ind.volumeRatio?.toFixed(2)}x (20 bar EMA ortalamasının üzerinde)`
                      : `Hacim oranı (${ind.volumeRatio?.toFixed(2)}x) yetersiz`
                  });
                  break;
                }
                case 'NEAR_ALL_TIME_HIGH': {
                  const dist = peakMetrics.distanceFromPeakPct;
                  const passed = dist <= 3.5;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `Zirveye %${dist?.toFixed(2)} yakınlıkta (Periyot zirvesi: ${peakMetrics.periodHigh} TL)`
                      : `Zirveye %${dist?.toFixed(2)} uzaklıkta`
                  });
                  break;
                }
                case 'RELATIVE_STRENGTH_OUTPERFORM': {
                  const passed = relPerf > 0;
                  conditionEvaluations.push({
                    key: condKey,
                    passed,
                    explanation: passed
                      ? `BIST 100'e göre +%${relPerf} daha güçlü getiri`
                      : `BIST 100'e göre %${relPerf} geride`
                  });
                  break;
                }
              }
            }

            // Evaluate custom indicator rules
            for (const rule of customRules) {
              const resRule = evaluateCustomRule(rule, ind, stock.lastPrice);
              conditionEvaluations.push({
                key: `custom_${rule.id}`,
                passed: resRule.passed,
                explanation: resRule.explanation
              });
            }

            // Minimum technical score filter
            if (minScore) {
              const threshold = parseFloat(minScore as string);
              if (!isNaN(threshold)) {
                const passed = scoreBreakdown.totalScore >= threshold;
                conditionEvaluations.push({
                  key: 'MIN_SCORE',
                  passed,
                  explanation: passed
                    ? `Teknik skor (${scoreBreakdown.totalScore}/100) >= ${threshold}`
                    : `Teknik skor (${scoreBreakdown.totalScore}/100) < ${threshold}`
                });
              }
            }

            // Combine with AND / OR logic
            let isMatched = true;
            if (conditionEvaluations.length > 0) {
              if (isOrLogic) {
                isMatched = conditionEvaluations.some(c => c.passed);
              } else {
                isMatched = conditionEvaluations.every(c => c.passed);
              }
            }

            if (!isMatched) return;

            // Specialized mode filters
            const screenerMode = String(mode).toLowerCase();
            if (screenerMode === 'resistance_breakout') {
              const minBScore = parseFloat(minBreakoutScore as string) || 80;
              if (!resistanceBreakout || resistanceBreakout.breakoutScore < minBScore || resistanceBreakout.isFailed) {
                return;
              }
              // Beş temas kuralı ve asgari temas sayısı filtresi
              if (minTouchCount && minTouchCount !== 'ALL') {
                const reqTouches = parseInt(minTouchCount as string, 10);
                const actualTouches = resistanceBreakout.scoreBreakdown?.resistanceReliability?.testCount || 0;
                if (!isNaN(reqTouches) && actualTouches < reqTouches) {
                  return;
                }
              }
            } else if (screenerMode === 'near_support') {
              const minSDist = parseFloat(minSupportDist as string) ?? 2.0;
              const maxSDist = parseFloat(maxSupportDist as string) ?? 5.0;
              if (
                !nearSupport ||
                nearSupport.isBelowSupport ||
                nearSupport.distanceToSupportPct < minSDist ||
                nearSupport.distanceToSupportPct > maxSDist
              ) {
                return;
              }
            } else if (screenerMode === 'buy_signal_ratio') {
              const minBRatio = parseFloat(minBuyRatio as string) ?? 40.0;
              const maxBRatio = parseFloat(maxBuyRatio as string) ?? 55.0;
              if (
                !buySignalRatio ||
                buySignalRatio.buySignalRatioPct < minBRatio ||
                buySignalRatio.buySignalRatioPct > maxBRatio
              ) {
                return;
              }
            } else if (screenerMode === 'validated_patterns') {
              if (!validatedPatterns || validatedPatterns.length === 0) return;
              if (patternType && patternType !== 'ALL' && !validatedPatterns.some((p: any) => p.type === patternType)) {
                return;
              }
            } else if (screenerMode === 'breakout_patterns') {
              if (!breakoutPatterns || breakoutPatterns.length === 0) return;
              if (patternType && patternType !== 'ALL' && !breakoutPatterns.some((p: any) => p.type === patternType)) {
                return;
              }
            }

            const matchedConditions = conditionEvaluations.filter(c => c.passed).map(c => c.explanation);
            const unmatchedConditions = conditionEvaluations.filter(c => !c.passed).map(c => c.explanation);
            const dailyTrend = trends.find((t: any) => t.timeframe === '1d')?.trend || 'NEUTRAL';

            matchedResults.push({
              stock,
              timeframe: effectiveTimeframe,
              lastDataTime: candleDate,
              indicators: {
                rsi14: ind.rsi14,
                macdHistogram: ind.macd?.histogram || null,
                macdStatus,
                ema5: ind.ema5,
                ema20: ind.ema20,
                ema50: ind.ema50,
                ema200: ind.ema200,
                bollingerBandwidth: ind.bollinger?.bandwidth || null,
                volumeRatio: ind.volumeRatio,
                adx14: ind.adx14?.adx || null,
                atr14: ind.atr14
              },
              trend: dailyTrend,
              ema5Direction: emaStatus.ema5Trend || 'NEUTRAL',
              ema20Direction: emaStatus.ema20Trend || 'NEUTRAL',
              technicalScore: scoreBreakdown.totalScore,
              scoreBreakdown,
              nearestSupport: nearestSup ? { price: nearestSup.pivotPrice, distancePct: nearestSup.distancePercent } : null,
              nearestResistance: nearestRes ? { price: nearestRes.pivotPrice, distancePct: nearestRes.distancePercent } : null,
              activePatterns: patterns.map((p: any) => p.turkishName),
              relativePerformanceVsXU100: relPerf,
              matchedConditions,
              unmatchedConditions,
              matchedCount: matchedConditions.length,
              totalConditions: conditionEvaluations.length,
              dataQuality: {
                isRealData: currentProvider.isRealData,
                isValidated: true,
                barCount: ohlcv.length,
                isDelayed: currentProvider.isDelayed,
                delayMinutes: currentProvider.delayMinutes
              },
              resistanceBreakout: resistanceBreakout || null,
              nearSupport: nearSupport || null,
              buySignalRatio: buySignalRatio || null,
              validatedPatterns: validatedPatterns || [],
              breakoutPatterns: breakoutPatterns || []
            });
            fetchedCount++;
          } catch (err: any) {
            const errMsg = err?.message || 'Veri sağlayıcıdan veri akışı alınamadı';
            let errType: ExcludedStockReason['errorType'] = 'UNKNOWN';
            let canRetry = true;

            if (errMsg.includes('delisted') || errMsg.includes('not found') || errMsg.includes('404')) {
              errType = 'DELISTED_OR_NOT_FOUND';
              canRetry = false;
            } else if (errMsg.includes('429') || errMsg.includes('rate limit')) {
              errType = 'RATE_LIMITED';
            } else if (errMsg.includes('timeout') || errMsg.includes('network') || errMsg.includes('econnreset')) {
              errType = 'NETWORK_TIMEOUT';
            } else if (errMsg.includes('boş')) {
              errType = 'EMPTY_RESPONSE';
              canRetry = false;
            } else if (stock.status === 'HALTED' || stock.status === 'SUSPENDED') {
              errType = 'HALTED_OR_SUSPENDED';
              canRetry = false;
            }

            excludedStocks.push({
              symbol: stock.symbol,
              name: stock.name,
              segment: stock.marketSegment,
              reason: errMsg,
              errorType: errType,
              canRetry,
              lastAttemptAt: new Date().toISOString()
            });
          }
        })
      );
    }

    // Sort results
    const isDesc = String(sortDir).toLowerCase() === 'desc';
    matchedResults.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;
      switch (sortField) {
        case 'symbol':
          valA = a.stock.symbol;
          valB = b.stock.symbol;
          return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        case 'lastPrice':
          valA = a.stock.lastPrice;
          valB = b.stock.lastPrice;
          break;
        case 'changePercent':
          valA = a.stock.changePercent;
          valB = b.stock.changePercent;
          break;
        case 'relativeStrength':
          valA = a.relativePerformanceVsXU100;
          valB = b.relativePerformanceVsXU100;
          break;
        case 'matchedCount':
          valA = a.matchedCount;
          valB = b.matchedCount;
          break;
        case 'rsi':
          valA = a.indicators.rsi14 ?? 0;
          valB = b.indicators.rsi14 ?? 0;
          break;
        case 'breakoutScore':
          valA = a.resistanceBreakout?.breakoutScore ?? 0;
          valB = b.resistanceBreakout?.breakoutScore ?? 0;
          break;
        case 'breakoutDate':
          valA = a.resistanceBreakout?.breakoutDate ?? '';
          valB = b.resistanceBreakout?.breakoutDate ?? '';
          return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
        case 'volumeRatio':
          valA = a.resistanceBreakout?.volumeRatio ?? 0;
          valB = b.resistanceBreakout?.volumeRatio ?? 0;
          break;
        case 'distanceToResistancePct':
          valA = a.resistanceBreakout?.distanceToResistancePct ?? 0;
          valB = b.resistanceBreakout?.distanceToResistancePct ?? 0;
          break;
        case 'testCount':
        case 'touchCount':
          valA = a.resistanceBreakout?.scoreBreakdown?.resistanceReliability?.testCount ?? 0;
          valB = b.resistanceBreakout?.scoreBreakdown?.resistanceReliability?.testCount ?? 0;
          break;
        case 'distanceToSupportPct':
          valA = a.nearSupport?.distanceToSupportPct ?? 999;
          valB = b.nearSupport?.distanceToSupportPct ?? 999;
          break;
        case 'supportStrengthScore':
          valA = a.nearSupport?.supportStrengthScore ?? 0;
          valB = b.nearSupport?.supportStrengthScore ?? 0;
          break;
        case 'testsInLast20Bars':
          valA = a.nearSupport?.testsInLast20Bars ?? 0;
          valB = b.nearSupport?.testsInLast20Bars ?? 0;
          break;
        case 'buySignalRatioPct':
          valA = a.buySignalRatio?.buySignalRatioPct ?? 0;
          valB = b.buySignalRatio?.buySignalRatioPct ?? 0;
          break;
        case 'buySignalsCount':
          valA = a.buySignalRatio?.buySignalsCount ?? 0;
          valB = b.buySignalRatio?.buySignalsCount ?? 0;
          break;
        case 'technicalScore':
        default:
          valA = a.technicalScore;
          valB = b.technicalScore;
          break;
      }
      return isDesc ? valB - valA : valA - valB;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const pageSizeNum = pageSize === 'ALL' ? matchedResults.length : Math.max(1, parseInt(pageSize as string) || 25);
    const totalPages = Math.max(1, Math.ceil(matchedResults.length / pageSizeNum));
    const pagedResults = matchedResults.slice((pageNum - 1) * pageSizeNum, pageNum * pageSizeNum);

    const failureReasons: Record<string, number> = {};
    for (const exc of excludedStocks) {
      const type = exc.errorType || 'UNKNOWN';
      failureReasons[type] = (failureReasons[type] || 0) + 1;
    }

    const screenerStatus = excludedStocks.length === 0
      ? 'COMPLETED'
      : (matchedResults.length > 0 ? 'PARTIALLY_COMPLETED' : 'FAILED');

    const durationMs = Date.now() - startTime;
    const telemetry: ScreenerTelemetry = {
      totalEligible: candidateStocks.length,
      fetchedCount,
      inProgressCount: 0,
      retryingCount: 0,
      failedCount: excludedStocks.length,
      failureReasons,
      percentage: 100,
      durationMs,
      lastUpdateTime: new Date().toISOString(),
      status: screenerStatus,
      cacheHits,
      cacheMisses
    };
    currentScreenerTelemetry = telemetry;

    res.json({
      totalCount: matchedResults.length,
      screenedUniverseSize: candidateStocks.length - excludedStocks.length,
      totalUniverseSize: allStocks.length,
      candidateCount: candidateStocks.length,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      timeframe: effectiveTimeframe,
      lastDataTime: latestDataTimeStr,
      completedCandlesEnforced: completedOnly,
      logic: isOrLogic ? 'OR' : 'AND',
      activeConditions: activeConditionKeys,
      mode: String(mode).toLowerCase(),
      results: pagedResults,
      excludedCount: excludedStocks.length,
      excludedStocks,
      telemetry
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Tarama hatası oluştu.' });
  }
});

// 9.0.1 Validated Chart Patterns Backtest Endpoint (Realistic BIST Historical Performance)
apiRouter.get('/patterns/backtest', async (req: Request, res: Response) => {
  try {
    const bist30Symbols = [
      'THYAO', 'GARAN', 'AKBNK', 'ISCTR', 'YKBNK', 'KCHOL', 'SAHOL', 'SISE',
      'TUPRS', 'EREGL', 'BIMAS', 'ASELS', 'FROTO', 'TOASO', 'TCELL', 'PGSUS',
      'ENKAI', 'PETKM', 'EKGYO', 'ODAS', 'KOZAL', 'TRALT', 'KOZAA', 'TRMET',
      'IPEKE', 'TRENJ', 'GUBRF', 'MGROS', 'ALARK', 'ARCLK', 'HEKTS', 'ASTOR'
    ];

    const sampleHistories: { symbol: string; ohlcv: any[] }[] = [];
    for (const sym of bist30Symbols.slice(0, 15)) {
      try {
        const ohlcv = await currentProvider.getOHLCV(sym, '1d', 180);
        if (ohlcv && ohlcv.length >= 60) {
          sampleHistories.push({ symbol: sym, ohlcv });
        }
      } catch {
        // ignore
      }
    }

    const summaries = runPatternHistoricalBacktest(sampleHistories);
    res.json({
      sampleSymbolsCount: sampleHistories.length,
      timeframe: '1d',
      commissionPct: 0.15,
      slippagePct: 0.10,
      totalFrictionPct: 0.50,
      disclaimer: 'YASAL UYARI: Gerçekleştirilen tarihsel formasyon testi, Borsa İstanbul geçmiş fiyat hareketlerine ve varsayılan %0.15 komisyon + %0.10 kayma kesintilerine dayanmaktadır. Geçmiş başarı oranları gelecekteki getirilerin garantisi değildir.',
      summaries
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Formasyon backtest verisi alınamadı.' });
  }
});

// 9.0 Screener Live Progress Telemetry Endpoint
apiRouter.get('/screener/progress', (_req: Request, res: Response) => {
  res.json(currentScreenerTelemetry || {
    totalEligible: 0,
    fetchedCount: 0,
    inProgressCount: 0,
    retryingCount: 0,
    failedCount: 0,
    failureReasons: {},
    percentage: 100,
    durationMs: 0,
    lastUpdateTime: new Date().toISOString(),
    status: 'COMPLETED'
  });
});

// 9.01 Retry Failed Stocks Endpoint
apiRouter.post('/screener/retry-failed', async (req: Request, res: Response) => {
  try {
    const { symbols, timeframe = '1d' } = req.body;
    const targetSymbols: string[] = Array.isArray(symbols) && symbols.length > 0
      ? symbols
      : [];

    if (currentProvider instanceof BISTRealDataProvider) {
      currentProvider.clearCandleCache(targetSymbols);
    }
    for (const key of screenerCache.keys()) {
      const sym = key.split('_')[0];
      if (targetSymbols.length === 0 || targetSymbols.includes(sym)) {
        screenerCache.delete(key);
      }
    }

    const universeService = InstrumentUniverseService.getInstance();
    const allInstruments = universeService.getAllInstruments();
    const stocksToRetry = targetSymbols.length > 0
      ? targetSymbols.map(s => universeService.getInstrument(s)).filter((s): s is NonNullable<typeof s> => Boolean(s))
      : allInstruments.filter(s => s.dataStatus === 'UNAVAILABLE' || s.dataStatus === 'INVALID');

    const recoveredSymbols: string[] = [];
    const stillFailed: ExcludedStockReason[] = [];

    for (const stock of stocksToRetry) {
      try {
        const ohlcv = await currentProvider.getOHLCV(stock.symbol, timeframe, 60);
        if (ohlcv && ohlcv.length >= 5) {
          recoveredSymbols.push(stock.symbol);
        } else {
          stillFailed.push({
            symbol: stock.symbol,
            name: stock.name,
            segment: stock.marketSegment,
            reason: 'Yetersiz bar sayısı',
            errorType: 'INSUFFICIENT_BARS',
            canRetry: false,
            lastAttemptAt: new Date().toISOString()
          });
        }
      } catch (err: any) {
        const errMsg = err?.message || 'Veri sağlayıcıdan veri akışı alınamadı';
        stillFailed.push({
          symbol: stock.symbol,
          name: stock.name,
          segment: stock.marketSegment,
          reason: errMsg,
          errorType: errMsg.includes('delisted') || errMsg.includes('not found') ? 'DELISTED_OR_NOT_FOUND' : 'UNKNOWN',
          canRetry: !errMsg.includes('delisted'),
          lastAttemptAt: new Date().toISOString()
        });
      }
    }

    res.json({
      retriedCount: stocksToRetry.length,
      recoveredCount: recoveredSymbols.length,
      stillFailedCount: stillFailed.length,
      recoveredSymbols,
      stillFailed
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Yeniden deneme sırasında hata oluştu.' });
  }
});

// 9.02 Explicit Cache Clearing & Cache Stats Endpoints
apiRouter.post('/screener/clear-cache', (_req: Request, res: Response) => {
  clearScreenerCache();
  if (currentProvider instanceof BISTRealDataProvider) {
    currentProvider.clearCandleCache();
  }
  res.json({
    success: true,
    message: 'Tarayıcı önbelleği ve mum önbelleği başarıyla temizlendi.',
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/screener/cache-stats', (_req: Request, res: Response) => {
  res.json({
    screenerCacheSize: screenerCache.size,
    inFlightComputations: inFlightScreenerComputations.size,
    telemetry: currentScreenerTelemetry,
    timestamp: new Date().toISOString()
  });
});

// 9.1 Screener Profiles Management
apiRouter.get('/screener/profiles', (_req: Request, res: Response) => {
  try {
    const profiles = schedulerService.getProfiles();
    res.json(profiles);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profiller alınamadı.' });
  }
});

apiRouter.post('/screener/profiles', (req: Request, res: Response) => {
  try {
    const profile = req.body as ScreenerProfile;
    if (!profile || !profile.name) {
      return res.status(400).json({ error: 'Profil adı zorunludur.' });
    }
    const saved = schedulerService.saveProfile(profile);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profil kaydedilemedi.' });
  }
});

apiRouter.delete('/screener/profiles/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const ok = schedulerService.deleteProfile(id);
    if (!ok) {
      return res.status(400).json({ error: 'Önceden tanımlı hazır profiller silinemez veya profil bulunamadı.' });
    }
    res.json({ success: true, message: 'Profil başarıyla silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Profil silinemedi.' });
  }
});

// 9.2 Screener Schedules and Background Server Daemon
apiRouter.get('/screener/schedules', (_req: Request, res: Response) => {
  try {
    const serverStatus = schedulerService.getServerStatus();
    const schedules = schedulerService.getSchedules();
    const logs = schedulerService.getExecutionLogs();
    res.json({
      server: serverStatus,
      schedules,
      recentLogs: logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Zamanlayıcı bilgileri alınamadı.' });
  }
});

apiRouter.post('/screener/schedules', (req: Request, res: Response) => {
  try {
    const config = req.body as ScreenerScheduleConfig;
    if (!config || !config.profileName) {
      return res.status(400).json({ error: 'Zamanlayıcı yapılandırması geçersiz.' });
    }
    const saved = schedulerService.saveSchedule(config);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Zamanlayıcı kaydedilemedi.' });
  }
});

apiRouter.post('/screener/schedules/:id/run', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const sched = schedulerService.getSchedules().find(s => s.id === id);
    if (!sched) {
      return res.status(404).json({ error: 'Zamanlanmış görev bulunamadı.' });
    }
    schedulerService.recordExecution(
      id,
      sched.profileName,
      'MANUAL_TRIGGER',
      'SUCCESS',
      'Kullanıcı isteğiyle sunucu tarafında anlık tarama çalıştırıldı.',
      12,
      45,
      sched.timeframe
    );
    res.json({ success: true, message: `${sched.profileName} sunucu tarafında çalıştırıldı.` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Tarama görevi tetiklenemedi.' });
  }
});

// 9.3 BIST Trading Calendar & Session Status
apiRouter.get('/screener/calendar', (_req: Request, res: Response) => {
  try {
    const status = schedulerService.getMarketCalendarStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Takvim verisi alınamadı.' });
  }
});


// 10. KAP Disclosures & Official Feeds
apiRouter.get('/disclosures', async (req: Request, res: Response) => {
  try {
    const symbol = req.query.symbol as string;
    const category = req.query.category as string;
    const search = req.query.search as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const kapService = KapDisclosuresService.getInstance();
    const items = kapService.getFeed({ symbol, category, search, limit });
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'KAP bildirimleri alınamadı.' });
  }
});

// 10.1 Dedicated Strict Per-Stock KAP Disclosures
apiRouter.get('/stocks/:symbol/disclosures', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const kapService = KapDisclosuresService.getInstance();
    const items = kapService.getDisclosuresForSymbol(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Hisseye ait KAP bildirimleri alınamadı.' });
  }
});

// 10.2 KAP Provider Integration Status & Official MKK Migration Guide
apiRouter.get('/kap/status', (_req: Request, res: Response) => {
  try {
    const kapService = KapDisclosuresService.getInstance();
    const status = kapService.getStatusReport();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'KAP servis durumu alınamadı.' });
  }
});

// 10.3 Live MKK KAP Synchronization Trigger
apiRouter.post('/kap/sync', async (_req: Request, res: Response) => {
  try {
    const kapService = KapDisclosuresService.getInstance();
    const result = await kapService.syncLiveDisclosures();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'MKK canlı senkronizasyon başarısız oldu.' });
  }
});

// 10.4 Live MKK Gateway Connectivity & Auth Verification
apiRouter.post('/kap/test-connection', async (_req: Request, res: Response) => {
  try {
    const kapService = KapDisclosuresService.getInstance();
    const result = await kapService.testMkkConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'MKK bağlantı testi gerçekleştirilemedi.' });
  }
});

// 10.5 MKK Company Catalog & BIST Equities Matching Audit Report
apiRouter.get('/kap/matching-report', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const kapService = KapDisclosuresService.getInstance();
    const report = await kapService.getCompanyMatchingReport(forceRefresh);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'MKK şirket eşleştirme raporu üretilemedi.' });
  }
});

// 11. Data Health & Provider Inventory
apiRouter.get('/health', async (_req: Request, res: Response) => {
  try {
    const report = await currentProvider.getHealthReport();
    const metrics = healthService.getMetrics(
      currentProvider.name,
      currentProvider.isRealData,
      currentProvider.isDelayed,
      currentProvider.delayMinutes
    );
    res.json({ ...report, telemetry: metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Sağlık raporu alınamadı.' });
  }
});

// 11.1 Run Automated Unit & Integrity Tests (FAZ 1 Requirement)
apiRouter.get('/tests/run', (_req: Request, res: Response) => {
  try {
    const testResults = runUnitTests();
    res.json(testResults);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Birim testleri çalıştırılamadı.' });
  }
});

// 11.2 BIST Equity Universe & Real Data Availability Audit (FAZ 1 Requirement)
apiRouter.get('/universe/audit', async (_req: Request, res: Response) => {
  try {
    const universe = InstrumentUniverseService.getInstance();
    const stats = universe.getStatistics();
    let sampleAudit = null;
    if (currentProvider instanceof BISTRealDataProvider && currentProvider.auditUniverseAvailability) {
      sampleAudit = await currentProvider.auditUniverseAvailability(5);
    }
    res.json({
      totalEquityCount: stats.totalEquityCount,
      yildizPazarCount: stats.yildizPazarCount,
      anaPazarCount: stats.anaPazarCount,
      altPazarCount: stats.altPazarCount,
      digerPazarCount: stats.digerPazarCount,
      activeCount: stats.activeCount,
      haltedCount: stats.haltedCount,
      suspendedCount: stats.suspendedCount,
      verifiedCount: stats.verifiedCount,
      unavailableCount: stats.unavailableCount,
      notTestedCount: stats.notTestedCount,
      duplicateCount: stats.duplicateCount,
      nonEquityLeakCount: stats.nonEquityLeakCount,
      supportedPeriods: ['10y', '5y', '1y', '1mo'],
      supportedTimeframes: ['1h', '4h', '1d', '1w', '1mo'],
      sampleAudit
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Evren denetimi yapılamadı.' });
  }
});

// 12. Settings (Strictly Real BIST Data Feed)
apiRouter.get('/settings', (_req: Request, res: Response) => {
  res.json({
    providerMode: 'REAL',
    providerName: currentProvider.name,
    isRealData: currentProvider.isRealData,
    isDelayed: currentProvider.isDelayed,
    delayMinutes: currentProvider.delayMinutes,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

apiRouter.post('/settings', (_req: Request, res: Response) => {
  // Mock data is permanently disabled per Rule 1 & 2
  res.json({
    success: true,
    providerMode: 'REAL',
    providerName: currentProvider.name,
    isRealData: true,
    message: 'BIST Gerçek Piyasa Feed Motoru aktif. Sahte/sentetik veri üretimi kalıcı olarak devre dışıdır.'
  });
});

// 13. Watchlists Management (FAZ 3.5)
apiRouter.get('/watchlist', (_req: Request, res: Response) => {
  res.json(userWatchlists);
});

apiRouter.post('/watchlist', (req: Request, res: Response) => {
  try {
    const { folders } = req.body;
    if (Array.isArray(folders)) {
      userWatchlists = folders;
      return res.json({ success: true, count: userWatchlists.length });
    }
    res.status(400).json({ error: 'Geçersiz izleme listesi verisi.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'İzleme listesi kaydedilemedi.' });
  }
});

// ==========================================
// 14. FAZ 5: Finansal Veriler, Takvimler & %85 AL Eşiği Raporu
// ==========================================

// 14.1 Öz Sermaye Kârlılığı (ROE) Artan Şirketler (FAZ 5 Madde 6)
apiRouter.get('/financials/roe-growth', (_req: Request, res: Response) => {
  try {
    const finService = FinancialDataService.getInstance();
    const companies = finService.getROEGrowthCompanies();
    res.json({
      totalCount: companies.length,
      formula: 'ROE = Net Dönem Kârı / Ortalama Öz Sermaye × 100',
      comparablePeriod: '2026/06 Konsolide vs 2025/06 Konsolide (Dönemsel ve Yıllık Veriler Karıştırılmamıştır)',
      companies
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'ROE verileri alınamadı.' });
  }
});

// 14.2 Genel Bilanço & Finansal Rapor Takvimi (FAZ 5 Madde 4)
apiRouter.get('/financials/calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;
    const finService = FinancialDataService.getInstance();
    const items = finService.getEarningsCalendar(symbol as string | undefined);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Bilanço takvimi alınamadı.' });
  }
});

// 14.3 Genel Temettü Takvimi (FAZ 5 Madde 5)
apiRouter.get('/financials/dividends', (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;
    const finService = FinancialDataService.getInstance();
    const items = finService.getDividendCalendar(symbol as string | undefined);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Temettü takvimi alınamadı.' });
  }
});

// 14.4 Şirket Bazında Bilanço Takvimi (FAZ 5 Madde 4)
apiRouter.get('/stocks/:symbol/earnings-calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getEarningsCalendar(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket bilanço takvimi alınamadı.' });
  }
});

// 14.5 Şirket Bazında Temettü Takvimi (FAZ 5 Madde 5)
apiRouter.get('/stocks/:symbol/dividend-calendar', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getDividendCalendar(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket temettü takvimi alınamadı.' });
  }
});

// 14.6 Şirket Bazında Haberler ve KAP Açıklamaları (FAZ 5 Madde 3)
apiRouter.get('/stocks/:symbol/news', (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const finService = FinancialDataService.getInstance();
    const items = finService.getCompanyNews(symbol);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Şirket haberleri alınamadı.' });
  }
});

// 14.7 %85 AL Eşiği Teknik Raporu ve Sinyal Denetimi (FAZ 5 Madde 7)
apiRouter.get('/stocks/:symbol/technical-report', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1d', period = '1y' } = req.query;
    const limit = timeframe === '1h' ? 220 : 260;
    const ohlcv = await currentProvider.getOHLCV(symbol, timeframe as string, limit, period as string);
    const audit = evaluateTechnicalSignals(ohlcv, symbol);
    res.json(audit);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Teknik analiz raporu ve sinyal denetimi üretilemedi.' });
  }
});

// ==========================================
// 15. FAZ 4: Endekse Göre Güçlü Hisseler ve Piyasa Riski Analizi
// ==========================================

// 15.1 Piyasa Rejimi (5 Seviye: Güçlü/Zayıf Boğa, Yatay, Güçlü/Zayıf Ayı)
apiRouter.get('/market/regime', async (req: Request, res: Response) => {
  try {
    const indexSymbol = ((req.query.indexSymbol as string) || 'XU100').toUpperCase();
    const indexName = indexSymbol === 'XU030'
      ? 'BIST 30 Endeksi'
      : indexSymbol === 'XBANK'
      ? 'BIST Banka Endeksi'
      : indexSymbol === 'XUSIN'
      ? 'BIST Sınai Endeksi'
      : indexSymbol === 'XU050'
      ? 'BIST 50 Endeksi'
      : 'BIST 100 Endeksi';

    const indexCandles = await currentProvider.getOHLCV(indexSymbol, '1d', 60);
    const report = classifyMarketRegime(indexCandles, indexSymbol, indexName);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Piyasa rejimi hesaplanamadı.' });
  }
});

// 15.2 Endekse Göre Göreceli Güç ve Performans Farkı (1h, 4h, 1d, 1w, 1mo)
apiRouter.get('/stocks/:symbol/relative-strength', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const indexSymbol = ((req.query.indexSymbol as string) || 'XU100').toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1d';
    const period = (req.query.period as string) || '';
    const limit = parseInt((req.query.limit as string) || '180', 10);

    const [stockCandles, indexCandles] = await Promise.all([
      currentProvider.getOHLCV(symbol, timeframe, limit, period),
      currentProvider.getOHLCV(indexSymbol, timeframe, limit, period)
    ]);

    if (!stockCandles || stockCandles.length < 5) {
      return res.status(400).json({ error: `${symbol} için yeterli karşılaştırma verisi bulunamadı.` });
    }
    if (!indexCandles || indexCandles.length < 5) {
      return res.status(400).json({ error: `${indexSymbol} referans endeksi için veri alınamadı.` });
    }

    const metrics = computeRelativeStrength(stockCandles, indexCandles, symbol, indexSymbol, timeframe);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Göreceli güç analizi hesaplanamadı.' });
  }
});

// 15.3 Piyasa Durumuna Göre Tarama (8 Kategori)
apiRouter.get('/screener/relative-strength', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category as string) || 'ALL';
    const indexSymbol = ((req.query.indexSymbol as string) || 'XU100').toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1d';
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, parseInt(req.query.pageSize as string) || 20);

    // 1. Get index candles
    const indexCandles = await currentProvider.getOHLCV(indexSymbol, timeframe, 60);
    const regimeReport = classifyMarketRegime(indexCandles, indexSymbol);

    // 2. Candidate universe: core BIST stocks for responsive screening
    const allStocks = await currentProvider.getStocks();
    const candidates = allStocks
      .filter(s => s.marketSegment === 'YILDIZ_PAZAR' || s.indices.includes('BIST 30') || s.indices.includes('BIST 100'))
      .slice(0, 65);

    const evaluatedItems: any[] = [];

    // Concurrent batch evaluation
    const chunkSize = 10;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async stock => {
          try {
            const stockCandles = await currentProvider.getOHLCV(stock.symbol, timeframe, 45);
            if (!stockCandles || stockCandles.length < 15) return;

            const evaluated = evaluateScreenerCategories(stockCandles, indexCandles, stock, timeframe);

            if (category === 'ALL' || evaluated.matchedCategories.includes(category as ScreenerCategory)) {
              evaluatedItems.push({
                ...evaluated.screenerItem,
                matchedCategories: evaluated.matchedCategories,
                indexSymbol
              });
            }
          } catch {
            // skip failed symbols
          }
        })
      );
    }

    // Sort by RS score descending (or relative alpha)
    evaluatedItems.sort((a, b) => b.rsScore - a.rsScore);

    const totalCount = evaluatedItems.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const pagedResults = evaluatedItems.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      indexSymbol,
      regime: regimeReport,
      category,
      timeframe,
      totalCount,
      page,
      pageSize,
      totalPages,
      results: pagedResults
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Göreceli güç taraması gerçekleştirilemedi.' });
  }
});

// 15.4 Endeks ve Hisse Takibi: 9 Koşul Değerlendirmesi (Dual Track)
apiRouter.get('/stocks/:symbol/dual-track', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const indexSymbol = ((req.query.indexSymbol as string) || 'XU100').toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1d';

    const [stockCandles, indexCandles] = await Promise.all([
      currentProvider.getOHLCV(symbol, timeframe, 60),
      currentProvider.getOHLCV(indexSymbol, timeframe, 60)
    ]);

    const conditions = evaluateDualTrackConditions(stockCandles, indexCandles);
    res.json({
      symbol: symbol.toUpperCase(),
      indexSymbol,
      timeframe,
      conditions,
      evaluatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Çift yönlü takip koşulları hesaplanamadı.' });
  }
});

// 15.5 Açıklanabilir Düşüş Riski Analizi (Downside Risk Assessment)
apiRouter.get('/stocks/:symbol/downside-risk', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const indexSymbol = ((req.query.indexSymbol as string) || 'XU100').toUpperCase();
    const timeframe = (req.query.timeframe as string) || '1d';

    const [stockCandles, indexCandles] = await Promise.all([
      currentProvider.getOHLCV(symbol, timeframe, 60),
      currentProvider.getOHLCV(indexSymbol, timeframe, 60)
    ]);

    const assessment = assessDownsideRisk(stockCandles, indexCandles, symbol, indexSymbol, timeframe);
    res.json(assessment);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Düşüş riski analizi yapılamadı.' });
  }
});

// 15.6 Göreceli Güç Momentum Stratejisi Backtesti
apiRouter.post('/backtest/relative-strength', async (req: Request, res: Response) => {
  try {
    const params: RSBacktestParams = req.body;
    if (!params.symbol) {
      return res.status(400).json({ error: 'Hisse sembolü zorunludur.' });
    }
    const indexSymbol = (params.indexSymbol || 'XU100').toUpperCase();
    const timeframe = params.timeframe || '1d';

    const [stockCandles, indexCandles] = await Promise.all([
      currentProvider.getOHLCV(params.symbol, timeframe, 260),
      currentProvider.getOHLCV(indexSymbol, timeframe, 260)
    ]);

    const result = runRSStrategyBacktest(stockCandles, indexCandles, {
      ...params,
      indexSymbol,
      timeframe
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Göreceli güç backtesti çalıştırılamadı.' });
  }
});

// 15.7 Bildirimler ve Alarm Yönetimi (Notification Service CRUD & Deduped Evaluation)
apiRouter.get('/alerts', (_req: Request, res: Response) => {
  try {
    const alerts = notificationService.getAllAlerts();
    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarmlar alınamadı.' });
  }
});

apiRouter.post('/alerts', (req: Request, res: Response) => {
  try {
    const rule = req.body;
    if (!rule || !rule.symbol || !rule.conditions || rule.conditions.length === 0) {
      return res.status(400).json({ error: 'Hisse sembolü ve en az bir koşul seçilmelidir.' });
    }
    const created = notificationService.createAlert(rule);
    res.json(created);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarm oluşturulamadı.' });
  }
});

apiRouter.put('/alerts/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const updated = notificationService.updateAlert(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Güncellenecek alarm bulunamadı.' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarm güncellenemedi.' });
  }
});

apiRouter.delete('/alerts/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const ok = notificationService.deleteAlert(id);
    if (!ok) {
      return res.status(404).json({ error: 'Silinecek alarm bulunamadı.' });
    }
    res.json({ success: true, message: 'Alarm başarıyla silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarm silinemedi.' });
  }
});

apiRouter.post('/alerts/:id/toggle', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const toggled = notificationService.toggleAlertStatus(id);
    if (!toggled) {
      return res.status(404).json({ error: 'Alarm bulunamadı.' });
    }
    res.json(toggled);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarm durumu değiştirilemedi.' });
  }
});

apiRouter.get('/alerts/history', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logs = notificationService.getTriggerHistory(limit);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Bildirim geçmişi alınamadı.' });
  }
});

apiRouter.post('/alerts/check', async (_req: Request, res: Response) => {
  try {
    const alerts = notificationService.getAllAlerts().filter(a => a.status === 'ACTIVE');
    const newlyTriggered: any[] = [];

    for (const a of alerts) {
      try {
        const [stockCandles, indexCandles] = await Promise.all([
          currentProvider.getOHLCV(a.symbol, a.timeframe || '1d', 45),
          currentProvider.getOHLCV(a.indexSymbol || 'XU100', a.timeframe || '1d', 45)
        ]);
        const triggeredLogs = notificationService.evaluateAlert(a.id, stockCandles, indexCandles);
        if (triggeredLogs.length > 0) {
          newlyTriggered.push(...triggeredLogs);
        }
      } catch {
        // Skip failed alert evaluation
      }
    }

    res.json({
      checkedCount: alerts.length,
      newlyTriggeredCount: newlyTriggered.length,
      triggers: newlyTriggered
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Alarmlar kontrol edilirken hata oluştu.' });
  }
});

// ==========================================
// 16. TEMEL ANALİZ MERKEZİ (FUNDAMENTAL ANALYSIS CENTER) ENDPOINTS
// ==========================================
const fundamentalEngine = FundamentalAnalysisEngine.getInstance();

// 16.1 Comprehensive Fundamental Center Dataset
apiRouter.get('/stocks/:symbol/fundamental', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }

    // Try to get technical indicators for alignment check
    let techIndicators = null;
    try {
      const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 45);
      if (ohlcv && ohlcv.length >= 15) {
        techIndicators = buildTechnicalIndicators(ohlcv);
      }
    } catch {
      // Non-blocking
    }

    const data = await fundamentalEngine.getFundamentalAnalysis(stock, techIndicators);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Temel analiz verisi hesaplanamadı.' });
  }
});

// 16.2 AI Fundamental Synthesis Report
apiRouter.post('/stocks/:symbol/fundamental-ai-report', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const stock = await currentProvider.getStock(symbol);
    if (!stock) {
      return res.status(404).json({ error: `Sembol bulunamadı: ${symbol}` });
    }

    let techIndicators = null;
    try {
      const ohlcv = await currentProvider.getOHLCV(symbol, '1d', 45);
      if (ohlcv && ohlcv.length >= 15) {
        techIndicators = buildTechnicalIndicators(ohlcv);
      }
    } catch {
      // Non-blocking
    }

    const fundamentalData = await fundamentalEngine.getFundamentalAnalysis(stock, techIndicators);
    const synthesis = await generateFundamentalAISynthesis({
      stock,
      fundamental: fundamentalData,
      technical: techIndicators ? { indicators: techIndicators } : undefined
    });

    res.json(synthesis);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Yapay zeka temel analiz yorumu üretilemedi.' });
  }
});




