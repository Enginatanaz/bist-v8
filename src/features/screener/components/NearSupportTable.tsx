import React from 'react';
import { ScreenerStockResult } from '../../../types';
import { ShieldAlert, TrendingUp, TrendingDown, RotateCcw, Info, AlertTriangle } from 'lucide-react';

interface NearSupportTableProps {
  results: ScreenerStockResult[];
  isLoading: boolean;
  onSelectStock: (symbol: string) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

export const NearSupportTable: React.FC<NearSupportTableProps> = ({
  results,
  isLoading,
  onSelectStock,
  sortField,
  sortDir,
  onSortChange
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800 tracking-wider">
            <tr>
              <th className="py-3 px-3">Hisse</th>
              <th className="py-3 px-3">Şirket &amp; Sektör</th>
              <th className="py-3 px-3 text-center">Pazar</th>
              <th
                onClick={() => onSortChange('lastPrice')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
              >
                Son Fiyat (TL)
              </th>
              <th
                onClick={() => onSortChange('changePercent')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
              >
                Günlük Değişim %
              </th>
              <th className="py-3 px-3 text-center">Destek Seviyesi</th>
              <th
                onClick={() => onSortChange('distanceToSupportPct')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200 font-bold"
              >
                Desteğe Mesafe (%)
              </th>
              <th
                onClick={() => onSortChange('supportStrengthScore')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
              >
                Destek Gücü / Pivot
              </th>
              <th
                onClick={() => onSortChange('testsInLast20Bars')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
              >
                Son 20 Bar Test
              </th>
              <th className="py-3 px-3 text-center">ATR (14) &amp; Oynaklık %</th>
              <th className="py-3 px-3 text-center">Trend Yönü</th>
              <th className="py-3 px-3 text-left">Önerilen Stop &amp; Risk Notu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                  Desteğe yakın (%2–%5) hisseler taranıyor...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                  Belirtilen destek mesafesinde (%2–5) hisse bulunamadı. Filtre aralığını genişleterek deneyiniz.
                </td>
              </tr>
            ) : (
              results.map((res) => {
                const stock = res.stock;
                const sup = res.nearSupport;
                const isPositive = stock.changePercent >= 0;
                if (!sup) return null;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* 1. Hisse Kodu */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {stock.symbol}
                    </td>

                    {/* 2. Şirket Adı & Sektör */}
                    <td className="py-3 px-3 text-slate-300 max-w-[160px] truncate" title={stock.name}>
                      <div className="truncate font-medium">{stock.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{stock.sector}</div>
                    </td>

                    {/* 3. Pazar */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {stock.marketSegment === 'YILDIZ_PAZAR' ? 'Yıldız' : stock.marketSegment === 'ANA_PAZAR' ? 'Ana' : 'Alt'}
                      </span>
                    </td>

                    {/* 4. Son Fiyat */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-100">
                      {stock.lastPrice.toFixed(2)} TL
                    </td>

                    {/* 5. Günlük Değişim */}
                    <td className={`py-3 px-3 text-right font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}%{stock.changePercent.toFixed(2)}
                    </td>

                    {/* 6. Destek Seviyesi */}
                    <td className="py-3 px-3 text-center font-mono font-semibold text-slate-200">
                      {sup.supportLevel.toFixed(2)} TL
                    </td>

                    {/* 7. Desteğe Mesafe (%) */}
                    <td className="py-3 px-3 text-center">
                      <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        +%{sup.distanceToSupportPct.toFixed(2)}
                      </span>
                    </td>

                    {/* 8. Destek Güç Skoru / Pivot Sayısı */}
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <div className="text-slate-200 font-semibold">{sup.supportStrengthScore}/100</div>
                      <div className="text-[10px] text-slate-400">{sup.pivotCount} pivot tabanı</div>
                    </td>

                    {/* 9. Son 20 Bardaki Test Sayısı */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {sup.testsInLast20Bars} kez test
                      </span>
                    </td>

                    {/* 10. ATR & Oynaklık */}
                    <td className="py-3 px-3 text-center font-mono text-xs">
                      <div className="text-slate-200">{sup.atr14.toFixed(2)} TL</div>
                      <div className="text-[10px] text-slate-400">%{sup.atrPct.toFixed(1)} Oynaklık</div>
                    </td>

                    {/* 11. Trend Yönü */}
                    <td className="py-3 px-3 text-center">
                      {sup.trendDirection === 'BULLISH' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <TrendingUp className="w-3.5 h-3.5" /> Boğa Trendi
                        </span>
                      ) : sup.trendDirection === 'BEARISH' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                          <TrendingDown className="w-3.5 h-3.5" /> Düzeltme
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Yatay</span>
                      )}
                    </td>

                    {/* 12. Önerilen Stop & Risk Notu */}
                    <td className="py-3 px-3 text-left">
                      <div className="text-xs text-slate-300">
                        Stop: <strong className="font-mono text-rose-400">{sup.recommendedStopPrice} TL</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 italic max-w-[200px] truncate" title={sup.riskNote}>
                        {sup.riskNote}
                      </div>
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
