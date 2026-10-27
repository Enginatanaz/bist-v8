import React, { useState, useEffect } from 'react';
import { BISTStock, WatchlistFolder, WatchlistItem } from '../../types';
import { apiClient } from '../../services/apiClient';
import {
  Bookmark,
  Plus,
  Trash2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Search,
  FolderPlus,
  Edit3,
  Target,
  ShieldAlert,
  SlidersHorizontal,
  Table,
  LayoutGrid,
  Save,
  Check,
  ChevronRight
} from 'lucide-react';

interface WatchlistViewProps {
  watchlist: string[];
  stocks: BISTStock[];
  onSelectStock: (symbol: string) => void;
  onRemoveFromWatchlist: (symbol: string) => void;
  onAddToWatchlist: (symbol: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  stocks,
  onSelectStock,
  onRemoveFromWatchlist,
  onAddToWatchlist
}) => {
  const [folders, setFolders] = useState<WatchlistFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string>('fav-1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [viewMode, setViewMode] = useState<'CARDS' | 'COMPARISON'>('CARDS');

  // Load from API + localStorage
  useEffect(() => {
    const loadWatchlists = async () => {
      try {
        const serverFolders = await apiClient.getWatchlists();
        if (serverFolders && serverFolders.length > 0) {
          setFolders(serverFolders);
          setActiveFolderId(serverFolders[0].id);
        } else {
          // fallback to localStorage
          const local = localStorage.getItem('bist_watchlists');
          if (local) {
            const parsed = JSON.parse(local);
            setFolders(parsed);
            setActiveFolderId(parsed[0]?.id || 'fav-1');
          }
        }
      } catch (err) {
        console.error('İzleme listesi yükleme hatası:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlists();
  }, []);

  // Save changes to API & localStorage
  const syncFolders = async (updated: WatchlistFolder[]) => {
    setFolders(updated);
    localStorage.setItem('bist_watchlists', JSON.stringify(updated));
    try {
      await apiClient.saveWatchlists(updated);
    } catch (e) {
      console.warn('API izleme listesi senkronizasyon uyarısı:', e);
    }
  };

  const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0];

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: WatchlistFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      createdAt: new Date().toISOString(),
      items: []
    };
    const updated = [...folders, newFolder];
    syncFolders(updated);
    setActiveFolderId(newFolder.id);
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleDeleteFolder = (folderId: string) => {
    if (folders.length <= 1) return; // Keep at least one
    const updated = folders.filter(f => f.id !== folderId);
    syncFolders(updated);
    setActiveFolderId(updated[0].id);
  };

  const handleAddStockToFolder = (symbol: string) => {
    if (!activeFolder) return;
    if (activeFolder.items.some(i => i.symbol === symbol)) return;

    const newItem: WatchlistItem = {
      symbol,
      addedAt: new Date().toISOString(),
      notes: ''
    };

    const updated = folders.map(f => {
      if (f.id === activeFolder.id) {
        return { ...f, items: [...f.items, newItem] };
      }
      return f;
    });

    syncFolders(updated);
    onAddToWatchlist(symbol);
    setSearch('');
    setIsAdding(false);
  };

  const handleRemoveStockFromFolder = (symbol: string) => {
    if (!activeFolder) return;
    const updated = folders.map(f => {
      if (f.id === activeFolder.id) {
        return { ...f, items: f.items.filter(i => i.symbol !== symbol) };
      }
      return f;
    });
    syncFolders(updated);
    onRemoveFromWatchlist(symbol);
  };

  const handleUpdateItemNotes = (symbol: string, notes: string, targetPrice?: number, stopPrice?: number) => {
    if (!activeFolder) return;
    const updated = folders.map(f => {
      if (f.id === activeFolder.id) {
        return {
          ...f,
          items: f.items.map(i => {
            if (i.symbol === symbol) {
              return {
                ...i,
                notes,
                targetPrice: targetPrice !== undefined ? targetPrice : i.targetPrice,
                stopPrice: stopPrice !== undefined ? stopPrice : i.stopPrice
              };
            }
            return i;
          })
        };
      }
      return f;
    });
    syncFolders(updated);
  };

  const currentFolderStocks = activeFolder?.items
    .map(item => {
      const stock = stocks.find(s => s.symbol === item.symbol);
      return stock ? { stock, item } : null;
    })
    .filter(Boolean) as { stock: BISTStock; item: WatchlistItem }[] || [];

  const availableToAdd = stocks.filter(
    s => !activeFolder?.items.some(i => i.symbol === s.symbol) &&
    (s.symbol.includes(search.toUpperCase()) || s.name.toUpperCase().includes(search.toUpperCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header & Folder Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-400" />
              Özel İzleme Listeleri ve Portföy Takibi (FAZ 3.5)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Çoklu izleme klasörleri oluşturun, kişisel hedef ve stop notlarınızı kaydedin, hisseleri yan yana karşılaştırın.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-md border border-slate-800">
              <button
                onClick={() => setViewMode('CARDS')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'CARDS' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Kart Görünümü"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('COMPARISON')}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === 'COMPARISON' ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="Karşılaştırma Matrisi"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs rounded-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Hisse Ekle
            </button>
          </div>
        </div>

        {/* Folders Tabs Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
          {folders.map(folder => (
            <div
              key={folder.id}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors border ${
                activeFolderId === folder.id
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
              onClick={() => setActiveFolderId(folder.id)}
            >
              <span>{folder.name}</span>
              <span className="text-[10px] text-slate-500 font-mono">({folder.items.length})</span>
              {folders.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder.id);
                  }}
                  className="hover:text-rose-400 text-slate-600 ml-1 p-0.5"
                  title="Klasörü Sil"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* New Folder Creation */}
          {isCreatingFolder ? (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-700">
              <input
                type="text"
                placeholder="Klasör adı..."
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                className="bg-transparent text-xs text-slate-200 outline-none w-28 px-1"
                autoFocus
              />
              <button
                onClick={handleCreateFolder}
                className="px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-bold rounded"
              >
                Ekle
              </button>
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 border border-dashed border-slate-700 rounded-md transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              Yeni Liste
            </button>
          )}
        </div>
      </div>

      {/* Add Stock Search Overlay */}
      {isAdding && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={`${activeFolder?.name || 'İzleme listesi'}ne eklemek için hisse kodu veya adı yazın...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {availableToAdd.slice(0, 12).map(s => (
              <button
                key={s.symbol}
                onClick={() => handleAddStockToFolder(s.symbol)}
                className="p-2 bg-slate-950 hover:bg-slate-800 rounded border border-slate-800 text-left flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-200 font-mono">{s.symbol}</div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{s.name}</div>
                </div>
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main View: Cards or Comparison Matrix */}
      {currentFolderStocks.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center text-xs text-slate-400">
          "{activeFolder?.name}" listesinde henüz hisse bulunmuyor. Yukarıdaki "Hisse Ekle" butonuna basarak hisse ekleyebilirsiniz.
        </div>
      ) : viewMode === 'CARDS' ? (
        /* Cards View with Target/Stop & Personal Notes */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentFolderStocks.map(({ stock: s, item }) => {
            const isPos = s.changePercent >= 0;
            return (
              <div
                key={s.symbol}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-colors"
              >
                {/* Symbol Title & Remove */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => onSelectStock(s.symbol)}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 font-mono text-base group-hover:text-emerald-400 transition-colors">
                        {s.symbol}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {s.sector}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[180px] mt-0.5 font-sans">
                      {s.name}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStockFromFolder(s.symbol)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Listeden Çıkar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Price & Change */}
                <div
                  onClick={() => onSelectStock(s.symbol)}
                  className="flex items-baseline justify-between pt-2 border-t border-slate-800/80 cursor-pointer"
                >
                  <div className="text-2xl font-extrabold text-slate-100 font-mono tabular-nums">
                    {s.lastPrice.toFixed(2)} <span className="text-xs font-normal text-slate-400">TL</span>
                  </div>
                  <div className={`text-xs font-bold font-mono tabular-nums flex items-center gap-1 ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {isPos ? `+${s.changePercent.toFixed(2)}%` : `${s.changePercent.toFixed(2)}%`}
                  </div>
                </div>

                {/* Target & Stop-Loss Level Inputs */}
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/60 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                      <Target className="w-3 h-3 text-emerald-400" />
                      Hedef Seviye
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Hedef TL"
                      value={item.targetPrice || ''}
                      onChange={(e) => handleUpdateItemNotes(s.symbol, item.notes || '', parseFloat(e.target.value) || undefined, item.stopPrice)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-emerald-300 focus:outline-none focus:border-emerald-500 text-xs mt-0.5"
                    />
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-rose-400" />
                      Stop Seviyesi
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Stop TL"
                      value={item.stopPrice || ''}
                      onChange={(e) => handleUpdateItemNotes(s.symbol, item.notes || '', item.targetPrice, parseFloat(e.target.value) || undefined)}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-rose-300 focus:outline-none focus:border-rose-500 text-xs mt-0.5"
                    />
                  </div>
                </div>

                {/* Personal Notes */}
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[10px] text-slate-500 block mb-1 flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-amber-400" />
                    Kişisel Not:
                  </span>
                  <input
                    type="text"
                    placeholder="Örn: 260 TL direnç kırılımında pozisyon aç..."
                    value={item.notes || ''}
                    onChange={(e) => handleUpdateItemNotes(s.symbol, e.target.value, item.targetPrice, item.stopPrice)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-sans"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Comparison Matrix Table */
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Sembol</th>
                  <th className="py-2.5 px-3">Son Fiyat</th>
                  <th className="py-2.5 px-3">Değişim %</th>
                  <th className="py-2.5 px-3">Hacim (TL)</th>
                  <th className="py-2.5 px-3">F/K</th>
                  <th className="py-2.5 px-3">PD/DD</th>
                  <th className="py-2.5 px-3">Hedef Seviye</th>
                  <th className="py-2.5 px-3">Stop Seviyesi</th>
                  <th className="py-2.5 px-3">Not</th>
                  <th className="py-2.5 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {currentFolderStocks.map(({ stock: s, item }) => {
                  const isPos = s.changePercent >= 0;
                  return (
                    <tr key={s.symbol} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                        {s.symbol}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-100">
                        {s.lastPrice.toFixed(2)} TL
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={isPos ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPos ? '+' : ''}{s.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">
                        {(s.volumeTL / 1e6).toFixed(1)}M TL
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {s.pe ? s.pe.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {s.pb ? s.pb.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-emerald-400">
                        {item.targetPrice ? `${item.targetPrice.toFixed(2)} TL` : '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-rose-400">
                        {item.stopPrice ? `${item.stopPrice.toFixed(2)} TL` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 truncate max-w-[150px]">
                        {item.notes || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onSelectStock(s.symbol)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium"
                        >
                          İncele
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
