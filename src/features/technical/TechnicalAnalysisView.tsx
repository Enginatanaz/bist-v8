import React, { useState, useEffect } from 'react';
import {
  BISTStock,
  TechnicalIndicators,
  SupportResistanceZone,
  ChartPattern,
  MultiTimeframeTrend,
  BreakoutEvent,
  TechnicalSignalAudit,
  RelativeStrengthMetrics,
  MarketRegimeReport,
  DownsideRiskAssessment
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  ShieldCheck,
  AlertTriangle,
  Compass,
  Zap,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowRight,
  Info,
  CheckCircle2,
  Clock,
  Activity,
  Check,
  Shield,
  Scale,
  Bell,
  Sliders,
  BarChart2
} from 'lucide-react';

interface TechnicalAnalysisViewProps {
  symbol: string;
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const TechnicalAnalysisView: React.FC<TechnicalAnalysisViewProps> = ({
  symbol,
  stocks,
  onSelectStock,
  onNavigateTab
}) => {
  const [data, setData] = useState<{
    stock: BISTStock;
    indicators: TechnicalIndicators;
    zones: SupportResistanceZone[];
    breakouts?: BreakoutEvent[];
    patterns: ChartPattern[];
    trends: MultiTimeframeTrend[];
    candleCount: number;
    lastCandleDate: string;
    isDelayed: boolean;
  } | null>(null);

  const [signalAudit, setSignalAudit] = useState<TechnicalSignalAudit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeSubTab, setActiveSubTab] = useState<'SUMMARY' | 'INDICATORS' | 'LEVELS' | 'BREAKOUTS' | 'PATTERNS' | 'REPORT' | 'RELATIVE_STRENGTH'>('SUMMARY');

