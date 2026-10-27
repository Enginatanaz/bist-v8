import React from 'react';
import { ScreenerStockResult, BuySignalRatioItem } from '../../../types';
import { CheckCircle2, RotateCcw, Info, Sliders } from 'lucide-react';

interface BuySignalRatioTableProps {
  results: ScreenerStockResult[];
  isLoading: boolean;
  onSelectStock: (symbol: string) => void;
  onOpenAuditDetail: (item: BuySignalRatioItem) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

export const BuySignalRatioTable: React.FC<BuySignalRatioTableProps> = ({
  results,
  isLoading,
  onSelectStock,
  onOpenAuditDetail,
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
              <th
                onClick={() => onSortChange('buySignalRatioPct')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200 font-bold"
              >
                AL Sinyali Oranı (%)
              </th>
              <th
                onClick={() => onSortChange('buySignalsCount')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
              >
                AL Sinyali
              </th>
              <th className="py-3 px-3 text-center">SAT Sinyali</th>
              <th className="py-3 px-3 text-center">NÖTR Sinyal</th>
              <th className="py-3 px-3 text-center">Değerlendirilen</th>
              <th className="py-3 px-3 text-center">Baskın Sinyal</th>
              <th className="py-3 px-3 text-center">Gösterge Ayrışımı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                  AL sinyali oranına göre hisseler değerlendiriliyor...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                  Seçilen AL sinyali oranı aralığında hisse bulunamadı. Filtre aralığını genişleterek deneyiniz.
                </td>
              </tr>
            ) : (
              results.map((res) => {
                const stock = res.stock;
                const bsr = res.buySignalRatio;
                const isPositive = stock.changePercent >= 0;
                if (!bsr) return null;

                const ratio = bsr.buySignalRatioPct;

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

                    {/* 2. Şirket & Sektör */}
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

                    {/* 6. AL Sinyali Oranı (%) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          %{ratio.toFixed(1)}
                        </span>
                        <div className="w-16 bg-slate-800 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${ratio}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* 7. AL Sinyali Sayısı */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                      {bsr.buySignalsCount}
                    </td>

                    {/* 8. SAT Sinyali Sayısı */}
                    <td className="py-3 px-3 text-center font-mono text-rose-400">
                      {bsr.sellSignalsCount}
                    </td>

                    {/* 9. NÖTR Sinyali Sayısı */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {bsr.neutralSignalsCount}
                    </td>

                    {/* 10. Toplam Değerlendirilen */}
                    <td className="py-3 px-3 text-center font-mono text-slate-300 text-xs">
                      {bsr.evaluatedIndicatorsCount} adet
                      {bsr.uncomputableIndicatorsCount > 0 && (
                        <div className="text-[10px] text-slate-500">
                          ({bsr.uncomputableIndicatorsCount} dışlandı)
                        </div>
                      )}
                    </td>

                    {/* 11. Baskın Sinyal */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        bsr.dominantSignal === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : bsr.dominantSignal === 'SELL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {bsr.dominantSignal === 'BUY' ? 'AL' : bsr.dominantSignal === 'SELL' ? 'SAT' : 'NÖTR'}
                      </span>
                    </td>

                    {/* 12. Detay Butonu */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenAuditDetail(bsr)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                        title="Tüm indikatörleri ve sinyal nedenlerini gör"
                      >
                        Detay Gör
                      </button>
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
