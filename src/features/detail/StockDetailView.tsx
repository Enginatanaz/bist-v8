import React, { useState, useEffect } from 'react';
import {
  BISTStock,

  OHLCV,
  SupportResistanceZone,
  SupportResistanceModel,
  BreakoutEvent,
  AutoChannel,
  PeakAndResistanceMetrics,
  EarningsCalendarItem,
  DividendCalendarItem,
  CompanyNewsItem,
  TechnicalSignalAudit,
  StockFundamentalCenterData,
  KAPDisclosure
} from '../../types';
import { apiClient } from '../../services/apiClient';
import { FinancialChart } from '../../components/FinancialChart';
import { FundamentalAnalysisCenter } from './components/FundamentalAnalysisCenter';
import {
  Activity,
  ArrowUpRight,
  BarChart2,
  Layers,
  Search,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Scale,
  TrendingUp,
  TrendingDown,
  Shield,
  ShieldCheck,
  Zap,
  Calendar,
  DollarSign,
  Newspaper,
  Bell,
  Clock,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  Check,
  XCircle,
  HelpCircle,
  FileText,
  Sparkles
} from 'lucide-react';

interface StockDetailViewProps {
  symbol: string;
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (symbol: string) => void;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  symbol,
  stocks,
  onSelectStock,
  onNavigateTab,
  isWatchlisted,
  onToggleWatchlist
}) => {
  const [stock, setStock] = useState<BISTStock | null>(null);
  const [candles, setCandles] = useState<OHLCV[]>([]);
  const [zones, setZones] = useState<SupportResistanceZone[]>([]);
  const [srModel, setSrModel] = useState<SupportResistanceModel | null>(null);
  const [srFilterType, setSrFilterType] = useState<'ALL' | 'SUPPORTS' | 'RESISTANCES' | 'BROKEN'>('ALL');
  const [breakouts, setBreakouts] = useState<BreakoutEvent[]>([]);
  const [autoChannels, setAutoChannels] = useState<AutoChannel[]>([]);
  const [peakMetrics, setPeakMetrics] = useState<PeakAndResistanceMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<string>('1d');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1y');
  const [coverage, setCoverage] = useState<import('../../types').HistoricalCoverage | null>(null);

  // FAZ 5 Specific State:
  const [earningsCalendar, setEarningsCalendar] = useState<EarningsCalendarItem[]>([]);
  const [dividendCalendar, setDividendCalendar] = useState<DividendCalendarItem[]>([]);
  const [companyNews, setCompanyNews] = useState<CompanyNewsItem[]>([]);
  const [stockDisclosures, setStockDisclosures] = useState<KAPDisclosure[]>([]);
  const [disclosureModeMap, setDisclosureModeMap] = useState<Record<string, 'AI_SUMMARY' | 'ORIGINAL'>>({});
  const [signalAudit, setSignalAudit] = useState<TechnicalSignalAudit | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  // Subtabs: 'CHART' | 'LEVELS' | 'EARNINGS' | 'DIVIDENDS' | 'NEWS' | 'REPORT_85' | 'INDICATORS'
  const [activeSubTab, setActiveSubTab] = useState<'CHART' | 'LEVELS' | 'EARNINGS' | 'DIVIDENDS' | 'NEWS' | 'REPORT_85' | 'INDICATORS'>('CHART');

  // Temel Analiz Merkezi State
  const [fundamentalData, setFundamentalData] = useState<StockFundamentalCenterData | null>(null);
  const [isFundamentalLoading, setIsFundamentalLoading] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataErrorMessage, setDataErrorMessage] = useState<string | null>(null);

  // Quick symbol search box
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsFundamentalLoading(true);
    setDataErrorMessage(null);

    const loadData = async () => {
      // 1. Fetch stock basic metadata first
      let currentStock: BISTStock | null = null;
      try {
        currentStock = await apiClient.getStock(symbol);
        if (isMounted) setStock(currentStock);
      } catch {
        const found = stocks.find(s => s.symbol === symbol.toUpperCase());
        if (found && isMounted) setStock(found);
      }

      // 2. Fetch candles, technical and fundamental data
      try {
        // Enforce FAZ 5 Madde 2: Saatlik grafikte son 1 aylık saatlik veri (~200 bar)
        const candleLimit = timeframe === '1h'
          ? 220
          : selectedPeriod === '10y' ? 2600 : selectedPeriod === '5y' ? 1300 : selectedPeriod === '1y' ? 260 : 35;

        const effectivePeriod = timeframe === '1h' ? '1mo' : selectedPeriod;

        const [ohlcvData, techData, earnData, divData, newsData, auditData, fundData, kapData] = await Promise.all([
          apiClient.getOHLCV(symbol, timeframe, candleLimit, effectivePeriod).catch(err => {
            if (isMounted) setDataErrorMessage(err.message);
            return { candles: [], coverage: undefined };
          }),
          apiClient.getTechnical(symbol, timeframe, effectivePeriod).catch(() => ({
            zones: [],
            supports: [],
            resistances: [],
            brokenLevels: [],
            supportResistanceModel: null,
            breakouts: [],
            autoChannels: [],
            peakMetrics: undefined
          })),
          apiClient.getEarningsCalendar(symbol).catch(() => []),
          apiClient.getDividendCalendar(symbol).catch(() => []),
          apiClient.getCompanyNews(symbol).catch(() => []),
          apiClient.getTechnicalSignalAudit(symbol, timeframe, effectivePeriod).catch(() => null),
          apiClient.getFundamentalData(symbol).catch(() => null),
          apiClient.getStockDisclosures(symbol).catch(() => [])
        ]);

        if (isMounted) {
          setCandles(ohlcvData.candles || []);
          setCoverage(ohlcvData.coverage || null);
          setZones(techData.zones || []);
          setSrModel(techData.supportResistanceModel || null);
          setBreakouts(techData.breakouts || []);
          setAutoChannels(techData.autoChannels || []);
          setPeakMetrics(techData.peakMetrics || null);
          setEarningsCalendar(earnData || []);
          setDividendCalendar(divData || []);
          setCompanyNews(newsData || []);
          setStockDisclosures(kapData || []);
          setSignalAudit(auditData);
          setFundamentalData(fundData);
          setIsFundamentalLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setDataErrorMessage(err.message);
          setIsFundamentalLoading(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [symbol, timeframe, selectedPeriod, stocks]);

  const refreshFundamental = async () => {
    setIsFundamentalLoading(true);
    try {
      const fund = await apiClient.getFundamentalData(symbol);
      setFundamentalData(fund);
    } catch {
      // ignore
    } finally {
      setIsFundamentalLoading(false);
    }
  };


  const handleCreateEarningsAlert = (item: EarningsCalendarItem) => {
    try {
      const alertKey = `bist_alert_earnings_${item.symbol}_${item.financialPeriod}`;
      localStorage.setItem(alertKey, JSON.stringify({
        symbol: item.symbol,
        date: item.scheduledDate,
        title: `${item.symbol} Bilanço Bildirimi`,
        message: `${item.companyName} için ${item.financialPeriod} finansal raporunun ${item.scheduledDate} tarihinde açıklanması bekleniyor.`,
        created: new Date().toISOString()
      }));
      setAlertSuccess(`${item.symbol} ${item.financialPeriod} bilançosu için alarm oluşturuldu.`);
      setTimeout(() => setAlertSuccess(null), 3000);
    } catch {
      setAlertSuccess('Alarm kaydedilemedi.');
    }
  };

  const filteredStocks = searchQuery
    ? stocks.filter(s => s.symbol.includes(searchQuery.toUpperCase()) || s.name.toUpperCase().includes(searchQuery.toUpperCase())).slice(0, 10)
    : [];

  const isPos = (stock?.changePercent || 0) >= 0;

  const segmentLabel = stock?.marketSegment === 'YILDIZ_PAZAR'
    ? 'Yıldız Pazar'
    : stock?.marketSegment === 'ANA_PAZAR'
    ? 'Ana Pazar'
    : stock?.marketSegment === 'ALT_PAZAR'
    ? 'Alt Pazar'
    : stock?.marketSegment === 'POIP'
    ? 'PÖİP'
    : 'BIST Pay';

  // EMA Direction Labels
  const lastEma5 = signalAudit?.signals.find(s => s.id === 'sig_ema5_ema20');
  const lastEma20 = signalAudit?.signals.find(s => s.id === 'sig_price_vs_ema20');

  return (
    <div className="space-y-5 pb-12">
      {/* 1. Header: Symbol, Real Price, Data Time & Universal Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Symbol Title & Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight font-mono">{symbol}</h1>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                {stock?.sector || 'BIST Pay Senedi'}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold font-mono">
                {segmentLabel}
              </span>

              {stock?.dataStatus === 'VERIFIED' ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-mono flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> DOĞRULANDI
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {stock?.dataStatus || 'NOT_TESTED'}
                </span>
              )}

              <button
                onClick={() => onToggleWatchlist(symbol)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isWatchlisted
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title={isWatchlisted ? 'İzleme listemden çıkar' : 'İzleme listeme ekle'}
              >
                {isWatchlisted ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">{stock?.name}</p>

            {/* Quick Switch Dropdown */}
            <div className="relative pt-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Hisse değiştir (500+ BIST payı)..."
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="bg-transparent border-b border-slate-800 focus:border-emerald-500 text-xs text-slate-200 placeholder-slate-500 outline-none pb-0.5 w-64"
                />
              </div>

              {isSearchOpen && filteredStocks.length > 0 && (
                <div className="absolute left-0 mt-1 w-80 bg-slate-950 border border-slate-800 rounded-lg shadow-2xl z-30 py-1 max-h-56 overflow-y-auto">
                  {filteredStocks.map(s => (
                    <button
                      key={s.symbol}
                      onClick={() => {
                        onSelectStock(s.symbol);
                        setSearchQuery('');
                        setIsSearchOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 flex items-center justify-between transition-colors border-b border-slate-900 last:border-0"
                    >
                      <div>
                        <span className="font-mono font-bold text-slate-100">{s.symbol}</span>
                        <span className="text-[11px] text-slate-400 ml-2 truncate max-w-[150px] inline-block align-bottom">{s.name}</span>
                      </div>
                      <span className="font-mono text-slate-300 font-semibold">{s.lastPrice.toFixed(2)} TL</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real Price & Data Timestamp */}
          <div className="text-right">
            <div className="text-3xl font-extrabold font-mono text-slate-100 tracking-tight">
              {stock?.lastPrice ? stock.lastPrice.toFixed(2) : '-'} <span className="text-base font-normal text-slate-400 font-sans">TL</span>
            </div>
            <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 mt-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPos ? '+' : ''}{stock?.change ? stock.change.toFixed(2) : '0.00'} TL</span>
              <span>({isPos ? '+' : ''}{stock?.changePercent ? stock.changePercent.toFixed(2) : '0.00'}%)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Veri Zamanı: {stock?.lastVerifiedAt ? stock.lastVerifiedAt.replace('T', ' ').substring(0, 16) : '15 Dk Gecikmeli'}</span>
            </div>
          </div>
        </div>

        {alertSuccess && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{alertSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. FAZ 5 Madde 1: Core Metrics Bar (EMA Directions, Peak Distance, Resistance Distance, Relative Strength) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* EMA5 Trend Yönü */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">EMA5 Trend Yönü</span>
          <div className="text-xs font-bold mt-1 flex items-center gap-1 font-mono">
            {lastEma5?.signal === 'BUY' ? (
              <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Yükseliş</span>
            ) : lastEma5?.signal === 'SELL' ? (
              <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Düşüş</span>
            ) : (
              <span className="text-slate-300">Yatay / Nötr</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Kısa Vade Momentum</span>
        </div>

        {/* EMA20 Trend Yönü */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">EMA20 Trend Yönü</span>
          <div className="text-xs font-bold mt-1 flex items-center gap-1 font-mono">
            {lastEma20?.signal === 'BUY' ? (
              <span className="text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Yükseliş (Boğa)</span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> Düşüş (Ayı)</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Ana Trend Referansı</span>
        </div>

        {/* Tarihsel Zirveye Uzaklık */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Zirveden Uzaklık</span>
          <div className="text-xs font-bold font-mono text-slate-200 mt-1">
            {peakMetrics ? `-%${peakMetrics.distanceFromPeakPct.toFixed(1)}` : '-'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
            {peakMetrics ? `Dönem Zirvesi: ${peakMetrics.periodHigh.toFixed(2)} TL` : 'Hesaplanıyor'}
          </span>
        </div>

        {/* Tarihsel Dirence Uzaklık (Kural: Direnç Yeşil) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Dirence Uzaklık</span>
          <div className="text-xs font-bold font-mono text-emerald-400 mt-1">
            {peakMetrics?.distanceToResistancePct !== null && peakMetrics?.distanceToResistancePct !== undefined
              ? `%${peakMetrics.distanceToResistancePct.toFixed(1)}`
              : 'Direnç Üzerinde'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
            {peakMetrics?.nearestResistance ? `En Yakın Direnç (Yeşil): ${peakMetrics.nearestResistance.pivotPrice.toFixed(2)} TL` : 'Direnç Yok'}
          </span>
        </div>

        {/* Göreceli Güç vs BIST 100 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Göreceli Güç (RS)</span>
          <div className="text-xs font-bold font-mono text-cyan-400 mt-1">
            {stock?.changePercent ? (stock.changePercent >= 0 ? `+${stock.changePercent.toFixed(2)}%` : `${stock.changePercent.toFixed(2)}%`) : '0.0%'}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">vs BIST 100 Endeksi</span>
        </div>

        {/* %85 AL Eşiği Durumu */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">%85 AL Sinyal Eşiği</span>
          <div className="text-xs font-bold font-mono mt-1">
            {signalAudit ? (
              signalAudit.thresholdMet ? (
                <span className="text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Geçti (%{signalAudit.buySignalRatioPct})</span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Sağlanmadı (%{signalAudit.buySignalRatioPct})</span>
              )
            ) : (
              <span className="text-slate-500">Denetleniyor</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">FAZ 5 Madde 7 Kuralı</span>
        </div>
      </div>

      {/* 2.1 TEMEL ANALİZ MERKEZİ (FUNDAMENTAL ANALYSIS CENTER) - High-Visibility Upper Window */}
      <FundamentalAnalysisCenter
        data={fundamentalData}
        isLoading={isFundamentalLoading}
        onRefresh={refreshFundamental}
        selectedSymbol={symbol}
      />

      {/* 3. Sub-tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-medium">
        {[
          { id: 'CHART', label: 'Grafik ve Çizimler', icon: Activity },
          { id: 'LEVELS', label: 'Destek & Direnç Analiz Penceresi', icon: Layers },

          { id: 'EARNINGS', label: `Bilanço Takvimi (${earningsCalendar.length})`, icon: Calendar },
          { id: 'DIVIDENDS', label: `Temettü Takvimi (${dividendCalendar.length})`, icon: DollarSign },
          { id: 'NEWS', label: `KAP & Haberler (${stockDisclosures.length || companyNews.length})`, icon: Newspaper },
          { id: 'REPORT_85', label: '%85 AL Eşiği Raporu', icon: Shield },
          { id: 'INDICATORS', label: 'Tüm Teknik Göstergeler', icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. TAB 1: GRAFİK VE ÇİZİMLER (Financial Chart with User Drawings & Timeframe) */}
      {activeSubTab === 'CHART' && (
        <div className="space-y-4">
          {/* Controls: Timeframe & Period Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Zaman Dilimi:</span>
              {[
                { id: '1h', label: '1 Saat (Son 1 Ay)' },
                { id: '4h', label: '4 Saat' },
                { id: '1d', label: 'Günlük' },
                { id: '1wk', label: 'Haftalık' },
                { id: '1mo', label: 'Aylık' }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-2.5 py-1 rounded-md font-mono ${
                    timeframe === tf.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">D/D Analiz Dönemi:</span>
              {['10y', '5y', '1y', '1mo'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  disabled={timeframe === '1h'} // Saatlikte son 1 ay kuralı sabittir
                  className={`px-2.5 py-1 rounded-md font-mono ${
                    selectedPeriod === p
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Component */}
          <FinancialChart
            candles={candles}
            symbol={symbol}
            zones={zones}
            autoChannels={autoChannels}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* 5. TAB 2: DESTEK VE DİRENÇ ANALİZ PENCERESİ (FAZ 5 Madde 2) */}
      {activeSubTab === 'LEVELS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Destek ve Direnç Analiz Penceresi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                FAZ 5 Kuralı: Destekler kırmızı (#ef4444), dirençler yeşil (#10b981) olarak gösterilir. Seviyeler gerçek fiyat koordinatlarına bağlıdır.
              </p>
            </div>

            {/* Period Selector (10y, 5y, 1y, 1mo) */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 px-2">Dönem:</span>
              {['10y', '5y', '1y', '1mo'].map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  disabled={timeframe === '1h'}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    selectedPeriod === p
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
                  }`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Status & Data Provenance Banner (L1 - L7 Gereksinimi) */}
          {srModel && (
            <div className="space-y-2">
              {srModel.metadata.calculationStatus === 'NO_DATA' && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Bu hisse ve zaman dilimi için kullanılabilir fiyat verisi bulunamadı.</span>
                </div>
              )}
              {srModel.metadata.calculationStatus === 'INSUFFICIENT_DATA' && (
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-lg text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    Destek ve direnç analizi için yeterli geçmiş fiyat verisi bulunmuyor. Mevcut veri aralığı: {srModel.metadata.dataStartTime || '-'} – {srModel.metadata.dataEndTime || '-'}.
                  </span>
                </div>
              )}
              {srModel.metadata.calculationStatus === 'FAILED' && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Destek ve direnç hesaplaması tamamlanamadı. Lütfen daha sonra tekrar deneyin.</span>
                </div>
              )}

              {/* Warnings (Örn: L5 / L6 Destek veya Direnç bulunamadı uyarısı) */}
              {srModel.metadata.warnings.length > 0 && (
                <div className="space-y-1">
                  {srModel.metadata.warnings.map((w, wIdx) => (
                    <div key={wIdx} className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-md text-[11px] font-mono text-slate-400 flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Provenance and summary bar */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Zaman Dilimi / Dönem</span>
                  <strong className="text-emerald-400 uppercase">{timeframe}</strong> / <strong className="text-cyan-400 uppercase">{timeframe === '1h' ? '1mo' : selectedPeriod}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Veri Kapsamı</span>
                  <span className="text-slate-200">{srModel.metadata.dataStartTime || '-'} – {srModel.metadata.dataEndTime || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Aktif Seviyeler</span>
                  <span className="text-rose-400 font-bold">{srModel.metadata.activeSupportsCount} Destek</span> · <span className="text-emerald-400 font-bold">{srModel.metadata.activeResistancesCount} Direnç</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Fiyat Tipi &amp; Sağlayıcı</span>
                  <span className="text-slate-300 truncate block" title={srModel.metadata.priceType}>{srModel.metadata.priceType}</span>
                </div>
              </div>
            </div>
          )}

          {/* Filter Pills (Tümü, Destekler, Dirençler, Kırılanlar) */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setSrFilterType('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  srFilterType === 'ALL'
                    ? 'bg-slate-800 text-slate-100 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-950'
                }`}
              >
                Tümü ({zones.length})
              </button>
              <button
                onClick={() => setSrFilterType('SUPPORTS')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  srFilterType === 'SUPPORTS'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                    : 'text-slate-400 hover:text-rose-300 bg-slate-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Destekler ({zones.filter(z => (z.type && z.type.toUpperCase() === 'SUPPORT') || z.colorHex === '#ef4444').length})
              </button>
              <button
                onClick={() => setSrFilterType('RESISTANCES')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  srFilterType === 'RESISTANCES'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                    : 'text-slate-400 hover:text-emerald-300 bg-slate-950'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Dirençler ({zones.filter(z => (z.type && z.type.toUpperCase() === 'RESISTANCE') || z.colorHex === '#10b981').length})
              </button>
              <button
                onClick={() => setSrFilterType('BROKEN')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  srFilterType === 'BROKEN'
                    ? 'bg-slate-800 text-amber-300 border border-slate-700 font-bold'
                    : 'text-slate-400 hover:text-amber-300 bg-slate-950'
                }`}
              >
                Kırılan / Retest ({zones.filter(z => z.status === 'broken' || z.status === 'BROKEN' || z.status === 'retest').length})
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Kural: Destekler <span className="text-rose-400 font-bold">KIRMIZI</span>, Dirençler <span className="text-emerald-400 font-bold">YEŞİL</span>
            </div>
          </div>

          {/* Zones Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-3">Temsilî Fiyat (TL)</th>
                  <th className="py-2.5 px-3">Bölge Aralığı (TL)</th>
                  <th className="py-2.5 px-3 text-center">Güç Skoru</th>
                  <th className="py-2.5 px-3 text-center">Test Sayısı</th>
                  <th className="py-2.5 px-3 text-center">Pivot Sayısı</th>
                  <th className="py-2.5 px-3 text-right">Fiyata Uzaklık</th>
                  <th className="py-2.5 px-3 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {(() => {
                  const filtered = zones.filter(z => {
                    const isSupp = (z.type && z.type.toUpperCase() === 'SUPPORT') || z.colorHex === '#ef4444';
                    if (srFilterType === 'SUPPORTS') return isSupp;
                    if (srFilterType === 'RESISTANCES') return !isSupp;
                    if (srFilterType === 'BROKEN') return z.status === 'broken' || z.status === 'BROKEN' || z.status === 'retest';
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500 font-mono text-xs">
                          {srFilterType === 'SUPPORTS'
                            ? 'Bu zaman diliminde yeterli veriden doğrulanmış destek bulunamadı.'
                            : srFilterType === 'RESISTANCES'
                            ? 'Bu zaman diliminde yeterli veriden doğrulanmış direnç bulunamadı.'
                            : srFilterType === 'BROKEN'
                            ? 'Kırılmış veya retest aşamasında seviye bulunmamaktadır.'
                            : 'Seçilen parametrelerde doğrulanmış destek veya direnç tespit edilmedi.'}
                        </td>
                      </tr>
                    );
                  }

                  const visibleHigh = candles.length > 0 ? Math.max(...candles.slice(-80).map(c => c.high)) : Infinity;
                  const visibleLow = candles.length > 0 ? Math.min(...candles.slice(-80).map(c => c.low)) : -Infinity;

                  return filtered.map(z => {
                    const isSupport = (z.type && (z.type.toUpperCase() === 'SUPPORT' || z.type === 'support')) || z.colorHex === '#ef4444';
                    const levelPrice = z.price ?? z.pivotPrice;
                    const lowVal = z.zoneLow ?? z.priceLow;
                    const highVal = z.zoneHigh ?? z.priceHigh;
                    const isOutOfVisibleChart = levelPrice > visibleHigh * 1.05 || levelPrice < visibleLow * 0.95;

                    return (
                      <tr key={z.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-semibold">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold inline-flex items-center gap-1 ${
                            isSupport
                              ? 'bg-rose-950/70 text-rose-400 border border-rose-800/60'
                              : 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isSupport ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                            {isSupport ? 'DESTEK (Kırmızı)' : 'DİRENÇ (Yeşil)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className={isSupport ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {levelPrice.toFixed(2)} TL
                            </span>
                            {isOutOfVisibleChart && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans" title="Bu seviye grafiğin mevcut dikey yakınlaştırma aralığı dışında kaldığı için tabloda listelenmiştir">
                                Liste
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">
                          {lowVal.toFixed(2)} - {highVal.toFixed(2)} TL
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-200">
                          <div className="inline-flex items-center gap-1">
                            <span>{z.strengthScore}/100</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                          {z.touchCount} Test
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {z.pivotCount || 1} Pivot
                        </td>
                        <td className={`py-2.5 px-3 text-right font-mono font-semibold ${
                          z.distancePercent >= 0 ? (isSupport ? 'text-rose-400' : 'text-emerald-400') : 'text-amber-400'
                        }`}>
                          {z.distancePercent >= 0 ? `+${z.distancePercent.toFixed(1)}%` : `${z.distancePercent.toFixed(1)}%`}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            z.status === 'broken' || z.status === 'BROKEN'
                              ? 'bg-slate-800 text-slate-400 line-through border border-slate-700'
                              : z.status === 'retest'
                              ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                              : isSupport
                              ? 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
                              : 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
                          }`}>
                            {z.status === 'active' || z.status === 'ACTIVE' || z.status === 'HOLDING' ? 'AKTİF' : z.status === 'retest' ? 'RETEST' : 'KIRILDI'}
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>


          {/* Historical Breakouts Table */}
          {breakouts.length > 0 && (
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Tarihsel Kırılımlar ve Fitil Ayrımı ({breakouts.length}):
              </h4>
              <div className="space-y-1.5">
                {breakouts.slice(0, 5).map(b => (
                  <div key={b.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.direction === 'BULLISH_BREAKOUT' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {b.direction === 'BULLISH_BREAKOUT' ? 'YUKARI KIRILIM' : 'AŞAĞI KIRILIM'}
                      </span>
                      <span className="text-slate-200">{(b.priceLevel ?? b.levelPrice ?? 0).toFixed(2)} TL</span>
                      <span className="text-slate-400">({b.dateStr ?? b.date})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={b.closeConfirmed ? 'text-emerald-400' : 'text-amber-400'}>
                        {b.closeConfirmed ? 'Teyitli Kapanış' : 'Fitil Taşması'}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className={b.volumeConfirmed ? 'text-emerald-400' : 'text-slate-400'}>
                        {b.volumeRatio ? `${b.volumeRatio.toFixed(1)}x Hacim` : 'Normal Hacim'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 3: BİLANÇO TAKVİMİ (FAZ 5 Madde 4) */}
      {activeSubTab === 'EARNINGS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              {symbol} Bilanço ve Finansal Raporlama Takvimi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              FAZ 5 Kuralı: Kesinleşmemiş tarihler tahmini olarak işaretlenir. Yaklaşan açıklamalar için önceden bildirim oluşturulabilir.
            </p>
          </div>

          {earningsCalendar.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Bu şirket için şu an planlanmış bilanço takvim duyurusu bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-3">
              {earningsCalendar.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                        {item.financialPeriod} Finansal Tabloları
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.dateStatus === 'EXACT'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {item.dateStatus === 'EXACT' ? 'KESİNLEŞMİŞ RESMİ TARİH' : 'TAHMİNİ / BEKLENEN TARİH'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Kaynak: <strong className="text-slate-300 font-sans">{item.source}</strong> (Son Güncelleme: {item.lastUpdated})
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right font-mono">
                        <div className="text-base font-extrabold text-emerald-400">{item.scheduledDate}</div>
                        <span className="text-[10px] text-slate-500">Açıklanma Günü</span>
                      </div>

                      <button
                        onClick={() => handleCreateEarningsAlert(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Bildirim Oluştur
                      </button>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. TAB 4: TEMETTÜ TAKVİMİ (FAZ 5 Madde 5) */}
      {activeSubTab === 'DIVIDENDS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              {symbol} Temettü (Kâr Payı Dağıtım) Takvimi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              FAZ 5 Kuralı: Açıklanmamış kararlar kesinleşmiş gibi gösterilmez. Brüt, net temettü ve temettü verimi resmi kaynakla sunulur.
            </p>
          </div>

          {dividendCalendar.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Bu şirket için kayıtlı temettü bildirimi bulunmamaktadır.
            </div>
          ) : (
            <div className="space-y-3">
              {dividendCalendar.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                        {item.companyName}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.decisionStatus === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : item.decisionStatus === 'PROPOSED'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.decisionStatus === 'APPROVED' ? 'GENEL KURULDA ONAYLANDI' : item.decisionStatus === 'PROPOSED' ? 'YÖNETİM KURULU TEKLİFİ' : 'KARAR AÇIKLANMADI'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Resmi Kaynak: <strong className="text-slate-300 font-sans">{item.source}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-extrabold font-mono text-emerald-400">
                        {item.dividendYieldPct !== null ? `%${item.dividendYieldPct.toFixed(1)}` : '-'}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Temettü Verimi ({item.yieldCalculationDate})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">HİSSE BAŞINA BRÜT</span>
                      <strong className="text-slate-100 font-bold">{item.grossPerShare !== null ? `${item.grossPerShare.toFixed(2)} TL` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">HİSSE BAŞINA NET</span>
                      <strong className="text-emerald-400 font-bold">{item.netPerShare !== null ? `${item.netPerShare.toFixed(3)} TL` : '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">HAK KULLANIM TARİHİ</span>
                      <strong className="text-slate-200">{item.exDividendDate || 'Tarih Yok'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ÖDEME / HESABA GEÇİŞ</span>
                      <strong className="text-slate-200">{item.paymentDate || 'Tarih Yok'}</strong>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 5: HABERLER VE KAP AÇIKLAMALARI (FAZ 5 Madde 3 & KAP Entegrasyonu) */}
      {activeSubTab === 'NEWS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {symbol} Resmî Kamuyu Aydınlatma Platformu (KAP) ve Şirket Bildirimleri
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Şirket koduna ({symbol}) göre filtrelenmiş, doğrulanmış resmî bildirimler. Orijinal metin ve yapay zekâ özeti bağımsız sunulmaktadır.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Resmî Doğrulamalı Akış
              </span>
              <a
                href={`https://www.kap.org.tr/tr/sirket-bilgileri/ozet/${symbol}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
              >
                KAP Şirket Profili <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {stockDisclosures.length === 0 && companyNews.length === 0 ? (
            <div className="p-10 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-300">
                  {symbol} İçin Doğrulanmış Resmî KAP Bildirimi Bulunmamaktadır
                </h4>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  BIST Akıllı Analiz Merkezi standartları uyarınca, şirketle doğrudan ilişkisi teyit edilmemiş veya test edilmemiş tahminî bildirimler gösterilmez.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {(stockDisclosures.length > 0 ? stockDisclosures : companyNews).map(rawItem => {
                const item = rawItem as KAPDisclosure;
                const mode = disclosureModeMap[item.id] || 'AI_SUMMARY';
                const originalUrl = item.originalUrl || `https://www.kap.org.tr/tr/Bildirim/${item.disclosureIndex || item.id}`;

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700/80 transition-all space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {item.symbol}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-semibold text-slate-300">{item.companyTitle || symbol}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.disclosureType || item.category || 'Özel Durum'}
                        </span>
                        {item.isImportant && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Önemli
                          </span>
                        )}
                        {item.dataSource === 'MKK_LIVE_API' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            MKK Canlı Akış
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5 text-cyan-400" />
                            Doğrulanmış Arşiv
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{item.publishDate ? item.publishDate.replace('T', ' ').substring(0, 16) : 'Güncel'}</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-slate-100 leading-snug">
                      {item.title}
                    </h4>

                    {/* Toggle: AI Summary vs Original Verbatim KAP Text */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800/80 w-fit text-xs">
                      <button
                        onClick={() => setDisclosureModeMap(prev => ({ ...prev, [item.id]: 'AI_SUMMARY' }))}
                        className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors ${
                          mode === 'AI_SUMMARY'
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        Yapay Zekâ Özeti ve Etki Analizi
                      </button>

                      <button
                        onClick={() => setDisclosureModeMap(prev => ({ ...prev, [item.id]: 'ORIGINAL' }))}
                        className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors ${
                          mode === 'ORIGINAL'
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        Orijinal KAP Açıklama Metni
                      </button>
                    </div>

                    {/* Content Body Based on Selected Mode */}
                    {mode === 'AI_SUMMARY' ? (
                      <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-emerald-900/40">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            Yapay Zekâ Finansal Değerlendirmesi
                          </span>
                          {item.financialImpactScore !== undefined && (
                            <span className="font-bold">
                              Etki Puanı: {item.financialImpactScore.toFixed(1)} / 10
                            </span>
                          )}
                        </div>
                        <p className="leading-relaxed font-sans text-slate-200">
                          {item.aiSummary || item.summary || 'Şirket faaliyet bildirimi yapay zekâ analiz özeti.'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-cyan-400" />
                            KAP Resmî Bildirim Şablonu (Orijinal İfade)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Bildirim No: {item.disclosureIndex || item.id}
                          </span>
                        </div>
                        <p className="leading-relaxed font-mono text-xs whitespace-pre-wrap text-slate-300">
                          {item.originalText || item.summary || 'Resmî metin kaydı.'}
                        </p>
                      </div>
                    )}

                    {/* Footer Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                      <div>
                        <span>Kaynak: <strong className="text-slate-300 font-sans">{item.source || 'KAP Resmî Bildirim'}</strong></span>
                      </div>

                      <a
                        href={originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-sans font-semibold transition-colors"
                      >
                        Resmî KAP Bildirimine Git <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 9. TAB 6: %85 AL EŞİĞİ TEKNİK RAPORU (FAZ 5 Madde 7) */}
      {activeSubTab === 'REPORT_85' && signalAudit && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                %85 AL Eşiği Teknik Analiz Raporu ve Sinyal Denetimi ({symbol})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                FAZ 5 Madde 7: Rapor oluşturulurken geçerli indikatör sinyallerinin en az %85'inin AL yönünde olması şartı denetlenir.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                signalAudit.thresholdMet
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {signalAudit.thresholdMet ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {signalAudit.thresholdMet ? '%85 AL EŞİĞİ SAĞLANDI' : '%85 AL EŞİĞİ SAĞLANAMADI'}
              </span>
            </div>
          </div>

          {/* Warning Banner if threshold not met */}
          {!signalAudit.thresholdMet && signalAudit.warningMessage && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>{signalAudit.warningMessage}</strong>
                <p className="text-[11px] text-amber-400/80 mt-1">
                  Kural uyarınca bu hisse güçlü konsensüs alım eşiğinde değildir. Yine de aşağıda tüm göstergelerin bağımsız denetim detayları incelenebilir.
                </p>
              </div>
            </div>
          )}

          {/* Ratios Distribution Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AL Sinyali Oranı</span>
              <div className="text-lg font-extrabold text-emerald-400">%{signalAudit.buySignalRatioPct}</div>
              <span className="text-[10px] text-slate-500">{signalAudit.buySignalsCount} / {signalAudit.evaluatedIndicatorsCount} Gösterge</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SAT Sinyali Oranı</span>
              <div className="text-lg font-extrabold text-rose-400">%{signalAudit.sellSignalRatioPct}</div>
              <span className="text-[10px] text-slate-500">{signalAudit.sellSignalsCount} / {signalAudit.evaluatedIndicatorsCount} Gösterge</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nötr Sinyal Oranı</span>
              <div className="text-lg font-extrabold text-slate-300">%{signalAudit.neutralSignalRatioPct}</div>
              <span className="text-[10px] text-slate-500">{signalAudit.neutralSignalsCount} / {signalAudit.evaluatedIndicatorsCount} Gösterge</span>
            </div>
          </div>

          {/* Signals Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Gösterge Adı</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Sinyal</th>
                  <th className="py-2.5 px-3">Mevcut Değer</th>
                  <th className="py-2.5 px-3">Açıklama / Karar</th>
                  <th className="py-2.5 px-3 text-center">Bağımsızlık</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {signalAudit.signals.map(sig => (
                  <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">
                      {sig.name}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] font-mono text-slate-400">
                      {sig.category}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sig.signal === 'BUY'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : sig.signal === 'SELL'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {sig.signal === 'BUY' ? 'AL' : sig.signal === 'SELL' ? 'SAT' : 'NÖTR'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {sig.valueStr}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-300 max-w-xs">
                      {sig.reason}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px]">
                      {sig.isIndependent ? (
                        <span className="text-emerald-400 font-mono">Bağımsız</span>
                      ) : (
                        <span className="text-amber-400 font-mono" title={sig.correlationNote}>Bağımlı</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Uncomputable Indicators Notice (Madde 7: Asla AL veya Nötr sayılmaz) */}
          {signalAudit.uncomputableList.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold block mb-1">
                Hesaplanamayan Göstergeler ({signalAudit.uncomputableList.length}) — Kural Gereği AL veya Nötr Sayılmamıştır:
              </span>
              <ul className="space-y-1 text-slate-400 text-[11px]">
                {signalAudit.uncomputableList.map((unc, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 font-mono">
                    <span className="text-slate-600">•</span>
                    <strong className="text-slate-300">{unc.name}:</strong>
                    <span>{unc.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings & Mandatory Legal Disclaimers */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <p className="text-amber-400/90 leading-relaxed font-sans">
              <strong>{signalAudit.correlationWarning}</strong>
            </p>
            <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400 leading-relaxed font-sans">
              <strong>{signalAudit.legalDisclaimer}</strong>
            </p>
          </div>
        </div>
      )}

      {/* 10. TAB 7: TÜM TEKNİK GÖSTERGELER (Full Indicators Grid) */}
      {activeSubTab === 'INDICATORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                {symbol} Kapsamlı Teknik Göstergeler
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                SMA tamamen kaldırılmıştır. Tüm hareketli ortalamalar EMA olarak hesaplanmıştır.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('technical')}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 transition-colors"
            >
              Teknik Analiz Merkezine Git <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">EMA (5, 20, 50, 200)</span>
              <div className="text-slate-200 mt-1 font-semibold space-y-0.5">
                <div>EMA5: {signalAudit?.signals.find(s => s.id === 'sig_ema5_ema20')?.valueStr}</div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">RSI (14 Wilder)</span>
              <div className="text-cyan-400 mt-1 font-bold text-sm">
                {signalAudit?.signals.find(s => s.id === 'sig_rsi14')?.valueStr || '-'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MACD (12, 26, 9)</span>
              <div className="text-slate-200 mt-1 font-semibold">
                {signalAudit?.signals.find(s => s.id === 'sig_macd')?.valueStr || '-'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">BOLLINGER BANTLARI (EMA20 ORTA BANT)</span>
              <div className="text-slate-200 mt-1 font-semibold">
                {signalAudit?.signals.find(s => s.id === 'sig_bollinger')?.valueStr || '-'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">HACİM ORANI (20 BAR EMA)</span>
              <div className="text-emerald-400 mt-1 font-bold text-sm">
                {signalAudit?.signals.find(s => s.id === 'sig_volume')?.valueStr || '-'}
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PARABOLIC SAR</span>
              <div className="text-slate-200 mt-1 font-semibold">
                {signalAudit?.signals.find(s => s.id === 'sig_psar')?.valueStr || '-'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
