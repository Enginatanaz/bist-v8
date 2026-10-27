import React, { useState, useEffect, useRef } from 'react';
import {
  ScreenerStockResult,
  ScreenerProfile,
  ScreenerScheduleConfig,
  CustomIndicatorRule,
  ExcludedStockReason,
  ScreenerTelemetry,
  RelativeStrengthScreenerItem,
  ScreenerCategory,
  MarketRegimeReport,
  ResistanceBreakoutItem,
  NearSupportItem,
  BuySignalRatioItem,
  PatternBacktestSummary,
  ChartPattern
} from '../../types';
import { apiClient } from '../../services/apiClient';
import { BreakoutScoreModal } from './components/BreakoutScoreModal';
import { SignalAuditModal } from './components/SignalAuditModal';
import { PatternBacktestModal } from './components/PatternBacktestModal';
import { ResistanceBreakoutTable } from './components/ResistanceBreakoutTable';
import { NearSupportTable } from './components/NearSupportTable';
import { BuySignalRatioTable } from './components/BuySignalRatioTable';
import { PatternsTable } from './components/PatternsTable';
import {
  Filter,
  Search,
  Sliders,
  TrendingUp,
  TrendingDown,
  Scale,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  Copy,
  Save,
  Play,
  RotateCcw,
  AlertTriangle,
  Server,
  Zap,
  BarChart2,
  Activity,
  Check,
  Eye,
  Settings,
  HelpCircle,
  RefreshCw,
  Award
} from 'lucide-react';

interface ScreenerViewProps {
  onSelectStock: (symbol: string) => void;
  onAddToWatchlist?: (symbol: string) => void;
}

// All 24 Built-in Conditions defined in FAZ 3
const CONDITION_DEFINITIONS: {
  id: string;
  name: string;
  category: 'EMA' | 'BOLLINGER' | 'SUPPORT_RESISTANCE' | 'PATTERNS' | 'MOMENTUM_VOLUME';
  description: string;
}[] = [
  // 1. Hareketli Ortalamalar (EMA)
  { id: 'EMA5_CROSS_ABOVE_EMA20', name: 'EMA5/EMA20 yukarı kesişimi', category: 'EMA', description: 'Kısa vadeli EMA5 ortalaması EMA20 ortalamasını yukarı keserek boğa dönüş sinyali üretir.' },
  { id: 'EMA5_CROSS_BELOW_EMA20', name: 'EMA5/EMA20 aşağı kesişimi', category: 'EMA', description: 'EMA5 ortalaması EMA20 ortalamasını aşağı keserek düşüş/düzeltme sinyali üretir.' },
  { id: 'PRICE_ABOVE_EMA5', name: 'Fiyatın EMA5 üzerinde olması', category: 'EMA', description: 'Son işlem fiyatı anlık dinamik EMA5 destek seviyesinin üzerindedir.' },
  { id: 'PRICE_ABOVE_EMA20', name: 'Fiyatın EMA20 üzerinde olması', category: 'EMA', description: 'Fiyat ana kısa-orta vadeli EMA20 referans trend çizgisinin üzerindedir.' },

  // 2. Bollinger Bantları
  { id: 'BB_CROSS_ABOVE_MIDDLE', name: 'Bollinger orta bant yukarı kırılımı', category: 'BOLLINGER', description: 'Fiyat EMA20 Bollinger orta bandını yukarı yönlü kırarak pozitif banda geçer.' },
  { id: 'BB_CROSS_BELOW_MIDDLE', name: 'Bollinger orta bant aşağı kırılımı', category: 'BOLLINGER', description: 'Fiyat Bollinger orta bandını aşağı kırarak negatif düzeltme bandına geçer.' },

  // 3. Destek ve Direnç Seviyeleri
  { id: 'SUPPORT_NEAR_1PCT', name: 'Desteğe %1 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat tespit edilen en yakın matematiksel destek bölgesine %1 veya daha yakındır.' },
  { id: 'SUPPORT_NEAR_1_5PCT', name: 'Desteğe %1,5 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın destek bölgesine %1.5 veya daha yakındır.' },
  { id: 'SUPPORT_NEAR_2PCT', name: 'Desteğe %2 yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın destek bölgesine %2 veya daha yakındır.' },
  { id: 'RESISTANCE_NEAR_2PCT', name: 'Dirence yakınlık', category: 'SUPPORT_RESISTANCE', description: 'Fiyat en yakın direnç bölgesine %2 veya daha yakındır.' },
  { id: 'SUPPORT_BREAK', name: 'Destek kırılımı', category: 'SUPPORT_RESISTANCE', description: 'Fiyat destek seviyesini teyitli kapanışla aşağı yönlü kırmıştır.' },
  { id: 'RESISTANCE_BREAK', name: 'Direnç kırılımı', category: 'SUPPORT_RESISTANCE', description: 'Fiyat direnç seviyesini teyitli kapanışla yukarı yönlü kırarak alan açmıştır.' },

  // 4. Teknik Grafik Formasyonları
  { id: 'PATTERN_ASCENDING_TRIANGLE', name: 'Yükselen üçgen', category: 'PATTERNS', description: 'Yatay direnç ve yükselen dipler ile oluşan boğa kırılım adayı.' },
  { id: 'PATTERN_DESCENDING_TRIANGLE', name: 'Düşen üçgen', category: 'PATTERNS', description: 'Yatay destek ve alçalan tepeler ile oluşan ayı kırılım adayı.' },
  { id: 'PATTERN_SYMMETRICAL_TRIANGLE', name: 'Simetrik üçgen', category: 'PATTERNS', description: 'Daralan fiyat koridoru ve sıkışma sonrası yön arayışı.' },
  { id: 'PATTERN_TOBO', name: 'TOBO (Ters Omuz Baş Omuz)', category: 'PATTERNS', description: 'Düşüş trendi sonunda güvenilir boğa dönüş formasyonu.' },
  { id: 'PATTERN_OBO', name: 'OBO (Omuz Baş Omuz)', category: 'PATTERNS', description: 'Yükseliş trendi tepesinde oluşan ayı dönüş formasyonu.' },
  { id: 'PATTERN_FALLING_WEDGE', name: 'Düşen kama', category: 'PATTERNS', description: 'Daralan eğimli kama yapısından yukarı kırılım potansiyeli.' },
  { id: 'PATTERN_RISING_WEDGE', name: 'Yükselen kama', category: 'PATTERNS', description: 'Daralan eğimli kama yapısından aşağı kırılım riski.' },
  { id: 'PATTERN_CHANNEL_UP', name: 'Yükselen kanal', category: 'PATTERNS', description: 'Düzenli yükselen dip ve tepelerden oluşan yükseliş kanalı.' },
  { id: 'PATTERN_CHANNEL_DOWN', name: 'Düşen kanal', category: 'PATTERNS', description: 'Alçalan dip ve tepelerden oluşan düşüş kanalı.' },

  // 5. Hacim, Zirve ve Göreceli Güç
  { id: 'VOLUME_SURGE', name: 'Hacim artışı', category: 'MOMENTUM_VOLUME', description: 'Günlük işlem hacmi 20 barlık ortalama hacmin en az 1.2 katına ulaşmıştır.' },
  { id: 'NEAR_ALL_TIME_HIGH', name: 'Tarihsel zirveye yakınlık', category: 'MOMENTUM_VOLUME', description: 'Fiyat periyodun gördüğü en yüksek zirve seviyesine %3.5 yakınlıktadır.' },
  { id: 'RELATIVE_STRENGTH_OUTPERFORM', name: 'Endekse göre göreceli güç artışı', category: 'MOMENTUM_VOLUME', description: 'Hissenin son 20 barlık getirisi BIST 100 endeksinin üzerinde pozitif ayrışmaktadır.' }
];

export type ConditionCategoryId = 'ALL' | 'EMA' | 'BOLLINGER' | 'SUPPORT_RESISTANCE' | 'PATTERNS' | 'MOMENTUM_VOLUME';

export const CONDITION_CATEGORIES: {
  id: ConditionCategoryId;
  name: string;
  shortName: string;
}[] = [
  { id: 'ALL', name: 'Tüm Koşullar', shortName: 'Tümü' },
  { id: 'EMA', name: 'Hareketli Ortalamalar', shortName: 'EMA' },
  { id: 'BOLLINGER', name: 'Bollinger Bantları', shortName: 'Bollinger' },
  { id: 'SUPPORT_RESISTANCE', name: 'Destek & Direnç', shortName: 'Destek/Direnç' },
  { id: 'PATTERNS', name: 'Formasyonlar', shortName: 'Formasyon' },
  { id: 'MOMENTUM_VOLUME', name: 'Hacim, Zirve & Güç', shortName: 'Hacim/Güç' }
];

export const RS_CATEGORIES: { id: string; title: string; desc: string }[] = [
  { id: 'ALL', title: 'Tüm Kategoriler', desc: 'Tüm göreceli güç ve piyasa rejimi taramaları' },
  { id: 'INDEX_UP_STOCK_STRONGER', title: '1. Endeks Yükselirken Güçlü', desc: 'Endeks yükselirken endeksten daha güçlü yükselen hisseler (Alfa > 0)' },
  { id: 'INDEX_UP_RS_EXPANDING', title: '2. Yükselişte Gücü Artan', desc: 'Endeks yükselirken göreceli güç oranı (RS) genişleyen hisseler' },
  { id: 'INDEX_SIDEWAYS_STOCK_GAINING', title: '3. Yatayda Güç Kazanan', desc: 'Endeks yatay banttayken pozitif ayrışıp güç kazanan hisseler' },
  { id: 'INDEX_DOWN_STOCK_LESS_DROP', title: '4. Düşüşte Az Gerileyen', desc: 'Endeks düşerken endekse göre daha az gerileyen defansif hisseler' },
  { id: 'INDEX_DOWN_STOCK_RISING', title: '5. Düşüşte Yükselişini Sürdüren', desc: 'Endeks sert düşerken primini ve yükselişini koruyan ayrışan hisseler' },
  { id: 'INDEX_DOWN_STOCK_RESILIENT', title: '6. Düşüşe Direnç Gösteren', desc: 'Endeks düşerken desteğini kırmayan ve direnç gösteren hisseler' },
  { id: 'INDEX_RELATIVELY_WEAK', title: '7. Endekse Kıyasla Zayıflayan', desc: 'Endekse oranla belirgin negatif alfa ve momentum kaybeden hisseler' },
  { id: 'DOWNSIDE_RISK_INCREASING', title: '8. Düşüş Riski Artan', desc: 'EMA20 altı, destek ihlali ve zayıf RS ile çoklu risk faktörü taşıyanlar' }
];

