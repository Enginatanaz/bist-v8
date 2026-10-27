import React, { useState, useEffect } from 'react';
import { BISTStock, ExtendedScenarioResult, AnalyticalReport } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Compass,
  Calculator,
  Sliders,
  FileText,
  Printer,
  ChevronRight,
  HelpCircle,
  BarChart3
} from 'lucide-react';

interface ScenarioCenterViewProps {
  symbol: string;
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const ScenarioCenterView: React.FC<ScenarioCenterViewProps> = ({
  symbol,
  stocks,
  onSelectStock,
  onNavigateTab
}) => {
  const [data, setData] = useState<ExtendedScenarioResult | null>(null);
  const [selectedDays, setSelectedDays] = useState<5 | 7 | 10>(5);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Position Sizing Calculator State (FAZ 4.4)
  const [capitalTL, setCapitalTL] = useState<number>(100000);
  const [riskPct, setRiskPct] = useState<number>(1.0);
  const [customEntryPrice, setCustomEntryPrice] = useState<number>(0);
  const [customStopPrice, setCustomStopPrice] = useState<number>(0);
  const [customTargetPrice, setCustomTargetPrice] = useState<number>(0);

  // Gemini AI Report State
  const [aiReport, setAiReport] = useState<AnalyticalReport | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'CALCULATOR' | 'CALIBRATION' | 'REPORT'>('SCENARIOS');

  const [scenarioError, setScenarioError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setScenarioError(null);
    setAiReport(null);
    setAiError(null);

    apiClient.getScenarios(symbol)
      .then(res => {
        if (isMounted) {
          setData(res);
          setCustomEntryPrice(res.currentPrice);
          const initialHorizon = res.horizons.horizon5d;
          setCustomStopPrice(initialHorizon.bullish.invalidationPrice);
          setCustomTargetPrice(initialHorizon.bullish.targetHigh);
        }
      })
      .catch((err) => {
        if (isMounted) setScenarioError(err?.message || 'Senaryo verisi alınamadı.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [symbol]);

  // Update calculator stop/target when horizon changes
  useEffect(() => {
    if (!data) return;
    const currentHorizon = selectedDays === 5
      ? data.horizons.horizon5d
      : selectedDays === 7
      ? data.horizons.horizon7d
      : data.horizons.horizon10d;

    setCustomStopPrice(currentHorizon.bullish.invalidationPrice);
    setCustomTargetPrice(currentHorizon.bullish.targetHigh);
  }, [selectedDays, data]);

  const handleGenerateAiReport = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const report = await apiClient.generateAiReport(symbol);
      setAiReport(report);
    } catch (err: any) {
      setAiError(err?.message || 'Rapor oluşturulamadı.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-3" />
        <div className="text-xs text-slate-400 font-mono">
          {symbol} için 5, 7 ve 10 işlem günlük deterministik senaryo olasılıkları hesaplanıyor...
        </div>
      </div>
    );
  }

  if (scenarioError || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">
            {symbol} İçin Doğrulanmış Senaryo Modellemesi Üretilemedi
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            Bu sembol BIST hisse evreninde kayıtlıdır ancak sağlayıcıdan yeterli geçmiş OHLCV verisi temin edilemedi ({scenarioError}). Kural 1 uyarınca yatırımcı güvenliği için rastgele veya tahmin verisi üretilmemektedir.
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

  const { stock, currentPrice, horizons, calibration, keyLevels, marketDataTime, analysisTime } = data;
  const currentHorizon = selectedDays === 5
    ? horizons.horizon5d
    : selectedDays === 7
    ? horizons.horizon7d
    : horizons.horizon10d;

  // Position Sizing Calculations (FAZ 4.4)
  const allowedMonetaryRiskTL = (capitalTL * riskPct) / 100;
  const entryP = customEntryPrice || currentPrice;
  const stopP = customStopPrice || currentHorizon.bullish.invalidationPrice;
  const targetP = customTargetPrice || currentHorizon.bullish.targetHigh;
  const stopDistanceTL = Math.abs(entryP - stopP);
  const stopDistancePct = entryP > 0 ? (stopDistanceTL / entryP) * 100 : 0;
  const targetDistanceTL = Math.abs(targetP - entryP);
  const targetDistancePct = entryP > 0 ? (targetDistanceTL / entryP) * 100 : 0;

  const calculatedLots = stopDistanceTL > 0 ? Math.floor(allowedMonetaryRiskTL / stopDistanceTL) : 0;
  const totalAllocationTL = calculatedLots * entryP;
  const allocationPct = capitalTL > 0 ? (totalAllocationTL / capitalTL) * 100 : 0;
  const potentialProfitTL = calculatedLots * (targetP - entryP);
  const calculatedRR = stopDistanceTL > 0 ? Number((targetDistanceTL / stopDistanceTL).toFixed(2)) : 0;

  // Commission & Slippage estimate (0.15% commission + 0.10% slippage)
  const estCostsTL = totalAllocationTL * 0.0025;

  return (
    <div className="space-y-5">
      {/* Top Header Card with Metadata & Trading Days Notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 font-mono">{symbol}</h2>
              <span className="text-xs text-slate-400 font-medium">· {stock.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">{stock.sector}</span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {currentPrice.toFixed(2)} TL
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              5, 7 ve 10 <strong>işlem günlük</strong> senaryo koridorları; tarihsel logaritmik volatilite, ATR yayılımı ve pivot bölgeleriyle modellenmiştir.
            </p>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('SCENARIOS')}
              className={`px-3 py-1.5 rounded transition-colors ${
                activeTab === 'SCENARIOS' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Senaryo Koridorları
            </button>
            <button
              onClick={() => setActiveTab('CALCULATOR')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'CALCULATOR' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              Pozisyon & Risk
            </button>
            <button
              onClick={() => setActiveTab('CALIBRATION')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'CALIBRATION' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Kalibrasyon & Dağılım
            </button>
            <button
              onClick={() => setActiveTab('REPORT')}
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === 'REPORT' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Rapor
            </button>
          </div>
        </div>

        {/* Timestamp & Verification Bar (FAZ 4.5) */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3 text-emerald-400" />
              Piyasa Veri Zamanı: <strong className="text-slate-300">{marketDataTime || stock.updatedAt.substring(0, 10)}</strong>
            </span>
            <span>·</span>
            <span>Analiz Çalıştırma: <strong className="text-slate-300">{new Date(analysisTime).toLocaleTimeString('tr-TR')}</strong></span>
            <span>·</span>
            <span className="text-amber-400/90 font-sans">
              Takvim günü değil, işlem günü baz alınmıştır.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-sans">
              Model Durumu: {calibration.modelStatus === 'EXPERIMENTAL' ? 'Deneysel İstatistiksel Model' : 'Kalibre Edilmiş'}
            </span>
          </div>
        </div>
      </div>

      {/* Horizon Selector (5, 7, 10 Trading Days) */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-lg p-3">
        <div className="text-xs text-slate-300 font-semibold flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          İşlem Günü Ufku Seçimi:
        </div>

        <div className="flex items-center gap-2">
          {[5, 7, 10].map((days) => (
            <button
              key={days}
              onClick={() => setSelectedDays(days as 5 | 7 | 10)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors font-mono ${
                selectedDays === days
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {days} İşlem Günü
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SCENARIOS */}
      {activeTab === 'SCENARIOS' && (
        <div className="space-y-4">
          {/* Probability Distribution Strip */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold">{selectedDays} İşlem Günü Olasılık Dağılımı</span>
              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-emerald-400 font-bold">Boğa: %{currentHorizon.bullish.probability}</span>
                <span className="text-slate-400 font-bold">Nötr/Denge: %{currentHorizon.base.probability}</span>
                <span className="text-rose-400 font-bold">Ayı: %{currentHorizon.bearish.probability}</span>
              </div>
            </div>

            {/* Visual Weighted Probability Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${currentHorizon.bullish.probability}%` }}
              />
              <div
                className="bg-slate-500 h-full transition-all"
                style={{ width: `${currentHorizon.base.probability}%` }}
              />
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${currentHorizon.bearish.probability}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
              <span>Güncel Fiyat: <strong className="text-slate-200">{currentPrice.toFixed(2)} TL</strong></span>
              <span>Ufuk Volatilitesi: <strong className="text-slate-200">%{currentHorizon.volatilityEstimatePct}</strong></span>
              <span>%95 Parametrik VaR: <strong className="text-rose-400">-%{currentHorizon.var95LossPct}</strong></span>
              <span>Risk / Getiri Rasyosu: <strong className="text-emerald-400">{currentHorizon.riskRewardRatio}x</strong></span>
            </div>
          </div>

          {/* 3 Scenario Cards: Bullish, Base, Bearish */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Bullish Scenario */}
            <div className="bg-slate-900 border border-emerald-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200">Olumlu Senaryo (Boğa)</h3>
                </div>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  %{currentHorizon.bullish.probability} Olasılık
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Hedef Fiyat Koridoru ({selectedDays} İşlem Günü)</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                    {currentHorizon.bullish.targetLow} - {currentHorizon.bullish.targetHigh} TL
                  </div>
                  <div className="text-[11px] text-emerald-400/80 font-mono">
                    Beklenen Getiri Potansiyeli: +%{currentHorizon.bullish.expectedGainPct}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Destekleyen Koşul (Tetikleyici):</span>
                  <p className="text-slate-300 mt-0.5">{currentHorizon.bullish.triggerCondition}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-rose-400/90 font-semibold block">Geçersizlik (Stop) Seviyesi:</span>
                  <p className="text-slate-200 font-mono font-bold mt-0.5">{currentHorizon.bullish.invalidationPrice} TL altı kapanış</p>
                </div>
              </div>
            </div>

            {/* 2. Base Scenario */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-slate-200">Nötr Senaryo (Denge/Yatay)</h3>
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  %{currentHorizon.base.probability} Olasılık
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Beklenen Denge Bandı ({selectedDays} İşlem Günü)</div>
                  <div className="text-lg font-bold text-slate-200 font-mono tabular-nums">
                    {currentHorizon.base.corridorLow} - {currentHorizon.base.corridorHigh} TL
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Mevcut Seviyede Taban & Konsolidasyon
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Tetikleyici Koşul:</span>
                  <p className="text-slate-300 mt-0.5">{currentHorizon.base.triggerCondition}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Piyasa Rejimi:</span>
                  <p className="text-slate-300 mt-0.5">Yatay dalgalanma, düşük momentumlu denge süreci.</p>
                </div>
              </div>
            </div>

            {/* 3. Bearish Scenario */}
            <div className="bg-slate-900 border border-rose-900/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold text-slate-200">Olumsuz Senaryo (Ayı/Düzeltme)</h3>
                </div>
                <span className="text-xs font-bold text-rose-400 font-mono">
                  %{currentHorizon.bearish.probability} Olasılık
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[11px] text-slate-500">Olası Destek Koridoru ({selectedDays} İşlem Günü)</div>
                  <div className="text-lg font-bold text-rose-400 font-mono tabular-nums">
                    {currentHorizon.bearish.targetLow} - {currentHorizon.bearish.targetHigh} TL
                  </div>
                  <div className="text-[11px] text-rose-400/80 font-mono">
                    Olası Geri Çekilme: -%{currentHorizon.bearish.expectedLossPct}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 font-semibold block">Destekleyen Koşul (Tetikleyici):</span>
                  <p className="text-slate-300 mt-0.5">{currentHorizon.bearish.triggerCondition}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-emerald-400/90 font-semibold block">Düşüşü Geçersiz Kılacak Seviye:</span>
                  <p className="text-slate-200 font-mono font-bold mt-0.5">{currentHorizon.bearish.invalidationPrice} TL üzeri toparlanma</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Narrative Synthesis Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Yapay Zekâ Analitik Raporu ve Senaryo Değerlendirmesi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hesaplanmış deterministik verileri Türkçe analitik rapor formatında özetler (Gemini 3.8 Flash).
                </p>
              </div>

              <button
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAi}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 rounded-md transition-colors flex items-center gap-2"
              >
                {isGeneratingAi ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Rapor Üretiliyor...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Analitik Rapor Üret (Gemini)
                  </>
                )}
              </button>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded">
                {aiError}
              </div>
            )}

            {aiReport ? (
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
                <div className="p-3.5 bg-slate-950 rounded border border-slate-800">
                  <h4 className="font-bold text-emerald-400 mb-1">Genel Teknik ve Senaryo Özeti</h4>
                  <p>{aiReport.summary}</p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded border border-slate-800">
                  <h4 className="font-bold text-cyan-400 mb-1">Trend ve Momentum Analizi</h4>
                  <p>{aiReport.trendEvaluation}</p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded border border-slate-800">
                  <h4 className="font-bold text-amber-400 mb-1">Senaryo Koridorlarının Yorumu</h4>
                  <p>{aiReport.scenarioAnalysis}</p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded border border-slate-800">
                  <h4 className="font-bold text-rose-400 mb-1">Kritik Risk ve Geçersizlik Kuralları</h4>
                  <p>{aiReport.riskAndInvalidationRules}</p>
                </div>

                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80 text-[11px] text-slate-500 font-sans">
                  {aiReport.disclaimer}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950/60 rounded border border-slate-800/80 text-center text-xs text-slate-400">
                Yukarıdaki butona basarak deterministik koridorların, risk seviyelerinin ve gösterge bileşiminin yapay zekâ tarafından sentezlenmiş özet raporunu oluşturabilirsiniz.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POSITION SIZING & CAPITAL RISK CALCULATOR (FAZ 4.4) */}
      {activeTab === 'CALCULATOR' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              Pozisyon Büyüklüğü ve Risk Yönetimi Hesaplayıcısı (FAZ 4.4)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Portföy sermayeniz ve işlem başına kabul ettiğiniz maksimum risk yüzdesine göre matematiksel lot büyüklüğü ve sermaye tahsisini hesaplar.
            </p>
          </div>

          {/* Calculator Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Portföy Sermayesi (TL)</label>
              <input
                type="number"
                value={capitalTL}
                onChange={(e) => setCapitalTL(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">İşlem Başına Risk (%)</label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="10"
                value={riskPct}
                onChange={(e) => setRiskPct(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Giriş Fiyatı (TL)</label>
              <input
                type="number"
                step="0.05"
                value={customEntryPrice}
                onChange={(e) => setCustomEntryPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Stop-Loss Fiyatı (TL)</label>
              <input
                type="number"
                step="0.05"
                value={customStopPrice}
                onChange={(e) => setCustomStopPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-rose-400 font-mono focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Hedef Fiyat (TL)</label>
              <input
                type="number"
                step="0.05"
                value={customTargetPrice}
                onChange={(e) => setCustomTargetPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Calculator Output KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-500">İzin Verilen Risk</div>
              <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {allowedMonetaryRiskTL.toLocaleString('tr-TR')} TL
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Sermayenin %{riskPct}'i</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-500">Stop Mesafesi</div>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5">
                {stopDistanceTL.toFixed(2)} TL
              </div>
              <div className="text-[10px] text-rose-400 font-mono">-%{stopDistancePct.toFixed(2)}</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/60">
              <div className="text-[11px] text-emerald-400 font-semibold">Önerilen Lot Adedi</div>
              <div className="text-xl font-extrabold text-emerald-300 font-mono mt-0.5">
                {calculatedLots.toLocaleString('tr-TR')} Lot
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Adet Hisse</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-500">Toplam Pozisyon Tutarı</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {totalAllocationTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Portföyün %{allocationPct.toFixed(1)}'i</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-500">Potansiyel Kâr</div>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                +{potentialProfitTL.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">+{targetDistancePct.toFixed(1)}% getiri</div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-500">Risk / Getiri (R:R)</div>
              <div className="text-base font-bold text-slate-100 font-mono mt-0.5">
                {calculatedRR}x
              </div>
              <div className="text-[10px] text-slate-400 font-mono">1 Risk / {calculatedRR} Kazanç</div>
            </div>
          </div>

          {/* Friction, Commission & Invalidation Disclaimers */}
          <div className="space-y-2 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">İşlem Maliyetleri ve Likidite Etkisi: </strong>
                Tahmini çift yönlü BIST takas payı ve aracı kurum komisyonu (~%0.15) ile tahta kademe kayması (~%0.10) yaklaşık{' '}
                <strong className="text-slate-200 font-mono">{estCostsTL.toFixed(0)} TL</strong> maliyet oluşturur.
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-300">Zarar Durdurma (Stop-Loss) Yasal Uyarısı: </strong>
                Belirlenen stop seviyesinin emrin iletildiği anda gerçekleşeceği veya zarar sınırını kesin koruyacağı garanti edilemez.
                Piyasa açılış boşlukları (GAP), taban kilitlenmesi veya likidite yetersizliği durumlarında gerçekleşen zarar hesaplanan teorik tutarı aşabilir.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CALIBRATION & STATISTICAL DISTRIBUTION (FAZ 4.2 & 4.3) */}
      {activeTab === 'CALIBRATION' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                İstatistiksel Dağılım ve Model Kalibrasyon Raporu (FAZ 4.2 & 4.3)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Günlük logaritmik getiri serisinin basıklık (Kurtosis), çarpıklık (Skewness) ve %70 olasılık aralığının tarihsel gerçekleşme kalibrasyonu.
              </p>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Etiket: DENEYSEL İSTATİSTİKSEL MODEL
            </span>
          </div>

          {/* Statistical Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400">Günlük Volatilite (σ)</div>
              <div className="text-xl font-bold text-slate-100 font-mono mt-1">
                %{calibration.dailyVolatilityPct}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Yıllıklandırılmış: %{calibration.historicalVolatilityAnnualized}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400">Çarpıklık (Skewness)</div>
              <div className={`text-xl font-bold font-mono mt-1 ${calibration.dailySkewness >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {calibration.dailySkewness}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {calibration.dailySkewness > 0.2 ? 'Sağa Çarpık (Yukarı Sıçrama)' : calibration.dailySkewness < -0.2 ? 'Sola Çarpık (Aşağı Kuyruk)' : 'Simetrik'}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400">Basıklık (Kurtosis)</div>
              <div className="text-xl font-bold text-slate-100 font-mono mt-1">
                {calibration.dailyKurtosis}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {calibration.dailyKurtosis > 3 ? 'Şişman Kuyruk (Fat Tail Risk)' : 'Normal Platikurtik'}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400">Veri Yeterlilik Skoru</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {calibration.dataSufficiencyScore} / 100
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {calibration.sampleBars} Doğrulanmış Günlük Bar
              </div>
            </div>
          </div>

          {/* Historical Calibration Bucket Test */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200">
              Model Olasılık Kalibrasyonu: %70 Teorik Güven Bandı Gerçekleşme Frekansı
            </h4>
            <p className="text-xs text-slate-400">
              Modelin geçmişte %70 olasılık aralığında kalacağını öngördüğü 5 günlük hareketlerin fiilen kaçının bant içinde kaldığını ölçer:
            </p>

            <div className="flex items-center gap-6 font-mono text-xs pt-1">
              <div>
                <span className="text-slate-500 block">Teorik Hedef:</span>
                <span className="text-slate-200 font-bold">%{calibration.historicalCalibration.bucket70PctTheoretical}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Gerçekleşen Frekans:</span>
                <span className="text-emerald-400 font-bold">%{calibration.historicalCalibration.bucket70PctRealized}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Brier Skoru:</span>
                <span className="text-cyan-400 font-bold">{calibration.historicalCalibration.brierScore}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Kalibrasyon Durumu:</span>
                <span className="text-emerald-300 font-bold">
                  {calibration.historicalCalibration.calibrationStatus === 'WELL_CALIBRATED'
                    ? 'İyi Kalibre Edilmiş (Tolerans İçi)'
                    : 'Kabul Edilebilir'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: COMPREHENSIVE SCENARIO REPORT (FAZ 4.5) */}
      {activeTab === 'REPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 font-mono">
                {symbol} — Kapsamlı Senaryo ve Risk Raporu
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Borsa İstanbul Pay Piyasası Deterministik Analiz Çıktısı (FAZ 4.5)
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Yazdır / PDF Kaydet
            </button>
          </div>

          {/* Report Metadata */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono bg-slate-950 p-3.5 rounded border border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px]">VERİ ZAMAN DAMGASI:</span>
              <span className="text-slate-200 font-bold">{marketDataTime || stock.updatedAt.substring(0, 10)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ANALİZ ZAMANI:</span>
              <span className="text-slate-200 font-bold">{new Date(analysisTime).toLocaleString('tr-TR')}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SON FİYAT / DEĞİŞİM:</span>
              <span className="text-emerald-400 font-bold">{currentPrice.toFixed(2)} TL ({stock.changePercent.toFixed(2)}%)</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MODEL TÜRÜ:</span>
              <span className="text-slate-200 font-bold">Deneysel ATR Koridoru</span>
            </div>
          </div>

          {/* 5, 7, 10 Trading Days Comparison Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200">
              5, 7 ve 10 İşlem Günlük Ufuk Projeksiyon Matrisi
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 font-mono">
                <thead className="bg-slate-950 text-slate-400">
                  <tr>
                    <th className="p-2.5">Ufuk</th>
                    <th className="p-2.5">Olumlu Hedef (Boğa)</th>
                    <th className="p-2.5">Nötr Bant</th>
                    <th className="p-2.5">Olumsuz Destek (Ayı)</th>
                    <th className="p-2.5">Volatilite %</th>
                    <th className="p-2.5">%95 VaR</th>
                    <th className="p-2.5">R:R</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-bold text-slate-200">5 İşlem Günü</td>
                    <td className="p-2.5 text-emerald-400">
                      {horizons.horizon5d.bullish.targetLow} - {horizons.horizon5d.bullish.targetHigh} TL (+%{horizons.horizon5d.bullish.expectedGainPct})
                    </td>
                    <td className="p-2.5 text-slate-300">
                      {horizons.horizon5d.base.corridorLow} - {horizons.horizon5d.base.corridorHigh} TL
                    </td>
                    <td className="p-2.5 text-rose-400">
                      {horizons.horizon5d.bearish.targetLow} - {horizons.horizon5d.bearish.targetHigh} TL (-%{horizons.horizon5d.bearish.expectedLossPct})
                    </td>
                    <td className="p-2.5 text-slate-300">%{horizons.horizon5d.volatilityEstimatePct}</td>
                    <td className="p-2.5 text-rose-400">-%{horizons.horizon5d.var95LossPct}</td>
                    <td className="p-2.5 text-emerald-300 font-bold">{horizons.horizon5d.riskRewardRatio}x</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-slate-200">7 İşlem Günü</td>
                    <td className="p-2.5 text-emerald-400">
                      {horizons.horizon7d.bullish.targetLow} - {horizons.horizon7d.bullish.targetHigh} TL (+%{horizons.horizon7d.bullish.expectedGainPct})
                    </td>
                    <td className="p-2.5 text-slate-300">
                      {horizons.horizon7d.base.corridorLow} - {horizons.horizon7d.base.corridorHigh} TL
                    </td>
                    <td className="p-2.5 text-rose-400">
                      {horizons.horizon7d.bearish.targetLow} - {horizons.horizon7d.bearish.targetHigh} TL (-%{horizons.horizon7d.bearish.expectedLossPct})
                    </td>
                    <td className="p-2.5 text-slate-300">%{horizons.horizon7d.volatilityEstimatePct}</td>
                    <td className="p-2.5 text-rose-400">-%{horizons.horizon7d.var95LossPct}</td>
                    <td className="p-2.5 text-emerald-300 font-bold">{horizons.horizon7d.riskRewardRatio}x</td>
                  </tr>

                  <tr>
                    <td className="p-2.5 font-bold text-slate-200">10 İşlem Günü</td>
                    <td className="p-2.5 text-emerald-400">
                      {horizons.horizon10d.bullish.targetLow} - {horizons.horizon10d.bullish.targetHigh} TL (+%{horizons.horizon10d.bullish.expectedGainPct})
                    </td>
                    <td className="p-2.5 text-slate-300">
                      {horizons.horizon10d.base.corridorLow} - {horizons.horizon10d.base.corridorHigh} TL
                    </td>
                    <td className="p-2.5 text-rose-400">
                      {horizons.horizon10d.bearish.targetLow} - {horizons.horizon10d.bearish.targetHigh} TL (-%{horizons.horizon10d.bearish.expectedLossPct})
                    </td>
                    <td className="p-2.5 text-slate-300">%{horizons.horizon10d.volatilityEstimatePct}</td>
                    <td className="p-2.5 text-rose-400">-%{horizons.horizon10d.var95LossPct}</td>
                    <td className="p-2.5 text-emerald-300 font-bold">{horizons.horizon10d.riskRewardRatio}x</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Levels Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200">Kritik Destek ve Direnç Seviyeleri</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {keyLevels.map((lvl) => (
                <div
                  key={lvl.id}
                  className={`p-2.5 rounded border ${
                    lvl.type === 'SUPPORT' ? 'bg-rose-950/20 border-rose-900/60' : 'bg-emerald-950/20 border-emerald-900/60'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px] text-slate-400">
                    <span className={lvl.type === 'SUPPORT' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {lvl.type === 'SUPPORT' ? 'Destek (Kırmızı)' : 'Direnç (Yeşil)'}
                    </span>
                    <span className="font-mono">{lvl.touchCount} temas</span>
                  </div>
                  <div className="font-mono font-bold text-sm text-slate-200 mt-0.5">
                    {lvl.pivotPrice.toFixed(2)} TL
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Mesafe: %{Math.abs(lvl.distancePercent).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
