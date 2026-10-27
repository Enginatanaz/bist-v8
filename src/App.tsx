import React, { useState, useEffect } from 'react';
import { BISTStock, MarketStatus, KAPDisclosure } from './types';
import { apiClient } from './services/apiClient';
import { OverviewView } from './features/overview/OverviewView';
import { ScreenerView } from './features/screener/ScreenerView';
import { StockDetailView } from './features/detail/StockDetailView';
import { TechnicalAnalysisView } from './features/technical/TechnicalAnalysisView';
import { ScenarioCenterView } from './features/scenarios/ScenarioCenterView';
import { BacktestLabView } from './features/backtest/BacktestLabView';
import { WatchlistView } from './features/watchlist/WatchlistView';
import { AlertCenterView } from './features/alerts/AlertCenterView';
import { DisclosuresView } from './features/disclosures/DisclosuresView';
import { DataHealthView } from './features/health/DataHealthView';
import { SettingsView } from './features/settings/SettingsView';
import {
  TrendingUp,
  Filter,
  BarChart2,
  Layers,
  Clock,
  ShieldCheck,
  Bookmark,
  Bell,
  Settings,
  Menu,
  X,
  Zap,
  Activity,
  Sun,
  Moon,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('THYAO');
  const [stocks, setStocks] = useState<BISTStock[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
  const [disclosures, setDisclosures] = useState<KAPDisclosure[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Theme state (Dark vs Light terminal theme)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('bist_theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    try {
      localStorage.setItem('bist_theme', theme);
    } catch {}
  }, [theme]);

  // Watchlist persisted in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bist_watchlist');
      return saved ? JSON.parse(saved) : ['THYAO', 'GARAN', 'ASELS', 'TUPRS', 'EREGL'];
    } catch {
      return ['THYAO', 'GARAN', 'ASELS', 'TUPRS', 'EREGL'];
    }
  });

  const toggleWatchlist = (sym: string) => {
    setWatchlist(prev => {
      const next = prev.includes(sym) ? prev.filter(s => s !== sym) : [...prev, sym];
      try {
        localStorage.setItem('bist_watchlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSelectStock = (sym: string) => {
    setSelectedSymbol(sym);
    if (activeTab === 'overview' || activeTab === 'screener') {
      setActiveTab('detail');
    }
  };

  const loadData = async () => {
    setConnectionError(null);
    try {
      const [stockList, mStatus, kapList] = await Promise.all([
        apiClient.getStocks(),
        apiClient.getMarketStatus(),
        apiClient.getDisclosures()
      ]);
      setStocks(stockList);
      setMarketStatus(mStatus);
      setDisclosures(kapList);
    } catch (err: any) {
      setConnectionError(err?.message || 'Piyasa veri sağlayıcısına bağlanılamadı.');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000); // 1-minute refresh
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: Activity },
    { id: 'screener', label: 'Hisse Tarayıcı', icon: Filter },
    { id: 'detail', label: 'Hisse Detayı', icon: BarChart2 },
    { id: 'technical', label: 'Teknik Analiz', icon: TrendingUp },
    { id: 'scenarios', label: 'Senaryo Merkezi', icon: Layers },
    { id: 'backtesting', label: 'Backtest', icon: Zap },
    { id: 'watchlist', label: 'İzleme Listem', icon: Bookmark },
    { id: 'alerts', label: 'Alarmlar', icon: Bell },
    { id: 'disclosures', label: 'KAP Bildirimleri', icon: ShieldCheck },
    { id: 'health', label: 'Veri Sağlığı', icon: Clock },
    { id: 'settings', label: 'Ayarlar', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar Contract (3 Zones: Brand Title — Nav Links — 1 Primary Action) */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950 font-mono text-sm shadow-sm group-hover:scale-105 transition-transform">
              BIST
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-100 block">
                BIST Akıllı Analiz Merkezi
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">
                Borsa İstanbul Nicel Tarama ve Strateji Platformu
              </span>
            </div>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-slate-400 overflow-x-auto py-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                      : 'hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action, Theme Toggle & Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Market Clock & Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${marketStatus?.isOpen ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span>{marketStatus?.exchangeLocalTime || '10:00 UTC+3'}</span>
              <span className="text-slate-600">·</span>
              <span className="text-[11px] text-amber-400">15 Dk Gecikmeli</span>
            </div>

            <button
              onClick={() => setActiveTab('screener')}
              className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Hızlı Tarama
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-100 bg-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-medium flex items-center gap-2 ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Connection Error Banner (Rule 1 & Rule 1.4: Dürüst ve boş ekran) */}
      {connectionError && (
        <div className="bg-rose-950/80 border-b border-rose-900 px-4 py-3 text-xs text-rose-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>Piyasa Veri Kaynağı Bağlantı Uyarısı:</strong> {connectionError} Kural 1 gereğince sahte veriye otomatik geçilmemektedir.
              </span>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 font-bold rounded flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yeniden Bağlan
            </button>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {isInitialLoading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-16 text-center text-xs text-emerald-400 font-mono animate-pulse">
            Borsa İstanbul veri motoru başlatılıyor ve 500+ BIST pay senedi eşitleniyor...
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewView
                stocks={stocks}
                marketStatus={marketStatus}
                disclosures={disclosures}
                onSelectStock={handleSelectStock}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'screener' && (
              <ScreenerView
                onSelectStock={handleSelectStock}
                onAddToWatchlist={toggleWatchlist}
              />
            )}

            {activeTab === 'detail' && (
              <StockDetailView
                symbol={selectedSymbol}
                stocks={stocks}
                onSelectStock={setSelectedSymbol}
                onNavigateTab={setActiveTab}
                isWatchlisted={watchlist.includes(selectedSymbol)}
                onToggleWatchlist={toggleWatchlist}
              />
            )}

            {activeTab === 'technical' && (
              <TechnicalAnalysisView
                symbol={selectedSymbol}
                stocks={stocks}
                onSelectStock={setSelectedSymbol}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'scenarios' && (
              <ScenarioCenterView
                symbol={selectedSymbol}
                stocks={stocks}
                onSelectStock={setSelectedSymbol}
                onNavigateTab={setActiveTab}
              />
            )}

            {activeTab === 'backtesting' && (
              <BacktestLabView
                initialSymbol={selectedSymbol}
                stocks={stocks}
                onSelectStock={setSelectedSymbol}
              />
            )}

            {activeTab === 'watchlist' && (
              <WatchlistView
                watchlist={watchlist}
                stocks={stocks}
                onSelectStock={handleSelectStock}
                onRemoveFromWatchlist={toggleWatchlist}
                onAddToWatchlist={toggleWatchlist}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertCenterView
                stocks={stocks}
                onSelectStock={handleSelectStock}
              />
            )}

            {activeTab === 'disclosures' && (
              <DisclosuresView onSelectStock={handleSelectStock} />
            )}

            {activeTab === 'health' && (
              <DataHealthView />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}
          </>
        )}
      </main>

      {/* Quiet Financial Terminal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>BIST Akıllı Analiz Merkezi © 2026</span>
            <span>·</span>
            <span>Veri Gecikmesi: 15 Dakika (BIST Pay Piyasası)</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Deterministik Matematik Motoru v2.4</span>
            <span>·</span>
            <button onClick={() => setActiveTab('health')} className="hover:text-slate-300 underline">
              Veri Envanteri &amp; Testler
            </button>
            <span>·</span>
            <button onClick={() => setActiveTab('settings')} className="hover:text-slate-300 underline">
              Sağlayıcı Yapılandırması
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
