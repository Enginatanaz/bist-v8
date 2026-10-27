import React, { useState, useMemo, useRef, useEffect } from 'react';
import { OHLCV, SupportResistanceZone, AutoChannel, UserDrawing } from '../types';
import {
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  detectAutoChannels
} from '../../server/indicators/technicalEngine';
import {
  TrendingUp,
  Minus,
  Edit3,
  Trash2,
  RotateCcw,
  Layers,
  Save,
  Check,
  ChevronDown
} from 'lucide-react';

interface FinancialChartProps {
  candles: OHLCV[];
  symbol: string;
  zones?: SupportResistanceZone[];
  autoChannels?: AutoChannel[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  isLoading?: boolean;
}

type DrawingMode = 'NONE' | 'TREND_LINE' | 'HORIZONTAL_LINE' | 'SUPPORT_LINE' | 'RESISTANCE_LINE' | 'PARALLEL_CHANNEL';

export const FinancialChart: React.FC<FinancialChartProps> = ({
  candles,
  symbol,
  zones = [],
  autoChannels: propChannels,
  timeframe,
  onTimeframeChange,
  isLoading = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // EMA Overlay toggles (SMA tamamen kaldırıldı, EMA kullanılıyor)
  const [showEma5, setShowEma5] = useState(true);
  const [showEma20, setShowEma20] = useState(true);
  const [showEma50, setShowEma50] = useState(false);
  const [showEma200, setShowEma200] = useState(false);
  const [showBollinger, setShowBollinger] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showAutoChannels, setShowAutoChannels] = useState(true);

  // User Drawing Mode & State (Madde 9)
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('NONE');
  const [userDrawings, setUserDrawings] = useState<UserDrawing[]>([]);
  const [drawingInProgress, setDrawingInProgress] = useState<{ x: number; y: number; price: number; dateStr: string }[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Subplot selection: 'VOLUME' | 'RSI' | 'MACD'
  const [activeSubplot, setActiveSubplot] = useState<'VOLUME' | 'RSI' | 'MACD'>('VOLUME');

  // Visible window range (Zooming/panning)
  const [zoomLevel, setZoomLevel] = useState<number>(80);

  // Load user drawings from localStorage per symbol
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`bist_drawings_${symbol}`);
      if (saved) {
        setUserDrawings(JSON.parse(saved));
      } else {
        setUserDrawings([]);
      }
    } catch {
      setUserDrawings([]);
    }
  }, [symbol]);

  // Save drawings helper
  const handleSaveDrawings = () => {
    try {
      localStorage.setItem(`bist_drawings_${symbol}`, JSON.stringify(userDrawings));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Çizimler kaydedilemedi:', err);
    }
  };

  const handleClearDrawings = () => {
    setUserDrawings([]);
    setDrawingInProgress([]);
    localStorage.removeItem(`bist_drawings_${symbol}`);
  };

  const handleUndoDrawing = () => {
    if (drawingInProgress.length > 0) {
      setDrawingInProgress([]);
      return;
    }
    const updated = userDrawings.slice(0, -1);
    setUserDrawings(updated);
    localStorage.setItem(`bist_drawings_${symbol}`, JSON.stringify(updated));
  };

  const handleDeleteDrawing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = userDrawings.filter(d => d.id !== id);
    setUserDrawings(updated);
    localStorage.setItem(`bist_drawings_${symbol}`, JSON.stringify(updated));
  };

  const visibleCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return candles.slice(-zoomLevel);
  }, [candles, zoomLevel]);

  // Canlı destek ve direnç renk doğrulaması için güncel fiyat referansı
  const currentChartPrice = useMemo(() => {
    if (visibleCandles.length > 0) return visibleCandles[visibleCandles.length - 1].close;
    if (candles && candles.length > 0) return candles[candles.length - 1].close;
    return null;
  }, [visibleCandles, candles]);

  // Pre-calculate indicators for visible slice using EMA
  const { closes, highs, lows, volumes } = useMemo(() => {
    return {
      closes: candles.map(c => c.close),
      highs: candles.map(c => c.high),
      lows: candles.map(c => c.low),
      volumes: candles.map(c => c.volume)
    };
  }, [candles]);

  const ema5Series = useMemo(() => calculateEMA(closes, 5).slice(-zoomLevel), [closes, zoomLevel]);
  const ema20Series = useMemo(() => calculateEMA(closes, 20).slice(-zoomLevel), [closes, zoomLevel]);
  const ema50Series = useMemo(() => calculateEMA(closes, 50).slice(-zoomLevel), [closes, zoomLevel]);
  const ema200Series = useMemo(() => calculateEMA(closes, 200).slice(-zoomLevel), [closes, zoomLevel]);

  const bbSeries = useMemo(() => {
    const bb = calculateBollingerBands(closes, 20, 2);
    return {
      upper: bb.upper.slice(-zoomLevel),
      middle: bb.middle.slice(-zoomLevel),
      lower: bb.lower.slice(-zoomLevel)
    };
  }, [closes, zoomLevel]);

  const rsiSeries = useMemo(() => calculateRSI(closes, 14).slice(-zoomLevel), [closes, zoomLevel]);
  const macdSeries = useMemo(() => {
    const m = calculateMACD(closes);
    return {
      macdLine: m.macdLine.slice(-zoomLevel),
      signalLine: m.signalLine.slice(-zoomLevel),
      histogram: m.histogram.slice(-zoomLevel)
    };
  }, [closes, zoomLevel]);

  const volumeEmaSeries = useMemo(() => calculateEMA(volumes, 20).slice(-zoomLevel), [volumes, zoomLevel]);

  // Auto channels
  const channels = useMemo(() => {
    if (propChannels && propChannels.length > 0) return propChannels;
    return detectAutoChannels(visibleCandles);
  }, [propChannels, visibleCandles]);

  // Coordinate math
  const chartWidth = 900;
  const mainHeight = 350;
  const subHeight = 110;
  const paddingRight = 65;
  const paddingLeft = 15;
  const paddingTop = 20;
  const paddingBottom = 25;

  const plotWidth = chartWidth - paddingLeft - paddingRight;

  // Price Scale Bounds
  const { minPrice, maxPrice } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 100 };
    let min = Math.min(...visibleCandles.map(c => c.low));
    let max = Math.max(...visibleCandles.map(c => c.high));

    if (showBollinger) {
      bbSeries.lower.forEach(v => { if (v !== null && v < min) min = v; });
      bbSeries.upper.forEach(v => { if (v !== null && v > max) max = v; });
    }

    // Yakındaki aktif destek ve direnç seviyelerini (<%10 mesafe) fiyat ölçeğine dahil et
    // Böylece grafikte çizilen çizgiler pencere dışına taşmaz, görünür kalır
    if (showZones && zones && zones.length > 0) {
      const curPrice = visibleCandles[visibleCandles.length - 1]?.close || ((min + max) / 2);
      zones.forEach(z => {
        const p = z.price ?? z.pivotPrice;
        if (p && Math.abs(p - curPrice) / (curPrice || 1) <= 0.10) {
          if (p < min) min = p;
          if (p > max) max = p;
        }
      });
    }

    const pad = (max - min) * 0.06 || 1;
    return { minPrice: min - pad, maxPrice: max + pad };
  }, [visibleCandles, showBollinger, bbSeries, showZones, zones]);

  const priceToY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    return paddingTop + (1 - (price - minPrice) / range) * (mainHeight - paddingTop - paddingBottom);
  };

  const yToPrice = (y: number) => {
    const plotHeight = mainHeight - paddingTop - paddingBottom;
    const ratio = 1 - (y - paddingTop) / plotHeight;
    return minPrice + ratio * (maxPrice - minPrice);
  };

  const candleCount = visibleCandles.length;
  const candleStep = plotWidth / (candleCount || 1);
  const candleWidth = Math.max(2, Math.min(14, candleStep * 0.72));

  const getCandleX = (idx: number) => paddingLeft + idx * candleStep + candleStep / 2;

  // Mouse hover event
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || candleCount === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relativeX = (x / rect.width) * chartWidth - paddingLeft;
    const idx = Math.floor(relativeX / candleStep);
    if (idx >= 0 && idx < candleCount) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Canvas Click Handler for User Drawings (Madde 9)
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawingMode === 'NONE' || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * chartWidth;
    const clickY = ((e.clientY - rect.top) / rect.height) * (mainHeight + subHeight);

    if (clickY > mainHeight) return; // Only draw on main price canvas

    const relativeX = clickX - paddingLeft;
    const idx = Math.max(0, Math.min(candleCount - 1, Math.floor(relativeX / candleStep)));
    const candle = visibleCandles[idx];
    const price = Number(yToPrice(clickY).toFixed(2));
    const dateStr = candle ? candle.dateStr : new Date().toISOString().split('T')[0];

    const currentPoint = { x: clickX, y: clickY, price, dateStr };

    if (drawingMode === 'HORIZONTAL_LINE' || drawingMode === 'SUPPORT_LINE' || drawingMode === 'RESISTANCE_LINE') {
      const color = drawingMode === 'SUPPORT_LINE' ? '#ef4444' : drawingMode === 'RESISTANCE_LINE' ? '#10b981' : '#38bdf8';
      const newDrawing: UserDrawing = {
        id: `draw_${Date.now()}`,
        symbol,
        type: drawingMode,
        color,
        points: [currentPoint],
        createdAt: new Date().toISOString()
      };
      const updated = [...userDrawings, newDrawing];
      setUserDrawings(updated);
      localStorage.setItem(`bist_drawings_${symbol}`, JSON.stringify(updated));
    } else if (drawingMode === 'TREND_LINE' || drawingMode === 'PARALLEL_CHANNEL') {
      if (drawingInProgress.length === 0) {
        setDrawingInProgress([currentPoint]);
      } else {
        const firstPoint = drawingInProgress[0];
        const color = drawingMode === 'PARALLEL_CHANNEL' ? '#a855f7' : '#f59e0b';
        const newDrawing: UserDrawing = {
          id: `draw_${Date.now()}`,
          symbol,
          type: drawingMode,
          color,
          points: [firstPoint, currentPoint],
          createdAt: new Date().toISOString()
        };
        const updated = [...userDrawings, newDrawing];
        setUserDrawings(updated);
        localStorage.setItem(`bist_drawings_${symbol}`, JSON.stringify(updated));
        setDrawingInProgress([]);
      }
    }
  };

  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex]
    ? visibleCandles[hoverIndex]
    : visibleCandles[visibleCandles.length - 1];

  const candleChangePct = activeCandle && activeCandle.open > 0
    ? Number((((activeCandle.close - activeCandle.open) / activeCandle.open) * 100).toFixed(2))
    : 0;

  // Subplot scaling
  const maxVol = useMemo(() => {
    return Math.max(...visibleCandles.map(c => c.volume), 1);
  }, [visibleCandles]);

  // Horizontal Grid Price lines
  const gridPrices = useMemo(() => {
    const range = maxPrice - minPrice;
    if (range <= 0) return [];
    const step = range / 5;
    return [0, 1, 2, 3, 4, 5].map(i => minPrice + i * step);
  }, [minPrice, maxPrice]);

  return (
    <div ref={containerRef} className="bg-slate-900 border border-slate-800 rounded-lg p-4 select-none">
      {/* Top Bar: Active Candle Stats & Timeframe Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        {/* Real-time OHLCV Bar Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <span className="font-bold text-slate-100 text-sm">{symbol}</span>
          <span className="text-slate-500 font-sans">{activeCandle?.dateStr || '-'}</span>
          {activeCandle && activeCandle.isClosed === false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-bold animate-pulse">
              AÇIK MUM
            </span>
          )}
          <span>A: <strong className="text-slate-200">{activeCandle?.open?.toFixed(2) || '-'}</strong></span>
          <span>Y: <strong className="text-emerald-400">{activeCandle?.high?.toFixed(2) || '-'}</strong></span>
          <span>D: <strong className="text-rose-400">{activeCandle?.low?.toFixed(2) || '-'}</strong></span>
          <span>K: <strong className={candleChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {activeCandle?.close?.toFixed(2) || '-'}
          </strong></span>
          <span>Fark: <strong className={candleChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {candleChangePct >= 0 ? `+${candleChangePct}%` : `${candleChangePct}%`}
          </strong></span>
          {activeCandle?.adjClose && (
            <span className="text-slate-400" title="Temettü ve sermaye artırımlarına göre düzeltilmiş kapanış">
              Düz. Kapanış: <strong className="text-cyan-400">{activeCandle.adjClose.toFixed(2)}</strong>
            </span>
          )}
          <span>Hacim: <strong className="text-slate-300">
            {activeCandle?.volume ? (activeCandle.volume / 1000).toFixed(0) + 'K' : '-'}
          </strong></span>
        </div>

        {/* Timeframe selector tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-xs font-medium">
          {[
            { id: '1h', label: '1S' },
            { id: '4h', label: '4S' },
            { id: '1d', label: 'Gün' },
            { id: '1w', label: 'Hafta' },
            { id: '1mo', label: 'Ay' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`px-2.5 py-1 rounded transition-colors ${
                timeframe === tf.id
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Control Bar: EMA Toggles, Auto Channels, Drawing Tools & Subplots */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2.5 text-xs text-slate-400 border-b border-slate-800/80 pb-2.5">
        {/* Indicator Toggles (EMA Tabanlı) */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200" title="Kısa Vadeli Trend Yönü">
            <input
              type="checkbox"
              checked={showEma5}
              onChange={e => setShowEma5(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span className="text-amber-400 font-semibold font-mono">EMA 5</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200" title="Ana Trend Göstergesi">
            <input
              type="checkbox"
              checked={showEma20}
              onChange={e => setShowEma20(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-cyan-400 font-semibold font-mono">EMA 20</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showEma50}
              onChange={e => setShowEma50(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
            />
            <span className="text-purple-400 font-mono">EMA 50</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showEma200}
              onChange={e => setShowEma200(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-pink-500 focus:ring-0"
            />
            <span className="text-pink-400 font-mono">EMA 200</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showBollinger}
              onChange={e => setShowBollinger(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
            />
            <span className="text-emerald-400">Bollinger (EMA20)</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showZones}
              onChange={e => setShowZones(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
            />
            <span className="text-slate-300">
              <strong className="text-rose-400 font-medium">Destek (Kırmızı)</strong> / <strong className="text-emerald-400 font-medium">Direnç (Yeşil)</strong>
            </span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer hover:text-slate-200">
            <input
              type="checkbox"
              checked={showAutoChannels}
              onChange={e => setShowAutoChannels(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
            />
            <span className="text-purple-400">Otomatik Kanallar</span>
          </label>
        </div>

        {/* Subplot selector tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveSubplot('VOLUME')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              activeSubplot === 'VOLUME' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hacim (EMA 20)
          </button>
          <button
            onClick={() => setActiveSubplot('RSI')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              activeSubplot === 'RSI' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RSI (14)
          </button>
          <button
            onClick={() => setActiveSubplot('MACD')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              activeSubplot === 'MACD' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            MACD
          </button>
        </div>
      </div>

      {/* User Interactive Drawing Toolbar (Madde 9: Kullanıcı Çizimleri) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            Çizim Aracı:
          </span>
          {[
            { id: 'NONE', label: 'İşaretçi (Kapalı)' },
            { id: 'TREND_LINE', label: 'Trend Çizgisi' },
            { id: 'HORIZONTAL_LINE', label: 'Yatay Çizgi' },
            { id: 'SUPPORT_LINE', label: 'Destek (Kırmızı)' },
            { id: 'RESISTANCE_LINE', label: 'Direnç (Yeşil)' },
            { id: 'PARALLEL_CHANNEL', label: 'Kanal Çizgisi' }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setDrawingMode(tool.id as DrawingMode);
                setDrawingInProgress([]);
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                drawingMode === tool.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tool.label}
            </button>
          ))}
          {drawingInProgress.length > 0 && (
            <span className="text-[10px] text-amber-400 font-mono animate-pulse">
              1. Nokta seçildi. Bitiş için 2. noktaya tıklayın...
            </span>
          )}
        </div>

        {/* Drawing Actions: Undo, Clear, Save */}
        <div className="flex items-center gap-1.5">
          {userDrawings.length > 0 && (
            <button
              onClick={handleUndoDrawing}
              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Son çizimi geri al"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {userDrawings.length > 0 && (
            <button
              onClick={handleClearDrawings}
              className="p-1 rounded bg-slate-950 border border-slate-800 text-rose-400 hover:text-rose-300 transition-colors"
              title="Tüm kullanıcı çizimlerini temizle"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleSaveDrawings}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            {saveSuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Save className="w-3 h-3" />}
            {saveSuccess ? 'Kaydedildi' : `Kaydet (${userDrawings.length})`}
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden mt-2 bg-slate-950 rounded border border-slate-800/80">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center z-20">
            <div className="text-xs text-emerald-400 font-mono animate-pulse">Grafik verisi yükleniyor...</div>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartWidth} ${mainHeight + subHeight}`}
          className={`w-full h-auto block ${drawingMode !== 'NONE' ? 'cursor-pencil' : 'cursor-crosshair'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleCanvasClick}
        >
          <defs>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="channelGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* MAIN PRICE PANEL */}
          {/* Background grid lines */}
          {gridPrices.map((price, i) => {
            const y = priceToY(price);
            return (
              <g key={`grid_${i}`}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth - paddingRight + 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  textAnchor="start"
                >
                  {price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Support / Resistance Zones Overlay (KESİN KURAL: Destekler Kırmızı #ef4444, Dirençler Yeşil #10b981) */}
          {showZones && zones.map((zone, idx) => {
            const levelPrice = zone.price ?? zone.pivotPrice;
            const yMid = priceToY(levelPrice);
            if (yMid < paddingTop || yMid > mainHeight - paddingBottom) return null;

            // KESİN RENK KURALI (FAZ 5 / GÖREV):
            // Sınıflandırma: Destekler (Pivot Low kaynaklı) -> KIRMIZI (#ef4444)
            // Sınıflandırma: Dirençler (Pivot High kaynaklı) -> YEŞİL (#10b981)
            // Renk güncel fiyatın konumuna göre değil, seviyenin gerçek türüne (type) göre belirlenir.
            const isSupp = (zone.type && (zone.type.toUpperCase() === 'SUPPORT' || zone.type.toLowerCase() === 'support')) || zone.colorHex === '#ef4444';

            const strokeColor = isSupp ? '#ef4444' : '#10b981';
            const badgeBg = isSupp ? '#7f1d1d' : '#064e3b';
            const badgeBorder = isSupp ? '#dc2626' : '#059669';
            const textColor = isSupp ? '#fecaca' : '#a7f3d0';
            const isBroken = zone.status === 'broken' || zone.status === 'BROKEN';
            const isRetest = zone.status === 'retest';
            const labelPrefix = isSupp ? 'D' : 'R';

            // Fiyat tolerans koridoru hesaplama (priceLow - priceHigh veya zoneLow - zoneHigh)
            const lowVal = zone.zoneLow ?? zone.priceLow;
            const highVal = zone.zoneHigh ?? zone.priceHigh;
            let bandTop: number | null = null;
            let bandHeight: number | null = null;
            if (lowVal && highVal && lowVal !== highVal) {
              const yHigh = priceToY(Math.max(lowVal, highVal));
              const yLow = priceToY(Math.min(lowVal, highVal));
              bandTop = Math.min(yHigh, yLow);
              bandHeight = Math.max(3, Math.abs(yLow - yHigh));
            }

            return (
              <g key={`zone_${idx}`}>
                <title>{`${isSupp ? 'DESTEK (Kırmızı)' : 'DİRENÇ (Yeşil)'}: ${levelPrice.toFixed(2)} TL | Durum: ${zone.status} | Güç Skoru: ${zone.strengthScore}/100 | Temas: ${zone.touchCount}`}</title>
                {/* Koridor Gölgesi */}
                {bandTop !== null && bandHeight !== null && (
                  <rect
                    x={paddingLeft}
                    y={bandTop}
                    width={chartWidth - paddingLeft - paddingRight}
                    height={bandHeight}
                    fill={strokeColor}
                    opacity="0.08"
                    pointerEvents="none"
                  />
                )}
                {/* Ana Destek/Direnç Fiyat Çizgisi */}
                <line
                  x1={paddingLeft}
                  y1={yMid}
                  x2={chartWidth - paddingRight}
                  y2={yMid}
                  stroke={strokeColor}
                  strokeWidth={zone.strengthScore > 75 ? '1.8' : '1.3'}
                  strokeDasharray={isBroken ? '3 3' : isRetest ? '5 2' : zone.strengthScore > 65 ? 'none' : '4 3'}
                  opacity={isBroken ? 0.45 : 0.85}
                />
                {/* Fiyat Eksen Etiketi Rozeti */}
                <rect
                  x={chartWidth - paddingRight + 3}
                  y={yMid - 7.5}
                  width="62"
                  height="15"
                  fill={badgeBg}
                  stroke={badgeBorder}
                  strokeWidth="0.8"
                  rx="2"
                />
                <text
                  x={chartWidth - paddingRight + 5}
                  y={yMid + 3.5}
                  fill={textColor}
                  fontSize="8.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="700"
                >
                  {labelPrefix}{isBroken ? ' (K)' : isRetest ? ' (R)' : ''}: {levelPrice.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Otomatik Kanallar (Madde 9) */}
          {showAutoChannels && channels.map((ch, idx) => {
            const yStartUpper = priceToY(ch.upperPriceNow - ch.slope * (candleCount - 1));
            const yEndUpper = priceToY(ch.upperPriceNow);
            const yStartLower = priceToY(ch.lowerPriceNow - ch.slope * (candleCount - 1));
            const yEndLower = priceToY(ch.lowerPriceNow);
            const xStart = getCandleX(0);
            const xEnd = getCandleX(candleCount - 1);

            return (
              <g key={`autoch_${idx}`}>
                {/* Shaded Channel Corridor */}
                <polygon
                  points={`${xStart},${yStartUpper} ${xEnd},${yEndUpper} ${xEnd},${yEndLower} ${xStart},${yStartLower}`}
                  fill="url(#channelGradient)"
                />
                {/* Upper Channel Boundary Line */}
                <line
                  x1={xStart}
                  y1={yStartUpper}
                  x2={xEnd}
                  y2={yEndUpper}
                  stroke="#a855f7"
                  strokeWidth="1.4"
                  strokeDasharray="4 2"
                />
                {/* Lower Channel Boundary Line */}
                <line
                  x1={xStart}
                  y1={yStartLower}
                  x2={xEnd}
                  y2={yEndLower}
                  stroke="#a855f7"
                  strokeWidth="1.4"
                  strokeDasharray="4 2"
                />
              </g>
            );
          })}

          {/* User Drawings Layer (Madde 9: Kullanıcı Çizimleri) */}
          {userDrawings.map((draw) => {
            if (draw.type === 'HORIZONTAL_LINE' || draw.type === 'SUPPORT_LINE' || draw.type === 'RESISTANCE_LINE') {
              const pt = draw.points[0];
              const y = priceToY(pt.price);
              return (
                <g key={draw.id} className="group cursor-pointer">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke={draw.color}
                    strokeWidth="1.8"
                    strokeDasharray={draw.type === 'HORIZONTAL_LINE' ? '5 3' : 'none'}
                  />
                  <rect
                    x={paddingLeft + 4}
                    y={y - 8}
                    width="62"
                    height="16"
                    fill="#0f172a"
                    stroke={draw.color}
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x={paddingLeft + 8}
                    y={y + 4}
                    fill={draw.color}
                    fontSize="9"
                    fontFamily="JetBrains Mono"
                    fontWeight="700"
                  >
                    {draw.points[0].price.toFixed(2)} TL
                  </text>
                </g>
              );
            } else if (draw.type === 'TREND_LINE' || draw.type === 'PARALLEL_CHANNEL') {
              if (draw.points.length < 2) return null;
              const pt1 = draw.points[0];
              const pt2 = draw.points[1];
              const y1 = priceToY(pt1.price);
              const y2 = priceToY(pt2.price);
              const x1 = pt1.x || getCandleX(0);
              const x2 = pt2.x || getCandleX(candleCount - 1);

              return (
                <g key={draw.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={draw.color}
                    strokeWidth="2"
                  />
                  {draw.type === 'PARALLEL_CHANNEL' && (
                    <line
                      x1={x1}
                      y1={y1 + 25}
                      x2={x2}
                      y2={y2 + 25}
                      stroke={draw.color}
                      strokeWidth="1.6"
                      strokeDasharray="4 2"
                      opacity={0.8}
                    />
                  )}
                </g>
              );
            }
            return null;
          })}

          {/* Current In-Progress Drawing Preview */}
          {drawingInProgress.length === 1 && (
            <circle
              cx={drawingInProgress[0].x}
              cy={drawingInProgress[0].y}
              r="4"
              fill="#38bdf8"
              className="animate-ping"
            />
          )}

          {/* Bollinger Bands Fill */}
          {showBollinger && (
            <path
              d={(() => {
                let dUpper = '';
                let dLower = '';
                for (let i = 0; i < candleCount; i++) {
                  const u = bbSeries.upper[i];
                  const l = bbSeries.lower[i];
                  if (u !== null && l !== null) {
                    const x = getCandleX(i);
                    const yU = priceToY(u);
                    const yL = priceToY(l);
                    if (!dUpper) dUpper = `M ${x} ${yU}`;
                    else dUpper += ` L ${x} ${yU}`;
                    if (!dLower) dLower = `L ${x} ${yL}`;
                    else dLower = `L ${x} ${yL} ` + dLower;
                  }
                }
                return dUpper ? `${dUpper} ${dLower} Z` : '';
              })()}
              fill="url(#bbGradient)"
            />
          )}

          {/* Bollinger Upper, Middle (EMA20), & Lower Lines */}
          {showBollinger && (
            <>
              <path
                d={bbSeries.upper.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity={0.5}
              />
              <path
                d={bbSeries.middle.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity={0.6}
              />
              <path
                d={bbSeries.lower.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity={0.5}
              />
            </>
          )}

          {/* EMA Curves (SMA'lar kaldırıldı) */}
          {showEma5 && (
            <path
              d={ema5Series.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.6"
            />
          )}
          {showEma20 && (
            <path
              d={ema20Series.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="1.6"
            />
          )}
          {showEma50 && (
            <path
              d={ema50Series.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.4"
            />
          )}
          {showEma200 && (
            <path
              d={ema200Series.map((val, i) => val !== null ? `${i === 0 ? 'M' : 'L'} ${getCandleX(i)} ${priceToY(val)}` : '').filter(Boolean).join(' ')}
              fill="none"
              stroke="#ec4899"
              strokeWidth="1.4"
            />
          )}

          {/* Candlesticks */}
          {visibleCandles.map((c, i) => {
            const x = getCandleX(i);
            const isBullish = c.close >= c.open;
            const candleColor = isBullish ? '#10b981' : '#f43f5e';

            const yHigh = priceToY(c.high);
            const yLow = priceToY(c.low);
            const yOpen = priceToY(c.open);
            const yClose = priceToY(c.close);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));

            return (
              <g key={`candle_${i}`}>
                {/* High/Low wick */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={candleColor}
                  strokeWidth="1.2"
                />
                {/* Real Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={candleColor}
                  stroke={candleColor}
                  strokeWidth="0.5"
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* Separator between main and subplot */}
          <line
            x1={paddingLeft}
            y1={mainHeight}
            x2={chartWidth - paddingRight}
            y2={mainHeight}
            stroke="#334155"
            strokeWidth="1"
          />

          {/* SUBPLOT PANEL */}
          {activeSubplot === 'VOLUME' && (
            <g transform={`translate(0, ${mainHeight})`}>
              <text x={paddingLeft + 4} y="14" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
                HACİM (20 GÜNLÜK EMA HACİM)
              </text>
              {visibleCandles.map((c, i) => {
                const x = getCandleX(i);
                const isBull = c.close >= c.open;
                const barHeight = (c.volume / maxVol) * (subHeight - 25);
                const y = subHeight - barHeight;

                return (
                  <rect
                    key={`vol_${i}`}
                    x={x - candleWidth / 2}
                    y={y}
                    width={candleWidth}
                    height={Math.max(1, barHeight)}
                    fill={isBull ? '#065f46' : '#881337'}
                    opacity={0.8}
                  />
                );
              })}
              {/* Volume EMA line */}
              <path
                d={volumeEmaSeries.map((v, i) => {
                  if (v === null) return '';
                  const x = getCandleX(i);
                  const y = subHeight - (v / maxVol) * (subHeight - 25);
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).filter(Boolean).join(' ')}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1.2"
              />
            </g>
          )}

          {activeSubplot === 'RSI' && (
            <g transform={`translate(0, ${mainHeight})`}>
              {/* 70 & 30 Lines */}
              <line
                x1={paddingLeft}
                y1={subHeight * 0.3}
                x2={chartWidth - paddingRight}
                y2={subHeight * 0.3}
                stroke="#f43f5e"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity={0.6}
              />
              <text x={chartWidth - paddingRight + 4} y={subHeight * 0.3 + 3} fill="#f43f5e" fontSize="9" fontFamily="JetBrains Mono">70</text>

              <line
                x1={paddingLeft}
                y1={subHeight * 0.7}
                x2={chartWidth - paddingRight}
                y2={subHeight * 0.7}
                stroke="#10b981"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity={0.6}
              />
              <text x={chartWidth - paddingRight + 4} y={subHeight * 0.7 + 3} fill="#10b981" fontSize="9" fontFamily="JetBrains Mono">30</text>

              {/* RSI Curve */}
              <path
                d={rsiSeries.map((v, i) => {
                  if (v === null) return '';
                  const x = getCandleX(i);
                  const y = (1 - v / 100) * subHeight;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).filter(Boolean).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
              <text x={paddingLeft + 4} y="14" fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono">
                RSI 14: {rsiSeries[rsiSeries.length - 1] || '-'}
              </text>
            </g>
          )}

          {activeSubplot === 'MACD' && (
            <g transform={`translate(0, ${mainHeight})`}>
              <line
                x1={paddingLeft}
                y1={subHeight / 2}
                x2={chartWidth - paddingRight}
                y2={subHeight / 2}
                stroke="#475569"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {/* MACD Histogram */}
              {macdSeries.histogram.map((h, i) => {
                if (h === null) return null;
                const x = getCandleX(i);
                const zeroY = subHeight / 2;
                const scaledH = Math.max(-subHeight / 2 + 5, Math.min(subHeight / 2 - 5, h * 12));
                const y = scaledH > 0 ? zeroY - scaledH : zeroY;

                return (
                  <rect
                    key={`hist_${i}`}
                    x={x - candleWidth / 2}
                    y={y}
                    width={candleWidth}
                    height={Math.max(1, Math.abs(scaledH))}
                    fill={scaledH >= 0 ? '#10b981' : '#f43f5e'}
                    opacity={0.75}
                  />
                );
              })}
              {/* MACD Line */}
              <path
                d={macdSeries.macdLine.map((v, i) => {
                  if (v === null) return '';
                  const x = getCandleX(i);
                  const y = subHeight / 2 - v * 12;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).filter(Boolean).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.4"
              />
              {/* Signal Line */}
              <path
                d={macdSeries.signalLine.map((v, i) => {
                  if (v === null) return '';
                  const x = getCandleX(i);
                  const y = subHeight / 2 - v * 12;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).filter(Boolean).join(' ')}
                fill="none"
                stroke="#f97316"
                strokeWidth="1.2"
              />
              <text x={paddingLeft + 4} y="14" fill="#94a3b8" fontSize="9" fontFamily="JetBrains Mono">
                MACD (12, 26, 9)
              </text>
            </g>
          )}

          {/* CROSSHAIR TRACKER */}
          {hoverIndex !== null && visibleCandles[hoverIndex] && (
            <g>
              <line
                x1={getCandleX(hoverIndex)}
                y1={paddingTop}
                x2={getCandleX(hoverIndex)}
                y2={mainHeight + subHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={paddingLeft}
                y1={priceToY(visibleCandles[hoverIndex].close)}
                x2={chartWidth - paddingRight}
                y2={priceToY(visibleCandles[hoverIndex].close)}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <rect
                x={chartWidth - paddingRight + 2}
                y={priceToY(visibleCandles[hoverIndex].close) - 8}
                width="60"
                height="16"
                fill="#0284c7"
                rx="2"
              />
              <text
                x={chartWidth - paddingRight + 5}
                y={priceToY(visibleCandles[hoverIndex].close) + 3}
                fill="#ffffff"
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="700"
              >
                {visibleCandles[hoverIndex].close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom disclaimer bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-slate-500 font-mono">
        <span>Kapsam: BIST Pay Piyasası · Son Güncelleme: {candles[candles.length - 1]?.dateStr || '-'}</span>
        <span>Destekler: Kırmızı (#ef4444) · Dirençler: Yeşil (#10b981) · EMA20 Ana Trend</span>
      </div>
    </div>
  );
};
