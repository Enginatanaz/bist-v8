import React, { useState, useMemo, useEffect } from 'react';
import { BISTStock, MarketStatus, KAPDisclosure, ROEGrowthCompany } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Zap,
  Search,
  DollarSign,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

interface OverviewViewProps {
  stocks: BISTStock[];
  marketStatus: MarketStatus | null;
  disclosures: KAPDisclosure[];
  onSelectStock: (symbol: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  stocks,
  marketStatus,
  disclosures,
  onSelectStock,
  onNavigateTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const q = searchTerm.toUpperCase().trim();
    return stocks
      .filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q))
      .slice(0, 10);
  }, [stocks, searchTerm]);

  // Compute gainers, losers, and volume leaders
  const topGainers = useMemo(() => {
    return [...stocks]
      .filter(s => s.lastPrice > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  }, [stocks]);

  const topLosers = useMemo(() => {
    return [...stocks]
      .filter(s => s.lastPrice > 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
  }, [stocks]);

  const volumeLeaders = useMemo(() => {
    return [...stocks]
      .filter(s => s.volumeTL > 0)
      .sort((a, b) => b.volumeTL - a.volumeTL)
      .slice(0, 5);
  }, [stocks]);

  const marketBreadth = useMemo(() => {
    const advancing = stocks.filter(s => s.changePercent > 0).length;
    const declining = stocks.filter(s => s.changePercent < 0).length;
    const unchanged = stocks.filter(s => s.changePercent === 0).length;
    return { advancing, declining, unchanged };
  }, [stocks]);

  // FAZ 5 Madde 6: ROE'si Artan Şirketler State
  const [roeCompanies, setRoeCompanies] = useState<ROEGrowthCompany[]>([]);
  const [isRoeLoading, setIsRoeLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient.getROEGrowth()
      .then(res => setRoeCompanies(res.companies || []))
      .catch(err => console.warn('ROE verisi alınamadı:', err))
      .finally(() => setIsRoeLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Market Status Banner & Universal Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">Borsa İstanbul Pay Piyasası Seansı</h2>
              <span className="text-[11px] font-semibold text-emerald-400">
                {marketStatus?.isOpen ? 'SEANS AÇIK' : 'SEANS KAPALI'}
              </span>
              <span className="text-slate-500 text-xs">·</span>
              <span className="text-xs text-slate-400">
                {marketStatus?.sessionPhase === 'CONTINUOUS_AUCTION' ? 'Sürekli Müzayede' : 'Kapanış Seansı'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>BIST Yerel Saat: {marketStatus?.exchangeLocalTime || '10:00 - 18:15 UTC+3'}</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-400/90 font-medium">15 Dk Gecikmeli Veri Akışı</span>
            </div>
          </div>
        </div>

        {/* Universal Search Box & Quick CTA */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 focus-within:border-emerald-500 rounded-md px-3 py-1.5 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tüm BIST hisselerinde ara (500+)..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-transparent text-xs text-slate-100 placeholder-slate-500 outline-none w-56 sm:w-64"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute right-0 mt-1.5 w-80 bg-slate-950 border border-slate-800 rounded-md shadow-2xl z-50 py-1 max-h-64 overflow-y-auto divide-y divide-slate-800/40">
                {searchResults.map(s => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      onSelectStock(s.symbol);
                      setSearchTerm('');
                      setIsSearchOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-slate-100">{s.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                          {s.marketSegment === 'YILDIZ_PAZAR' ? 'Yıldız' : s.marketSegment === 'ANA_PAZAR' ? 'Ana' : s.marketSegment === 'ALT_PAZAR' ? 'Alt' : 'PÖİP'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[170px]">{s.name}</div>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-xs font-semibold text-slate-200">
                        {s.lastPrice > 0 ? `${s.lastPrice.toFixed(2)} TL` : '-'}
                      </div>
                      {s.lastPrice > 0 && (
                        <div className={`text-[11px] font-bold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {s.changePercent >= 0 ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('screener')}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Zap className="w-3.5 h-3.5" />
            Teknik Tarayıcı
          </button>
        </div>
      </div>

      {/* Indices Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {marketStatus?.bistIndices.map(idx => {
          const isPos = idx.changePercent >= 0;
          return (
            <div
              key={idx.symbol}
              className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span className="font-semibold text-slate-200">{idx.name}</span>
                <span className="font-mono text-[10px] text-slate-500">{idx.symbol}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-100 font-mono tabular-nums">
                  {idx.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-bold font-mono tabular-nums flex items-center ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? '+' : ''}{idx.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Market Breadth Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400 font-medium">
            Piyasa Genişliği ({stocks.length} BIST Pay Senedi Kapsamı)
          </span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400 font-semibold">{marketBreadth.advancing} Yükselen</span>
            <span className="text-slate-500">{marketBreadth.unchanged} Yatay</span>
            <span className="text-rose-400 font-semibold">{marketBreadth.declining} Düşen</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full transition-all"
            style={{ width: `${(marketBreadth.advancing / (stocks.length || 1)) * 100}%` }}
          />
          <div
            className="bg-slate-600 h-full transition-all"
            style={{ width: `${(marketBreadth.unchanged / (stocks.length || 1)) * 100}%` }}
          />
          <div
            className="bg-rose-500 h-full transition-all"
            style={{ width: `${(marketBreadth.declining / (stocks.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* 3 Column Grid: Gainers, Losers, Volume Leaders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gainers */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-slate-200">Günün Yükselenleri</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Son Fiyat / %</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {topGainers.map(s => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 px-1 rounded transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-slate-200 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    {s.symbol}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                      {s.marketSegment === 'YILDIZ_PAZAR' ? 'Yıldız' : s.marketSegment === 'ANA_PAZAR' ? 'Ana' : 'Alt'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.name}</div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-200 font-semibold">{s.lastPrice.toFixed(2)} TL</div>
                  <div className="text-xs text-emerald-400 font-bold">+{s.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              <h3 className="text-xs font-bold text-slate-200">Günün Düşenleri</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Son Fiyat / %</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {topLosers.map(s => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 px-1 rounded transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-slate-200 group-hover:text-rose-400 transition-colors flex items-center gap-1.5">
                    {s.symbol}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                      {s.marketSegment === 'YILDIZ_PAZAR' ? 'Yıldız' : s.marketSegment === 'ANA_PAZAR' ? 'Ana' : 'Alt'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.name}</div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-200 font-semibold">{s.lastPrice.toFixed(2)} TL</div>
                  <div className="text-xs text-rose-400 font-bold">{s.changePercent.toFixed(2)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Leaders */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200">Hacim Liderleri</h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Hacim (TL)</span>
          </div>
          <div className="divide-y divide-slate-800/60">
            {volumeLeaders.map(s => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 px-1 rounded transition-colors group"
              >
                <div>
                  <div className="font-bold text-xs text-slate-200 group-hover:text-cyan-400 transition-colors flex items-center gap-1.5">
                    {s.symbol}
                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-sans">
                      {s.marketSegment === 'YILDIZ_PAZAR' ? 'Yıldız' : s.marketSegment === 'ANA_PAZAR' ? 'Ana' : 'Alt'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[140px]">{s.name}</div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs text-slate-200 font-semibold">
                    {(s.volumeTL / 1_000_000).toFixed(1)} M TL
                  </div>
                  <div className={`text-xs font-bold ${s.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.changePercent >= 0 ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAZ 5 Madde 6: Öz Sermaye Kârlılığı (ROE) Artan Şirketler */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Öz Sermaye Kârlılığı (ROE) Artan Şirketler</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                FAZ 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Formül: <strong>ROE = Net Dönem Kârı / Ortalama Öz Sermaye × 100</strong>. Dönemsel ve yıllık değerler birbirine karıştırılmamış, karşılaştırılabilir 6 aylık konsolide dönemler baz alınmıştır.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>2026/06 vs 2025/06 Konsolide Bilanço</span>
          </div>
        </div>

        {isRoeLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 font-mono">
            Doğrulanmış finansal raporlar ve kârlılık oranları yükleniyor...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Hisse</th>
                  <th className="py-2.5 px-3">Şirket Adı</th>
                  <th className="py-2.5 px-3">Sektör</th>
                  <th className="py-2.5 px-3 text-right">Son ROE (%)</th>
                  <th className="py-2.5 px-3 text-right">Önceki ROE (%)</th>
                  <th className="py-2.5 px-3 text-center">Değişim (Artış)</th>
                  <th className="py-2.5 px-3 text-center">Finansal Dönem</th>
                  <th className="py-2.5 px-3 text-center">Açıklanma Tarihi</th>
                  <th className="py-2.5 px-3">Resmi Kaynak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {roeCompanies.map(c => (
                  <tr
                    key={c.symbol}
                    onClick={() => onSelectStock(c.symbol)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {c.symbol}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-semibold truncate max-w-[160px]">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                      {c.sector}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-xs">
                      %{c.lastReportedROE.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-xs">
                      %{c.previousROE.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-950 text-emerald-400 border border-emerald-800/60">
                        +{c.roeChangePct.toFixed(1)}% Puan
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-300">
                      {c.financialPeriod}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                      {c.announcementDate}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-[180px]" title={c.source}>
                      {c.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Latest KAP Disclosures Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-slate-200">Son KAP ve Şirket Bildirimleri</h3>
          </div>
          <button
            onClick={() => onNavigateTab('disclosures')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            Tüm KAP Bildirimlerini İncele
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60">
          {disclosures.slice(0, 3).map(k => (
            <div key={k.id} className="py-2.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-200 font-mono">{k.symbol}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {k.category}
                  </span>
                </div>
                <div className="text-xs text-slate-300 font-medium">{k.title}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{k.summary}</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono shrink-0">{k.publishDate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
