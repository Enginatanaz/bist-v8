import React, { useState, useEffect } from 'react';
import { KAPDisclosure, KAPStatusReport } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Calendar,
  Sparkles,
  FileText,
  CheckCircle2,
  Info,
  Server,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  AlertCircle,
  Clock
} from 'lucide-react';

interface DisclosuresViewProps {
  onSelectStock: (symbol: string) => void;
}

export const DisclosuresView: React.FC<DisclosuresViewProps> = ({ onSelectStock }) => {
  const [disclosures, setDisclosures] = useState<KAPDisclosure[]>([]);
  const [kapStatus, setKapStatus] = useState<KAPStatusReport | null>(null);
  const [category, setCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [showMigrationModal, setShowMigrationModal] = useState<boolean>(false);
  const [cardViewModes, setCardViewModes] = useState<Record<string, 'AI_SUMMARY' | 'ORIGINAL'>>({});
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [connTestResult, setConnTestResult] = useState<{
    reachable: boolean;
    authenticated: boolean;
    statusCode: number;
    message: string;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await apiClient.testKAPConnection();
      setConnTestResult(res);
    } catch (err: any) {
      setConnTestResult({
        reachable: false,
        authenticated: false,
        statusCode: 0,
        message: err?.message || 'Ağ testi gerçekleştirilemedi.'
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const reloadData = () => {
    setIsLoading(true);
    Promise.all([
      apiClient.getDisclosures(selectedStockFilter || undefined, category !== 'ALL' ? category : undefined, search || undefined),
      apiClient.getKAPStatus().catch(() => null)
    ])
      .then(([items, status]) => {
        setDisclosures(items);
        if (status) setKapStatus(status);
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      apiClient.getDisclosures(selectedStockFilter || undefined, category !== 'ALL' ? category : undefined, search || undefined),
      apiClient.getKAPStatus().catch(() => null)
    ])
      .then(([items, status]) => {
        if (isMounted) {
          setDisclosures(items);
          if (status) setKapStatus(status);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [category, search, selectedStockFilter]);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await apiClient.syncKAPDisclosures();
      if (res.success) {
        setSyncFeedback(`MKK Senkronizasyonu başarılı! ${res.newCount} yeni bildirim alındı.`);
      } else {
        setSyncFeedback(`MKK Senkronizasyonu: ${res.error || 'Doğrulanmış arşiv moduna geçildi.'}`);
      }
      reloadData();
    } catch (err: any) {
      setSyncFeedback(`Senkronizasyon hatası: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const uniqueSymbols = Array.from(new Set(disclosures.map(d => d.symbol))).sort();

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Kamuyu Aydınlatma Platformu (KAP) Resmî Bildirim Merkezi
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Borsa İstanbul pay senetleri için filtrelenmiş, teyitli ve orijinal KAP bildirim akışı. Canlı MKK REST yayını ve doğrulanmış arşiv kayıtları ayrıştırılmıştır.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white border border-emerald-500 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'MKK Sorgulanıyor...' : 'MKK Canlı Senkronize Et'}
            </button>

            <button
              onClick={() => setShowMigrationModal(!showMigrationModal)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              KAP Veri Durumu & MKK Bilgisi
              {showMigrationModal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-300 font-mono">{syncFeedback}</span>
            <button onClick={() => setSyncFeedback(null)} className="text-slate-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MKK Migration & Integration Architecture Collapsible */}
        {showMigrationModal && kapStatus && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                MKK KAP Veri Yayın Kuruluşu (VYK) REST API Entegrasyon Durumu
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                kapStatus.status === 'CONNECTED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {kapStatus.status === 'CONNECTED' ? 'Canlı MKK REST Yayını Bağlı' : 'Doğrulanmış Resmî Arşiv & Yerel Önbellek'}
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed font-sans">
              KAP bildirimleri, Merkezi Kayıt Kuruluşu (MKK) REST API servisi (<code>{kapStatus.officialEndpoint}</code>) üzerinden temin edilir.
              Sistem MKK'nın <strong>dakikada maksimum 6 istek</strong> hız sınırına otomatik olarak uymaktadır.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-[11px]">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Aktif Veri Modu</span>
                <span className="font-bold text-slate-200">
                  {kapStatus.dataSourceMode === 'MKK_LIVE_API' ? 'MKK Canlı REST Akışı' : 'Doğrulanmış Arşiv'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Toplam Bildirim</span>
                <span className="font-bold text-emerald-400">
                  {kapStatus.verifiedCount} Kayıt
                  {kapStatus.liveDisclosuresCount !== undefined && (
                    <span className="text-slate-400 text-[10px] font-normal ml-1">
                      ({kapStatus.liveDisclosuresCount} Canlı / {kapStatus.archiveDisclosuresCount} Arşiv)
                    </span>
                  )}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MKK Hız Sınırı (Rate Limit)</span>
                <span className="font-bold text-cyan-400">
                  {kapStatus.rateLimitStatus ? `${kapStatus.rateLimitStatus.remainingRequests}/${kapStatus.rateLimitStatus.maxRequestsPerMinute} İstek Kaldı` : '6 İstek/Dk (Uyumlu)'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">MKK Hedef Uç Noktası</span>
                <span className="font-mono text-slate-300 text-[10px] truncate block" title={kapStatus.officialEndpoint}>
                  {kapStatus.officialEndpoint.replace('https://', '')}
                </span>
              </div>
            </div>

            {kapStatus.lastApiError && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-900/60 text-amber-300 text-[11px] font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>Son API Bildirimi: {kapStatus.lastApiError}</span>
              </div>
            )}

            {/* Live Gateway Test Trigger & Status */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-200 block">Canlı Ağ Bağlantı Teşhisi</span>
                <span className="text-[11px] text-slate-400 block">
                  Resmî test sunucusuna (<code className="text-cyan-300">https://apigwdev.mkk.com.tr/api/vyk/members</code>) anlık HTTP denemesi gönderir.
                </span>
              </div>
              <button
                onClick={handleTestConnection}
                disabled={isTestingConn}
                className="px-3 py-1 rounded text-xs font-mono font-medium bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isTestingConn ? 'animate-spin' : ''}`} />
                {isTestingConn ? 'Bağlantı Sınanıyor...' : 'MKK Ağ Bağlantısını Sına'}
              </button>
            </div>

            {connTestResult && (
              <div className={`p-2.5 rounded-lg text-xs font-mono border ${
                connTestResult.authenticated
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : connTestResult.reachable
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    {connTestResult.reachable
                      ? `MKK Ağ Durumu: Erişildi [HTTP ${connTestResult.statusCode}]`
                      : 'MKK Ağ Durumu: Bağlantı Başarısız'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
                  {connTestResult.message}
                </p>
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-300 block">MKK Kurumsal Entegrasyon Parametreleri:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {kapStatus.migrationGuide.map(step => (
                  <div key={step.step} className="p-2 rounded bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="font-bold text-slate-200">{step.step}. {step.title}</span>
                    <p className="text-slate-400 text-[10px]">{step.description}</p>
                    <span className="text-[9px] text-cyan-400 font-mono block">Gereksinim: {step.actionRequired}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {['ALL', 'Özel Durum', 'Finansal Rapor', 'Temettü / Sermaye', 'Şirket Kararı'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
                  category === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Tüm Bildirimler' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Symbol Filter Pill */}
            {selectedStockFilter && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 rounded text-xs text-emerald-300 font-mono">
                <span>Filtre: <strong>{selectedStockFilter}</strong></span>
                <button
                  onClick={() => setSelectedStockFilter('')}
                  className="hover:text-white"
                  title="Hisse filtresini kaldır"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Hisse kodu veya bildirim ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Disclosures Feed List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 font-mono">
            KAP resmî bildirim akışı yükleniyor...
          </div>
        ) : disclosures.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center space-y-2">
            <h3 className="text-sm font-semibold text-slate-300">
              {selectedStockFilter ? `${selectedStockFilter} için doğrulanmış resmî KAP bildirimi bulunamadı` : 'Kriterlere uygun KAP bildirimi bulunamadı'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sistemimiz yalnızca doğrulanmış şirket bildirimlerini listeler. Tahmini veya uydurma bildirim gösterilmez.
            </p>
          </div>
        ) : (
          disclosures.map(item => {
            const mode = cardViewModes[item.id] || 'AI_SUMMARY';
            const originalUrl = item.originalUrl || `https://www.kap.org.tr/tr/Bildirim/${item.disclosureIndex || item.id}`;

            return (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3 hover:border-slate-700 transition-colors"
              >
                {/* Card Top Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      className="font-bold text-emerald-400 font-mono hover:underline bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                    >
                      {item.symbol}
                    </button>
                    <span className="text-slate-500">·</span>
                    <span className="font-semibold text-slate-200">{item.companyTitle}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-cyan-300 border border-slate-700">
                      {item.disclosureType || item.category}
                    </span>
                    {item.isImportant && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                        Önemli
                      </span>
                    )}
                    {item.dataSource === 'MKK_LIVE_API' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        MKK Canlı Akış
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-cyan-400" />
                        Doğrulanmış Arşiv
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.publishDate.replace('T', ' ').substring(0, 16)}</span>
                  </div>
                </div>

                {/* Subject Title */}
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>

                {/* Sub-Tabs: AI Summary vs Original Verbatim KAP Text */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 w-fit text-xs">
                  <button
                    onClick={() => setCardViewModes(prev => ({ ...prev, [item.id]: 'AI_SUMMARY' }))}
                    className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors ${
                      mode === 'AI_SUMMARY'
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Yapay Zekâ Özeti ve Etki Analizi
                  </button>

                  <button
                    onClick={() => setCardViewModes(prev => ({ ...prev, [item.id]: 'ORIGINAL' }))}
                    className={`px-3 py-1 rounded flex items-center gap-1.5 font-medium transition-colors ${
                      mode === 'ORIGINAL'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    Orijinal KAP Açıklama Metni
                  </button>
                </div>

                {/* Content Box */}
                {mode === 'AI_SUMMARY' ? (
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400 pb-1 border-b border-emerald-900/40">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Yapay Zekâ Analiz ve Çıkarımları
                      </span>
                      {item.financialImpactScore !== undefined && (
                        <span className="font-bold">
                          Etki Puanı: {item.financialImpactScore.toFixed(1)} / 10
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed font-sans text-slate-200">
                      {item.aiSummary || item.summary}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-1 border-b border-slate-800">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        KAP'a Bildirilen Orijinal Metin
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Bildirim No: {item.disclosureIndex || item.id}
                      </span>
                    </div>
                    <p className="leading-relaxed font-mono text-xs whitespace-pre-wrap text-slate-300">
                      {item.originalText || item.summary}
                    </p>
                  </div>
                )}

                {/* Footer Bar */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Kaynak: <strong className="text-slate-400 font-sans">{item.source || 'KAP Resmî Bildirim Servisi'}</strong>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      Resmî KAP Belgesi <ExternalLink className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => onSelectStock(item.symbol)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      {item.symbol} Analizine Git <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
