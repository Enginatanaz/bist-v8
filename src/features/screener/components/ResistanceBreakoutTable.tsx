import React from 'react';
import { ScreenerStockResult, ResistanceBreakoutItem } from '../../../types';
import { Award, Volume2, TrendingUp, Info, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ResistanceBreakoutTableProps {
  results: ScreenerStockResult[];
  isLoading: boolean;
  onSelectStock: (symbol: string) => void;
  onOpenBreakoutDetail: (item: ResistanceBreakoutItem) => void;
  sortField: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (field: string) => void;
}

export const ResistanceBreakoutTable: React.FC<ResistanceBreakoutTableProps> = ({
  results,
  isLoading,
  onSelectStock,
  onOpenBreakoutDetail,
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
              <th className="py-3 px-3 text-center">Kırılan Direnç</th>
              <th
                onClick={() => onSortChange('breakoutDate')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
              >
                Kırılım Tarihi
              </th>
              <th
                onClick={() => onSortChange('breakoutScore')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200 font-bold"
              >
                Kırılım Skoru (0-100)
              </th>
              <th
                onClick={() => onSortChange('volumeRatio')}
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
              >
                Hacim Teyidi
              </th>
              <th className="py-3 px-3 text-center">ATR Kırılım Marjı</th>
              <th className="py-3 px-3 text-center">Kırılım Durumu</th>
              <th className="py-3 px-3 text-center">Ayrışım</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                  Direnç kırılımı gösteren hisseler taranıyor...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-12 text-center text-slate-400">
                  <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                  Seçilen skor eşiğini (80+) sağlayan teyitli direnç kırılımı bulunamadı. Eşiği düşürerek tekrar deneyiniz.
                </td>
              </tr>
            ) : (
              results.map((res) => {
                const stock = res.stock;
                const bk = res.resistanceBreakout;
                const isPositive = stock.changePercent >= 0;
                if (!bk) return null;

                const score = bk.breakoutScore;
                const isScoreHigh = score >= 80;

                return (
                  <tr
                    key={stock.symbol}
                    onClick={() => onSelectStock(stock.symbol)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* 1. Hisse Kodu */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{stock.symbol}</span>
                        {isScoreHigh && (
                          <span title="80+ Üstün Kırılım Skoru">
                            <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </span>
                        )}
                      </div>
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

                    {/* 6. Kırılan Direnç Seviyesi */}
                    <td className="py-3 px-3 text-center">
                      <div className="font-mono font-semibold text-slate-200">
                        {bk.resistanceLevel.toFixed(2)} TL
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {bk.scoreBreakdown?.resistanceReliability?.testCount || 1} Temas · Güç: {bk.resistanceZone?.strengthScore || 70}
                      </div>
                    </td>

                    {/* 7. Kırılım Tarihi */}
                    <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                      {bk.breakoutDate}
                    </td>

                    {/* 8. Direnç Kırılım Skoru (0-100) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          isScoreHigh
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : score >= 65
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {score} / 100
                        </span>
                      </div>
                    </td>

                    {/* 9. Hacim Teyidi */}
                    <td className="py-3 px-3 text-center">
                      {bk.hasVolumeData ? (
                        <div className="inline-flex items-center gap-1 font-mono text-xs">
                          <span className={bk.volumeConfirmed ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {bk.volumeRatio?.toFixed(2)}x
                          </span>
                          {bk.volumeConfirmed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="20-bar ortalamanın 1.2x katı veya üzeri" />
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Veri Yok</span>
                      )}
                    </td>

                    {/* 10. ATR Kırılım Marjı */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-300">
                      <span className={bk.atrBreakoutMargin >= 0.5 ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                        +{bk.atrBreakoutMargin.toFixed(1)} ATR
                      </span>
                    </td>

                    {/* 11. Kırılım Durumu */}
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        bk.isFailed
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : bk.status === 'RETEST'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {bk.isFailed ? 'Tuzak / Başarısız' : bk.status === 'RETEST' ? 'Retest' : 'Başarılı'}
                      </span>
                    </td>

                    {/* 12. Skor Ayrışımı / İncele */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenBreakoutDetail(bk)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                        title="Puanlama bileşenlerini ve detayları görüntüle"
                      >
                        İncele
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