export const PATTERN_OPTIONS: { id: string; name: string }[] = [
  { id: 'ALL', name: 'Tüm Formasyonlar (16 Tip)' },
  { id: 'TOBO', name: 'TOBO (Ters Omuz Baş Omuz)' },
  { id: 'OBO', name: 'OBO (Omuz Baş Omuz)' },
  { id: 'DOUBLE_BOTTOM', name: 'Çift Dip (Double Bottom)' },
  { id: 'DOUBLE_TOP', name: 'Çift Tepe (Double Top)' },
  { id: 'ASCENDING_TRIANGLE', name: 'Yükselen Üçgen' },
  { id: 'DESCENDING_TRIANGLE', name: 'Düşen Üçgen' },
  { id: 'SYMMETRICAL_TRIANGLE', name: 'Simetrik Üçgen' },
  { id: 'CUP_AND_HANDLE', name: 'Fincan Kulp' },
  { id: 'INVERSE_CUP_AND_HANDLE', name: 'Ters Fincan Kulp' },
  { id: 'BULL_FLAG', name: 'Boğa Bayrağı' },
  { id: 'BEAR_FLAG', name: 'Ayı Bayrağı' },
  { id: 'BULL_PENNANT', name: 'Boğa Flaması' },
  { id: 'BEAR_PENNANT', name: 'Ayı Flaması' },
  { id: 'FALLING_WEDGE', name: 'Düşen Kama' },
  { id: 'RISING_WEDGE', name: 'Yükselen Kama' }
];

