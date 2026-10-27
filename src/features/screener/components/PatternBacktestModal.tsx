import React from 'react';
import { PatternBacktestSummary } from '../../../types';
import { X, Award, ShieldAlert, BarChart2, TrendingUp, RefreshCw } from 'lucide-react';

interface PatternBacktestModalProps {
  summaries: PatternBacktestSummary[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onClose: () => void;
}

export const PatternBacktestModal: React.FC<PatternBacktestModalProps> = ({
  summaries,
  isLoading,
  onRefresh,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                16 Klasik Formasyon — Gerçekçi BIST Tarihsel Başarı Oranı (Backtest)
              </h3>
              <p className="text-xs text-slate-400">
                Sıfır lookahead bias | BIST komisyonu (%0.15) ve kayma (%0.10) işlem bazında düşülmüştür
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                title="Tarihsel verileri yeniden hesapla"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="py-3 px-3">Formasyon</th>
                  <th className="py-3 px-3 text-center">Örneklem</th>
                  <th className="py-3 px-3 text-center">Başarılı (Win)</th>
                  <th className="py-3 px-3 text-center">Başarısız (Loss)</th>
                  <th className="py-3 px-3 text-center">Zaman Aşımı</th>
                  <th className="py-3 px-3 text-right">Başarı Oranı (%)</th>
                  <th className="py-3 px-3 text-right">Kâr Faktörü</th>
                  <th className="py-3 px-3 text-right">Ort. Kâr (%)</th>
                  <th className="py-3 px-3 text-right">Ort. Zarar (%)</th>
                  <th className="py-3 px-3 text-center">Ort. Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-400 mb-2" />
                      BIST tarihsel barlarında formasyon hedefleri ve stop seviyeleri test ediliyor...
                    </td>
                  </tr>
                ) : summaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Tarihsel formasyon verisi henüz yüklenmedi.
                    </td>
                  </tr>
                ) : (
                  summaries.map((s, idx) => {
                    const isHighSuccess = s.winRatePct >= 68;
                    const isMediumSuccess = s.winRatePct >= 65;

                    return (
                      <tr key={s.patternType} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-200 flex items-center gap-2">
                          <span className="w-5 text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                          <span>{s.turkishName}</span>
                          {isHighSuccess && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 text-[10px] font-mono border border-purple-500/20">
                              Lider
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-300">{s.sampleCount}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">{s.wins}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-rose-400">{s.losses}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">{s.timeouts}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            isHighSuccess
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isMediumSuccess
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            %{s.winRatePct.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {s.profitFactor.toFixed(2)}x
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-medium">
                          +%{s.averageGainPct.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400 font-medium">
                          -%{s.averageLossPct.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                          {s.avgBarsToTarget} bar
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Legal Disclaimer */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Yasal ve Metodolojik Bildirim:</strong> Tüm başarı oranları Borsa İstanbul geçmiş pay verileri üzerinde sıfır gelecek sızıntısı kuralıyla hesaplanmıştır. Alış ve satışta toplam %0.50 oranında BIST komisyonu ve piyasa kayması yansıtılmıştır. Geçmiş başarı oranları, gelecekteki fiyat hareketleri için getiri garantisi taşımaz.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
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
