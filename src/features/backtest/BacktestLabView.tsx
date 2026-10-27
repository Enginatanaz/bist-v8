import React, { useState } from 'react';
import { BISTStock, BacktestResult, BacktestParams, RSBacktestResult, RSBacktestParams } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Play,
  TrendingUp,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Scale,
  ShieldCheck,
  BarChart2,
  Activity
} from 'lucide-react';

interface BacktestLabViewProps {
  initialSymbol: string;
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
}

export const BacktestLabView: React.FC<BacktestLabViewProps> = ({
  initialSymbol,
  stocks,
  onSelectStock
}) => {
  const [symbol, setSymbol] = useState(initialSymbol || 'THYAO');
  const [strategyMode, setStrategyMode] = useState<'RELATIVE_STRENGTH' | 'CLASSIC'>('RELATIVE_STRENGTH');
  const [strategy, setStrategy] = useState<BacktestParams['strategy']>('EMA_CROSSOVER');
  const [indexSymbol, setIndexSymbol] = useState<string>('XU100');
  const [alphaThresholdPct, setAlphaThresholdPct] = useState<number>(0.5);
  const [timeframe, setTimeframe] = useState<'1d' | '4h' | '1h'>('1d');
  const [initialCapital, setInitialCapital] = useState<number>(100000);
  const [commissionPct, setCommissionPct] = useState<number>(0.15);
  const [slippagePct, setSlippagePct] = useState<number>(0.10);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(8.0);
  const [stopLossPct, setStopLossPct] = useState<number>(4.0);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [rsResult, setRsResult] = useState<RSBacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (strategyMode === 'RELATIVE_STRENGTH') {
        const rs = await apiClient.runRSBacktest({
          symbol,
          indexSymbol,
          timeframe,
          initialCapital,
          commissionPct,
          slippagePct,
          alphaThresholdPct,
          takeProfitPct,
          stopLossPct
        });
        setRsResult(rs);
        setResult(null);
      } else {
        const res = await apiClient.runBacktest({
          symbol,
          strategy,
          timeframe,
          initialCapital,
          commissionPct,
          slippagePct,
          takeProfitPct,
          stopLossPct
        });
        setResult(res);
        setRsResult(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Backtest çalıştırılamadı.');
    } finally {
      setIsLoading(false);
    }
  };

  // SVG Equity Curve calculations for Classic
  const classicCurve = result?.equityCurve || [];
  const minEquityClassic = classicCurve.length > 0 ? Math.min(...classicCurve.map(e => Math.min(e.portfolioValue, e.benchmarkValue))) : 0;
  const maxEquityClassic = classicCurve.length > 0 ? Math.max(...classicCurve.map(e => Math.max(e.portfolioValue, e.benchmarkValue))) : 100;
  const rangeClassic = (maxEquityClassic - minEquityClassic) || 1;

  // SVG Equity Curve calculations for RS Backtest
  const rsCurve = rsResult?.equityCurve || [];
  const minRs = rsCurve.length > 0 ? Math.min(...rsCurve.map(e => Math.min(e.strategyValue, e.stockValue, e.indexValue))) : 0;
  const maxRs = rsCurve.length > 0 ? Math.max(...rsCurve.map(e => Math.max(e.strategyValue, e.stockValue, e.indexValue))) : 100;
  const rangeRs = (maxRs - minRs) || 1;

  const chartW = 800;
  const chartH = 220;
  const pad = 30;

  const getX = (idx: number, len: number) => pad + (idx / (len - 1 || 1)) * (chartW - pad * 2);
  const getY = (val: number, min: number, range: number) => pad + (1 - (val - min) / range) * (chartH - pad * 2);

  return (
    <div className="space-y-5">
      {/* Configuration Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                FAZ 4 BACKTEST
              </span>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                BIST Strateji Test Laboratuvarı (Göreceli Güç ve Teknik Backtest)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              BIST işlem komisyonları (%{commissionPct}) ve kayma payı (%{slippagePct}) işlem bazında kesilen,
              sıfır gelecek verisi sızıntılı (Zero Lookahead Bias) deterministik simülasyon motoru.
            </p>
          </div>

          <button
            onClick={handleRunBacktest}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-60 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Hesaplanıyor...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Backtest'i Çalıştır
              </>
            )}
          </button>
        </div>

        {/* Strategy Mode Switcher: RS Momentum vs Classic */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setStrategyMode('RELATIVE_STRENGTH')}
            className={`flex-1 py-1.5 px-3 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              strategyMode === 'RELATIVE_STRENGTH'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            FAZ 4: Endekse Göre Güçlü Hisse Momentum Stratejisi
          </button>

          <button
            onClick={() => setStrategyMode('CLASSIC')}
            className={`flex-1 py-1.5 px-3 rounded font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              strategyMode === 'CLASSIC'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Klasik Teknik İndikatör Stratejileri
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          {/* Stock Symbol */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Hisse Sembolü</label>
            <select
              value={symbol}
              onChange={e => {
                setSymbol(e.target.value);
                onSelectStock(e.target.value);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
            >
              {stocks.map(s => (
                <option key={s.symbol} value={s.symbol}>
                  {s.symbol} {s.lastPrice > 0 ? `(${s.lastPrice} TL)` : `(${s.name})`}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy / Comparison Index */}
          {strategyMode === 'RELATIVE_STRENGTH' ? (
            <>
              <div>
                <label className="block text-slate-400 font-medium mb-1">Referans Endeks</label>
                <select
                  value={indexSymbol}
                  onChange={e => setIndexSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                >
                  <option value="XU100">BIST 100 (XU100)</option>
                  <option value="XU030">BIST 30 (XU030)</option>
                  <option value="XU050">BIST 50 (XU050)</option>
                  <option value="XBANK">BIST Banka (XBANK)</option>
                  <option value="XUSIN">BIST Sınai (XUSIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Alfa Eşiği (+%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={alphaThresholdPct}
                  onChange={e => setAlphaThresholdPct(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">Teknik Strateji</label>
              <select
                value={strategy}
                onChange={e => setStrategy(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="EMA_CROSSOVER">EMA 20/50 Kesişimi (Golden / Death Cross)</option>
                <option value="RSI_REVERSAL">RSI Aşırı Satım / Tepki (RSI &lt; 30 Al / &gt; 70 Sat)</option>
                <option value="MACD_CROSSOVER">MACD Sinyal Kesişimi (12, 26, 9)</option>
                <option value="BOLLINGER_BREAKOUT">Bollinger Bandı Sıkışma &amp; Kırılım</option>
                <option value="SUPERTREND_MOMENTUM">Parabolic SAR / Trend Takip</option>
              </select>
            </div>
          )}

          {/* Timeframe */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Periyot</label>
            <select
              value={timeframe}
              onChange={e => setTimeframe(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
            >
              <option value="1d">Günlük (1D)</option>
              <option value="4h">4 Saatlik (4H)</option>
              <option value="1h">1 Saatlik (1H)</option>
            </select>
          </div>

          {/* Capital */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Başlangıç Sermaye</label>
            <input
              type="number"
              value={initialCapital}
              onChange={e => setInitialCapital(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Kâr Al (TP %)</label>
            <input
              type="number"
              step="0.5"
              value={takeProfitPct}
              onChange={e => setTakeProfitPct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Zarar Kes (SL %)</label>
            <input
              type="number"
              step="0.5"
              value={stopLossPct}
              onChange={e => setStopLossPct(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-900 text-rose-300 text-xs rounded">
          {error}
        </div>
      )}

      {/* FAZ 4: RS MOMENTUM BACKTEST RESULTS */}
      {rsResult && (
        <div className="space-y-5">
          {/* Section 7 Scorecard: Period, Trades, Stock Return, Index Return, Alpha, DD, Costs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Strateji Net Getiri</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${rsResult.strategyReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rsResult.strategyReturnPct >= 0 ? `+${rsResult.strategyReturnPct}%` : `${rsResult.strategyReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {rsResult.finalCapital.toLocaleString('tr-TR')} TL
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Hisse Tut Getirisi</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${rsResult.stockReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rsResult.stockReturnPct >= 0 ? `+${rsResult.stockReturnPct}%` : `${rsResult.stockReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{rsResult.symbol} Al &amp; Tut</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Endeks Getirisi</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${rsResult.indexReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rsResult.indexReturnPct >= 0 ? `+${rsResult.indexReturnPct}%` : `${rsResult.indexReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{rsResult.indexSymbol} Getirisi</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Göreceli Alfa (Strateji vs Endeks)</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${rsResult.strategyAlphaVsIndex >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {rsResult.strategyAlphaVsIndex >= 0 ? `+${rsResult.strategyAlphaVsIndex}%` : `${rsResult.strategyAlphaVsIndex}%`}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Hisse Alfası: %{rsResult.relativeAlphaPct}</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Toplam İşlem / Başarı</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                {rsResult.totalTrades} İşlem (%{rsResult.winRatePct})
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {rsResult.winningTrades} Kazanç / {rsResult.losingTrades} Kayıp
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Maksimum Düşüş (DD)</div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                -%{rsResult.maxDrawdownPct}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">Kâr Faktörü: {rsResult.profitFactor}x</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 font-medium">Toplam İşlem Maliyeti</div>
              <div className="text-sm font-bold font-mono text-amber-400 tabular-nums">
                {(rsResult.totalCommissionsTL + rsResult.totalSlippageTL).toFixed(2)} TL
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Komisyon: {rsResult.totalCommissionsTL} TL | Kayma: {rsResult.totalSlippageTL} TL
              </div>
            </div>
          </div>

          {/* 3'lü Equity Curve Graph: Strategy vs Stock vs Index */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="font-bold text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Tarihsel Sermaye Eğrisi (Strateji vs Hisse Tut vs Endeks)
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> RS Stratejisi
                </span>
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> {rsResult.symbol} (Al &amp; Tut)
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" /> {rsResult.indexSymbol}
                </span>
              </div>
            </div>

            {rsCurve.length > 5 && (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-52">
                  {/* Grid Lines */}
                  <line x1={pad} y1={getY(rsResult.initialCapital, minRs, rangeRs)} x2={chartW - pad} y2={getY(rsResult.initialCapital, minRs, rangeRs)} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Index Curve */}
                  <path
                    d={rsCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, rsCurve.length).toFixed(1)} ${getY(pt.indexValue, minRs, rangeRs).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />

                  {/* Stock Hold Curve */}
                  <path
                    d={rsCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, rsCurve.length).toFixed(1)} ${getY(pt.stockValue, minRs, rangeRs).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    opacity="0.8"
                  />

                  {/* RS Strategy Curve */}
                  <path
                    d={rsCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, rsCurve.length).toFixed(1)} ${getY(pt.strategyValue, minRs, rangeRs).toFixed(1)}`).join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />

                  <text x={pad} y={chartH - 4} fill="#64748b" fontSize="10" fontFamily="monospace">
                    {rsResult.testPeriod.startDate} (Bar: {rsResult.testPeriod.totalBars})
                  </text>
                  <text x={chartW - pad} y={chartH - 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                    {rsResult.testPeriod.endDate}
                  </text>
                </svg>
              </div>
            )}
          </div>

          {/* Trade Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="p-3 bg-slate-950 border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Göreceli Güç İşlem Günlüğü (Toplam {rsResult.trades.length} İşlem)</span>
              <span className="font-mono text-slate-400 text-[11px]">BIST Komisyon &amp; Kayma Kesintili</span>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Giriş Tarihi</th>
                    <th className="py-2.5 px-3 text-right">Giriş Fiyatı</th>
                    <th className="py-2.5 px-3">Çıkış Tarihi</th>
                    <th className="py-2.5 px-3 text-right">Net Çıkış Fiyatı</th>
                    <th className="py-2.5 px-3 text-right">Net Kâr/Zarar</th>
                    <th className="py-2.5 px-3 text-right">Trade Getiri %</th>
                    <th className="py-2.5 px-3 text-right">Trade Anı Alfa</th>
                    <th className="py-2.5 px-3 text-center">Çıkış Nedeni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
                  {rsResult.trades.map((t, idx) => {
                    const isWin = t.pnlTL > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 text-slate-300">{t.entryDate}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{t.entryPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-slate-300">{t.exitDate}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{t.exitPrice.toFixed(2)}</td>
                        <td className={`py-2 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? `+${t.pnlTL.toLocaleString('tr-TR')} TL` : `${t.pnlTL.toLocaleString('tr-TR')} TL`}
                        </td>
                        <td className={`py-2 px-3 text-right font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isWin ? `+${t.returnPct}%` : `${t.returnPct}%`}
                        </td>
                        <td className={`py-2 px-3 text-right ${t.relativeAlphaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.relativeAlphaPct >= 0 ? `+${t.relativeAlphaPct}%` : `${t.relativeAlphaPct}%`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-sans ${
                            t.exitReason === 'TAKE_PROFIT'
                              ? 'bg-emerald-950 text-emerald-300'
                              : t.exitReason === 'STOP_LOSS'
                              ? 'bg-rose-950 text-rose-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {t.exitReason === 'TAKE_PROFIT' ? 'Kâr Al' : t.exitReason === 'STOP_LOSS' ? 'Zarar Kes' : 'RS/EMA Dönüşü'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 7 Mandatory Disclaimer */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-400 leading-relaxed font-sans flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Gelecek Verisi Sızıntısı Yokluğu &amp; Yasal Uyarı: </strong>
              {rsResult.disclaimer}
            </div>
          </div>
        </div>
      )}

      {/* CLASSIC STRATEGY RESULTS */}
      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Toplam Net Getiri</div>
              <div className={`text-lg font-bold font-mono tabular-nums ${result.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.totalReturnPct >= 0 ? `+${result.totalReturnPct}%` : `${result.totalReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                BIST 100: {result.benchmarkReturnPct >= 0 ? `+${result.benchmarkReturnPct}%` : `${result.benchmarkReturnPct}%`}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Kazanma Oranı</div>
              <div className="text-lg font-bold font-mono text-cyan-400 tabular-nums">
                %{result.winRatePct}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {result.winningTrades} Başarılı / {result.losingTrades} Kayıplı
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Kâr Faktörü (Profit Factor)</div>
              <div className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                {result.profitFactor}x
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Brüt Kâr / Brüt Zarar</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Maksimum Düşüş (DD)</div>
              <div className="text-lg font-bold font-mono text-rose-400 tabular-nums">
                -%{result.maxDrawdownPct}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Zirveden Düşüş</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">Son Sermaye</div>
              <div className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                {result.finalCapital.toLocaleString('tr-TR')} TL
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Başlangıç: {result.initialCapital.toLocaleString('tr-TR')} TL</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-500 font-medium">İşlem Maliyetleri</div>
              <div className="text-sm font-bold font-mono text-slate-300 tabular-nums">
                {(result.totalCommissionsTL + result.totalSlippageTL).toFixed(2)} TL
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                K: {result.totalCommissionsTL.toFixed(0)} | S: {result.totalSlippageTL.toFixed(0)} TL
              </div>
            </div>
          </div>

          {/* SVG Equity Curve */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <div className="font-bold text-slate-200">Sermaye Eğrisi (Equity Curve)</div>
              <div className="flex gap-4 text-[11px] font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> Strateji
                </span>
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-slate-400 inline-block" /> BIST 100 Benchmark
                </span>
              </div>
            </div>

            {classicCurve.length > 5 && (
              <div className="w-full overflow-x-auto">
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-48">
                  <path
                    d={classicCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, classicCurve.length)} ${getY(pt.benchmarkValue, minEquityClassic, rangeClassic)}`).join(' ')}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  <path
                    d={classicCurve.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${getX(i, classicCurve.length)} ${getY(pt.portfolioValue, minEquityClassic, rangeClassic)}`).join(' ')}
                    fill="none"
                    stroke={result.totalReturnPct >= 0 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2"
                  />
                </svg>
              </div>
            )}
          </div>
        </div>
      )}

      {!result && !rsResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400 space-y-2">
          <Scale className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <div className="text-slate-200 font-bold text-sm">FAZ 4 Göreceli Güç ve Teknik Strateji Backtest Laboratuvarı</div>
          <p className="max-w-md mx-auto">
            Hisse ve referans endeks (XU100, BIST Banka vb.) arasındaki getiri farkını (Alfa), işlem komisyonlarını ve kayma payını hesaba katan geriye dönük test motorunu yukarıdaki butona tıklayarak çalıştırın.
          </p>
        </div>
      )}
    </div>
  );
};