export const ScreenerView: React.FC<ScreenerViewProps> = ({ onSelectStock, onAddToWatchlist }) => {
  // 1. Timeframe selection (1h, 4h, 1d, 1wk, 1mo)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '4h' | '1d' | '1wk' | '1mo'>('1d');

  // 2. Multi-condition selection & AND/OR logic
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'EMA5_CROSS_ABOVE_EMA20',
    'PRICE_ABOVE_EMA20'
  ]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');

  // 3. Custom user-defined indicator conditions
  const [customRules, setCustomRules] = useState<CustomIndicatorRule[]>([]);
  const [showCustomRuleModal, setShowCustomRuleModal] = useState<boolean>(false);
  const [newRuleIndicator, setNewRuleIndicator] = useState<CustomIndicatorRule['indicator']>('RSI');
  const [newRuleOperator, setNewRuleOperator] = useState<CustomIndicatorRule['operator']>('<');
  const [newRuleCompareTo, setNewRuleCompareTo] = useState<'VALUE' | 'INDICATOR'>('VALUE');
  const [newRuleTargetValue, setNewRuleTargetValue] = useState<number>(30);
  const [newRuleTargetIndicator, setNewRuleTargetIndicator] = useState<string>('EMA50');
  const [newRuleName, setNewRuleName] = useState<string>('Aşırı Satım RSI');

  // 4. Saved profiles management
  const [profiles, setProfiles] = useState<ScreenerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('preset-strong-bull');
  const [showSaveProfileModal, setShowSaveProfileModal] = useState<boolean>(false);
  const [profileNameInput, setProfileNameInput] = useState<string>('');
  const [profileDescInput, setProfileDescInput] = useState<string>('');

  // 5. Schedules, Calendar & Server Automation
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [schedules, setSchedules] = useState<ScreenerScheduleConfig[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [completedCandlesOnly, setCompletedCandlesOnly] = useState<boolean>(false);

  // 6. Universe filters
  const [marketSegmentFilter, setMarketSegmentFilter] = useState<string>('ALL');
  const [indexFilter, setIndexFilter] = useState<string>('ALL');
  const [sectorFilter, setSectorFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(0);

  // 7. Results, Pagination & Excluded Stocks
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<ScreenerStockResult[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [screenedUniverseSize, setScreenedUniverseSize] = useState<number>(0);
  const [totalUniverseSize, setTotalUniverseSize] = useState<number>(0);
  const [lastDataTime, setLastDataTime] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [excludedStocks, setExcludedStocks] = useState<ExcludedStockReason[]>([]);
  const [showExcludedModal, setShowExcludedModal] = useState<boolean>(false);
  const [selectedStockExplanation, setSelectedStockExplanation] = useState<ScreenerStockResult | null>(null);
  const [telemetry, setTelemetry] = useState<ScreenerTelemetry | null>(null);
  const [isRetryingFailed, setIsRetryingFailed] = useState<boolean>(false);
  const [retryResultFeedback, setRetryResultFeedback] = useState<string | null>(null);
  const [retryingSymbol, setRetryingSymbol] = useState<string | null>(null);
  const [excludedFilterType, setExcludedFilterType] = useState<string>('ALL');

  // 8. Sorting
  const [sortField, setSortField] = useState<string>('technicalScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Active condition category and dropdown state
  const [activeCategoryTab, setActiveCategoryTab] = useState<ConditionCategoryId>('ALL');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Dynamic counts per category calculated from actual condition definitions and selection state
  const getCategoryTotalCount = (catId: ConditionCategoryId): number => {
    if (catId === 'ALL') return CONDITION_DEFINITIONS.length;
    return CONDITION_DEFINITIONS.filter(c => c.category === catId).length;
  };

  const getCategorySelectedCount = (catId: ConditionCategoryId): number => {
    if (catId === 'ALL') {
      return selectedConditions.filter(id => CONDITION_DEFINITIONS.some(c => c.id === id)).length;
    }
    return selectedConditions.filter(id => {
      const def = CONDITION_DEFINITIONS.find(c => c.id === id);
      return def && def.category === catId;
    }).length;
  };

  const selectAllConditionsInActiveCategory = () => {
    const targetConditions = (activeCategoryTab === 'ALL'
      ? CONDITION_DEFINITIONS
      : CONDITION_DEFINITIONS.filter(c => c.category === activeCategoryTab)
    ).map(c => c.id);
    setSelectedConditions(prev => Array.from(new Set([...prev, ...targetConditions])));
  };

  const clearConditionsInActiveCategory = () => {
    const targetSet = new Set(
      (activeCategoryTab === 'ALL'
        ? CONDITION_DEFINITIONS
        : CONDITION_DEFINITIONS.filter(c => c.category === activeCategoryTab)
      ).map(c => c.id)
    );
    setSelectedConditions(prev => prev.filter(id => !targetSet.has(id)));
  };

  // Tarayıcı Modları ve İzole State Yönetimi
  const [screenerMode, setScreenerMode] = useState<
    | 'MULTICRITERIA'
    | 'RESISTANCE_BREAKOUT'
    | 'NEAR_SUPPORT'
    | 'BUY_SIGNAL_RATIO'
    | 'VALIDATED_PATTERNS'
    | 'BREAKOUT_CONFIRMED_PATTERNS'
    | 'RELATIVE_STRENGTH'
  >('MULTICRITERIA');

  // 1. Direnç Kırılımı (Skor 80+) İzole State'leri
  const [minBreakoutScore, setMinBreakoutScore] = useState<number>(80);
  const [minTouchCount, setMinTouchCount] = useState<string>('ALL');
  const [breakoutSortField, setBreakoutSortField] = useState<string>('breakoutScore');
  const [breakoutSortDir, setBreakoutSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedBreakoutDetail, setSelectedBreakoutDetail] = useState<ResistanceBreakoutItem | null>(null);

  // 2. Dibe Yakın (%2–5) İzole State'leri
  const [minSupportDist, setMinSupportDist] = useState<number>(2.0);
  const [maxSupportDist, setMaxSupportDist] = useState<number>(5.0);
  const [supportSortField, setSupportSortField] = useState<string>('distanceToSupportPct');
  const [supportSortDir, setSupportSortDir] = useState<'asc' | 'desc'>('asc');

  // 3. AL Sinyali Oranı (%40–55) İzole State'leri
  const [minBuyRatio, setMinBuyRatio] = useState<number>(40.0);
  const [maxBuyRatio, setMaxBuyRatio] = useState<number>(55.0);
  const [buyRatioSortField, setBuyRatioSortField] = useState<string>('buySignalRatioPct');
  const [buyRatioSortDir, setBuyRatioSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedSignalAudit, setSelectedSignalAudit] = useState<BuySignalRatioItem | null>(null);

  // 4. Doğrulanmış & Kırılımı Doğrulanmış Formasyonlar İzole State'leri
  const [selectedPatternType, setSelectedPatternType] = useState<string>('ALL');
  const [patternBacktestSummaries, setPatternBacktestSummaries] = useState<PatternBacktestSummary[]>([]);
  const [isBacktestLoading, setIsBacktestLoading] = useState<boolean>(false);
  const [showBacktestModal, setShowBacktestModal] = useState<boolean>(false);

  // FAZ 4: Piyasa Durumuna Göre Tarama States
  const [rsCategory, setRsCategory] = useState<string>('ALL');
  const [rsIndexSymbol, setRsIndexSymbol] = useState<string>('XU100');
  const [rsTimeframe, setRsTimeframe] = useState<string>('1d');
  const [rsResults, setRsResults] = useState<(RelativeStrengthScreenerItem & { matchedCategories: ScreenerCategory[] })[]>([]);
  const [rsRegime, setRsRegime] = useState<MarketRegimeReport | null>(null);
  const [rsTotalCount, setRsTotalCount] = useState<number>(0);
  const [isRsLoading, setIsRsLoading] = useState<boolean>(false);

  const loadPatternBacktest = async () => {
    if (patternBacktestSummaries.length > 0) return;
    setIsBacktestLoading(true);
    try {
      const res = await apiClient.getPatternBacktest();
      setPatternBacktestSummaries(res.summaries || []);
    } catch (err) {
      console.warn('Pattern backtest load error:', err);
    } finally {
      setIsBacktestLoading(false);
    }
  };

  const executeRsScreen = async () => {
    setIsRsLoading(true);
    try {
      const res = await apiClient.runRelativeStrengthScreener({
        category: rsCategory !== 'ALL' ? rsCategory : undefined,
        indexSymbol: rsIndexSymbol,
        timeframe: rsTimeframe,
        page: 1,
        pageSize: 50
      });
      setRsResults(res.results);
      setRsRegime(res.regime);
      setRsTotalCount(res.totalCount);
    } catch {
      setRsResults([]);
    } finally {
      setIsRsLoading(false);
    }
  };

  useEffect(() => {
    if (screenerMode === 'RELATIVE_STRENGTH') {
      executeRsScreen();
    } else if (screenerMode === 'VALIDATED_PATTERNS' || screenerMode === 'BREAKOUT_CONFIRMED_PATTERNS') {
      loadPatternBacktest();
    }
  }, [screenerMode, rsCategory, rsIndexSymbol, rsTimeframe]);

  // Load profiles, calendar and schedules on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [profileList, cal, schedData] = await Promise.all([
        apiClient.getScreenerProfiles().catch(() => []),
        apiClient.getScreenerCalendar().catch(() => null),
        apiClient.getScreenerSchedules().catch(() => null)
      ]);
      if (profileList && profileList.length > 0) {
        setProfiles(profileList);
      }
      setCalendarStatus(cal);
      if (schedData) {
        setServerStatus(schedData.server);
        setSchedules(schedData.schedules || []);
      }
    } catch (err) {
      console.warn('İlk yükleme uyarısı:', err);
    }
  };

  // Run Screener API
  const executeScreen = async (pageToFetch: number = 1) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        timeframe: selectedTimeframe,
        logic: filterLogic,
        conditions: selectedConditions.join(','),
        page: pageToFetch.toString(),
        pageSize: pageSize.toString(),
        sortField,
        sortDir
      };

      if (screenerMode === 'RESISTANCE_BREAKOUT') {
        params.mode = 'resistance_breakout';
        params.minBreakoutScore = minBreakoutScore.toString();
        if (minTouchCount !== 'ALL') {
          params.minTouchCount = minTouchCount;
        }
        params.sortField = breakoutSortField;
        params.sortDir = breakoutSortDir;
      } else if (screenerMode === 'NEAR_SUPPORT') {
        params.mode = 'near_support';
        params.minSupportDist = minSupportDist.toString();
        params.maxSupportDist = maxSupportDist.toString();
        params.sortField = supportSortField;
        params.sortDir = supportSortDir;
      } else if (screenerMode === 'BUY_SIGNAL_RATIO') {
        params.mode = 'buy_signal_ratio';
        params.minBuyRatio = minBuyRatio.toString();
        params.maxBuyRatio = maxBuyRatio.toString();
        params.sortField = buyRatioSortField;
        params.sortDir = buyRatioSortDir;
      } else if (screenerMode === 'VALIDATED_PATTERNS') {
        params.mode = 'validated_patterns';
        params.patternType = selectedPatternType;
      } else if (screenerMode === 'BREAKOUT_CONFIRMED_PATTERNS') {
        params.mode = 'breakout_patterns';
        params.patternType = selectedPatternType;
      } else {
        params.mode = 'all';
      }

      if (customRules.length > 0) {
        params.customRules = JSON.stringify(customRules);
      }
      if (marketSegmentFilter !== 'ALL') params.marketSegment = marketSegmentFilter;
      if (indexFilter !== 'ALL') params.index = indexFilter;
      if (sectorFilter !== 'ALL') params.sector = sectorFilter;
      if (searchTerm.trim() !== '') params.search = searchTerm.trim();
      if (minScore > 0 && screenerMode === 'MULTICRITERIA') params.minScore = minScore.toString();
      if (completedCandlesOnly) params.completedCandlesOnly = 'true';

      const resp = await apiClient.runScreener(params);

      setResults(resp.results || []);
      setTotalCount(resp.totalCount || 0);
      setScreenedUniverseSize(resp.screenedUniverseSize || 0);
      setTotalUniverseSize(resp.totalUniverseSize || 0);
      setTotalPages(resp.totalPages || 1);
      setCurrentPage(resp.page || 1);
      setLastDataTime(resp.lastDataTime || new Date().toISOString());
      setExcludedStocks(resp.excludedStocks || []);
      if (resp.telemetry) {
        setTelemetry(resp.telemetry);
      }
    } catch (err) {
      console.error('Tarama çalıştırma hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run screener on mode or mode-specific filter changes
  useEffect(() => {
    if (screenerMode !== 'RELATIVE_STRENGTH') {
      executeScreen(1);
    }
  }, [
    screenerMode,
    selectedTimeframe,
    minBreakoutScore,
    minTouchCount,
    breakoutSortField,
    breakoutSortDir,
    minSupportDist,
    maxSupportDist,
    supportSortField,
    supportSortDir,
    minBuyRatio,
    maxBuyRatio,
    buyRatioSortField,
    buyRatioSortDir,
    selectedPatternType
  ]);

  // Poll progress during active screening
  useEffect(() => {
    let timer: any = null;
    if (isLoading) {
      timer = setInterval(async () => {
        try {
          const prog = await apiClient.getScreenerProgress();
          if (prog && prog.status === 'IN_PROGRESS') {
            setTelemetry(prog);
          }
        } catch {
          // ignore polling errors
        }
      }, 750);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  // Retry failed stocks handler
  const handleRetryFailed = async (symbols?: string[]) => {
    if (symbols && symbols.length === 1) {
      setRetryingSymbol(symbols[0]);
    } else {
      setIsRetryingFailed(true);
    }
    setRetryResultFeedback(null);
    try {
      const res = await apiClient.retryFailedScreener(symbols, selectedTimeframe);
      setRetryResultFeedback(
        `${res.retriedCount} hisse yeniden denendi: ${res.recoveredCount} hisse başarıyla kurtarıldı, ${res.stillFailedCount} hisse sağlayıcıda bulunamadı.`
      );
      await executeScreen(currentPage);
    } catch (err: any) {
      setRetryResultFeedback(`Yeniden deneme sırasında hata: ${err.message}`);
    } finally {
      setIsRetryingFailed(false);
      setRetryingSymbol(null);
    }
  };

  // Auto trigger screen when primary parameters change
  useEffect(() => {
    executeScreen(1);
  }, [
    selectedTimeframe,
    filterLogic,
    selectedConditions,
    customRules,
    marketSegmentFilter,
    indexFilter,
    sectorFilter,
    minScore,
    completedCandlesOnly,
    sortField,
    sortDir,
    pageSize
  ]);

  const toggleCondition = (condId: string) => {
    setSelectedConditions(prev =>
      prev.includes(condId) ? prev.filter(id => id !== condId) : [...prev, condId]
    );
  };

  const selectAllConditionsInCategory = (cat: string) => {
    const catConditions = CONDITION_DEFINITIONS.filter(c => c.category === cat).map(c => c.id);
    setSelectedConditions(prev => {
      const next = new Set([...prev, ...catConditions]);
      return Array.from(next);
    });
  };

  const clearConditions = () => {
    setSelectedConditions([]);
  };

  // Apply a Profile (Preset or Custom)
  const applyProfile = (profile: ScreenerProfile) => {
    setActiveProfileId(profile.id);
    setSelectedTimeframe(profile.timeframe || '1d');
    setFilterLogic(profile.logic || 'AND');
    setSelectedConditions(profile.conditions || []);
    if (profile.customRules) {
      setCustomRules(profile.customRules);
    }
    if (profile.sortField) {
      setSortField(profile.sortField);
    }
    if (profile.sortDir) {
      setSortDir(profile.sortDir);
    }
  };

  // Save Current Setup as New Profile
  const handleSaveProfile = async () => {
    if (!profileNameInput.trim()) return;
    const newProfile: ScreenerProfile = {
      id: `profile-${Date.now()}`,
      name: profileNameInput.trim(),
      description: profileDescInput.trim() || 'Kullanıcı tanımlı tarama profili',
      isPreset: false,
      timeframe: selectedTimeframe,
      logic: filterLogic,
      conditions: selectedConditions,
      customRules,
      sortField,
      sortDir,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await apiClient.saveScreenerProfile(newProfile);
      setProfiles(prev => [...prev.filter(p => p.id !== saved.id), saved]);
      setActiveProfileId(saved.id);
      setShowSaveProfileModal(false);
      setProfileNameInput('');
      setProfileDescInput('');
    } catch (err) {
      console.error('Profil kaydetme hatası:', err);
    }
  };

  // Duplicate active profile
  const handleDuplicateProfile = () => {
    const current = profiles.find(p => p.id === activeProfileId);
    if (!current) return;
    setProfileNameInput(`${current.name} (Kopya)`);
    setProfileDescInput(current.description || '');
    setShowSaveProfileModal(true);
  };

  // Delete profile
  const handleDeleteProfile = async (id: string) => {
    try {
      await apiClient.deleteScreenerProfile(id);
      setProfiles(prev => prev.filter(p => p.id !== id));
      setActiveProfileId('preset-strong-bull');
    } catch (err: any) {
      alert(err.message || 'Profil silinemedi.');
    }
  };

  // Add Custom Indicator Rule
  const handleAddCustomRule = () => {
    const rule: CustomIndicatorRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName.trim() || `${newRuleIndicator} ${newRuleOperator} ${newRuleCompareTo === 'VALUE' ? newRuleTargetValue : newRuleTargetIndicator}`,
      indicator: newRuleIndicator,
      operator: newRuleOperator,
      compareTo: newRuleCompareTo,
      targetValue: newRuleTargetValue,
      targetIndicator: newRuleTargetIndicator
    };
    setCustomRules(prev => [...prev, rule]);
    setShowCustomRuleModal(false);
  };

  const handleRemoveCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const filteredConditionDefinitions = activeCategoryTab === 'ALL'
    ? CONDITION_DEFINITIONS
    : CONDITION_DEFINITIONS.filter(c => c.category === activeCategoryTab);

  const renderPaginationBar = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <span className="text-slate-400">
          Sayfa <strong>{currentPage}</strong> / <strong>{totalPages}</strong> ({totalCount} toplam sonuç)
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Sayfa Başına:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (currentPage > 1) {
              setCurrentPage(prev => prev - 1);
              executeScreen(currentPage - 1);
            }
          }}
          disabled={currentPage <= 1 || isLoading}
          className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Önceki
        </button>

        <button
          onClick={() => {
            if (currentPage < totalPages) {
              setCurrentPage(prev => prev + 1);
              executeScreen(currentPage + 1);
            }
          }}
          disabled={currentPage >= totalPages || isLoading}
          className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1 cursor-pointer"
        >
          Sonraki
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header: Title & BIST Calendar / Server Daemon Live Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                BIST Çok Kriterli Akıllı Hisse Tarayıcısı
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                FAZ 3
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Merkezi BIST pay senedi evrenindeki tüm şirketler için deterministik göstergeler, formasyon kırılımları ve çoklu koşul filtreleme motoru.
            </p>
          </div>

          {/* BIST Calendar and Server Status Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {/* Session Phase Badge */}
            <div className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
              calendarStatus?.isSessionOpen
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${calendarStatus?.isSessionOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{calendarStatus?.sessionPhase === 'CONTINUOUS_AUCTION' ? 'Sürekli Müzayede (Seans Açık)' : calendarStatus?.sessionPhase === 'CLOSING_SESSION' ? 'Kapanış Seansı' : 'Seans Kapalı'}</span>
            </div>

            {/* BIST Clock */}
            <div className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{calendarStatus?.localTimeStr || '14:30 (İstanbul)'}</span>
            </div>

            {/* Server Daemon Status */}
            <button
              onClick={() => setShowScheduleModal(true)}
              className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Sunucu Otomasyonu ve Zamanlanmış Görevleri Görüntüle"
            >
              <Server className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sunucu Otomasyonu</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </button>
          </div>
        </div>

        {/* Holiday Banner if today is a public holiday */}
        {calendarStatus?.holidayName && (
          <div className="mt-3 px-3 py-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>Bugün Borsa İstanbul Resmi Tatili: <strong>{calendarStatus.holidayName}</strong> (İşlem yapılmamaktadır).</span>
          </div>
        )}
      </div>

      {/* 1.5 Mode Switcher: 7 Screener Modes */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {[
            {
              id: 'MULTICRITERIA',
              label: 'Çok Kriterli Tarama',
              desc: '24 Kural & Özel Filtreler',
              icon: Filter
            },
            {
              id: 'RESISTANCE_BREAKOUT',
              label: 'Direnç Kırılımı (80+)',
              desc: 'Hacim Teyitli & Tuzaksız',
              icon: TrendingUp
            },
            {
              id: 'NEAR_SUPPORT',
              label: 'Dibe Yakın (%2–5)',
              desc: 'Güçlü Destek & Stop Seviyesi',
              icon: Sliders
            },
            {
              id: 'BUY_SIGNAL_RATIO',
              label: 'AL Sinyali (%40–55)',
              desc: 'İndikatör Mutabakat Oranı',
              icon: Activity
            },
            {
              id: 'VALIDATED_PATTERNS',
              label: 'Doğrulanmış Formasyon',
              desc: 'Geometrisi Tamamlanan',
              icon: Layers
            },
            {
              id: 'BREAKOUT_CONFIRMED_PATTERNS',
              label: 'Kırılımı Doğrulanmış',
              desc: 'Boyun Çizgisi Aşılan',
              icon: Zap
            },
            {
              id: 'RELATIVE_STRENGTH',
              label: 'Göreceli Güç (RS)',
              desc: '8 Piyasa Durum Kategorisi',
              icon: Scale
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = screenerMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setScreenerMode(tab.id as any)}
                className={`flex-1 min-w-[155px] py-2 px-3 rounded-lg text-left transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-800 text-slate-100 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {tab.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FAZ 3 MULTICRITERIA SCREENER CONTENT */}
      {screenerMode === 'MULTICRITERIA' && (
        <>
          {/* 2. Top Control Panel: Timeframe Selector & Primary Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Timeframe Selector (1h, 4h, 1d, 1wk, 1mo) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Zaman Dilimi:
          </span>
          {[
            { id: '1h', label: '1 Saat' },
            { id: '4h', label: '4 Saat' },
            { id: '1d', label: 'Günlük' },
            { id: '1wk', label: 'Haftalık' },
            { id: '1mo', label: 'Aylık' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setSelectedTimeframe(tf.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTimeframe === tf.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Scan Modes & Execution Trigger */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Completed Candles Toggle (for post-close scan) */}
          <button
            onClick={() => setCompletedCandlesOnly(!completedCandlesOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              completedCandlesOnly
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Seans içi oluşumu devam eden açık mumu hariç tut, yalnızca tamamlanmış barları kullan"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Tamamlanmış Mumlar
          </button>

          {/* Manual Run Now Button */}
          <button
            onClick={() => executeScreen(1)}
            disabled={isLoading}
            className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isLoading ? 'Taranıyor...' : 'Taramayı Çalıştır'}
          </button>
        </div>
      </div>

      {/* 3. Profile Management Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Kayıtlı Profil:
          </span>
          <select
            value={activeProfileId}
            onChange={(e) => {
              const prof = profiles.find(p => p.id === e.target.value);
              if (prof) applyProfile(prof);
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
          >
            <optgroup label="Önceden Tanımlı Hazır Stratejiler">
              {profiles.filter(p => p.isPreset).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </optgroup>
            {profiles.some(p => !p.isPreset) && (
              <optgroup label="Özel Kullanıcı Profillerim">
                {profiles.filter(p => !p.isPreset).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Profile Action Buttons */}
          <button
            onClick={() => {
              setProfileNameInput('');
              setProfileDescInput('');
              setShowSaveProfileModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            title="Mevcut koşulları yeni profil olarak kaydet"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            Yeni Kaydet
          </button>

          <button
            onClick={handleDuplicateProfile}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
            title="Aktif profili kopyala"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-400" />
            Kopyala
          </button>

          {activeProfileId && !profiles.find(p => p.id === activeProfileId)?.isPreset && (
            <button
              onClick={() => handleDeleteProfile(activeProfileId)}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs flex items-center gap-1 transition-colors"
              title="Özel profili sil"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
            </button>
          )}
        </div>

        {/* Profile Active Description */}
        <div className="text-xs text-slate-400 italic">
          {profiles.find(p => p.id === activeProfileId)?.description || 'Kullanıcı tanımlı strateji filtreleri.'}
        </div>
      </div>

      {/* 4. Condition Builder & Multi-Select Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        {/* Logic Toggle & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Koşul Birleştirme Mantığı:
            </span>
            <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
              <button
                onClick={() => setFilterLogic('AND')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterLogic === 'AND'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                AND (Tümü Sağlansın)
              </button>
              <button
                onClick={() => setFilterLogic('OR')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterLogic === 'OR'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OR (En Az Biri Sağlansın)
              </button>
            </div>
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              {filterLogic === 'AND'
                ? '• Seçtiğiniz tüm koşulları aynı anda sağlayan hisseler listelenir.'
                : '• Seçtiğiniz koşullardan herhangi birini sağlayan hisseler listelenir.'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomRuleModal(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Özel İndikatör Koşulu Ekle
            </button>
            <button
              onClick={clearConditions}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>

        {/* 1. Category Dropdown Selector & Category Batch Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Custom Accessible Dropdown */}
          <div className="relative inline-block w-full sm:w-auto" ref={categoryDropdownRef}>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Koşul Kategorisi:
            </label>
            <button
              type="button"
              onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isCategoryDropdownOpen}
              className="w-full sm:w-84 flex items-center justify-between gap-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 text-slate-100 rounded-xl px-3.5 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <div className="flex items-center gap-2 truncate">
                <Filter className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{CONDITION_CATEGORIES.find(c => c.id === activeCategoryTab)?.name || 'Tüm Koşullar'}</span>
                <span className="text-slate-500 font-normal">·</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  getCategorySelectedCount(activeCategoryTab) > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                }`}>
                  {getCategorySelectedCount(activeCategoryTab)} seçili
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                isCategoryDropdownOpen ? 'rotate-180 text-emerald-400' : ''
              }`} />
            </button>

            {/* Dropdown Menu Popover */}
            {isCategoryDropdownOpen && (
              <div
                role="listbox"
                aria-label="Koşul Kategorileri"
                className="absolute left-0 top-full mt-1.5 w-full sm:w-88 max-w-[calc(100vw-2rem)] bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 max-h-80 overflow-y-auto"
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                  Kategori Seçiniz
                </div>
                {CONDITION_CATEGORIES.map(cat => {
                  const isSelected = activeCategoryTab === cat.id;
                  const total = getCategoryTotalCount(cat.id);
                  const selected = getCategorySelectedCount(cat.id);

                  return (
                    <button
                      key={cat.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        setActiveCategoryTab(cat.id);
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isSelected ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : selected > 0 ? 'bg-cyan-400' : 'bg-slate-700'
                        }`} />
                        <span className="truncate">
                          {cat.name} <span className="text-slate-400 font-normal">({total})</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {selected > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {selected} seçili
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions for Active Category */}
          <div className="flex items-center gap-2 self-start sm:self-end text-xs">
            <button
              type="button"
              onClick={selectAllConditionsInActiveCategory}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/60 transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              title={`${CONDITION_CATEGORIES.find(c => c.id === activeCategoryTab)?.name} altındaki tüm koşulları seç`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Kategorideki Tümünü Seç</span>
            </button>
            {getCategorySelectedCount(activeCategoryTab) > 0 && (
              <button
                type="button"
                onClick={clearConditionsInActiveCategory}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/50 text-slate-400 border border-slate-700/60 transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                title={`${CONDITION_CATEGORIES.find(c => c.id === activeCategoryTab)?.name} altındaki seçili koşulları kaldır`}
              >
                <X className="w-3 h-3" />
                <span>Kategoriyi Kaldır</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Selected Conditions Summary ("Seçilen Koşulların Özeti") */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Seçilen Koşulların Özeti ({selectedConditions.length})
              </span>
              {selectedConditions.length > 0 && (
                <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                  [{filterLogic === 'AND' ? 'AND: Tümü Sağlanacak' : 'OR: En Az Biri Sağlanacak'}]
                </span>
              )}
            </div>
            {selectedConditions.length > 0 && (
              <button
                type="button"
                onClick={clearConditions}
                className="text-[11px] text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                title="Tüm seçili koşulları temizle"
              >
                <RotateCcw className="w-3 h-3" />
                Seçimleri Temizle
              </button>
            )}
          </div>

          {selectedConditions.length === 0 ? (
            <div className="text-xs text-slate-400 italic py-1 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Henüz koşul seçmediniz. Yukarıdaki açılır menüden bir kategori belirleyerek koşul kartlarına tıklayabilirsiniz.</span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {selectedConditions.map(condId => {
                const condDef = CONDITION_DEFINITIONS.find(c => c.id === condId);
                const catMeta = condDef ? CONDITION_CATEGORIES.find(m => m.id === condDef.category) : null;
                return (
                  <span
                    key={condId}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg text-xs bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 shadow-sm transition-all hover:border-emerald-400"
                  >
                    {catMeta && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-400 font-bold">
                        {catMeta.shortName}
                      </span>
                    )}
                    <span className="font-medium text-slate-100">{condDef ? condDef.name : condId}</span>
                    <button
                      type="button"
                      onClick={() => toggleCondition(condId)}
                      className="p-0.5 rounded-full hover:bg-emerald-800/80 text-emerald-400 hover:text-white transition-colors cursor-pointer ml-0.5"
                      title={`${condDef?.name || condId} koşulunu kaldır`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Condition Cards Section Header */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-slate-200 font-semibold">
              {CONDITION_CATEGORIES.find(c => c.id === activeCategoryTab)?.name || 'Tüm Koşullar'}
            </span>
            <span>·</span>
            <span>{filteredConditionDefinitions.length} adet koşul listeleniyor</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">Kartlara tıklayarak filtreye ekleyin veya kaldırın</span>
        </div>

        {/* 4. Condition Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredConditionDefinitions.map(cond => {
            const isSelected = selectedConditions.includes(cond.id);
            const catMeta = CONDITION_CATEGORIES.find(m => m.id === cond.category);
            return (
              <div
                key={cond.id}
                onClick={() => toggleCondition(cond.id)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                    : 'border-slate-700 bg-slate-900'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {cond.name}
                    </span>
                    {activeCategoryTab === 'ALL' && catMeta && (
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0">
                        {catMeta.shortName}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                    {cond.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Rules List if any exist */}
        {customRules.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Kişiye Özel Tanımlı İndikatör Koşulları ({customRules.length}):
            </div>
            <div className="flex flex-wrap gap-2">
              {customRules.map(rule => (
                <div
                  key={rule.id}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2"
                >
                  <span className="font-semibold">{rule.name}:</span>
                  <span className="font-mono text-[11px]">
                    {rule.indicator} {rule.operator} {rule.compareTo === 'VALUE' ? rule.targetValue : rule.targetIndicator}
                  </span>
                  <button
                    onClick={() => handleRemoveCustomRule(rule.id)}
                    className="p-0.5 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Universe Filters: Pazar, Endeks, Sektör, Arama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Pazar Segmenti
            </label>
            <select
              value={marketSegmentFilter}
              onChange={(e) => setMarketSegmentFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Pazarlar (BIST Pay)</option>
              <option value="YILDIZ_PAZAR">Yıldız Pazar (Büyük/Orta Ölçek)</option>
              <option value="ANA_PAZAR">Ana Pazar</option>
              <option value="ALT_PAZAR">Alt Pazar</option>
              <option value="POIP">PÖİP (Piyasa Öncesi)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Endeks
            </label>
            <select
              value={indexFilter}
              onChange={(e) => setIndexFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Endeksler</option>
              <option value="BIST 30">BIST 30</option>
              <option value="BIST 50">BIST 50</option>
              <option value="BIST 100">BIST 100</option>
              <option value="BIST TUM">BIST TÜM</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Sektör
            </label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tüm Sektörler</option>
              <option value="Mali Kuruluşlar">Mali Kuruluşlar / Bankacılık</option>
              <option value="Sanayi">Sanayi ve İmalat</option>
              <option value="Teknoloji">Teknoloji ve Bilişim</option>
              <option value="Ulaştırma">Ulaştırma ve Havacılık</option>
              <option value="Holdingler">Holdingler</option>
              <option value="Enerji">Enerji ve Elektrik</option>
              <option value="Gayrimenkul">Gayrimenkul (GYO)</option>
              <option value="Hizmetler">Hizmetler ve Perakende</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Hisse / Şirket Ara
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ör. THYAO veya Aselsan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Screener Progress & Telemetry Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-sm">
        {/* Panel Top Row: Status badge, Title and Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Canlı Tarama İlerlemesi ve Telemetri
                </span>
                {/* Status Badge */}
                {isLoading ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Taranıyor...
                  </span>
                ) : excludedStocks.length === 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Tamamlandı
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    Kısmen tamamlandı ({excludedStocks.length} hisse eksik)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Gerçek zamanlı piyasa verisi, oturum bazlı önbellekleme ve eşzamanlı istek kuyruğu ile optimize edilmiştir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {excludedStocks.length > 0 && (
              <button
                onClick={() => setShowExcludedModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Başarısız Hisseleri İncele ({excludedStocks.length})</span>
              </button>
            )}
            <button
              onClick={() => executeScreen(currentPage)}
              disabled={isLoading || isRetryingFailed}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Taramayı ve önbelleği yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">İlerleme Oranı</span>
            <span className="text-emerald-400 font-bold">
              {isLoading ? (telemetry?.percentage || 45) : 100}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 animate-pulse'
                  : excludedStocks.length === 0
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-emerald-500 to-amber-500'
              }`}
              style={{ width: `${isLoading ? (telemetry?.percentage || 45) : 100}%` }}
            />
          </div>
        </div>

        {/* Telemetry Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tarama Kapsamı</span>
            <span className="text-sm font-mono font-bold text-slate-100">
              {totalUniverseSize > 0 ? totalUniverseSize : 529} <span className="text-[10px] font-normal text-slate-400">Hisse</span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Verisi Alınan</span>
            <span className="text-sm font-mono font-bold text-emerald-300">
              {screenedUniverseSize} <span className="text-[10px] font-normal text-slate-400">Hisse</span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block tracking-wider">İşlem Devam Eden</span>
            <span className="text-sm font-mono font-bold text-cyan-300">
              {isLoading ? (telemetry?.inProgressCount ?? 0) : 0} <span className="text-[10px] font-normal text-slate-400">Hisse</span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">Başarısız / Askıda</span>
            <span className="text-sm font-mono font-bold text-amber-300">
              {excludedStocks.length} <span className="text-[10px] font-normal text-slate-400">Hisse</span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">Geçen Süre</span>
            <span className="text-sm font-mono font-bold text-indigo-300">
              {telemetry?.durationMs ? `${(telemetry.durationMs / 1000).toFixed(1)} sn` : '< 1 sn'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Son Güncelleme</span>
            <span className="text-xs font-mono font-semibold text-slate-300 truncate block mt-0.5">
              {lastDataTime ? lastDataTime.substring(11, 19) || lastDataTime.substring(0, 10) : 'Güncel'}
            </span>
          </div>
        </div>

        {/* Secondary Info Strip: Cache Hits & Matches */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span>
              Eşleşen Kriter Sonucu: <strong className="text-emerald-400 font-mono">{totalCount}</strong> Hisse
            </span>
            <span>·</span>
            <span>
              Periyot: <strong className="text-cyan-400 font-mono uppercase">{selectedTimeframe}</strong>
            </span>
            {telemetry?.cacheHits !== undefined && (
              <>
                <span>·</span>
                <span className="text-slate-400">
                  Önbellek: <span className="text-emerald-400 font-mono">{telemetry.cacheHits}</span> hit / <span className="text-amber-400 font-mono">{telemetry.cacheMisses || 0}</span> miss
                </span>
              </>
            )}
          </div>

          {excludedStocks.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">Hata Dağılımı:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {excludedStocks.filter(e => e.errorType === 'DELISTED_OR_NOT_FOUND').length} Kot Dışı
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {excludedStocks.filter(e => e.errorType === 'HALTED_OR_SUSPENDED').length} Askıda
              </span>
              {excludedStocks.filter(e => e.errorType === 'RATE_LIMITED' || e.errorType === 'NETWORK_TIMEOUT').length > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300 font-mono">
                  {excludedStocks.filter(e => e.errorType === 'RATE_LIMITED' || e.errorType === 'NETWORK_TIMEOUT').length} Ağ/Limit
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 6. Results Table with Complete Mandated Columns */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-mono border-b border-slate-800 tracking-wider">
              <tr>
                <th className="py-3 px-3">Hisse</th>
                <th className="py-3 px-3">Şirket Adı</th>
                <th
                  onClick={() => {
                    setSortField('lastPrice');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                >
                  Son Fiyat (TL)
                </th>
                <th className="py-3 px-3 text-center">Veri Zamanı</th>
                <th className="py-3 px-3 text-center">Periyot</th>
                <th className="py-3 px-3 text-center">EMA5 Yönü</th>
                <th className="py-3 px-3 text-center">EMA20 Yönü</th>
                <th
                  onClick={() => {
                    setSortField('relativeStrength');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                >
                  Göreceli Güç
                </th>
                <th className="py-3 px-3 text-center">En Yakın Destek</th>
                <th className="py-3 px-3 text-center">Dirence Uzaklık</th>
                <th className="py-3 px-3 text-center">Formasyon</th>
                <th
                  onClick={() => {
                    setSortField('matchedCount');
                    setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
                  }}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                >
                  Koşullar
                </th>
                <th className="py-3 px-3 text-center">Veri Kalitesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Borsa İstanbul pay evreni taranıyor, lütfen bekleyiniz...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                    Seçilen kriterleri sağlayan hisse bulunamadı. Filtreleri genişleterek tekrar deneyiniz.
                  </td>
                </tr>
              ) : (
                results.map((res) => {
                  const stock = res.stock;
                  const isPositive = stock.changePercent >= 0;
                  const relPerfPos = res.relativePerformanceVsXU100 >= 0;

                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => onSelectStock(stock.symbol)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Hisse Kodu */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                        {stock.symbol}
                      </td>

                      {/* Şirket Adı */}
                      <td className="py-3 px-3 text-slate-300 max-w-[170px] truncate" title={stock.name}>
                        {stock.name}
                      </td>

                      {/* Son Doğrulanmış Fiyat */}
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <div className="text-slate-100">{stock.lastPrice.toFixed(2)}</div>
                        <div className={`text-[10px] ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? '+' : ''}%{stock.changePercent.toFixed(2)}
                        </div>
                      </td>

                      {/* Veri Zamanı */}
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">
                        {res.lastDataTime ? res.lastDataTime.replace('T', ' ').substring(0, 16) : '-'}
                      </td>

                      {/* Seçilen Periyot */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono uppercase font-semibold">
                          {res.timeframe || selectedTimeframe}
                        </span>
                      </td>

                      {/* EMA5 Yönü */}
                      <td className="py-3 px-3 text-center">
                        {res.ema5Direction === 'BULLISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Yükseliş
                          </span>
                        ) : res.ema5Direction === 'BEARISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <TrendingDown className="w-3.5 h-3.5" /> Düşüş
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            Yatay
                          </span>
                        )}
                      </td>

                      {/* EMA20 Yönü */}
                      <td className="py-3 px-3 text-center">
                        {res.ema20Direction === 'BULLISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <TrendingUp className="w-3.5 h-3.5" /> Yükseliş
                          </span>
                        ) : res.ema20Direction === 'BEARISH' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                            <TrendingDown className="w-3.5 h-3.5" /> Düşüş
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            Yatay
                          </span>
                        )}
                      </td>

                      {/* Göreceli Güç vs BIST 100 */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          relPerfPos
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {relPerfPos ? '+' : ''}{res.relativePerformanceVsXU100.toFixed(2)}%
                        </span>
                      </td>

                      {/* En Yakın Destek */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {res.nearestSupport ? (
                          <div>
                            <span className="text-slate-200">{res.nearestSupport.price.toFixed(2)} TL</span>
                            <span className="text-[10px] text-emerald-400 block">(%{res.nearestSupport.distancePct.toFixed(1)})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* En Yakın Dirence Uzaklık */}
                      <td className="py-3 px-3 text-center font-mono text-[11px]">
                        {res.nearestResistance ? (
                          <div>
                            <span className="text-slate-200">{res.nearestResistance.price.toFixed(2)} TL</span>
                            <span className="text-[10px] text-amber-400 block">(%{res.nearestResistance.distancePct.toFixed(1)})</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Formasyon */}
                      <td className="py-3 px-3 text-center">
                        {res.activePatterns && res.activePatterns.length > 0 ? (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-[10px] font-semibold truncate max-w-[120px] inline-block" title={res.activePatterns.join(', ')}>
                            {res.activePatterns[0]}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Sağlanan Koşul Sayısı & Açıklama */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStockExplanation(res);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-mono font-bold flex items-center justify-center gap-1 mx-auto transition-colors"
                          title="Hangi koşulların sağlandığını detaylı gör"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{res.matchedCount}/{res.totalConditions} Koşul</span>
                        </button>
                      </td>

                      {/* Veri Kalitesi Durumu */}
                      <td className="py-3 px-3 text-center text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-mono">
                          Doğrulandı {res.dataQuality.isDelayed ? '(15 Dk)' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Page Size Toolbar */}
        <div className="bg-slate-950/90 border-t border-slate-800 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">
              Sayfa <strong>{currentPage}</strong> / <strong>{totalPages}</strong> ({totalCount} toplam sonuç)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Sayfa Başına:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentPage > 1) {
                  setCurrentPage(prev => prev - 1);
                  executeScreen(currentPage - 1);
                }
              }}
              disabled={currentPage <= 1 || isLoading}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Önceki
            </button>

            <button
              onClick={() => {
                if (currentPage < totalPages) {
                  setCurrentPage(prev => prev + 1);
                  executeScreen(currentPage + 1);
                }
              }}
              disabled={currentPage >= totalPages || isLoading}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 flex items-center gap-1"
            >
              Sonraki
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
        </>
      )}

      {/* MOD 1: DİRENÇ KIRILIMI — SKOR 80+ */}
      {screenerMode === 'RESISTANCE_BREAKOUT' && (
        <div className="space-y-4">
          {/* Header & Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Direnç Kırılımı (Skor 80+) Taraması
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tamamlanmış mum kapanışıyla direnç seviyesini yukarı yönlü kıran, 20 bar hacim teyitli, ATR anlamlılığında ve sahte kırılımlardan (boğa tuzağı) arındırılmış hisseler.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => executeScreen(1)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Taranıyor...' : 'Taramayı Yenile'}
                </button>
              </div>
            </div>

            {/* Filter toolbar: Timeframe, Min Score, Touch Count, Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Zaman Dilimi:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: '1h', label: '1S' },
                    { id: '4h', label: '4S' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1wk', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedTimeframe === tf.id
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    Min Kırılım Skoru:
                  </label>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded text-[11px]">
                    {minBreakoutScore}+ / 100
                  </span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={minBreakoutScore}
                  onChange={e => setMinBreakoutScore(Number(e.target.value))}
                  className="w-full accent-emerald-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>50 (Geniş)</span>
                  <span className="text-emerald-400 font-bold">80 (Önerilen)</span>
                  <span>95 (Çok Katı)</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Asgari Temas Sayısı:
                </label>
                <select
                  value={minTouchCount}
                  onChange={e => setMinTouchCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Tüm Temas Sayıları</option>
                  <option value="1">En Az 1 Geçerli Temas</option>
                  <option value="3">En Az 3 Geçerli Temas</option>
                  <option value="5">En Az 5 Geçerli Temas (5 Temas Kuralı)</option>
                </select>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Hisse Detayı bağımsız temas sayacı esas alınır
                </span>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Pazar / Endeks Filtresi:
                </label>
                <select
                  value={indexFilter}
                  onChange={e => setIndexFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Tüm BIST Evreni</option>
                  <option value="BIST 30">BIST 30</option>
                  <option value="BIST 50">BIST 50</option>
                  <option value="BIST 100">BIST 100</option>
                  <option value="BIST TÜM">BIST TÜM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Explainability & Legal Disclaimer Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Açıklanabilir 5 Bileşenli Direnç Kırılım Skoru Modeli (0–100 Puan)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Hisse Detayı ile Tek Doğruluk Kaynağı
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Puan dağılımı: <strong>Direnç Güvenilirliği (25p - Hisse Detayı 0–100 Güç Skoru × 0.25)</strong> + <strong>Kapanışın Direnç Üzerinde Olması (25p)</strong> + <strong>ATR Anlamlılığı (20p)</strong> + <strong>Hacim Teyidi (15p)</strong> + <strong>Mum Kapanış Kalitesi (15p)</strong> = 100 Azami Puan. Fiyatın kırılım sonrası direnç altına geri çekildiği sahte kırılımlar (boğa tuzakları) <strong>-35 puan</strong> ile cezalandırılır veya başarılı kırılımlardan tamamen ayrı tutulur.
              </p>
              <div className="text-amber-400/90 text-[10px] font-mono pt-0.5">
                Yasal Uyarı: Bu skor bir başarı olasılığı (% kâr ihtimali) veya getiri garantisi değildir. Yalnızca geçmiş tamamlanmış mum verilerindeki teknik sağlamlık derecesini ölçer.
              </div>
            </div>
          </div>

          {/* Table */}
          <ResistanceBreakoutTable
            results={results}
            isLoading={isLoading}
            onSelectStock={onSelectStock}
            onOpenBreakoutDetail={item => setSelectedBreakoutDetail(item)}
            sortField={breakoutSortField}
            sortDir={breakoutSortDir}
            onSortChange={field => {
              if (breakoutSortField === field) {
                setBreakoutSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setBreakoutSortField(field);
                setBreakoutSortDir('desc');
              }
            }}
          />

          {/* Pagination */}
          {renderPaginationBar()}
        </div>
      )}

      {/* MOD 2: DİBE YAKIN HİSSELER — %2–5 */}
      {screenerMode === 'NEAR_SUPPORT' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  Dibe Yakın Hisseler (%2–5) Taraması
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fiyatı matematiksel olarak tespit edilmiş güçlü destek seviyesinin %2 ile %5 üzerinde seyreden, stop-loss seviyesi tanımlı hisseler.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => executeScreen(1)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Taranıyor...' : 'Taramayı Yenile'}
                </button>
              </div>
            </div>

            {/* Filter toolbar: Timeframe, Min Dist, Max Dist, Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  Zaman Dilimi:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: '1h', label: '1S' },
                    { id: '4h', label: '4S' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1wk', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedTimeframe === tf.id
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Min Destek Uzaklığı (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={minSupportDist}
                    onChange={e => setMinSupportDist(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Maks Destek Uzaklığı (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={0.5}
                    min={minSupportDist}
                    max={20}
                    value={maxSupportDist}
                    onChange={e => setMaxSupportDist(Math.max(minSupportDist, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Pazar / Endeks:
                </label>
                <select
                  value={indexFilter}
                  onChange={e => setIndexFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ALL">Tüm BIST Evreni</option>
                  <option value="BIST 30">BIST 30</option>
                  <option value="BIST 50">BIST 50</option>
                  <option value="BIST 100">BIST 100</option>
                  <option value="BIST TÜM">BIST TÜM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mathematical definition & Risk Disclaimer Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-200">
                Matematiksel Formül ve Destek İhlali Disiplini
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Destek Uzaklığı = <code>((Güncel Fiyat - Destek) / Destek) * 100</code> formülüyle hesaplanır. Desteğin altındaki hisseler (negatif uzaklık) destek kırılımı sayılır ve listelenmez. Tabloda son 20 bardaki test sayısı, destek dayanıklılık skoru (0–100), ATR ve EMA5/EMA20 trend yönü sunulur.
              </p>
              <div className="text-amber-400/90 text-[10px] font-mono pt-0.5">
                Kritik Risk Uyarısı: Desteğe yakınlık kesinlikle tek başına bir alım sinyali değildir. Desteğin aşağı kırılması durumunda pozisyon kapatma (stop-loss) kurallarına sıkı sıkıya uyulmalıdır.
              </div>
            </div>
          </div>

          {/* Table */}
          <NearSupportTable
            results={results}
            isLoading={isLoading}
            onSelectStock={onSelectStock}
            sortField={supportSortField}
            sortDir={supportSortDir}
            onSortChange={field => {
              if (supportSortField === field) {
                setSupportSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSupportSortField(field);
                setSupportSortDir('asc');
              }
            }}
          />

          {/* Pagination */}
          {renderPaginationBar()}
        </div>
      )}

      {/* MOD 3: AL SİNYALİ ORANI — %40–55 */}
      {screenerMode === 'BUY_SIGNAL_RATIO' && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  AL Sinyali Oranı (%40–55) Taraması
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Çoklu teknik indikatör havuzunun ürettiği AL sinyallerinin, başarıyla hesaplanan geçerli toplam indikatör sayısına oranı.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => executeScreen(1)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Taranıyor...' : 'Taramayı Yenile'}
                </button>
              </div>
            </div>

            {/* Filter toolbar: Timeframe, Min Ratio, Max Ratio, Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-purple-400" />
                  Zaman Dilimi:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: '1h', label: '1S' },
                    { id: '4h', label: '4S' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1wk', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedTimeframe === tf.id
                          ? 'bg-purple-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Min AL Sinyali Oranı (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={1}
                    min={0}
                    max={100}
                    value={minBuyRatio}
                    onChange={e => setMinBuyRatio(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Maks AL Sinyali Oranı (%):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={1}
                    min={minBuyRatio}
                    max={100}
                    value={maxBuyRatio}
                    onChange={e => setMaxBuyRatio(Math.max(minBuyRatio, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Pazar / Endeks:
                </label>
                <select
                  value={indexFilter}
                  onChange={e => setIndexFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value="ALL">Tüm BIST Evreni</option>
                  <option value="BIST 30">BIST 30</option>
                  <option value="BIST 50">BIST 50</option>
                  <option value="BIST 100">BIST 100</option>
                  <option value="BIST TÜM">BIST TÜM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ratio Formula & Correlation Disclaimer Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-200">
                Formül, İndikatör Hariç Tutma Mantığı ve Korelasyon Uyarısı
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Formül: <code>(Üretilen AL Sinyali Sayısı / Geçerli Olarak Hesaplanabilen Toplam İndikatör Sayısı) * 100</code>. Yetersiz veri nedeniyle hesaplanamayan indikatörler hem paydan hem de paydadan kesinlikle hariç tutulur; geçersiz veri nötr veya negatif sayılarak oranı bozamaz.
              </p>
              <div className="text-amber-400/90 text-[10px] font-mono pt-0.5">
                Korelasyon &amp; Yasal Uyarı: EMA5/EMA20 kesişimi ve Bollinger orta bant kırılımı yüksek oranda koreledir ve bağımsız iki delil değildir. Bu oran başarı garantisi veya getiri olasılığı değildir.
              </div>
            </div>
          </div>

          {/* Table */}
          <BuySignalRatioTable
            results={results}
            isLoading={isLoading}
            onSelectStock={onSelectStock}
            onOpenAuditDetail={item => setSelectedSignalAudit(item)}
            sortField={buyRatioSortField}
            sortDir={buyRatioSortDir}
            onSortChange={field => {
              if (buyRatioSortField === field) {
                setBuyRatioSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setBuyRatioSortField(field);
                setBuyRatioSortDir('desc');
              }
            }}
          />

          {/* Pagination */}
          {renderPaginationBar()}
        </div>
      )}

      {/* MOD 4: DOĞRULANMIŞ & KIRILIMI DOĞRULANMIŞ FORMASYONLAR */}
      {(screenerMode === 'VALIDATED_PATTERNS' || screenerMode === 'BREAKOUT_CONFIRMED_PATTERNS') && (
        <div className="space-y-4">
          {/* Header & Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  {screenerMode === 'VALIDATED_PATTERNS' ? (
                    <>
                      <Layers className="w-4 h-4 text-amber-400" />
                      Doğrulanmış Teknik Formasyonlar
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Kırılımı Doğrulanmış Formasyonlar
                    </>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {screenerMode === 'VALIDATED_PATTERNS'
                    ? 'Geometrisi, temas noktaları ve boyun çizgisi tamamlanmış, henüz kırılım mumu kapanışı bekleyen hisseler (Oluşum aşamasındaki formasyonlar listelenmez).'
                    : 'Tamamlanmış mum kapanışıyla boyun çizgisini hacimli kıran ve hedef fiyat projeksiyonu açılmış hisseler.'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowBacktestModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  16 Formasyon Backtest Raporu
                </button>
                <button
                  onClick={() => executeScreen(1)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? 'Taranıyor...' : 'Taramayı Yenile'}
                </button>
              </div>
            </div>

            {/* Filter toolbar: Timeframe, Pattern Type, Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  Zaman Dilimi:
                </label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: '1h', label: '1S' },
                    { id: '4h', label: '4S' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1wk', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setSelectedTimeframe(tf.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                        selectedTimeframe === tf.id
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Formasyon Tipi Filtresi (16 Klasik Formasyon):
                </label>
                <select
                  value={selectedPatternType}
                  onChange={e => setSelectedPatternType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  {PATTERN_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Pazar / Endeks:
                </label>
                <select
                  value={indexFilter}
                  onChange={e => setIndexFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                >
                  <option value="ALL">Tüm BIST Evreni</option>
                  <option value="BIST 30">BIST 30</option>
                  <option value="BIST 50">BIST 50</option>
                  <option value="BIST 100">BIST 100</option>
                  <option value="BIST TÜM">BIST TÜM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pattern Classification & Backtest Methodology Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>3 Aşamalı Katı Formasyon Yaşam Döngüsü</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                  Oluşan → Doğrulanmış → Kırılımı Doğrulanmış
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Geometrisi eksik yapılar (<code>FORMING</code>) elenir. <strong>Doğrulanmış Formasyon</strong> sekmesinde yalnızca geometrisi tamamlanmış ancak henüz kırılmamış hisseler; <strong>Kırılımı Doğrulanmış</strong> sekmesinde ise boyun çizgisini tamamlanmış mum kapanışı ve hacim teyidiyle aşmış hisseler listelenir.
              </p>
              <div className="text-amber-400/90 text-[10px] font-mono pt-0.5">
                BIST Gerçekçi Backtest Notu: Backtest simülasyonu her işlemde %0.15 aracı kurum komisyonu + %0.10 kayma (slippage) sürtünme maliyeti düşülerek, sıfır geleceğe bakma hatasıyla hesaplanmıştır.
              </div>
            </div>
          </div>

          {/* Table */}
          <PatternsTable
            results={results}
            isLoading={isLoading}
            onSelectStock={onSelectStock}
            targetState={screenerMode === 'VALIDATED_PATTERNS' ? 'VALIDATED' : 'BREAKOUT_CONFIRMED'}
            selectedPatternType={selectedPatternType}
          />

          {/* Pagination */}
          {renderPaginationBar()}
        </div>
      )}

      {/* FAZ 4: PİYASA DURUMUNA GÖRE GÖRECELİ GÜÇ TARAMASI (8 KATEGORİ) */}
      {screenerMode === 'RELATIVE_STRENGTH' && (
        <div className="space-y-5">
          {/* Controls Bar: Index, Timeframe & Refresh */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  Piyasa Durumuna Göre Tarama &amp; Göreceli Güç (8 Kategori)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hisseleri tek bir mum rengine göre değil; aynı zaman aralığındaki getirileri, göreceli güç değişimini ve doğrulanmış teknik koşulları kullanarak sınıflandırır.
                </p>
              </div>

              <button
                onClick={executeRsScreen}
                disabled={isRsLoading}
                className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRsLoading ? 'animate-spin' : ''}`} />
                {isRsLoading ? 'Taranıyor...' : 'Taramayı Yenile'}
              </button>
            </div>

            {/* Reference Index & Timeframe Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Referans Endeks:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { sym: 'XU100', name: 'BIST 100' },
                    { sym: 'XU030', name: 'BIST 30' },
                    { sym: 'XU050', name: 'BIST 50' },
                    { sym: 'XBANK', name: 'BIST Banka' },
                    { sym: 'XUSIN', name: 'BIST Sınai' }
                  ].map(idx => (
                    <button
                      key={idx.sym}
                      onClick={() => setRsIndexSymbol(idx.sym)}
                      className={`px-3 py-1.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                        rsIndexSymbol === idx.sym
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {idx.sym} ({idx.name})
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1.5 uppercase text-[10px] tracking-wider">
                  Zaman Dilimi:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: '1h', label: '1 Saat' },
                    { id: '4h', label: '4 Saat' },
                    { id: '1d', label: 'Günlük' },
                    { id: '1w', label: 'Haftalık' },
                    { id: '1mo', label: 'Aylık' }
                  ].map(tf => (
                    <button
                      key={tf.id}
                      onClick={() => setRsTimeframe(tf.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        rsTimeframe === tf.id
                          ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/40'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Current Market Regime & Strict Rule Card */}
          {rsRegime && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] font-mono uppercase text-slate-400">Referans Endeks Durumu:</div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-100">{rsRegime.indexName} ({rsRegime.indexSymbol}): {rsRegime.currentPrice.toFixed(2)} TL</span>
                  <span className="text-slate-600">·</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    rsRegime.regime === 'STRONG_BULL'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : rsRegime.regime === 'WEAK_BULL'
                      ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                      : rsRegime.regime === 'SIDEWAYS'
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : rsRegime.regime === 'WEAK_BEAR'
                      ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}>
                    {rsRegime.regimeLabel}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-sans max-w-md sm:text-right">
                {rsRegime.description}
              </div>
            </div>
          )}

          {/* 8 Categories Filter Navigation */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              8 Piyasa Durumu Tarama Kategorisi:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {RS_CATEGORIES.map(cat => {
                const isSelected = rsCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setRsCategory(cat.id)}
                    className={`p-2.5 rounded-lg text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs leading-snug">{cat.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Table */}
          {isRsLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-xs text-slate-400 font-mono">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              {rsIndexSymbol} referans alınarak {rsTimeframe} zaman diliminde {rsCategory} kategorisi için BIST hisseleri taranıyor...
            </div>
          ) : rsResults.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center space-y-2 text-xs text-slate-400">
              <div className="text-sm font-semibold text-slate-200">Bu Kategoriye Uygun Hisse Bulunamadı</div>
              <p>Mevcut piyasa koşullarında seçili endeks ve zaman diliminde aranan kriterleri sağlayan hisse bulunmuyor veya piyasa ters rejimde.</p>
              <button
                onClick={() => setRsCategory('ALL')}
                className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
              >
                Tüm Kategorileri Göster
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Toplam Eşleşen: <strong className="text-slate-100 font-mono">{rsTotalCount}</strong> hisse
                </span>
                <span className="text-slate-500 font-mono text-[11px]">
                  Sıralama: Göreceli Güç Skoru (RS Score) En Yüksek
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[11px] text-slate-400 font-medium uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3.5">Hisse / Sektör</th>
                      <th className="py-3 px-3.5">Fiyat / Değişim</th>
                      <th className="py-3 px-3.5">Hisse Getirisi</th>
                      <th className="py-3 px-3.5">Endeks Getirisi</th>
                      <th className="py-3 px-3.5">Göreceli Alfa</th>
                      <th className="py-3 px-3.5">RS Skoru</th>
                      <th className="py-3 px-3.5">Eşleşen Kategori</th>
                      <th className="py-3 px-3.5">Doğrulanmış Teknik Gerekçe</th>
                      <th className="py-3 px-3.5 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs tabular-nums">
                    {rsResults.map(item => (
                      <tr key={item.symbol} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3.5 font-sans">
                          <button
                            onClick={() => onSelectStock(item.symbol)}
                            className="font-bold text-slate-100 hover:text-emerald-400 font-mono text-sm block cursor-pointer"
                          >
                            {item.symbol}
                          </button>
                          <span className="text-[10px] text-slate-400 truncate max-w-[130px] block">
                            {item.name} · {item.sector}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-100">{item.currentPrice.toFixed(2)} TL</div>
                          <span className={`text-[11px] ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.changePercent >= 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className={`font-bold ${item.stockReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.stockReturnPct >= 0 ? `+${item.stockReturnPct}%` : `${item.stockReturnPct}%`}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className={`${item.indexReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.indexReturnPct >= 0 ? `+${item.indexReturnPct}%` : `${item.indexReturnPct}%`}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.relativeAlphaPct >= 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {item.relativeAlphaPct >= 0 ? `+${item.relativeAlphaPct}%` : `${item.relativeAlphaPct}%`}
                          </span>
                        </td>

                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200">{item.rsScore}/100</span>
                            <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full ${item.rsScore >= 60 ? 'bg-emerald-400' : item.rsScore <= 40 ? 'bg-rose-400' : 'bg-amber-400'}`}
                                style={{ width: `${item.rsScore}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3.5 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                            {item.categoryTitle}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 font-sans text-slate-400 text-[11px] max-w-xs leading-relaxed">
                          {item.technicalReason}
                        </td>

                        <td className="py-3 px-3.5 text-right font-sans">
                          <button
                            onClick={() => onSelectStock(item.symbol)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Detay &amp; Analiz
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. Modal: Hangi Koşulların Sağlandığının Detaylı Açıklaması */}
      {selectedStockExplanation && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  {selectedStockExplanation.stock.symbol} — Koşul Değerlendirme Raporu
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedStockExplanation.stock.name}</p>
              </div>
              <button
                onClick={() => setSelectedStockExplanation(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sağlanan Koşullar ({selectedStockExplanation.matchedConditions.length})
                </h4>
                {selectedStockExplanation.matchedConditions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Hiçbir koşul sağlanmadı.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {selectedStockExplanation.matchedConditions.map((exp, idx) => (
                      <li key={idx} className="text-xs text-slate-200 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2 flex items-start gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedStockExplanation.unmatchedConditions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-slate-500" />
                    Sağlanmayan Koşullar ({selectedStockExplanation.unmatchedConditions.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedStockExplanation.unmatchedConditions.map((exp, idx) => (
                      <li key={idx} className="text-xs text-slate-400 bg-slate-950/60 border border-slate-800 rounded-lg p-2 flex items-start gap-2">
                        <span className="text-slate-600 mt-0.5">•</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setSelectedStockExplanation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal: Veri Alınamayan Hisseler ve Kök Neden Analizi */}
      {showExcludedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Kapsam Dışı ve Veri Alınamayan Hisseler ({excludedStocks.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Borsa İstanbul pay senedi evreninde işlem durumu değişen, birleşen, kot dışı kalan veya veri akışı sağlanamayan hisselerin ayrıntılı dökümü
                </p>
              </div>
              <button
                onClick={() => setShowExcludedModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Feedback notification after retry */}
            {retryResultFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
                <span>{retryResultFeedback}</span>
                <button
                  onClick={() => setRetryResultFeedback(null)}
                  className="text-emerald-400 hover:text-white text-xs ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Filter Tabs & Bulk Retry Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'ALL', label: 'Tümü', count: excludedStocks.length },
                  { id: 'DELISTED', label: 'Kot Dışı / Kod Değişen', count: excludedStocks.filter(e => e.errorType === 'DELISTED_OR_NOT_FOUND').length },
                  { id: 'HALTED', label: 'Askıda / Kapalı', count: excludedStocks.filter(e => e.errorType === 'HALTED_OR_SUSPENDED').length },
                  { id: 'NETWORK', label: 'Ağ / Hız Sınırı', count: excludedStocks.filter(e => e.errorType === 'RATE_LIMITED' || e.errorType === 'NETWORK_TIMEOUT').length },
                  { id: 'OTHER', label: 'Yetersiz Veri / Diğer', count: excludedStocks.filter(e => e.errorType === 'INSUFFICIENT_BARS' || e.errorType === 'EMPTY_RESPONSE' || e.errorType === 'UNKNOWN').length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setExcludedFilterType(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      excludedFilterType === tab.id
                        ? 'bg-slate-800 text-slate-100 border border-slate-700 shadow-sm'
                        : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    {tab.label} <span className="font-mono text-[10px] opacity-75">({tab.count})</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleRetryFailed()}
                disabled={isRetryingFailed || isLoading}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetryingFailed ? 'animate-spin' : ''}`} />
                <span>{isRetryingFailed ? 'Deneniyor...' : 'Tümünü Yeniden Dene'}</span>
              </button>
            </div>

            {/* Explanatory Info Card */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Borsa İstanbul Veri Sağlayıcı Eşleştirmesi:</span>
              </div>
              <p>
                Yahoo Finance feed üzerinde borsa kotundan çıkarılan (örn. DOBUR, KARYE, MIPAZ, PEGYO) veya holding birleşmesine giden paylar resmi bildirimlerle işaretlenmiştir. Yeniden denenebilir ağ/hız sınırı durumları otomatik olarak kurtarılır.
              </p>
            </div>

            {/* Stock List Scroll Area */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-800/60 space-y-1 pr-1">
              {excludedStocks
                .filter(exc => {
                  if (excludedFilterType === 'ALL') return true;
                  if (excludedFilterType === 'DELISTED') return exc.errorType === 'DELISTED_OR_NOT_FOUND';
                  if (excludedFilterType === 'HALTED') return exc.errorType === 'HALTED_OR_SUSPENDED';
                  if (excludedFilterType === 'NETWORK') return exc.errorType === 'RATE_LIMITED' || exc.errorType === 'NETWORK_TIMEOUT';
                  if (excludedFilterType === 'OTHER') return exc.errorType === 'INSUFFICIENT_BARS' || exc.errorType === 'EMPTY_RESPONSE' || exc.errorType === 'UNKNOWN';
                  return true;
                })
                .map((exc) => {
                  const isDelisted = exc.errorType === 'DELISTED_OR_NOT_FOUND';
                  const isHalted = exc.errorType === 'HALTED_OR_SUSPENDED';
                  const isRetryingThis = retryingSymbol === exc.symbol;

                  return (
                    <div key={exc.symbol} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200 text-sm">{exc.symbol}</span>
                          <span className="text-slate-400 font-medium truncate max-w-[240px] sm:max-w-[340px]">
                            {exc.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                            {exc.segment}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span className="text-amber-300 font-medium">
                            {isDelisted
                              ? 'Borsa kotundan çıkmış veya sağlayıcıda işlem kodu bulunmuyor'
                              : exc.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isDelisted ? (
                          <span className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[10px] font-medium">
                            Kot Dışı
                          </span>
                        ) : isHalted ? (
                          <span className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 text-[10px] font-medium">
                            Askıda
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRetryFailed([exc.symbol])}
                            disabled={isRetryingThis || isRetryingFailed}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRetryingThis ? 'animate-spin' : ''}`} />
                            <span>{isRetryingThis ? 'Deneniyor...' : 'Yeniden Dene'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Toplam <strong>{excludedStocks.length}</strong> hisse tarama kapsamı dışında
              </span>
              <button
                onClick={() => setShowExcludedModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal: Profil Kaydet */}
      {showSaveProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Save className="w-5 h-5 text-emerald-400" />
              Tarama Profilini Kaydet
            </h3>
            <p className="text-xs text-slate-400">
              Mevcut zaman dilimi, seçili {selectedConditions.length} koşul ve AND/OR mantığı profil olarak saklanır.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Profil Adı</label>
                <input
                  type="text"
                  placeholder="Ör. Hacimli Kırılım Stratejim"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama (İsteğe bağlı)</label>
                <textarea
                  placeholder="Profil stratejisi ve amaçları..."
                  value={profileDescInput}
                  onChange={(e) => setProfileDescInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 h-20 resize-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSaveProfileModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={!profileNameInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-40"
              >
                Profili Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. Modal: Kişiye Özel İndikatör Koşulu Ekle */}
      {showCustomRuleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Kişiye Özel İndikatör Kuralı Tanımla
            </h3>
            <p className="text-xs text-slate-400">
              Tamamen güvenli, whitelist tabanlı matematiksel koşul oluşturun.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Kural Adı</label>
                <input
                  type="text"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Gösterge</label>
                  <select
                    value={newRuleIndicator}
                    onChange={(e) => setNewRuleIndicator(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="RSI">RSI (14)</option>
                    <option value="EMA5">EMA (5)</option>
                    <option value="EMA20">EMA (20)</option>
                    <option value="EMA50">EMA (50)</option>
                    <option value="EMA200">EMA (200)</option>
                    <option value="VOLUME_RATIO">Hacim Oranı</option>
                    <option value="MACD_HIST">MACD Histogram</option>
                    <option value="ATR">ATR (14)</option>
                    <option value="BOLLINGER_BANDWIDTH">Bollinger Bant Genişliği</option>
                    <option value="LAST_PRICE">Son Fiyat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operatör</label>
                  <select
                    value={newRuleOperator}
                    onChange={(e) => setNewRuleOperator(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value=">">Büyüktür (&gt;)</option>
                    <option value=">=">Büyük Eşittir (&gt;=)</option>
                    <option value="<">Küçüktür (&lt;)</option>
                    <option value="<=">Küçük Eşittir (&lt;=)</option>
                    <option value="==">Eşittir (==)</option>
                    <option value="CROSS_ABOVE">Yukarı Kesişim</option>
                    <option value="CROSS_BELOW">Aşağı Kesişim</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Karşılaştırma Türü</label>
                  <select
                    value={newRuleCompareTo}
                    onChange={(e) => setNewRuleCompareTo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                  >
                    <option value="VALUE">Sabit Sayısal Değer</option>
                    <option value="INDICATOR">Başka Bir İndikatör</option>
                  </select>
                </div>

                <div>
                  {newRuleCompareTo === 'VALUE' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Değer</label>
                      <input
                        type="number"
                        step="any"
                        value={newRuleTargetValue}
                        onChange={(e) => setNewRuleTargetValue(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Hedef İndikatör</label>
                      <select
                        value={newRuleTargetIndicator}
                        onChange={(e) => setNewRuleTargetIndicator(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100"
                      >
                        <option value="EMA5">EMA (5)</option>
                        <option value="EMA20">EMA (20)</option>
                        <option value="EMA50">EMA (50)</option>
                        <option value="EMA200">EMA (200)</option>
                        <option value="LAST_PRICE">Son Fiyat</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCustomRuleModal(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                İptal
              </button>
              <button
                onClick={handleAddCustomRule}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Kuralı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Modal: Sunucu Tarafı Otomasyon ve Zamanlanmış Görevler */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Server className="w-5 h-5 text-cyan-400" />
                  Sunucu Tarafı Otomatik Görev Yönetimi
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tarayıcı kapalı olsa dahi Node.js sunucusunda arka planda bağımsız çalışan otomasyon motoru
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Daemon Health Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px]">SUNUCU DAEMON</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ÇALIŞIYOR
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">UPTIME (ÇALIŞMA)</span>
                <span className="text-slate-200">{serverStatus?.uptimeSeconds ? `${serverStatus.uptimeSeconds} sn` : 'Aktif'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SEANS KAPANISI</span>
                <span className="text-amber-400 font-semibold">{calendarStatus?.sessionCloseTimeStr || '18:15'}</span>
              </div>
            </div>

            {/* Configured Schedules List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Aktif Otomatik Görevler ({schedules.length}):
              </h4>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {schedules.map(sched => (
                  <div
                    key={sched.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {sched.profileName}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {sched.mode === 'POST_CLOSE' ? 'Seans Sonu Kapanış' : sched.mode === 'SCHEDULED_TIME' ? 'Zaman Ayarlı' : 'Koşul Tetiklemeli'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sched.lastRunSummary || 'Sunucu zamanlayıcısı hazır'}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          await apiClient.runScreenerSchedule(sched.id);
                          alert(`${sched.profileName} sunucu tarafında çalıştırıldı.`);
                        } catch (err: any) {
                          alert(err.message || 'Çalıştırma başarısız.');
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Çalıştır
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Direnç Kırılım Skoru Ayrıntılı Değerlendirmesi */}
      {selectedBreakoutDetail && (
        <BreakoutScoreModal
          item={selectedBreakoutDetail}
          onSelectStock={onSelectStock}
          onClose={() => setSelectedBreakoutDetail(null)}
        />
      )}

      {/* Modal: AL Sinyali Oranı İndikatör Denetim Listesi */}
      {selectedSignalAudit && (
        <SignalAuditModal
          item={selectedSignalAudit}
          onSelectStock={onSelectStock}
          onClose={() => setSelectedSignalAudit(null)}
        />
      )}

      {/* Modal: Formasyon Tarihsel Backtest İstatistikleri */}
      {showBacktestModal && (
        <PatternBacktestModal
          summaries={patternBacktestSummaries}
          isLoading={isBacktestLoading}
          onClose={() => setShowBacktestModal(false)}
        />
      )}
    </div>
  );
};
