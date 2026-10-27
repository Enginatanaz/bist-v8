import React, { useState, useEffect } from 'react';
import {
  BISTStock,
  MarketAlertRule,
  AlertTriggerLog,
  DualTrackConditionType,
  DualTrackConditionStatus
} from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Activity,
  Clock,
  ArrowRight,
  Sliders,
  X,
  Info,
  Check,
  TrendingDown
} from 'lucide-react';

interface AlertCenterViewProps {
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
}

const SUPPORTED_INDICES = [
  { symbol: 'XU100', name: 'BIST 100 Endeksi' },
  { symbol: 'XU030', name: 'BIST 30 Endeksi' },
  { symbol: 'XU050', name: 'BIST 50 Endeksi' },
  { symbol: 'XBANK', name: 'BIST Banka Endeksi' },
  { symbol: 'XUSIN', name: 'BIST Sınai Endeksi' }
];

const TIMEFRAME_OPTIONS = [
  { id: '1h', label: '1 Saat' },
  { id: '4h', label: '4 Saat' },
  { id: '1d', label: 'Günlük' },
  { id: '1w', label: 'Haftalık' },
  { id: '1mo', label: 'Aylık' }
];

const CONDITION_METADATA: {
  id: DualTrackConditionType;
  title: string;
  description: string;
}[] = [
  {
    id: 'INDEX_BELOW_EMA20',
    title: 'Endeks EMA20 Altına İndi',
    description: 'Referans endeks kapanış fiyatının 20 barlık EMA ana hareketli ortalamanın altına sarkması.'
  },
  {
    id: 'STOCK_BELOW_EMA20',
    title: 'Hisse EMA20 Altına İndi',
    description: 'Hisse kapanış fiyatının 20 barlık EMA dinamik trend desteğinin altına inerek zayıflaması.'
  },
  {
    id: 'EMA5_CROSS_EMA20_DOWN',
    title: 'EMA5, EMA20\'yi Aşağı Kesti (Ayı Kesişimi)',
    description: 'Kısa vadeli EMA5 ortalamasının orta vadeli EMA20 ortalamasını aşağı yönlü keserek trend değişimini işaret etmesi.'
  },
  {
    id: 'STOCK_BROKE_SUPPORT',
    title: 'Hisse Önemli Desteğini Kırdı',
    description: 'Hisse kapanış fiyatının doğrulanmış matematiksel destek seviyesini aşağı yönlü kırması.'
  },
  {
    id: 'STOCK_LOST_RS',
    title: 'Hisse Endekse Göre Güç Kaybetti',
    description: 'Hissenin referans endekse göre 5 barlık göreceli güç eğiminin (Alpha) negatife dönmesi.'
  },
  {
    id: 'RS_INDICATOR_RETREAT',
    title: 'Göreceli Güç Göstergesi Geriledi',
    description: 'Hissenin endekse oran serisinin (RS Ratio) son 3 barda ardışık gerilemesi.'
  },
  {
    id: 'UPWARD_CHANNEL_BROKEN',
    title: 'Yükselen Kanal Aşağı Kırıldı',
    description: 'Doğrulanmış otomatik lineer regresyon yükseliş kanalının alt bandının aşağı yönlü ihlal edilmesi.'
  },
  {
    id: 'RESISTANCE_REJECTION',
    title: 'Dirençten Başarısız Dönüş Gerçekleşti',
    description: 'Fiyatın direnç seviyesine fitil atıp güçlü satıcı baskısıyla belirgin şekilde geri çekilmesi.'
  },
  {
    id: 'SUPPORT_BREAK_WITH_VOLUME',
    title: 'Hacim Artışıyla Destek Kırıldı',
    description: 'Destek kırılımının 20 barlık ortalama hacmin en az %30 üzerindeki panik hacmiyle teyit edilmesi.'
  }
];

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({ stocks, onSelectStock }) => {
  // Alert Rules State
  const [alerts, setAlerts] = useState<MarketAlertRule[]>([]);
  const [history, setHistory] = useState<AlertTriggerLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkResult, setCheckResult] = useState<{ checkedCount: number; newlyTriggeredCount: number } | null>(null);

  // Active Tab: Rules, Live Tracker, History
  const [activeTab, setActiveTab] = useState<'RULES' | 'LIVE_TRACK' | 'HISTORY'>('RULES');

  // Live Dual-Track Inspection State
  const [trackSymbol, setTrackSymbol] = useState<string>('EREGL');
  const [trackIndex, setTrackIndex] = useState<string>('XU100');
  const [trackTimeframe, setTrackTimeframe] = useState<string>('1d');
  const [trackConditions, setTrackConditions] = useState<DualTrackConditionStatus[]>([]);
  const [isTrackLoading, setIsTrackLoading] = useState<boolean>(false);

  // Form State (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [formSymbol, setFormSymbol] = useState<string>('EREGL');
  const [formIndex, setFormIndex] = useState<string>('XU100');
  const [formTimeframe, setFormTimeframe] = useState<'1h' | '4h' | '1d' | '1w' | '1mo'>('1d');
  const [formConditions, setFormConditions] = useState<DualTrackConditionType[]>([
    'STOCK_BELOW_EMA20',
    'STOCK_LOST_RS'
  ]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Load initial alerts & history
  const loadAlertsAndHistory = async () => {
    setIsLoading(true);
    try {
      const [alertList, histList] = await Promise.all([
        apiClient.getAlerts(),
        apiClient.getAlertHistory(50)
      ]);
      setAlerts(alertList);
      setHistory(histList);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlertsAndHistory();
  }, []);

  // Fetch Live Dual-Track Conditions
  const loadTrackConditions = async (sym: string, idx: string, tf: string) => {
    setIsTrackLoading(true);
    try {
      const res = await apiClient.getDualTrackConditions(sym, idx, tf);
      setTrackConditions(res.conditions);
    } catch {
      setTrackConditions([]);
    } finally {
      setIsTrackLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'LIVE_TRACK') {
      loadTrackConditions(trackSymbol, trackIndex, trackTimeframe);
    }
  }, [trackSymbol, trackIndex, trackTimeframe, activeTab]);

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingAlertId(null);
    setFormSymbol(trackSymbol || 'EREGL');
    setFormIndex(trackIndex || 'XU100');
    setFormTimeframe('1d');
    setFormConditions(['STOCK_BELOW_EMA20', 'STOCK_LOST_RS']);
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (rule: MarketAlertRule) => {
    setEditingAlertId(rule.id);
    setFormSymbol(rule.symbol);
    setFormIndex(rule.indexSymbol);
    setFormTimeframe(rule.timeframe);
    setFormConditions(rule.conditions);
    setFormNotes(rule.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  // Toggle Condition in Form
  const toggleFormCondition = (cond: DualTrackConditionType) => {
    setFormConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  };

  // Save Alert (Create or Edit)
  const handleSaveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formConditions.length === 0) {
      setFormError('Lütfen en az bir tetiklenme koşulu seçin.');
      return;
    }

    try {
      if (editingAlertId) {
        await apiClient.updateAlert(editingAlertId, {
          symbol: formSymbol,
          indexSymbol: formIndex,
          timeframe: formTimeframe,
          conditions: formConditions,
          notes: formNotes
        });
      } else {
        await apiClient.createAlert({
          symbol: formSymbol,
          indexSymbol: formIndex,
          timeframe: formTimeframe,
          conditions: formConditions,
          status: 'ACTIVE',
          notes: formNotes
        });
      }

      setIsFormOpen(false);
      setEditingAlertId(null);
      await loadAlertsAndHistory();
    } catch (err: any) {
      setFormError(err.message || 'Alarm kaydedilemedi.');
    }
  };

  // Toggle Status (ACTIVE vs PAUSED)
  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await apiClient.toggleAlert(id);
      setAlerts(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch {
      // ignore
    }
  };

  // Delete Alert
  const handleDeleteAlert = async (id: string) => {
    try {
      await apiClient.deleteAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch {
      // ignore
    }
  };

  // Run Real-time Alert Scan
  const handleCheckAllAlerts = async () => {
    setIsChecking(true);
    setCheckResult(null);
    try {
      const res = await apiClient.checkAlerts();
      setCheckResult({
        checkedCount: res.checkedCount,
        newlyTriggeredCount: res.newlyTriggeredCount
      });
      await loadAlertsAndHistory();
    } catch {
      // ignore
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
              FAZ 4 KOŞULLU BİLDİRİM
            </span>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Endeks ve Hisse Çift Yönlü Takip & Bildirim Merkezi
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Seçtiğiniz hisseyi (örn. EREGL) endeks (XU100, XBANK vb.) ile birlikte izleyin; EMA20 altına sarkma,
            göreceli güç kaybı, destek ve kanal kırılımları gerçekleştiğinde mükerrersiz, doğrulanmış bildirimler alın.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCheckAllAlerts}
            disabled={isChecking}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5"
            title="Tüm aktif alarmları gerçek mum verisiyle şimdi denetle"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
            {isChecking ? 'Taranıyor...' : 'Alarmları Şimdi Tara'}
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Yeni Alarm Tanımla
          </button>
        </div>
      </div>

      {/* Check Scan Toast / Result Banner */}
      {checkResult && (
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg p-3 text-xs flex items-center justify-between gap-3 text-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Tarama tamamlandı: <strong>{checkResult.checkedCount}</strong> aktif alarm gerçek mum verileriyle denetlendi.
              {checkResult.newlyTriggeredCount > 0 ? (
                <span className="text-amber-400 ml-1 font-bold">
                  {checkResult.newlyTriggeredCount} yeni koşul tetiklendi ve geçmişe kaydedildi!
                </span>
              ) : (
                <span className="text-slate-400 ml-1">
                  (Daha önce tetiklenmiş devam eden koşullar için dedüplikasyon devrede, mükerrer bildirim engellendi).
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => setCheckResult(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab('RULES')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'RULES'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Tanımlı Alarmlarım ({alerts.length})
        </button>

        <button
          onClick={() => setActiveTab('LIVE_TRACK')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'LIVE_TRACK'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Canlı Çift Yönlü Takip Paneli (9 Koşul)
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
            activeTab === 'HISTORY'
              ? 'bg-slate-800 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Tetiklenme Günlüğü & Bildirim Geçmişi ({history.length})
        </button>
      </div>

      {/* TAB 1: RULES MANAGEMENT */}
      {activeTab === 'RULES' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center space-y-3">
              <Bell className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-sm font-semibold text-slate-200">Kayıtlı Alarm Kuralı Bulunmuyor</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Hisselerinizin endekse göre EMA20 altına sarkması, destek kırması veya göreceli güç kaybetmesi durumunda bildirim almak için yeni alarm oluşturun.
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded transition-colors"
              >
                İlk Alarmı Tanımla
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Hisse / Referans Endeks</th>
                    <th className="py-3 px-3.5">Periyot</th>
                    <th className="py-3 px-3.5">İzlenen Koşullar</th>
                    <th className="py-3 px-3.5">Son Tetiklenme</th>
                    <th className="py-3 px-3.5 text-center">Durum</th>
                    <th className="py-3 px-3.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
                  {alerts.map(rule => {
                    const isActive = rule.status === 'ACTIVE';

                    return (
                      <tr key={rule.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => onSelectStock(rule.symbol)}
                              className="font-bold text-slate-100 hover:text-emerald-400 cursor-pointer text-sm"
                            >
                              {rule.symbol}
                            </span>
                            <span className="text-slate-500 font-sans">vs</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                              {rule.indexSymbol}
                            </span>
                          </div>
                          {rule.notes && (
                            <div className="text-[11px] font-sans text-slate-400 mt-0.5 truncate max-w-xs">
                              {rule.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3.5 font-sans">
                          <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                            {rule.timeframe}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-sans">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {rule.conditions.map(c => {
                              const meta = CONDITION_METADATA.find(m => m.id === c);
                              return (
                                <span
                                  key={c}
                                  className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px]"
                                  title={meta?.description}
                                >
                                  {meta?.title || c}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-sans">
                          {rule.lastTriggeredAt ? (
                            <div>
                              <span className="text-amber-400 font-bold block text-[11px]">
                                {rule.lastTriggerReason || 'Koşul Sağlandı'}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(rule.lastTriggeredAt).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">— Henüz tetiklenmedi —</span>
                          )}
                        </td>

                        <td className="py-3 px-3.5 text-center font-sans">
                          <button
                            onClick={() => handleToggleStatus(rule.id)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors inline-flex items-center gap-1 ${
                              isActive
                                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800 hover:bg-emerald-900/60'
                                : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <Play className="w-3 h-3 fill-emerald-400" /> Aktif
                              </>
                            ) : (
                              <>
                                <Pause className="w-3 h-3 fill-slate-500" /> Durduruldu
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(rule)}
                            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
                            title="Alarmı Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAlert(rule.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Alarmı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE DUAL-TRACK INSPECTOR */}
      {activeTab === 'LIVE_TRACK' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                İzleme Çifti Seçimi (Hisse & Endeks)
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                9 Teknik Koşulun Anlık Durumu
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Hisse</label>
                <select
                  value={trackSymbol}
                  onChange={e => setTrackSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {stocks.map(s => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.symbol} ({s.lastPrice} TL)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Karşılaştırma Endeksi</label>
                <select
                  value={trackIndex}
                  onChange={e => setTrackIndex(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {SUPPORTED_INDICES.map(idx => (
                    <option key={idx.symbol} value={idx.symbol}>
                      {idx.symbol} - {idx.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Zaman Dilimi</label>
                <select
                  value={trackTimeframe}
                  onChange={e => setTrackTimeframe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                >
                  {TIMEFRAME_OPTIONS.map(tf => (
                    <option key={tf.id} value={tf.id}>
                      {tf.label} ({tf.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Condition Cards Grid */}
          {isTrackLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-xs text-slate-400 font-mono">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {trackSymbol} ve {trackIndex} için gerçek mum verileri eşleştirilerek 9 koşul hesaplanıyor...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trackConditions.map((cond, idx) => {
                const meta = CONDITION_METADATA.find(m => m.id === cond.condition);
                return (
                  <div
                    key={cond.condition}
                    className={`p-3.5 rounded-lg border transition-all ${
                      cond.isTriggered
                        ? 'bg-rose-950/20 border-rose-500/40 text-slate-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[11px] font-bold text-slate-400 font-mono">
                        KOŞUL #{idx + 1}
                      </div>
                      {cond.isTriggered ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700/60 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> TETİKLENDİ
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" /> SAĞLANMADI
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-xs text-slate-100 mt-2">
                      {cond.title}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {meta?.description || cond.description}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 font-mono text-[11px] text-slate-300 flex items-center justify-between">
                      <span className="text-slate-500">Değer:</span>
                      <span className="font-bold">{cond.valueDescription}</span>
                    </div>

                    {cond.triggeredAt && (
                      <div className="mt-1 font-mono text-[10px] text-amber-400 flex items-center justify-between">
                        <span className="text-slate-500">Mum Tarihi:</span>
                        <span>{cond.triggeredAt}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: TRIGGER HISTORY (DEDUPED) */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Gereksiz Tekrar Önleme (Deduplication):</strong> Aynı koşul sonraki saatlerde veya günlerde kesintisiz sağlansa dahi,
              sistem aynı veri zamanı için mükerrer bildirim kaydetmez. Her kayıt doğrulanmış veri zamanını içerir.
            </span>
          </div>

          {history.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-8 text-center text-xs text-slate-400">
              Henüz tetiklenmiş bildirim kaydı bulunmamaktadır.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Hisse / Endeks</th>
                    <th className="py-3 px-3.5">Tetiklenen Koşul</th>
                    <th className="py-3 px-3.5">Veri Zamanı</th>
                    <th className="py-3 px-3.5">Kapanış Fiyatı</th>
                    <th className="py-3 px-3.5">Kayıt Zamanı</th>
                    <th className="py-3 px-3.5">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
                  {history.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3.5">
                        <span className="font-bold text-slate-100">{item.symbol}</span>
                        <span className="text-slate-500 text-[10px] ml-1.5">vs {item.indexSymbol}</span>
                      </td>

                      <td className="py-2.5 px-3.5 font-sans">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800">
                          {item.conditionTitle}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-300">
                        {item.dataTimestamp}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-200">
                        {item.priceAtTrigger.toFixed(2)} TL
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-500 text-[11px]">
                        {new Date(item.recordedAt).toLocaleTimeString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>

                      <td className="py-2.5 px-3.5 font-sans text-slate-400 text-[11px] max-w-sm truncate">
                        {item.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT ALERT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                {editingAlertId ? 'Alarm Kuralını Düzenle' : 'Yeni Koşullu Alarm Tanımla'}
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/40 border border-rose-800/50 rounded p-2.5 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAlert} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Hisse</label>
                  <select
                    value={formSymbol}
                    onChange={e => setFormSymbol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {stocks.map(s => (
                      <option key={s.symbol} value={s.symbol}>
                        {s.symbol} ({s.lastPrice} TL)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Referans Endeks</label>
                  <select
                    value={formIndex}
                    onChange={e => setFormIndex(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                  >
                    {SUPPORTED_INDICES.map(idx => (
                      <option key={idx.symbol} value={idx.symbol}>
                        {idx.symbol} ({idx.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Periyot (Zaman Dilimi)</label>
                  <select
                    value={formTimeframe}
                    onChange={e => setFormTimeframe(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  >
                    {TIMEFRAME_OPTIONS.map(tf => (
                      <option key={tf.id} value={tf.id}>
                        {tf.label} ({tf.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1.5 font-medium">
                  Tetiklenme Koşulları (En az bir tane seçiniz):
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {CONDITION_METADATA.map(meta => {
                    const isChecked = formConditions.includes(meta.id);
                    return (
                      <div
                        key={meta.id}
                        onClick={() => toggleFormCondition(meta.id)}
                        className={`p-2.5 rounded border cursor-pointer transition-colors flex items-start gap-2.5 ${
                          isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div
                          className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold text-slate-200">{meta.title}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{meta.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Özel Not / Strateji Açıklaması</label>
                <input
                  type="text"
                  placeholder="Örn: EREGL BIST 100 kırılım koruma alarmı"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-200 border border-slate-700 rounded transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded transition-colors"
                >
                  {editingAlertId ? 'Değişiklikleri Kaydet' : 'Alarmı Oluştur ve Başlat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
