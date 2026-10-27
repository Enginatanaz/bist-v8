import {
  BISTStock,
  OHLCV,
  MarketStatus,
  TechnicalIndicators,
  SupportResistanceZone,
  ChartPattern,
  MultiTimeframeTrend,
  ScenarioHorizon,
  BacktestResult,
  KAPDisclosure,
  DataHealthReport,
  AnalyticalReport
} from '../types';

export const apiClient = {
  async getMarketStatus(): Promise<MarketStatus> {
    const res = await fetch('/api/market/status');
    if (!res.ok) throw new Error('Piyasa durumu alınamadı.');
    return res.json();
  },

  async getStocks(params?: {
    index?: string;
    sector?: string;
    search?: string;
    marketSegment?: string;
    dataStatus?: string;
  }): Promise<BISTStock[]> {
    const q = new URLSearchParams();
    if (params?.index) q.set('index', params.index);
    if (params?.sector) q.set('sector', params.sector);
    if (params?.search) q.set('search', params.search);
    if (params?.marketSegment) q.set('marketSegment', params.marketSegment);
    if (params?.dataStatus) q.set('dataStatus', params.dataStatus);

    const res = await fetch(`/api/stocks?${q.toString()}`);
    if (!res.ok) throw new Error('Hisseler alınamadı.');
    return res.json();
  },

  async getStock(symbol: string): Promise<BISTStock> {
    const res = await fetch(`/api/stocks/${symbol}`);
    if (!res.ok) throw new Error(`Hisse bulunamadı: ${symbol}`);
    return res.json();
  },

  async getOHLCV(symbol: string, timeframe: string = '1d', limit: number = 180, period?: string): Promise<{
    symbol: string;
    timeframe: string;
    period?: string;
    count: number;
    provider: string;
    isDelayed: boolean;
    delayMinutes?: number;
    coverage?: import('../types').HistoricalCoverage;
    candles: OHLCV[];
  }> {
    const q = new URLSearchParams({ timeframe, limit: limit.toString() });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/ohlcv?${q.toString()}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'OHLCV verisi alınamadı.');
    }
    return res.json();
  },

  async getUniverseAudit(): Promise<any> {
    const res = await fetch('/api/universe/audit');
    if (!res.ok) throw new Error('Evren denetim verisi alınamadı.');
    return res.json();
  },

  async getTechnical(symbol: string, timeframe: string = '1d', period?: string): Promise<{
    symbol: string;
    stock: BISTStock;
    timeframe: string;
    period?: string;
    indicators: TechnicalIndicators;
    zones: SupportResistanceZone[];
    supports?: SupportResistanceZone[];
    resistances?: SupportResistanceZone[];
    brokenLevels?: SupportResistanceZone[];
    supportResistanceModel?: import('../types').SupportResistanceModel;
    breakouts?: import('../types').BreakoutEvent[];
    patterns: ChartPattern[];
    autoChannels?: import('../types').AutoChannel[];
    peakMetrics?: import('../types').PeakAndResistanceMetrics;
    trends: MultiTimeframeTrend[];
    candleCount: number;
    lastCandleDate: string;
    provider: string;
    isDelayed: boolean;
  }> {
    const q = new URLSearchParams({ timeframe });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/technical?${q.toString()}`);
    if (!res.ok) throw new Error('Teknik analiz verisi alınamadı.');
    return res.json();
  },

  async getSupportResistance(symbol: string, timeframe: string = '1d', period?: string): Promise<import('../types').SupportResistanceModel> {
    const q = new URLSearchParams({ timeframe });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/support-resistance?${q.toString()}`);
    if (!res.ok) throw new Error('Destek ve direnç verisi alınamadı.');
    return res.json();
  },

  async getScenarios(symbol: string): Promise<import('../types').ExtendedScenarioResult> {
    const res = await fetch(`/api/stocks/${symbol}/scenarios`);
    if (!res.ok) throw new Error('Senaryo verisi alınamadı.');
    return res.json();
  },

  async generateAiReport(symbol: string): Promise<AnalyticalReport> {
    const res = await fetch(`/api/stocks/${symbol}/ai-report`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Yapay zeka analitik raporu üretilemedi.');
    return res.json();
  },

  async runBacktest(params: any): Promise<BacktestResult> {
    const res = await fetch('/api/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Backtest simülasyonu başarısız oldu.');
    return res.json();
  },

  async runScreener(filters: Record<string, string>): Promise<{
    totalCount: number;
    screenedUniverseSize: number;
    totalUniverseSize: number;
    candidateCount?: number;
    page: number;
    pageSize: number;
    totalPages: number;
    timeframe: string;
    lastDataTime: string;
    completedCandlesEnforced?: boolean;
    logic: 'AND' | 'OR';
    activeConditions?: string[];
    mode?: string;
    results: import('../types').ScreenerStockResult[];
    excludedCount: number;
    excludedStocks: import('../types').ExcludedStockReason[];
    telemetry?: import('../types').ScreenerTelemetry;
  }> {
    const q = new URLSearchParams(filters);
    const res = await fetch(`/api/screener?${q.toString()}`);
    if (!res.ok) throw new Error('Tarama filtresi uygulanamadı.');
    return res.json();
  },

  async getPatternBacktest(): Promise<{
    sampleSymbolsCount: number;
    timeframe: string;
    commissionPct: number;
    slippagePct: number;
    totalFrictionPct: number;
    disclaimer: string;
    summaries: import('../types').PatternBacktestSummary[];
  }> {
    const res = await fetch('/api/patterns/backtest');
    if (!res.ok) throw new Error('Formasyon backtest verisi alınamadı.');
    return res.json();
  },

  async getScreenerProgress(): Promise<import('../types').ScreenerTelemetry | null> {
    const res = await fetch('/api/screener/progress');
    if (!res.ok) return null;
    return res.json();
  },

  async retryFailedScreener(symbols?: string[], timeframe: string = '1d'): Promise<{
    retriedCount: number;
    recoveredCount: number;
    stillFailedCount: number;
    recoveredSymbols: string[];
    stillFailed: import('../types').ExcludedStockReason[];
  }> {
    const res = await fetch('/api/screener/retry-failed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols, timeframe })
    });
    if (!res.ok) throw new Error('Yeniden tarama başarısız oldu.');
    return res.json();
  },

  async clearScreenerCache(): Promise<{ success: boolean; message: string; timestamp: string }> {
    const res = await fetch('/api/screener/clear-cache', { method: 'POST' });
    if (!res.ok) throw new Error('Önbellek temizlenemedi.');
    return res.json();
  },

  async getScreenerCacheStats(): Promise<{ screenerCacheSize: number; inFlightComputations: number; telemetry: any; timestamp: string }> {
    const res = await fetch('/api/screener/cache-stats');
    if (!res.ok) throw new Error('Önbellek istatistikleri alınamadı.');
    return res.json();
  },

  async getScreenerProfiles(): Promise<import('../types').ScreenerProfile[]> {
    const res = await fetch('/api/screener/profiles');
    if (!res.ok) throw new Error('Tarama profilleri alınamadı.');
    return res.json();
  },

  async saveScreenerProfile(profile: import('../types').ScreenerProfile): Promise<import('../types').ScreenerProfile> {
    const res = await fetch('/api/screener/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (!res.ok) throw new Error('Tarama profili kaydedilemedi.');
    return res.json();
  },

  async deleteScreenerProfile(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/screener/profiles/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Tarama profili silinemedi.');
    return res.json();
  },

  async getScreenerSchedules(): Promise<{
    server: any;
    schedules: import('../types').ScreenerScheduleConfig[];
    recentLogs: any[];
  }> {
    const res = await fetch('/api/screener/schedules');
    if (!res.ok) throw new Error('Tarama zamanlayıcıları alınamadı.');
    return res.json();
  },

  async saveScreenerSchedule(config: import('../types').ScreenerScheduleConfig): Promise<import('../types').ScreenerScheduleConfig> {
    const res = await fetch('/api/screener/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Tarama zamanlayıcı kaydedilemedi.');
    return res.json();
  },

  async runScreenerSchedule(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/screener/schedules/${id}/run`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Tarama zamanlayıcısı çalıştırılamadı.');
    return res.json();
  },

  async getScreenerCalendar(): Promise<any> {
    const res = await fetch('/api/screener/calendar');
    if (!res.ok) throw new Error('Piyasa takvim durumu alınamadı.');
    return res.json();
  },

  async getWatchlists(): Promise<import('../types').WatchlistFolder[]> {
    const res = await fetch('/api/watchlist');
    if (!res.ok) throw new Error('İzleme listeleri alınamadı.');
    return res.json();
  },

  async saveWatchlists(folders: import('../types').WatchlistFolder[]): Promise<any> {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folders })
    });
    if (!res.ok) throw new Error('İzleme listeleri kaydedilemedi.');
    return res.json();
  },


  async getDisclosures(symbol?: string, category?: string, search?: string): Promise<KAPDisclosure[]> {
    const params = new URLSearchParams();
    if (symbol) params.set('symbol', symbol);
    if (category && category !== 'ALL') params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`/api/disclosures${qs}`);
    if (!res.ok) throw new Error('KAP bildirimleri alınamadı.');
    return res.json();
  },

  async getStockDisclosures(symbol: string): Promise<KAPDisclosure[]> {
    const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/disclosures`);
    if (!res.ok) throw new Error('Hisseye ait KAP bildirimleri alınamadı.');
    return res.json();
  },

  async getKAPStatus(): Promise<import('../types').KAPStatusReport> {
    const res = await fetch('/api/kap/status');
    if (!res.ok) throw new Error('KAP durum bilgisi alınamadı.');
    return res.json();
  },

  async syncKAPDisclosures(): Promise<{ success: boolean; newCount: number; error?: string }> {
    const res = await fetch('/api/kap/sync', { method: 'POST' });
    if (!res.ok) throw new Error('KAP senkronizasyonu tetiklenemedi.');
    return res.json();
  },

  async testKAPConnection(): Promise<{
    reachable: boolean;
    authenticated: boolean;
    statusCode: number;
    statusText: string;
    endpoint: string;
    message: string;
  }> {
    const res = await fetch('/api/kap/test-connection', { method: 'POST' });
    if (!res.ok) throw new Error('MKK bağlantı testi gerçekleştirilemedi.');
    return res.json();
  },

  async getHealthReport(): Promise<DataHealthReport & { telemetry?: any }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Sağlık raporu alınamadı.');
    return res.json();
  },

  async runUnitTests(): Promise<{ allPassed: boolean; testsCount: number; results: { name: string; passed: boolean; message: string }[] }> {
    const res = await fetch('/api/tests/run');
    if (!res.ok) throw new Error('Birim testleri çalıştırılamadı.');
    return res.json();
  },

  async getSettings(): Promise<{
    providerMode: string;
    providerName: string;
    isRealData: boolean;
    isDelayed: boolean;
    delayMinutes: number;
    hasGeminiKey: boolean;
  }> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Ayarlar alınamadı.');
    return res.json();
  },

  async updateSettings(mode: 'REAL' | 'DEMO'): Promise<any> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    if (!res.ok) throw new Error('Ayar güncellenemedi.');
    return res.json();
  },

  // FAZ 5 Methods:
  async getROEGrowth(): Promise<{
    totalCount: number;
    formula: string;
    comparablePeriod: string;
    companies: import('../types').ROEGrowthCompany[];
  }> {
    const res = await fetch('/api/financials/roe-growth');
    if (!res.ok) throw new Error('ROE büyüme verileri alınamadı.');
    return res.json();
  },

  async getEarningsCalendar(symbol?: string): Promise<import('../types').EarningsCalendarItem[]> {
    const url = symbol ? `/api/stocks/${symbol}/earnings-calendar` : '/api/financials/calendar';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Bilanço takvimi alınamadı.');
    return res.json();
  },

  async getDividendCalendar(symbol?: string): Promise<import('../types').DividendCalendarItem[]> {
    const url = symbol ? `/api/stocks/${symbol}/dividend-calendar` : '/api/financials/dividends';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Temettü takvimi alınamadı.');
    return res.json();
  },

  async getCompanyNews(symbol: string): Promise<import('../types').CompanyNewsItem[]> {
    const res = await fetch(`/api/stocks/${symbol}/news`);
    if (!res.ok) throw new Error('Şirket haberleri alınamadı.');
    return res.json();
  },

  async getTechnicalSignalAudit(symbol: string, timeframe: string = '1d', period: string = '1y'): Promise<import('../types').TechnicalSignalAudit> {
    const q = new URLSearchParams({ timeframe, period });
    const res = await fetch(`/api/stocks/${symbol}/technical-report?${q.toString()}`);
    if (!res.ok) throw new Error('Teknik sinyal denetim raporu alınamadı.');
    return res.json();
  },

  // ==========================================
  // FAZ 4: Endekse Göre Güçlü Hisseler ve Piyasa Riski Analizi
  // ==========================================

  async getMarketRegime(indexSymbol: string = 'XU100'): Promise<import('../types').MarketRegimeReport> {
    const res = await fetch(`/api/market/regime?indexSymbol=${encodeURIComponent(indexSymbol)}`);
    if (!res.ok) throw new Error('Piyasa rejimi verisi alınamadı.');
    return res.json();
  },

  async getRelativeStrength(
    symbol: string,
    indexSymbol: string = 'XU100',
    timeframe: string = '1d',
    period?: string
  ): Promise<import('../types').RelativeStrengthMetrics> {
    const q = new URLSearchParams({ indexSymbol, timeframe });
    if (period) q.set('period', period);
    const res = await fetch(`/api/stocks/${symbol}/relative-strength?${q.toString()}`);
    if (!res.ok) throw new Error('Göreceli güç verisi alınamadı.');
    return res.json();
  },

  async runRelativeStrengthScreener(params: {
    category?: string;
    indexSymbol?: string;
    timeframe?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{
    indexSymbol: string;
    regime: import('../types').MarketRegimeReport;
    category: string;
    timeframe: string;
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    results: (import('../types').RelativeStrengthScreenerItem & { matchedCategories: import('../types').ScreenerCategory[] })[];
  }> {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.indexSymbol) q.set('indexSymbol', params.indexSymbol);
    if (params.timeframe) q.set('timeframe', params.timeframe);
    if (params.page) q.set('page', params.page.toString());
    if (params.pageSize) q.set('pageSize', params.pageSize.toString());

    const res = await fetch(`/api/screener/relative-strength?${q.toString()}`);
    if (!res.ok) throw new Error('Piyasa durumuna göre tarama verisi alınamadı.');
    return res.json();
  },

  async getDualTrackConditions(
    symbol: string,
    indexSymbol: string = 'XU100',
    timeframe: string = '1d'
  ): Promise<{
    symbol: string;
    indexSymbol: string;
    timeframe: string;
    conditions: import('../types').DualTrackConditionStatus[];
    evaluatedAt: string;
  }> {
    const q = new URLSearchParams({ indexSymbol, timeframe });
    const res = await fetch(`/api/stocks/${symbol}/dual-track?${q.toString()}`);
    if (!res.ok) throw new Error('Çift yönlü takip koşulları alınamadı.');
    return res.json();
  },

  async getDownsideRisk(
    symbol: string,
    indexSymbol: string = 'XU100',
    timeframe: string = '1d'
  ): Promise<import('../types').DownsideRiskAssessment> {
    const q = new URLSearchParams({ indexSymbol, timeframe });
    const res = await fetch(`/api/stocks/${symbol}/downside-risk?${q.toString()}`);
    if (!res.ok) throw new Error('Düşüş riski analizi verisi alınamadı.');
    return res.json();
  },

  async runRSBacktest(params: import('../types').RSBacktestParams): Promise<import('../types').RSBacktestResult> {
    const res = await fetch('/api/backtest/relative-strength', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Göreceli güç backtesti başarısız oldu.');
    return res.json();
  },

  async getAlerts(): Promise<import('../types').MarketAlertRule[]> {
    const res = await fetch('/api/alerts');
    if (!res.ok) throw new Error('Alarmlar alınamadı.');
    return res.json();
  },

  async createAlert(rule: Partial<import('../types').MarketAlertRule>): Promise<import('../types').MarketAlertRule> {
    const res = await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    if (!res.ok) throw new Error('Alarm kaydedilemedi.');
    return res.json();
  },

  async updateAlert(id: string, updates: Partial<import('../types').MarketAlertRule>): Promise<import('../types').MarketAlertRule> {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Alarm güncellenemedi.');
    return res.json();
  },

  async deleteAlert(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/alerts/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Alarm silinemedi.');
    return res.json();
  },

  async toggleAlert(id: string): Promise<import('../types').MarketAlertRule> {
    const res = await fetch(`/api/alerts/${id}/toggle`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Alarm durumu değiştirilemedi.');
    return res.json();
  },

  async getAlertHistory(limit: number = 50): Promise<import('../types').AlertTriggerLog[]> {
    const res = await fetch(`/api/alerts/history?limit=${limit}`);
    if (!res.ok) throw new Error('Bildirim geçmişi alınamadı.');
    return res.json();
  },

  async checkAlerts(): Promise<{
    checkedCount: number;
    newlyTriggeredCount: number;
    triggers: import('../types').AlertTriggerLog[];
  }> {
    const res = await fetch('/api/alerts/check', {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Alarmlar taranamadı.');
    return res.json();
  },

  async getFundamentalData(symbol: string): Promise<import('../types').StockFundamentalCenterData> {
    const res = await fetch(`/api/stocks/${symbol}/fundamental`);
    if (!res.ok) throw new Error('Temel analiz verisi alınamadı.');
    return res.json();
  },

  async generateFundamentalAiReport(symbol: string): Promise<import('../types').AIFundamentalSynthesis> {
    const res = await fetch(`/api/stocks/${symbol}/fundamental-ai-report`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Yapay zeka temel analiz yorumu üretilemedi.');
    return res.json();
  }
};


