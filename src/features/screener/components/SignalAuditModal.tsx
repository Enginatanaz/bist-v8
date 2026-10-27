import React from 'react';
import { BuySignalRatioItem } from '../../../types';
import { X, CheckCircle2, XCircle, MinusCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SignalAuditModalProps {
  item: BuySignalRatioItem;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

export const SignalAuditModal: React.FC<SignalAuditModalProps> = ({
  item,
  onClose,
  onSelectStock
}) => {
  const { stock, audit, buySignalRatioPct, sellSignalRatioPct, neutralSignalRatioPct, dominantSignal } = item;
  const { signals, uncomputableList, correlationWarning, legalDisclaimer, evaluatedIndicatorsCount } = audit;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold font-mono">
              {stock.symbol.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-100 text-base">{stock.symbol} — Teknik Gösterge Sinyal Denetimi</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  dominantSignal === 'BUY'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : dominantSignal === 'SELL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  Baskın Sinyal: {dominantSignal === 'BUY' ? 'AL' : dominantSignal === 'SELL' ? 'SAT' : 'NÖTR'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {stock.name} | Zaman Dilimi: <strong className="text-slate-200 font-mono">{audit.timeframe?.toUpperCase() || '1D'}</strong> | Değerlendirilen: <strong className="text-emerald-400 font-mono">{evaluatedIndicatorsCount}</strong> Gösterge | Dışlanan: <strong className="text-amber-400 font-mono">{uncomputableList?.length || 0}</strong> Gösterge | FAZ 5 Madde 7 Ortak Kaynak
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ratio Summary Bar */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> AL Sinyalleri
            </div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              %{buySignalRatioPct.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {item.buySignalsCount} / {evaluatedIndicatorsCount} Gösterge
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> SAT Sinyalleri
            </div>
            <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
              %{sellSignalRatioPct.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {item.sellSignalsCount} / {evaluatedIndicatorsCount} Gösterge
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1">
              <MinusCircle className="w-3.5 h-3.5" /> NÖTR Sinyaller
            </div>
            <div className="text-2xl font-mono font-extrabold text-slate-300 mt-1">
              %{neutralSignalRatioPct.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {item.neutralSignalsCount} / {evaluatedIndicatorsCount} Gösterge
            </div>
          </div>
        </div>

        {/* Signals List */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Signals Table */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Değerlendirilen Geçerli Teknik Göstergeler ({signals.length})
            </h4>
            <div className="space-y-2">
              {signals.map((sig) => (
                <div
                  key={sig.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{sig.name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                        {sig.category}
                      </span>
                      {sig.correlationNote && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] text-amber-300 border border-amber-500/30">
                          Korelasyonlu
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">{sig.reason}</div>
                    {sig.correlationNote && (
                      <div className="text-[11px] text-amber-400/80 italic">{sig.correlationNote}</div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold font-mono ${
                      sig.signal === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : sig.signal === 'SELL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {sig.signal === 'BUY' ? 'AL' : sig.signal === 'SELL' ? 'SAT' : 'NÖTR'}
                    </span>
                    <div className="text-[11px] font-mono text-slate-400 mt-1">{sig.valueStr}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uncomputable Indicators (Excluded from denominator) */}
          {uncomputableList && uncomputableList.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Yetersiz Veri Nedeniyle Dışlanan Göstergeler ({uncomputableList.length})
              </div>
              <p className="text-[11px] text-slate-400">
                Aşağıdaki göstergeler yeterli bar geçmişi bulunmadığı için AL veya NÖTR sayılmamış, formül pay ve paydasından tamamen çıkarılmıştır:
              </p>
              <ul className="text-xs font-mono text-slate-300 space-y-1 list-disc list-inside">
                {uncomputableList.map((u, idx) => (
                  <li key={idx}>
                    <strong>{u.name}</strong>: {u.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Correlation Warning */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{correlationWarning}</span>
          </div>

          {/* Legal Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-[11px] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>{legalDisclaimer}</span>
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
            {stock.symbol} Teknik Analiz Paneline Git
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
