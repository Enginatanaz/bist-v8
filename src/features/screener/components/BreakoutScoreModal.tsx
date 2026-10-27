import React from 'react';
import { ResistanceBreakoutItem } from '../../../types';
import { X, ShieldAlert, Award, Volume2, TrendingUp, BarChart2, Layers } from 'lucide-react';

interface BreakoutScoreModalProps {
  item: ResistanceBreakoutItem;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

export const BreakoutScoreModal: React.FC<BreakoutScoreModalProps> = ({
  item,
  onClose,
  onSelectStock
}) => {
  const { stock, scoreBreakdown, resistanceLevel, breakoutDate, status, isFailed } = item;
  const {
    totalScore,
    resistanceReliability,
    closeAboveMargin,
    atrBreakoutMargin,
    volumeConfirmation,
    candleQuality,
    disclaimer
  } = scoreBreakdown;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold font-mono">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">{stock.symbol} — Direnç Kırılım Skoru Analizi</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  isFailed
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : status === 'RETEST'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {isFailed ? 'Başarısız Kırılım (Tuzak)' : status === 'RETEST' ? 'Retest Aşaması' : 'Başarılı Kırılım'}
                </span>
              </div>
              <p className="text-xs text-slate-400">{stock.name} | Kırılan Seviye: {resistanceLevel.toFixed(2)} TL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Score Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-1">Toplam Kırılım Skoru (0–100)</div>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-extrabold font-mono ${
                totalScore >= 80 ? 'text-emerald-400' : totalScore >= 60 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {totalScore}
              </span>
              <span className="text-sm font-mono text-slate-500">/ 100</span>
              {totalScore >= 80 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">
                  <Award className="w-3.5 h-3.5" /> 80+ Yüksek Skor
                </span>
              )}
            </div>
          </div>

          <div className="text-right text-xs text-slate-400">
            <div>Kırılım Tarihi: <strong className="text-slate-200 font-mono">{breakoutDate}</strong></div>
            <div>Son Fiyat: <strong className="text-slate-200 font-mono">{item.lastPrice.toFixed(2)} TL</strong></div>
            <div>Dirençten Uzaklık: <strong className="text-slate-200 font-mono">%{item.distanceToResistancePct.toFixed(2)}</strong></div>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 1. Direnç Güvenilirliği */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Layers className="w-4 h-4 text-cyan-400" />
                1. Direnç Seviyesi Güvenilirliği
              </div>
              <div className="font-mono text-xs font-bold text-cyan-400">
                {resistanceReliability.score} / {resistanceReliability.maxScore} Puan
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">{resistanceReliability.details}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all"
                style={{ width: `${(resistanceReliability.score / resistanceReliability.maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* 2. Kapanış Marjı */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                2. Kapanışın Direnç Üzerinde Gerçekleşmesi
              </div>
              <div className="font-mono text-xs font-bold text-emerald-400">
                {closeAboveMargin.score} / {closeAboveMargin.maxScore} Puan
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">{closeAboveMargin.details}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${(closeAboveMargin.score / closeAboveMargin.maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* 3. ATR Kırılım Büyüklüğü */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                3. ATR'ye Göre Kırılım Büyüklüğü
              </div>
              <div className="font-mono text-xs font-bold text-amber-400">
                {atrBreakoutMargin.score} / {atrBreakoutMargin.maxScore} Puan
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">{atrBreakoutMargin.details}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${(atrBreakoutMargin.score / atrBreakoutMargin.maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* 4. Hacim Teyidi */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Volume2 className="w-4 h-4 text-purple-400" />
                4. İşlem Hacmi Teyidi (20 Bar Ortalama)
              </div>
              <div className="font-mono text-xs font-bold text-purple-400">
                {volumeConfirmation.score} / {volumeConfirmation.maxScore} Puan
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">{volumeConfirmation.details}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${(volumeConfirmation.score / volumeConfirmation.maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* 5. Mum Kalitesi */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Award className="w-4 h-4 text-blue-400" />
                5. Kırılım Mumu Kapanış Kalitesi
              </div>
              <div className="font-mono text-xs font-bold text-blue-400">
                {candleQuality.score} / {candleQuality.maxScore} Puan
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2">{candleQuality.details}</p>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${(candleQuality.score / candleQuality.maxScore) * 100}%` }}
              />
            </div>
          </div>

          {/* Sahte Kırılım (Boğa Tuzağı) Cezası */}
          {scoreBreakdown.failedBreakoutPenalty ? (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  Sahte Kırılım (Boğa Tuzağı) Cezası
                </div>
                <div className="font-mono text-xs font-bold text-rose-400">
                  {scoreBreakdown.failedBreakoutPenalty} Puan
                </div>
              </div>
              <p className="text-xs text-rose-300/80">
                Fiyat direnç seviyesini aştıktan sonra tekrar direnç bandının altına sarktığı için tek seferlik {scoreBreakdown.failedBreakoutPenalty} puan ceza uygulanmış ve hisse başarısız kırılım olarak işaretlenmiştir.
              </p>
            </div>
          ) : null}

          {/* Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{disclaimer}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onSelectStock(stock.symbol);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            {stock.symbol} Detaylı Grafiğine Git
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
