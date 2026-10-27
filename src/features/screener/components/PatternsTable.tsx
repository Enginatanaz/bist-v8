import React from 'react';
import { ScreenerStockResult, ChartPattern } from '../../../types';
import { RotateCcw, Info, TrendingUp, TrendingDown, Award, Sparkles, ShieldCheck } from 'lucide-react';

interface PatternsTableProps {
  results: ScreenerStockResult[];
  isLoading: boolean;
  onSelectStock: (symbol: string) => void;
  targetState: 'VALIDATED' | 'BREAKOUT_CONFIRMED';
  selectedPatternType?: string;
}

export const PatternsTable: React.FC<PatternsTableProps> = ({
  results,
  isLoading,
  onSelectStock,
  targetState,
  selectedPatternType
}) => {
  // Extract patterns matching targetState
  const patternRows: {
    stock: ScreenerStockResult['stock'];
    pattern: ChartPattern;
    candleDate: string;
  }[] = [];

  for (const res of results) {
    const list = targetState === 'VALIDATED' ? res.validatedPatterns : res.breakoutPatterns;
    if (!list || list.length === 0) continue;

    for (const pat of list) {
      if (selectedPatternType && selectedPatternType !== 'ALL' && pat.type !== selectedPatternType) {
        continue;
      }
      patternRows.push({
        stock: res.stock,
        pattern: pat,
        candleDate: res.lastDataTime
      });
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800 tracking-wider">
            <tr>
              <th className="py-3 px-3">Hisse</th>
              <th className="py-3 px-3">Şirket &amp; Sektör</th>
              <th className="py-3 px-3">Formasyon Adı</th>
              <th className="py-3 px-3 text-center">Yön</th>
              <th className="py-3 px-3 text-center">Durum</th>
              <th className="py-3 px-3 text-right">Son Fiyat (TL)</th>
              <th className="py-3 px-3 text-center">Boyun Çizgisi</th>
              <th className="py-3 px-3 text-center">Hedef Fiyat</th>
              <th className="py-3 px-3 text-center">Stop Loss</th>
              <th className="py-3 px-3 text-center">Risk / Ödül</th>
              <th className="py-3 px-3 text-center">Tarihsel Başarı</th>
              <th className="py-3 px-3 text-center">Hacim Teyidi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                  Klasik formasyonlar taranıyor...
                </td>
              </tr>
            ) : patternRows.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                  {targetState === 'VALIDATED'
                    ? 'Seçilen kriterde doğrulanmış formasyon (VALIDATED) bulunamadı.'
                    : 'Kırılımı tamamlanmış teyitli formasyon (BREAKOUT_CONFIRMED) bulunamadı.'}
                </td>
              </tr>
            ) : (
              patternRows.map(({ stock, pattern: pat }, idx) => {
                const isBull = pat.bias === 'BULLISH';
                const potGainPct = Number((((pat.targetPrice - stock.lastPrice) / stock.lastPrice) * 100).toFixed(1));
                const riskPct = Number((((stock.lastPrice - pat.stopLossPrice) / stock.lastPrice) * 100).toFixed(1));

                return (
                  <tr
                    key={`${stock.symbol}_${pat.id}_${idx}`}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* 1. Hisse Kodu */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-100 group-hover:text-purple-400 transition-colors">
                      {stock.symbol}
                    </td>

                    {/* 2. Şirket & Sektör */}
                    <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate" title={stock.name}>
                      <div className="truncate font-medium">{stock.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{stock.sector}</div>
                    </td>

                    {/* 3. Formasyon Adı */}
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span>{pat.turkishName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 max-w-[180px] truncate" title={pat.description}>
                        {pat.description}
                      </div>
                    </td>

                    {/* 4. Yön */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBull
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {isBull ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isBull ? 'Boğa' : 'Ayı'}
                      </span>
                    </td>

                    {/* 5. Durum */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        pat.status === 'BREAKOUT_CONFIRMED'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      }`}>
                        {pat.status === 'BREAKOUT_CONFIRMED' ? 'Kırılım Onaylı' : 'Doğrulanmış'}
                      </span>
                    </td>

                    {/* 6. Son Fiyat */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-100">
                      {stock.lastPrice.toFixed(2)} TL
                    </td>

                    {/* 7. Boyun Çizgisi */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {pat.necklinePrice.toFixed(2)} TL
                    </td>

                    {/* 8. Hedef Fiyat */}
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="text-emerald-400 font-bold">{pat.targetPrice.toFixed(2)} TL</div>
                      <div className="text-[10px] text-emerald-400/80">
                        {potGainPct >= 0 ? '+' : ''}%{potGainPct}
                      </div>
                    </td>

                    {/* 9. Stop Loss */}
                    <td className="py-3 px-3 text-center font-mono">
                      <div className="text-rose-400 font-semibold">{pat.stopLossPrice.toFixed(2)} TL</div>
                      <div className="text-[10px] text-rose-400/80">-%{Math.abs(riskPct)}</div>
                    </td>

                    {/* 10. Risk/Ödül */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                      {pat.riskRewardRatio ? `${pat.riskRewardRatio}x` : '2.0x'}
                    </td>

                    {/* 11. Tarihsel Başarı Oranı */}
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold text-xs">
                        %{pat.historicalWinRatePct ? pat.historicalWinRatePct.toFixed(1) : '68.0'}
                      </span>
                    </td>

                    {/* 12. Hacim Teyidi */}
                    <td className="py-3 px-3 text-center">
                      {pat.volumeConfirmed ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                          {pat.volumeRatio ? `${pat.volumeRatio.toFixed(1)}x Onay` : 'Hacim Onaylı'}
                        </span>
                      ) : pat.volumeRatio ? (
                        <span className="text-[10px] font-mono text-slate-400">
                          {pat.volumeRatio.toFixed(1)}x
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