  // FAZ 4 Relative Strength, Market Regime & Downside Risk states
  const [compIndex, setCompIndex] = useState<string>('XU100');
  const [compTimeframe, setCompTimeframe] = useState<string>('1d');
  const [rsData, setRsData] = useState<RelativeStrengthMetrics | null>(null);
  const [regimeData, setRegimeData] = useState<MarketRegimeReport | null>(null);
  const [downsideRisk, setDownsideRisk] = useState<DownsideRiskAssessment | null>(null);
  const [isCompLoading, setIsCompLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsCompLoading(true);
    Promise.all([
      apiClient.getRelativeStrength(symbol, compIndex, compTimeframe),
      apiClient.getMarketRegime(compIndex),
      apiClient.getDownsideRisk(symbol, compIndex, compTimeframe)
    ])
      .then(([rsRes, regimeRes, riskRes]) => {
        if (isMounted) {
          setRsData(rsRes);
          setRegimeData(regimeRes);
          setDownsideRisk(riskRes);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsCompLoading(false);
      });
    return () => { isMounted = false; };
  }, [symbol, compIndex, compTimeframe]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    Promise.all([
      apiClient.getTechnical(symbol, '1d'),
      apiClient.getTechnicalSignalAudit(symbol, '1d')
    ])
      .then(([techRes, auditRes]) => {
        if (isMounted) {
          setData(techRes);
          setSignalAudit(auditRes);
        }
      })
      .catch(err => {
        if (isMounted) setError(err.message || 'Teknik analiz verisi alınamadı.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <div className="text-xs text-slate-400 font-mono">
          {symbol} için tüm EMA göstergeleri, pivot bölgeleri ve formasyonlar hesaplanıyor...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            {symbol} İçin Doğrulanmış Teknik Analiz Verisi Bulunamadı
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Bu sembol Borsa İstanbul hisse evreninde kayıtlıdır ancak sağlayıcıdan yeterli geçerli OHLCV mum verisi alınamadı ({error}). Kural 1 uyarınca sahte veya sentetik indikatör hesaplanmamaktadır.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onSelectStock('THYAO')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            Doğrulanmış BIST 30 Hisselerine Dön (THYAO)
          </button>
        </div>
      </div>
    );
  }

  const { stock, indicators, zones, breakouts = [], patterns, trends, lastCandleDate } = data;
  const currentPrice = stock.lastPrice;

  // EMA Trends evaluation (FAZ 2 Madde 2)
  const emaTrends = indicators.emaTrends;
  const ema5Val = emaTrends?.ema5 || indicators.ema5 || currentPrice;
  const ema20Val = emaTrends?.ema20 || indicators.ema20 || currentPrice;

  const ema5Dir = emaTrends?.ema5Trend || emaTrends?.ema5Direction || (currentPrice > ema5Val ? 'BULLISH' : currentPrice < ema5Val ? 'BEARISH' : 'NEUTRAL');
  const ema20Dir = emaTrends?.ema20Trend || emaTrends?.ema20Direction || (currentPrice > ema20Val ? 'BULLISH' : currentPrice < ema20Val ? 'BEARISH' : 'NEUTRAL');

  // Ana trend EMA20'ye göre belirlenir (Kural 2)
  const primaryTrend = emaTrends?.mainTrend || emaTrends?.primaryTrend || ema20Dir;

  const rsi = indicators.rsi14 || 50;

  let momentumSignal = 'DENGELİ';
  if (rsi > 70) momentumSignal = 'AŞIRI ALIM (Kâr Satışı Riski)';
  else if (rsi < 30) momentumSignal = 'AŞIRI SATIM (Tepki Potansiyeli)';
  else if (rsi >= 55) momentumSignal = 'POZİTİF MOMENTUM';
  else if (rsi <= 45) momentumSignal = 'NEGATİF MOMENTUM';

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-mono">{symbol}</h2>
              <span className="text-xs text-slate-400 font-medium">· {stock.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">{stock.sector}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>Son Fiyat: <strong className="text-slate-100">{stock.lastPrice.toFixed(2)} TL</strong></span>
              <span className="text-slate-600">·</span>
              <span className={stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                Günlük: {stock.changePercent >= 0 ? `+${stock.changePercent}%` : `${stock.changePercent}%`}
              </span>
              <span className="text-slate-600">·</span>
              <span>Son Mum Zamanı: <strong className="text-slate-200">{lastCandleDate}</strong></span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400">15 Dk Gecikmeli Doğrulanmış Veri</span>
            </div>
          </div>

          {/* Sub-nav Tab Buttons */}
          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveSubTab('SUMMARY')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'SUMMARY' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Özet Göstergeler
            </button>
            <button
              onClick={() => setActiveSubTab('INDICATORS')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'INDICATORS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tüm EMA &amp; Göstergeler
            </button>
            <button
              onClick={() => setActiveSubTab('LEVELS')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'LEVELS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Destek &amp; Direnç ({zones.length})
            </button>
            <button
              onClick={() => setActiveSubTab('BREAKOUTS')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'BREAKOUTS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kırılımlar ({breakouts.length})
            </button>
            <button
              onClick={() => setActiveSubTab('PATTERNS')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'PATTERNS' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formasyonlar ({patterns.length})
            </button>
            <button
              onClick={() => setActiveSubTab('REPORT')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeSubTab === 'REPORT' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kapsamlı Rapor
            </button>
            <button
              onClick={() => setActiveSubTab('RELATIVE_STRENGTH')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'RELATIVE_STRENGTH' ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Göreceli Güç &amp; Risk (FAZ 4)
            </button>
          </div>
        </div>
      </div>

      {/* 2. EMA5 VE EMA20 TREND YÖNLERİ (FAZ 2 Madde 2) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* EMA5 TREND YÖNÜ CARD */}
        <div className={`p-4 rounded-lg border font-mono ${
          ema5Dir === 'BULLISH'
            ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300'
            : ema5Dir === 'BEARISH'
            ? 'bg-rose-950/20 border-rose-800/80 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-100 font-sans">EMA5 TREND YÖNÜ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-mono">Kısa Vadeli</span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
              <Clock className="w-3.5 h-3.5" /> {lastCandleDate}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-2xl font-black flex items-center gap-2">
                {ema5Dir === 'BULLISH' ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-400">BOĞA YÖNÜ</span>
                  </>
                ) : ema5Dir === 'BEARISH' ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                    <span className="text-rose-400">AYI YÖNÜ</span>
                  </>
                ) : (
                  <span className="text-slate-300">NÖTR</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                {currentPrice > ema5Val
                  ? 'Kapanış EMA5 üzerinde (Fiyat > EMA5)'
                  : currentPrice < ema5Val
                  ? 'Kapanış EMA5 altında (Fiyat < EMA5)'
                  : 'Kapanış EMA5 seviyesinde eşit'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">EMA 5 Seviyesi</div>
              <div className="text-lg font-bold text-amber-400 tabular-nums">{ema5Val.toFixed(2)} TL</div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                Kapanış: <strong className="text-slate-200">{currentPrice.toFixed(2)} TL</strong>
              </div>
            </div>
          </div>
        </div>

        {/* EMA20 TREND YÖNÜ CARD (ANA TREND) */}
        <div className={`p-4 rounded-lg border font-mono ${
          ema20Dir === 'BULLISH'
            ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300'
            : ema20Dir === 'BEARISH'
            ? 'bg-rose-950/20 border-rose-800/80 text-rose-300'
            : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-slate-100 font-sans">EMA20 TREND YÖNÜ</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                ANA TREND ESASI
              </span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-sans">
              <Clock className="w-3.5 h-3.5" /> {lastCandleDate}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <div className="text-2xl font-black flex items-center gap-2">
                {ema20Dir === 'BULLISH' ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <span className="text-emerald-400">BOĞA YÖNÜ</span>
                  </>
                ) : ema20Dir === 'BEARISH' ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                    <span className="text-rose-400">AYI YÖNÜ</span>
                  </>
                ) : (
                  <span className="text-slate-300">NÖTR</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-sans">
                {currentPrice > ema20Val
                  ? 'Kapanış EMA20 üzerinde (Ana trend boğa)'
                  : currentPrice < ema20Val
                  ? 'Kapanış EMA20 altında (Ana trend ayı)'
                  : 'Kapanış EMA20 seviyesinde eşit'}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">EMA 20 Seviyesi</div>
              <div className="text-lg font-bold text-cyan-400 tabular-nums">{ema20Val.toFixed(2)} TL</div>
              <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                Kesişim: <strong className={emaTrends?.crossover === 'BULLISH_CROSS' ? 'text-emerald-400' : emaTrends?.crossover === 'BEARISH_CROSS' ? 'text-rose-400' : 'text-slate-400'}>
                  {emaTrends?.crossoverLabel || 'Kesişim Yok'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Secondary Metric Cards (Momentum, Volatilite, Hacim) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Momentum Strength */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Momentum Durumu</span>
            <Zap className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-sm font-bold font-mono text-cyan-400">
            {momentumSignal}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            RSI (14): <strong className="text-slate-300">{rsi.toFixed(1)}</strong> · MACD Hist: <strong className="text-slate-300">{indicators.macd?.histogram || '-'}</strong>
          </div>
        </div>

        {/* Volatility Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Volatilite Seviyesi</span>
            <AlertTriangle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-sm font-bold font-mono text-amber-400">
            {indicators.bollinger && indicators.bollinger.bandwidth < 6 ? 'SIKIŞMA (Bant %6 altı)' : 'NORMAL DALGA BOYU'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            ATR (14): <strong className="text-slate-300">{indicators.atr14?.toFixed(2) || '-'} TL</strong>
          </div>
        </div>

        {/* Volume Confluence */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Hacim Teyidi (20G EMA)</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400">
            {indicators.volumeRatio && indicators.volumeRatio >= 1.5 ? 'GÜÇLÜ HACİM ARTIŞI' : 'RUTİN İŞLEM HACMİ'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-1">
            Hacim / 20G Hacim EMA: <strong className="text-slate-300">{indicators.volumeRatio || '1.0'}x</strong>
          </div>
        </div>
      </div>

      {/* Multi-Timeframe Alignment Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          Çoklu Zaman Dilimi Trend Uyumu (EMA20 &amp; EMA50 Trend Matrix)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {trends.map(t => {
            const isBull = t.trend.includes('BULL');
            const isBear = t.trend.includes('BEAR');
            return (
              <div
                key={t.timeframe}
                className="bg-slate-950 p-3 rounded border border-slate-800/80 font-mono"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-400 font-semibold">{t.label}</span>
                  <span className="text-[10px] text-slate-500">RSI: {t.rsi.toFixed(0)}</span>
                </div>
                <div className={`text-xs font-bold ${isBull ? 'text-emerald-400' : isBear ? 'text-rose-400' : 'text-slate-300'}`}>
                  {t.trend === 'STRONG_BULL' ? 'GÜÇLÜ BOĞA' : t.trend === 'BULLISH' ? 'YUKARI' : t.trend === 'STRONG_BEAR' ? 'GÜÇLÜ AYI' : t.trend === 'BEARISH' ? 'AŞAĞI' : 'YATAY'}
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full ${isBull ? 'bg-emerald-500' : isBear ? 'bg-rose-500' : 'bg-slate-600'}`}
                    style={{ width: `${t.strengthScore}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-500 font-sans mt-1.5 truncate">{t.summary}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SUMMARY / GENERAL ANALYSIS */}
      {activeSubTab === 'SUMMARY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support and Resistance highlights (Kural 6: Destek Kırmızı, Direnç Yeşil) */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Önemli Destek ve Direnç Koridorları</span>
              <button onClick={() => setActiveSubTab('LEVELS')} className="text-emerald-400 hover:underline text-[11px]">
                Tümünü Gör ({zones.length})
              </button>
            </h3>
            <div className="space-y-2 font-mono text-xs">
              {zones.slice(0, 4).map(z => {
                const isSupp = z.type === 'SUPPORT';
                return (
                  <div
                    key={z.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSupp ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {isSupp ? 'DESTEK' : 'DİRENÇ'}
                      </span>
                      <span className="font-semibold text-slate-200">{z.priceLow.toFixed(2)} - {z.priceHigh.toFixed(2)} TL</span>
                    </div>
                    <div className="text-right text-slate-400 text-[11px]">
                      Mesafe: <strong className={isSupp ? 'text-rose-400' : 'text-emerald-400'}>%{z.distancePercent}</strong>
                      <span className="text-slate-600 mx-1">·</span>
                      Temas: <strong className="text-slate-200">{z.touchCount}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Chart Patterns */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center justify-between">
              <span>Tespit Edilen Fiyat Formasyonları</span>
              <button onClick={() => setActiveSubTab('PATTERNS')} className="text-emerald-400 hover:underline text-[11px]">
                Tüm Formasyonlar ({patterns.length})
              </button>
            </h3>
            {patterns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Son periyotta aktif kırılım aşamasına gelmiş klasik grafik formasyonu tespit edilmedi.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {patterns.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950/60 rounded border border-slate-800/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{p.turkishName}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {p.status === 'CONFIRMED' ? 'Teyit Edildi' : 'Oluşum Aşamasında'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{p.description}</p>
                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                      <span>Hedef: <strong className="text-emerald-400">{p.targetPrice} TL</strong></span>
                      <span>Stop-Loss: <strong className="text-rose-400">{p.stopLossPrice} TL</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DETAILED INDICATOR TABLE (100% EMA TABANLI, SMA TAMAMEN KALDIRILDI) */}
      {activeSubTab === 'INDICATORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="font-bold text-slate-200">Deterministik EMA ve Teknik Göstergeler (SMA Yoktur)</span>
            <span className="font-mono text-[11px]">Son Mum: {lastCandleDate}</span>
          </div>
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3.5">İndikatör</th>
                <th className="py-2.5 px-3.5">Kategori</th>
                <th className="py-2.5 px-3.5">Parametre / Formül</th>
                <th className="py-2.5 px-3.5 text-right">Hesaplanan Değer</th>
                <th className="py-2.5 px-3.5 text-center">Teknik Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
              {/* EMA 5 & EMA 20 */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">EMA 5 &amp; EMA 20</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Kısa &amp; Ana Trend</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">Üstel Hareketli Ortalamalar (EMA)</td>
                <td className="py-2.5 px-3.5 text-right text-slate-100 font-bold">
                  EMA5: {indicators.ema5} | EMA20: {indicators.ema20} TL
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    primaryTrend === 'BULLISH' ? 'bg-emerald-950 text-emerald-400' : primaryTrend === 'BEARISH' ? 'bg-rose-950 text-rose-400' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {primaryTrend === 'BULLISH' ? 'Ana Trend Boğa' : primaryTrend === 'BEARISH' ? 'Ana Trend Ayı' : 'Nötr'}
                  </span>
                </td>
              </tr>
              {/* EMA 50, 100, 200 */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">EMA 50 / 100 / 200</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Orta &amp; Uzun Vade Trend</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">Dinamik Ağırlıklı Üstel Ortalamalar</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">
                  EMA50: {indicators.ema50} | EMA100: {indicators.ema100} | EMA200: {indicators.ema200}
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {currentPrice > (indicators.ema50 || 0) && currentPrice > (indicators.ema200 || 0) ? (
                    <span className="text-emerald-400 font-semibold">Tüm EMA'lar Üzerinde</span>
                  ) : currentPrice < (indicators.ema50 || 0) && currentPrice < (indicators.ema200 || 0) ? (
                    <span className="text-rose-400 font-semibold">Tüm EMA'lar Altında</span>
                  ) : (
                    <span className="text-amber-400 font-semibold">Karışık EMA Konumu</span>
                  )}
                </td>
              </tr>
              {/* 20G Hacim EMA */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">Hacim EMA (20 Bar)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Hacim Trendi</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">20 Periyot Üstel Hacim Ortalaması</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">
                  {indicators.volumeEma20 ? `${(indicators.volumeEma20 / 1_000_000).toFixed(2)}M Adet` : '-'}
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {(indicators.volumeRatio || 1) >= 1.2 ? (
                    <span className="text-emerald-400 font-semibold">Hacim Patlaması ({indicators.volumeRatio}x)</span>
                  ) : (
                    <span className="text-slate-400">Rutin Hacim ({indicators.volumeRatio}x)</span>
                  )}
                </td>
              </tr>
              {/* Bollinger Bantları (EMA20 Orta Bant) */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">Bollinger Bantları (20, 2)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Volatilite</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">EMA20 Orta Bant ± 2 Standart Sapma</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">
                  Üst: {indicators.bollinger?.upper} · Orta (EMA20): {indicators.bollinger?.middle} · Alt: {indicators.bollinger?.lower} (Bant: %{indicators.bollinger?.bandwidth})
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {indicators.bollinger && indicators.bollinger.bandwidth < 6 ? 'Sıkışma (Dar Bant)' : 'Normal Dalga'}
                </td>
              </tr>
              {/* RSI */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">RSI (Relative Strength Index)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Momentum</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">14 Periyot Wilder Düzeltmesi</td>
                <td className="py-2.5 px-3.5 text-right font-bold text-cyan-400">{indicators.rsi14 || '-'}</td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {rsi > 70 ? 'Aşırı Alım' : rsi < 30 ? 'Aşırı Satım' : 'Dengeli Bölge'}
                </td>
              </tr>
              {/* MACD */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">MACD (12, 26, 9)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Trend &amp; Momentum</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">EMA12 - EMA26 vs Sinyal EMA9</td>
                <td className="py-2.5 px-3.5 text-right font-bold text-slate-100">
                  {indicators.macd?.macdLine} / {indicators.macd?.signalLine} (Hist: {indicators.macd?.histogram})
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {(indicators.macd?.histogram || 0) > 0 ? (
                    <span className="text-emerald-400 font-semibold">Pozitif Kesişim</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Negatif Kesişim</span>
                  )}
                </td>
              </tr>
              {/* ATR */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">ATR 14 (Average True Range)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Volatilite</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">14 Günlük Gerçek Ortalama Aralık</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200 font-bold">{indicators.atr14?.toFixed(2)} TL</td>
                <td className="py-2.5 px-3.5 text-center font-sans">Günlük %{((indicators.atr14 || 1) / currentPrice * 100).toFixed(1)} Salınım</td>
              </tr>
              {/* Stokastik */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">Stokastik Osilatör (%K, %D)</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Momentum</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">14, 3, 3 Hızlı ve Yavaş</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">
                  %K: {indicators.stochastic?.k || '-'} | %D: {indicators.stochastic?.d || '-'}
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {(indicators.stochastic?.k || 50) > 80 ? 'Aşırı Alım' : (indicators.stochastic?.k || 50) < 20 ? 'Aşırı Satım' : 'Denge'}
                </td>
              </tr>
              {/* Ichimoku */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">Ichimoku Bulutu</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Piyasa Yapısı</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">Tenkan 9, Kijun 26, Span A/B 52</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">
                  Tenkan: {indicators.ichimoku?.tenkanSen} | Kijun: {indicators.ichimoku?.kijunSen}
                </td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {currentPrice > (indicators.ichimoku?.kijunSen || currentPrice) ? 'Kijun Üzerinde' : 'Kijun Altında'}
                </td>
              </tr>
              {/* Parabolic SAR */}
              <tr>
                <td className="py-2.5 px-3.5 font-bold text-slate-100 font-sans">Parabolic SAR</td>
                <td className="py-2.5 px-3.5 text-slate-400 font-sans">Trend Takip</td>
                <td className="py-2.5 px-3.5 text-slate-500 font-sans">Adım 0.02, Maks 0.2</td>
                <td className="py-2.5 px-3.5 text-right text-slate-200">{indicators.parabolicSar?.toFixed(2)} TL</td>
                <td className="py-2.5 px-3.5 text-center font-sans">
                  {currentPrice > (indicators.parabolicSar || 0) ? (
                    <span className="text-emerald-400 font-semibold">Alım Konumunda</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">Satış Konumunda</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SUPPORT & RESISTANCE ENGINE (Kural 6: Destek Kırmızı, Direnç Yeşil) */}
      {activeSubTab === 'LEVELS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Doğrulanmış Destek ve Direnç Bölgeleri Motoru</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Destek ve dirençler bağımsız pivot algoritmalarıyla hesaplanmış; destekler KIRMIZI (#ef4444), dirençler YEŞİL (#10b981) olarak sınıflandırılmıştır.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-rose-400 flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Destek (Kırmızı - Dip)
              </span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Direnç (Yeşil - Tepe)
              </span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {zones.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 font-mono">
                Bu zaman diliminde yeterli veriden doğrulanmış destek veya direnç bulunamadı.
              </div>
            ) : (
              zones.map(z => {
                const isSupp = (z.type && (z.type.toUpperCase() === 'SUPPORT' || z.type === 'support')) || z.colorHex === '#ef4444';
                const levelPrice = z.price ?? z.pivotPrice;
                const lowVal = z.zoneLow ?? z.priceLow;
                const highVal = z.zoneHigh ?? z.priceHigh;
                const isBroken = z.status === 'broken' || z.status === 'BROKEN';
                const isRetest = z.status === 'retest';

                return (
                  <div
                    key={z.id}
                    className={`p-3.5 rounded border ${
                      isSupp ? 'bg-rose-950/20 border-rose-900/60' : 'bg-emerald-950/20 border-emerald-900/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                          isSupp ? 'bg-rose-900 text-rose-300 border-rose-800' : 'bg-emerald-900 text-emerald-300 border border-emerald-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSupp ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {isSupp ? 'DESTEK BÖLGESİ' : 'DİRENÇ BÖLGESİ'}
                        </span>
                        <span className="text-sm font-bold text-slate-100">
                          {lowVal.toFixed(2)} - {highVal.toFixed(2)} TL
                        </span>
                        <span className="text-slate-500 font-bold">(Temsilî: {levelPrice.toFixed(2)} TL)</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-slate-400">
                        <span>
                          Mesafe:{' '}
                          <strong className={z.distancePercent >= 0 ? (isSupp ? 'text-rose-400' : 'text-emerald-400') : 'text-amber-400'}>
                            {z.distancePercent >= 0 ? `+${z.distancePercent.toFixed(1)}%` : `${z.distancePercent.toFixed(1)}%`}
                          </strong>
                        </span>
                        <span>Test:{' '}<strong className="text-slate-200">{z.touchCount} kez</strong></span>
                        <span>Pivot:{' '}<strong className="text-slate-300">{z.pivotCount || 1}</strong></span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans ${
                          isBroken
                            ? 'bg-slate-800 text-slate-400 border border-slate-700 line-through'
                            : isRetest
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : isSupp
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {isBroken ? 'KIRILDI' : isRetest ? 'RETEST' : 'AKTİF'}
                        </span>
                        <span>Güç Skoru: <strong className="text-slate-100">{z.strengthScore} / 100</strong></span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className={`h-full ${isSupp ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${z.strengthScore}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BREAKOUTS (FAZ 2 Madde 7: Kırılımlar ve Fitil Taşması Ayrımı) */}
      {activeSubTab === 'BREAKOUTS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">Destek ve Direnç Kırılım Geçmişi</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Fitil taşması (wick penetration) ile kapanış teyitli gerçek kırılımlar matematiksel olarak ayrıştırılmıştır.
            </p>
          </div>

          {breakouts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              Bu periyotta tespit edilmiş kayıtlı destek/direnç kırılım olayı bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 uppercase font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Tarih</th>
                    <th className="py-2 px-3">Fiyat Seviyesi</th>
                    <th className="py-2 px-3">Kırılım Yönü</th>
                    <th className="py-2 px-3">Zaman Dilimi</th>
                    <th className="py-2 px-3 text-center">Kapanış Teyidi</th>
                    <th className="py-2 px-3 text-center">Hacim Teyidi</th>
                    <th className="py-2 px-3 text-right">Sonraki Fiyat Hareketi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {breakouts.map(b => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-200 font-semibold">{b.dateStr || b.date}</td>
                      <td className="py-2 px-3 font-bold text-slate-100">{(b.levelPrice ?? b.priceLevel ?? 0).toFixed(2)} TL</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          b.direction === 'BULLISH_BREAKOUT'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {b.direction === 'BULLISH_BREAKOUT' ? 'YUKARI KIRILIM' : 'AŞAĞI KIRILIM'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{b.timeframe.toUpperCase()}</td>
                      <td className="py-2 px-3 text-center">
                        {b.closeConfirmed ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-sans font-bold">
                            Kapanış Teyitli
                          </span>
                        ) : b.wickPenetrationOnly ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-sans font-bold">
                            Fitil Taşması (Sahte Kırılım)
                          </span>
                        ) : (
                          <span className="text-slate-500 font-sans">Teyitsiz</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {(b.hasVolumeConfirmation ?? b.volumeConfirmed) ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-sans">
                            {b.volumeRatio ? `${b.volumeRatio.toFixed(1)}x Hacim` : 'Hacimli'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-sans">Rutin Hacim</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {b.subsequentMovePct !== undefined ? (
                          <span className={`font-bold ${b.subsequentMovePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {b.subsequentMovePct >= 0 ? `+${b.subsequentMovePct.toFixed(2)}%` : `${b.subsequentMovePct.toFixed(2)}%`}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PATTERNS (FAZ 2 Madde 8: 16 Formasyon Kapsamı) */}
      {activeSubTab === 'PATTERNS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100">
              Genişletilmiş Formasyon Tespit Motoru ({patterns.length} Aktif Formasyon)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Desteklenen 16 Formasyon: Yükselen/Düşen/Simetrik Üçgen, TOBO, OBO, Çift/Üçlü Dip ve Tepe, Kamalar, Bayrak, Flama, Kanallar.
            </p>
          </div>

          {patterns.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 font-mono">
              Bu hissede yakın dönemde matematiksel kurallarla doğrulanmış formasyon bulunmamaktadır.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {patterns.map(p => (
                <div
                  key={p.id}
                  className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{p.turkishName}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.bias === 'BULLISH' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                      }`}>
                        {p.bias === 'BULLISH' ? 'Yükseliş Eğilimli' : 'Düşüş Eğilimli'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        p.status === 'CONFIRMED' ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                      }`}>
                        {p.status === 'CONFIRMED' ? 'Teyit Edildi' : 'Oluşumda'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-400 leading-relaxed">{p.description}</p>

                  {/* Formasyon Parametreleri (Madde 8) */}
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                    <div>
                      <span className="text-slate-500 font-sans">Başlangıç:</span> <strong className="text-slate-300">{p.startDate || '-'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">Zaman Dilimi:</span> <strong className="text-slate-300">{p.timeframe?.toUpperCase() || '1D'}</strong>
                    </div>
                    {p.boundaries && (
                      <div className="col-span-2">
                        <span className="text-slate-500 font-sans">Sınırlar:</span>{' '}
                        <strong className="text-slate-300">
                          Alt {(p.boundaries.lowerLevel ?? p.boundaries.lower ?? 0).toFixed(2)} TL - Üst {(p.boundaries.upperLevel ?? p.boundaries.upper ?? 0).toFixed(2)} TL
                        </strong>
                      </div>
                    )}
                    {p.invalidationCondition && (
                      <div className="col-span-2 text-rose-300/90 text-[10px] font-sans">
                        <strong>Geçersizlik Koşulu:</strong> {p.invalidationCondition}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                    <div>
                      <div className="text-slate-500">Kırılım / Boyun</div>
                      <div className="text-slate-200 font-semibold">{p.necklinePrice} TL</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Formasyon Hedefi</div>
                      <div className="text-emerald-400 font-semibold">{p.targetPrice} TL</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Stop-Loss</div>
                      <div className="text-rose-400 font-semibold">{p.stopLossPrice} TL</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUTOMATED TECHNICAL REPORT & %85 AL EŞİĞİ DENETİMİ (FAZ 5 Madde 7) */}
      {activeSubTab === 'REPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  %85 AL Eşiği Teknik Analiz Raporu &amp; Sinyal Denetimi ({symbol})
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  FAZ 5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Formül: <strong>AL Sinyali Oranı = AL Yönündeki Geçerli İndikatör Sayısı / Değerlendirilebilir İndikatör Sayısı × 100</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 ${
                signalAudit?.thresholdMet
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {signalAudit?.thresholdMet ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {signalAudit?.thresholdMet ? '%85 AL EŞİĞİ GEÇİLDİ' : 'DİKKAT: %85 AL EŞİĞİ SAĞLANAMADI'}
              </span>
            </div>
          </div>

          {/* Warning Banner if threshold not met */}
          {signalAudit && !signalAudit.thresholdMet && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>{signalAudit.warningMessage}</strong>
                <p className="text-[11px] text-amber-400/80 mt-1">
                  Kural uyarınca bu hisse %85 güçlü alım konsensüsünü geçememiştir. Aşağıdaki detaylı gösterge dağılımı objektif olarak incelenebilir.
                </p>
              </div>
            </div>
          )}

          {/* Ratios Breakdown Bar */}
          {signalAudit && (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AL Sinyali Oranı</span>
                <div className="text-lg font-extrabold text-emerald-400">%{signalAudit.buySignalRatioPct}</div>
                <span className="text-[10px] text-slate-500">{signalAudit.buySignalsCount} / {signalAudit.evaluatedIndicatorsCount} Geçerli Gösterge</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SAT Sinyali Oranı</span>
                <div className="text-lg font-extrabold text-rose-400">%{signalAudit.sellSignalRatioPct}</div>
                <span className="text-[10px] text-slate-500">{signalAudit.sellSignalsCount} / {signalAudit.evaluatedIndicatorsCount} Geçerli Gösterge</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nötr Sinyal Oranı</span>
                <div className="text-lg font-extrabold text-slate-300">%{signalAudit.neutralSignalRatioPct}</div>
                <span className="text-[10px] text-slate-500">{signalAudit.neutralSignalsCount} / {signalAudit.evaluatedIndicatorsCount} Geçerli Gösterge</span>
              </div>
            </div>
          )}

          {/* Signals Audit Table */}
          {signalAudit && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Gösterge</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Sinyal</th>
                    <th className="py-2.5 px-3">Değer</th>
                    <th className="py-2.5 px-3">Gerekçe / Yorum</th>
                    <th className="py-2.5 px-3 text-center">Bağımsızlık</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {signalAudit.signals.map(sig => (
                    <tr key={sig.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">
                        {sig.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
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
          )}

          {/* Uncomputable list */}
          {signalAudit && signalAudit.uncomputableList.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-bold block mb-1">
                Hesaplanamayan Göstergeler ({signalAudit.uncomputableList.length}) — Kural Gereği ASLA AL veya NÖTR Sayılmamıştır:
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

          {/* Core Technical Narrative */}
          <div className="space-y-3 text-xs leading-relaxed text-slate-300 pt-2 border-t border-slate-800">
            <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
              <h4 className="font-bold text-emerald-400 mb-1">1. EMA Trend ve Momentum Değerlendirmesi</h4>
              <p>
                {symbol} pay senedi {currentPrice.toFixed(2)} TL seviyesinde olup, EMA5 seviyesi {ema5Val.toFixed(2)} TL ({ema5Dir === 'BULLISH' ? 'kısa vadeli boğa' : 'kısa vadeli ayı'}) ve ana trendi temsil eden EMA20 seviyesi {ema20Val.toFixed(2)} TL ({ema20Dir === 'BULLISH' ? 'ana trend boğa' : 'ana trend ayı'}) konumundadır. Orta vadeli EMA50 {indicators.ema50 || '-'} TL ve uzun vadeli EMA200 {indicators.ema200 || '-'} TL seviyesindedir. RSI (14) göstergesi {indicators.rsi14} seviyesinde bulunarak {momentumSignal.toLowerCase()} karakter sergilemektedir.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
              <h4 className="font-bold text-cyan-400 mb-1">2. Volatilite ve İşlem Hacmi Analizi</h4>
              <p>
                14 günlük Ortalama Gerçek Aralık (ATR) {indicators.atr14?.toFixed(2)} TL seviyesindedir. Bollinger bantları EMA20 orta bandı etrafında %{indicators.bollinger?.bandwidth} genişliğindedir. İşlem hacmi, 20 barlık hacim EMA seviyesinin {indicators.volumeRatio}x katı düzeyindedir.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
              <h4 className="font-bold text-amber-400 mb-1">3. Destek, Direnç ve Kırılım Seviyeleri</h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300 mt-1">
                <li>
                  <strong className="text-slate-100">Direnç Teyidi (Yeşil):</strong> En yakın direnç bölgesi olan {zones.find(z => z.type === 'RESISTANCE')?.priceHigh || '-'} TL seviyesinin üzerinde hacimli kapanış gerçekleşmesi.
                </li>
                <li>
                  <strong className="text-slate-100">Destek Teyidi (Kırmızı):</strong> En yakın destek koridoru olan {zones.find(z => z.type === 'SUPPORT')?.priceLow || '-'} TL seviyesinin kırılması.
                </li>
                <li>
                  <strong className="text-slate-100">Kesişim Sinyali:</strong> {emaTrends?.crossoverLabel || 'Aktif EMA5/EMA20 kesişimi mevcut değildir.'}
                </li>
              </ul>
            </div>
          </div>

          {/* Mandatory Disclaimers */}
          <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            <p className="text-amber-400/90 leading-relaxed font-sans">
              <strong>{signalAudit?.correlationWarning}</strong>
            </p>
            <p className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-400 leading-relaxed font-sans">
              <strong>{signalAudit?.legalDisclaimer}</strong>
            </p>
          </div>
        </div>
      )}

      {/* 8. FAZ 4: GÖRECELİ GÜÇ, PİYASA REJİMİ & DÜŞÜŞ RİSKİ ANALİZİ */}
      {activeSubTab === 'RELATIVE_STRENGTH' && (
        <div className="space-y-5">
          {/* Controls Bar: Index & Timeframe Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  {symbol} vs Referans Endeks Karşılaştırması &amp; Göreceli Güç
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aynı zaman diliminde senkronize getiri farkı (Alfa = Hisse Getirisi - Endeks Getirisi) ve 5 seviyeli piyasa rejimi.
                </p>
              </div>

              <button
                onClick={() => onNavigateTab('alerts')}
                className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                Bu Çift İçin Alarm Kur
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Referans Endeks Seçimi:</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { sym: 'XU100', name: 'BIST 100' },
                    { sym: 'XU030', name: 'BIST 30' },
                    { sym: 'XU050', name: 'BIST 50' },
                    { sym: 'XBANK', name: 'BIST Banka' },
                    { sym: 'XUSIN', name: 'BIST Sınai' }
                  ].map(idx => (
                    <button
                      key={idx.sym}
                      onClick={() => setCompIndex(idx.sym)}
                      className={`px-3 py-1.5 rounded font-mono font-bold transition-colors ${
                        compIndex === idx.sym
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {idx.sym} ({idx.name})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">Periyot (Zaman Dilimi):</label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '1h', label: '1 Saat' },
                    { id: '4h', label: '4 Saat' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1w', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setCompTimeframe(tf.id)}
                      className={`px-3 py-1.5 rounded transition-colors ${
                        compTimeframe === tf.id
                          ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {isCompLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-10 text-center text-xs text-slate-400 font-mono">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {symbol} ile {compIndex} verileri senkronize edilerek göreceli güç ve piyasa rejimi hesaplanıyor...
            </div>
          ) : rsData && regimeData ? (
            <div className="space-y-5">
              {/* 1. Relative Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">{symbol} Getirisi ({rsData.timeframe})</div>
                  <div className={`text-xl font-bold font-mono ${rsData.stockReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rsData.stockReturnPct >= 0 ? `+${rsData.stockReturnPct}%` : `${rsData.stockReturnPct}%`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Senkronize {rsData.periodBars} bar</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">{compIndex} Endeks Getirisi</div>
                  <div className={`text-xl font-bold font-mono ${rsData.indexReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rsData.indexReturnPct >= 0 ? `+${rsData.indexReturnPct}%` : `${rsData.indexReturnPct}%`}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{regimeData.indexName}</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">Göreceli Performans Farkı (Alfa)</div>
                  <div className={`text-xl font-bold font-mono ${rsData.relativeAlphaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rsData.relativeAlphaPct >= 0 ? `+${rsData.relativeAlphaPct}%` : `${rsData.relativeAlphaPct}%`}
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">Hisse Getirisi - Endeks Getirisi</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-1">
                  <div className="text-[11px] text-slate-400 font-medium">RS Oranı &amp; Trend Eğimi</div>
                  <div className="text-base font-bold font-mono text-slate-200">
                    {rsData.rsRatioCurrent.toFixed(6)}
                  </div>
                  <div className="text-[10px] font-sans flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded font-bold ${
                      rsData.rsTrend === 'EXPANDING'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : rsData.rsTrend === 'CONTRACTING'
                        ? 'bg-rose-950 text-rose-400 border border-rose-800'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {rsData.rsTrend === 'EXPANDING' ? 'GÜÇLENİYOR' : rsData.rsTrend === 'CONTRACTING' ? 'ZAYIFLIYOR' : 'DENGELİ'}
                    </span>
                    <span className="text-slate-400 font-mono">Eğim: %{rsData.rsEmaSlope}</span>
                  </div>
                </div>
              </div>

              {/* 2. Visual Comparative SVG Chart */}
              {rsData.points.length > 5 && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-bold text-slate-200 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      Normalize Performans Grafiği (Başlangıç = 100)
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> {symbol}
                      </span>
                      <span className="flex items-center gap-1.5 text-sky-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> {compIndex}
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const pts = rsData.points;
                    const stockNorms = pts.map(p => p.normalizedStock);
                    const indexNorms = pts.map(p => p.normalizedIndex);
                    const allVals = [...stockNorms, ...indexNorms];
                    const minVal = Math.min(...allVals) * 0.98;
                    const maxVal = Math.max(...allVals) * 1.02;
                    const valRange = (maxVal - minVal) || 1;

                    const width = 800;
                    const height = 180;
                    const padX = 35;
                    const padY = 20;

                    const getX = (idx: number) => padX + (idx / (pts.length - 1)) * (width - padX * 2);
                    const getY = (val: number) => padY + (1 - (val - minVal) / valRange) * (height - padY * 2);

                    const stockPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.normalizedStock).toFixed(1)}`).join(' ');
                    const indexPath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.normalizedIndex).toFixed(1)}`).join(' ');

                    return (
                      <div className="w-full overflow-x-auto">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
                          {/* 100 Base Line */}
                          {minVal <= 100 && maxVal >= 100 && (
                            <line
                              x1={padX}
                              y1={getY(100)}
                              x2={width - padX}
                              y2={getY(100)}
                              stroke="#475569"
                              strokeDasharray="3 3"
                              strokeWidth="1"
                            />
                          )}

                          {/* Index Path */}
                          <path d={indexPath} fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.85" />
                          {/* Stock Path */}
                          <path d={stockPath} fill="none" stroke="#10b981" strokeWidth="2.5" />

                          {/* Dates */}
                          <text x={padX} y={height - 4} fill="#64748b" fontSize="10" fontFamily="monospace">
                            {pts[0].dateStr || ''}
                          </text>
                          <text x={width - padX} y={height - 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                            {pts[pts.length - 1].dateStr || ''}
                          </text>
                        </svg>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 3. Section 3: Piyasa Rejimi (5 Seviye) */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      FAZ 4 MADDE 3 · PİYASA REJİMİ ANALİZİ
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      {regimeData.indexName} ({compIndex}) Mevcut Piyasa Rejimi
                    </h4>
                  </div>

                  <span className={`px-3 py-1 rounded text-xs font-bold border font-mono ${
                    regimeData.regime === 'STRONG_BULL'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : regimeData.regime === 'WEAK_BULL'
                      ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800'
                      : regimeData.regime === 'SIDEWAYS'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : regimeData.regime === 'WEAK_BEAR'
                      ? 'bg-rose-950/50 text-rose-400 border-rose-800'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}>
                    {regimeData.regimeLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Endeks Son Fiyat</span>
                    <strong className="text-slate-100 text-sm">{regimeData.currentPrice.toFixed(2)}</strong>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Endeks EMA20</span>
                    <strong className="text-slate-100 text-sm">{regimeData.ema20.toFixed(2)}</strong>
                    <span className={`block text-[10px] ${regimeData.priceToEma20Pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      Fark: %{regimeData.priceToEma20Pct}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">EMA20 Eğimi (Son 5 Bar)</span>
                    <strong className={`text-sm ${regimeData.ema20Slope >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      %{regimeData.ema20Slope}
                    </strong>
                    <span className="block text-[10px] text-slate-500">Eşik: ±%{regimeData.thresholds.strongBullEmaSlopeMin}</span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Tepe-Dip Fiyat Yapısı</span>
                    <strong className="text-slate-200 text-xs font-sans">
                      {regimeData.priceStructure === 'HIGHER_HIGHS'
                        ? 'Yükselen Tepeler/Dipler'
                        : regimeData.priceStructure === 'LOWER_LOWS'
                        ? 'Alçalan Tepeler/Dipler'
                        : 'Yatay Bant / Sıkışma'}
                    </strong>
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-slate-800/80 text-xs space-y-1 font-sans">
                  <div className="font-bold text-slate-200">Rejim Değerlendirmesi:</div>
                  <p className="text-slate-400 leading-relaxed">{regimeData.description}</p>
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <strong>Yöntem ve Eşikler:</strong> {regimeData.methodologyExplanation}
                  </p>
                </div>
              </div>

              {/* 4. Section 6: Açıklanabilir Düşüş Riski Analizi */}
              {downsideRisk && (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        FAZ 4 MADDE 6 · AÇIKLANABİLİR DÜŞÜŞ RİSKİ DEĞERLENDİRMESİ
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-400" />
                        {symbol} Düşüş Riski Çok Faktörlü Skorlama
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">Toplam Risk Skoru:</span>
                      <span
                        className="px-3 py-1 rounded text-xs font-bold font-mono border"
                        style={{
                          backgroundColor: `${downsideRisk.riskLevelColor}20`,
                          borderColor: `${downsideRisk.riskLevelColor}60`,
                          color: downsideRisk.riskLevelColor
                        }}
                      >
                        {downsideRisk.riskScore}/100 ({downsideRisk.riskLevel})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {downsideRisk.summary}
                  </p>

                  {/* 6 Explainable Risk Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {downsideRisk.factors.map(f => (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border ${
                          f.isTriggered
                            ? 'bg-rose-950/20 border-rose-500/30 text-slate-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-200 text-xs">{f.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.isTriggered
                              ? f.severity === 'CRITICAL'
                                ? 'bg-rose-900 text-rose-200'
                                : 'bg-amber-900/80 text-amber-200'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {f.isTriggered ? `AKTİF (Ağırlık: %${f.weight})` : `GÜVENLİ (Ağırlık: %${f.weight})`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{f.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mandatory Downside Risk Legal Disclaimer */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-0.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Yasal Uyarı &amp; Şeffaflık İlkesi
                    </div>
                    {downsideRisk.disclaimer}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-400">
              Göreceli güç verisi hesaplanamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

