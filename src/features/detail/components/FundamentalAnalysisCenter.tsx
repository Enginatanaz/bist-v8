import React, { useState } from 'react';
import {
  StockFundamentalCenterData,
  AIFundamentalSynthesis,
  KAPNewsImpactItem
} from '../../../types';
import { apiClient } from '../../../services/apiClient';
import {
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  PieChart,
  FileText,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Award,
  Zap,
  Briefcase,
  HelpCircle,
  CopyCheck
} from 'lucide-react';

interface FundamentalAnalysisCenterProps {
  data: StockFundamentalCenterData | null;
  isLoading: boolean;
  onRefresh?: () => void;
  selectedSymbol: string;
}

export const FundamentalAnalysisCenter: React.FC<FundamentalAnalysisCenterProps> = ({
  data,
  isLoading,
  onRefresh,
  selectedSymbol
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeSection, setActiveSection] = useState<
    | 'SUMMARY'
    | 'STATEMENTS'
    | 'VALUATION'
    | 'PROFITABILITY'
    | 'DEBT'
    | 'CASHFLOW'
    | 'KAP_NEWS'
    | 'CAPITAL_INCREASES'
    | 'SCORING'
    | 'IMPACT'
    | 'AI_SYNTHESIS'
  >('SUMMARY');

  // Statement Tab: Balance Sheet, Income Statement, Cash Flow
  const [statementView, setStatementView] = useState<'INCOME' | 'BALANCE' | 'CASHFLOW'>('INCOME');
  // KAP Days Filter: 30, 90, 180, 365
  const [kapDayFilter, setKapDayFilter] = useState<number>(90);
  // AI Regenerating state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [customSynthesis, setCustomSynthesis] = useState<AIFundamentalSynthesis | null>(null);

  if (isLoading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                TEMEL ANALİZ MERKEZİ
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {selectedSymbol}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Finansal tablolar, değerleme oranları ve KAP bildirimleri yükleniyor...</p>
            </div>
          </div>
          <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
        </div>
      </div>
    );
  }

  const {
    stock,
    statements,
    valuation,
    profitability,
    debtHealth,
    cashFlow,
    growth,
    kapNews,
    kapItems,
    capitalIncreases,
    fundamentalScore,
    compositeScore,
    probableImpact,
    aiSynthesis
  } = data;

  const fallbackSynthesis: AIFundamentalSynthesis = {
    generalEvaluation: `${stock.symbol} (${stock.name}) için temel analiz verileri incelenmiştir.`,
    fundamentalScoreRationale: 'Temel analiz puanı 6 ana kategorinin ağırlıklı ortalamasıdır.',
    financialStatementEvaluation: 'Finansal tablolar konsolide bazda değerlendirilmiştir.',
    valuationEvaluation: 'Değerleme oranları sektör ortalamaları ile kıyaslanmıştır.',
    debtAndCashFlowEvaluation: 'Borçluluk ve nakit akışı dengesi izlenmektedir.',
    recentKapImpact: 'KAP bildirimleri takip edilmektedir.',
    newsProsAndCons: 'Haber akışı piyasa koşullarına paralel seyretmektedir.',
    rightsIssueAndFundUsage: 'Sermaye artırımları SPK bültenleri doğrultusunda incelenmektedir.',
    technicalAndFundamentalAlignment: 'ALIGNED_BULLISH',
    technicalAndFundamentalText: 'Teknik ve temel göstergeler birlikte izlenmektedir.',
    criticalRisks: ['Piyasa dalgalanmaları', 'Sektörel riskler'],
    upcomingCatalystsToWatch: ['Finansal raporlama takvimi'],
    overallConclusion: 'Yatırım kararlarında risk yönetimi esastır.',
    dataReliabilityNote: 'KAP ve finansal tablolardan derlenmiştir. Yatırım tavsiyesi değildir.',
    generatedAt: new Date().toISOString(),
    isAiGenerated: false
  };

  const currentSynthesis: AIFundamentalSynthesis = customSynthesis || aiSynthesis || fallbackSynthesis;


  const handleGenerateAi = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await apiClient.generateFundamentalAiReport(stock.symbol);
      setCustomSynthesis(res);
    } catch (err: any) {
      console.warn('AI report generation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const filteredKapItems = kapItems.filter(item => {
    const pub = new Date(item.publishDate).getTime();
    const cutoff = Date.now() - kapDayFilter * 24 * 60 * 60 * 1000;
    return pub >= cutoff;
  });

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case 'COK_GUCLU':
        return <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 text-xs font-mono font-bold">Çok Güçlü</span>;
      case 'GUCLU':
        return <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-600 text-xs font-mono font-bold">Güçlü</span>;
      case 'ORTA_IYI':
        return <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 text-xs font-mono font-bold">Orta-İyi</span>;
      case 'ORTA_ALT':
        return <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 text-xs font-mono font-bold">Orta-Alt</span>;
      case 'ZAYIF':
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 text-xs font-mono font-bold">Zayıf</span>;
      default:
        return <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 text-xs font-mono font-bold">Çok Zayıf</span>;
    }
  };

  const getEvaluationBadge = (evalType: string) => {
    switch (evalType) {
      case 'POSITIVE':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-semibold">Olumlu</span>;
      case 'NEGATIVE':
        return <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 text-[10px] font-mono font-semibold">Olumsuz</span>;
      case 'NEUTRAL':
        return <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono font-semibold">Nötr</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">Belirlenemedi</span>;
    }
  };

  const sections = [
    { id: 'SUMMARY', label: '1. Temel Özet', icon: Award },
    { id: 'STATEMENTS', label: '2. Finansal Tablolar', icon: FileText },
    { id: 'VALUATION', label: '3. Değerleme', icon: Scale },
    { id: 'PROFITABILITY', label: '4. Kârlılık & Büyüme', icon: TrendingUp },
    { id: 'DEBT', label: '5. Borçluluk & Sağlık', icon: ShieldCheck },
    { id: 'CASHFLOW', label: '6. Nakit Akışı', icon: DollarSign },
    { id: 'KAP_NEWS', label: `7. KAP & Haberler (${kapItems.length})`, icon: Briefcase },
    { id: 'CAPITAL_INCREASES', label: '8. Sermaye Artırımları', icon: Percent },
    { id: 'SCORING', label: '9. Puanlama Sistemi', icon: PieChart },
    { id: 'IMPACT', label: '10. Muhtemel Etki', icon: Zap },
    { id: 'AI_SYNTHESIS', label: '11. AI Yorumu & Sentez', icon: Sparkles },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all">
      {/* 1. Header Banner & Quick Metrics */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-100 tracking-tight flex items-center gap-2 font-mono">
                  TEMEL ANALİZ MERKEZİ
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono font-bold">
                  {stock.symbol}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {stock.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-mono font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> GERÇEK VERİ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Şirket finansal tabloları, değerleme rasyoları, nakit akımı, borçluluk, KAP açıklamaları ve sermaye artırımlarının açıklanabilir analizi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Verileri Yenile"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {isExpanded ? (
                <>Paneli Daralt <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <>Paneli Genişlet <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>

        {/* Top 3 Score Cards & Metadata Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          {/* Card 1: Temel Analiz Puanı */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Temel Analiz Puanı
              </span>
              {getRatingBadge(fundamentalScore.ratingCategory)}
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {fundamentalScore.totalFundamentalScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 10</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 truncate">
              6 ağırlıklı finansal kategori ortalaması
            </span>
          </div>

          {/* Card 2: KAP & Haber Etki Puanı */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                KAP & Haber Puanı
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                kapNews.newsFlowTrend90d === 'IMPROVING'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {kapNews.newsFlowTrend90d === 'IMPROVING' ? 'Pozitif Akış' : 'Dengeli Akış'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-extrabold font-mono text-cyan-400 tracking-tight">
                {kapNews.overallImpactScore.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 10</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1 truncate">
              {kapNews.positiveCount} Olumlu · {kapNews.negativeCount} Olumsuz · {kapNews.neutralCount} Nötr
            </span>
          </div>

          {/* Card 3: Birleşik Temel Değerlendirme (Unified Score) */}
          <div className="bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-emerald-300 font-extrabold uppercase tracking-wider">
                Birleşik Değerlendirme
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                %70 Temel + %30 KAP
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-extrabold font-mono text-emerald-300 tracking-tight">
                {compositeScore.compositeScore.toFixed(1)}
              </span>
              <span className="text-xs text-emerald-400/80 font-mono">/ 10</span>
            </div>
            <span className="text-[10px] text-emerald-400/90 block mt-1 truncate font-medium">
              Açıklanabilir Sentez Puanı
            </span>
          </div>

          {/* Card 4: Quick Financial Metadata */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Bilanço Dönemi:</span>
              <strong className="text-slate-200">{statements.period.split(' ')[0]}</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Piyasa Değeri:</span>
              <strong className="text-slate-200">{(stock.marketCapTL / 1e9).toFixed(2)} Milyar TL</strong>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Son Bilanço:</span>
              <span className="text-slate-300">{data.lastFinancialReportDate}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Veri Yeterliliği:</span>
              <span className="text-emerald-400 font-bold">{data.dataCompleteness} (%100)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Expandable Body */}
      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800 text-xs font-medium">
            {sections.map(sec => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`px-3 py-2 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {sec.label}
                </button>
              );
            })}
          </div>

          {/* ============================================================== */}
          {/* SECTION 1: TEMEL ANALİZ ÖZETİ (EXECUTIVE SUMMARY) */}
          {/* ============================================================== */}
          {activeSection === 'SUMMARY' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    {stock.symbol} Yönetici Temel Analiz Özeti
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Dönem: {statements.period}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {currentSynthesis.generalEvaluation}
                </p>
              </div>

              {/* Top 3 Positives & Top 3 Negatives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Positive Drivers */}
                <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <TrendingUp className="w-4 h-4" />
                    En Belirgin 3 Olumlu Faktör
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {fundamentalScore.topPositiveFactors.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Negative Risks */}
                <div className="bg-slate-950 border border-amber-900/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    En Belirgin 3 Risk & Dikkat Edilecek Faktör
                  </div>
                  <ul className="space-y-2 text-xs text-slate-300">
                    {fundamentalScore.topNegativeFactors.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-amber-950/20 border border-amber-900/40 p-2.5 rounded-lg">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-mono text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 6 Category Score Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(fundamentalScore.categories).map(([key, item]) => {
                  const labels: Record<string, string> = {
                    profitability: 'Kârlılık (%20)',
                    growth: 'Büyüme (%15)',
                    debtHealth: 'Borçluluk (%20)',
                    cashFlow: 'Nakit Akışı (%15)',
                    valuation: 'Değerleme (%20)',
                    capitalEfficiency: 'Verimlilik (%10)'
                  };
                  return (
                    <div key={key} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block truncate">{labels[key]}</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-lg font-bold font-mono text-slate-100">{item.score.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-500 font-mono">/ 10</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block truncate" title={item.notes}>
                        {item.notes}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: FİNANSAL TABLOLAR (STATEMENTS) */}
          {/* ============================================================== */}
          {activeSection === 'STATEMENTS' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Tablo Seçimi:</span>
                  {[
                    { id: 'INCOME', label: 'Gelir Tablosu' },
                    { id: 'BALANCE', label: 'Bilanço' },
                    { id: 'CASHFLOW', label: 'Nakit Akım Tablosu' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatementView(tab.id as any)}
                      className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                        statementView === tab.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Dönem: {statements.period} (Para Birimi: {statements.currency})
                </span>
              </div>

              {/* Enflasyon Muhasebesi Uyarısı */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2.5 text-xs text-amber-300">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="leading-relaxed font-sans">
                  <strong>Enflasyon Muhasebesi (TMS 29) Uyarısı: </strong>
                  {statements.inflationAccountingNote}
                </div>
              </div>

              {/* Table Render */}
              <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Kalem</th>
                      <th className="py-2.5 px-4 text-right">{statements.period}</th>
                      <th className="py-2.5 px-4 text-right">{statements.previousPeriod}</th>
                      <th className="py-2.5 px-4 text-right">{statements.annualPeriod}</th>
                      <th className="py-2.5 px-4 text-right">Değişim %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {statementView === 'INCOME' && statements.incomeStatement.rows.map(row => (
                      <tr key={row.id} className={row.isTotal ? 'bg-slate-900/50 font-bold text-slate-100' : 'hover:bg-slate-900/30'}>
                        <td className="py-2 px-4 font-sans" style={{ paddingLeft: `${16 + row.depth * 16}px` }}>
                          {row.label}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {row.currentPeriodValue !== null ? `${(row.currentPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.previousPeriodValue !== null ? `${(row.previousPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.annualPreviousValue !== null ? `${(row.annualPreviousValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className={`py-2 px-4 text-right ${
                          (row.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {row.changePercent ? `%${row.changePercent.toFixed(1)}` : '-'}
                        </td>
                      </tr>
                    ))}

                    {statementView === 'BALANCE' && [
                      ...statements.balanceSheet.currentAssets,
                      ...statements.balanceSheet.nonCurrentAssets,
                      ...statements.balanceSheet.shortTermLiabilities,
                      ...statements.balanceSheet.longTermLiabilities,
                      ...statements.balanceSheet.equity
                    ].map(row => (
                      <tr key={row.id} className={row.isTotal ? 'bg-slate-900/50 font-bold text-slate-100' : 'hover:bg-slate-900/30'}>
                        <td className="py-2 px-4 font-sans" style={{ paddingLeft: `${16 + row.depth * 16}px` }}>
                          {row.label}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {row.currentPeriodValue !== null ? `${(row.currentPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.previousPeriodValue !== null ? `${(row.previousPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.annualPreviousValue !== null ? `${(row.annualPreviousValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className={`py-2 px-4 text-right ${
                          (row.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {row.changePercent ? `%${row.changePercent.toFixed(1)}` : '-'}
                        </td>
                      </tr>
                    ))}

                    {statementView === 'CASHFLOW' && statements.cashFlowStatement.rows.map(row => (
                      <tr key={row.id} className={row.isTotal ? 'bg-slate-900/50 font-bold text-slate-100' : 'hover:bg-slate-900/30'}>
                        <td className="py-2 px-4 font-sans" style={{ paddingLeft: `${16 + row.depth * 16}px` }}>
                          {row.label}
                        </td>
                        <td className="py-2 px-4 text-right">
                          {row.currentPeriodValue !== null ? `${(row.currentPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.previousPeriodValue !== null ? `${(row.previousPeriodValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-slate-400">
                          {row.annualPreviousValue !== null ? `${(row.annualPreviousValue / 1e9).toFixed(2)} Milyar TL` : '-'}
                        </td>
                        <td className={`py-2 px-4 text-right ${
                          (row.changePercent || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {row.changePercent ? `%${row.changePercent.toFixed(1)}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: DEĞERLEME GÖSTERGELERİ (VALUATION) */}
          {/* ============================================================== */}
          {activeSection === 'VALUATION' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    Değerleme Çarpanları ve Sektörel Kıyaslama
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Sektör: {valuation.sectorComparison.sectorName} ({valuation.sectorComparison.peerCount} Şirket)
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                  {valuation.sectorComparison.note}
                </p>

                {/* Sektör Karşılaştırma Tablosu */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Şirket F/K</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{valuation.pe.value || '-'}</span>
                    <span className="text-[10px] text-slate-500 block">Sektör: {valuation.sectorComparison.sectorAvgPe}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Şirket PD/DD</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{valuation.pb.value || '-'}</span>
                    <span className="text-[10px] text-slate-500 block">Sektör: {valuation.sectorComparison.sectorAvgPb}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">FD/FAVÖK</span>
                    <span className="text-base font-bold font-mono text-cyan-400">{valuation.evEbitda.value || '-'}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{valuation.evEbitda.isMeaningful ? 'Sanayi Kriteri' : 'Bankada Geçersiz'}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 block">Özsermaye Kârlılığı (ROE)</span>
                    <span className="text-base font-bold font-mono text-emerald-400">%{valuation.roe.value || '-'}</span>
                    <span className="text-[10px] text-slate-500 block">Yıllıklandırılmış</span>
                  </div>
                </div>

                {/* All Valuation Metrics Grid */}
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 font-mono text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Gösterge</th>
                        <th className="py-2.5 px-3 text-right">Değer</th>
                        <th className="py-2.5 px-3">Değerlendirme</th>
                        <th className="py-2.5 px-3">Açıklama & Kural</th>
                        <th className="py-2.5 px-3">Kaynak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Fiyat / Kazanç (F/K)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{valuation.pe.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.pe.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{valuation.pe.reasonIfNot}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Piyasa Değeri / Defter Değeri (PD/DD)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{valuation.pb.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.pb.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{valuation.pb.notes}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Firma Değeri / FAVÖK (FD/FAVÖK)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{valuation.evEbitda.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.evEbitda.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{valuation.evEbitda.reasonIfNot}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">FD / Satışlar</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{valuation.evSales.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.evSales.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Firma değerinin yıllık ciroya oranı</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Özsermaye Kârlılığı (ROE)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">%{valuation.roe.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.roe.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Yıllık net kârın özkaynaklara oranı</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Aktif Kârlılığı (ROA)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">%{valuation.roa.value || '-'}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.roa.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Yıllık net kârın toplam varlıklara oranı</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Temettü Verimi %</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">%{valuation.dividendYield.value || 0}</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.dividendYield.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Son 1 yılda ödenen nakit kâr payı verimi</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP Kâr Dağıtım</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Hisse Başına Kazanç (EPS)</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{valuation.eps.value || '-'} TL</td>
                        <td className="py-2.5 px-3">{getEvaluationBadge(valuation.eps.evaluation)}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Pay başına düşen yıllıklandırılmış net kâr</td>
                        <td className="py-2.5 px-3 font-sans text-slate-500 text-[10px]">KAP 2026/06</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 4: KÂRLILIK VE BÜYÜME (PROFITABILITY & GROWTH) */}
          {/* ============================================================== */}
          {activeSection === 'PROFITABILITY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Brüt Kâr Marjı</span>
                  <span className="text-lg font-bold font-mono text-slate-100">%{profitability.grossMarginPct || '-'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">Brüt Kâr / Hasılat</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Faaliyet Kâr Marjı</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">%{profitability.operatingMarginPct || '-'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">Faaliyet Kârı / Hasılat</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">FAVÖK Marjı</span>
                  <span className="text-lg font-bold font-mono text-cyan-400">{profitability.ebitdaMarginPct !== null ? `%${profitability.ebitdaMarginPct}` : 'Bankada Yok'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">Operasyonel Marj</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Net Kâr Marjı</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">%{profitability.netMarginPct || '-'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">Net Kâr / Hasılat</span>
                </div>
              </div>

              {/* 3 Yıllık Büyüme Eğilimleri */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  3 Yıllık Büyüme Eğilimleri (Bileşik Değişim)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Hasılat Büyümesi</span>
                    <strong className="text-emerald-400 text-sm">+{growth.revenueGrowth3Y}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Net Kâr Büyümesi</span>
                    <strong className="text-emerald-400 text-sm">+{growth.netIncomeGrowth3Y}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">FAVÖK Büyümesi</span>
                    <strong className="text-cyan-400 text-sm">+{growth.ebitdaGrowth3Y}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Özsermaye Büyümesi</span>
                    <strong className="text-slate-200 text-sm">+{growth.equityGrowth3Y}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Varlık Büyümesi</span>
                    <strong className="text-slate-200 text-sm">+{growth.assetGrowth3Y}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Borç Büyümesi</span>
                    <strong className="text-amber-400 text-sm">+{growth.debtGrowth3Y}%</strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  <strong>Sürdürülebilirlik Notu: </strong>
                  {growth.nonRecurringItemsNote}
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 5: BORÇLULUK VE FİNANSAL SAĞLIK (DEBT & SOLVENCY) */}
          {/* ============================================================== */}
          {activeSection === 'DEBT' && (
            <div className="space-y-4">
              {debtHealth.distressRiskFlag ? (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="font-bold">Finansal Sıkıntı Riski Bayrağı: </strong>
                    <span>{debtHealth.distressRiskNotes.join(' ')}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Şirketin borçluluk ve likidite oranları finansal sıkıntı eşiklerinin üzerindedir.</span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Toplam Borç</span>
                  <span className="text-base font-bold text-slate-100">{(debtHealth.totalDebtTL / 1e9).toFixed(2)} Milyar TL</span>
                  <span className="text-[10px] text-slate-500 block">Kısa + Uzun Finansal</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Net Borç</span>
                  <span className={`text-base font-bold ${debtHealth.netDebtTL < 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {debtHealth.netDebtTL < 0 ? 'Net Nakit Fazlası' : `${(debtHealth.netDebtTL / 1e9).toFixed(2)} Milyar TL`}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">Borçlar - Nakit Varlıklar</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Cari Oran</span>
                  <span className={`text-base font-bold ${
                    debtHealth.currentRatio !== null && debtHealth.currentRatio >= 1.5 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {debtHealth.currentRatio !== null ? `${debtHealth.currentRatio}x` : 'Bankada Yok'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">Dönen Varlık / KVY</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Faiz Karşılama Oranı</span>
                  <span className="text-base font-bold text-emerald-400">
                    {debtHealth.interestCoverageRatio.value !== null ? `${debtHealth.interestCoverageRatio.value}x` : 'Hesaplanamıyor'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate">Faaliyet Kârı / Faiz Gideri</span>
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-slate-200">Net Borç / FAVÖK Değerlendirmesi:</h4>
                <p className="text-slate-400 leading-relaxed font-sans">
                  {debtHealth.netDebtToEbitda.note}
                </p>
                <h4 className="font-bold text-slate-200 pt-2 border-t border-slate-800">Nakit ve Kısa Vadeli Borç Dengesi:</h4>
                <p className="text-slate-400 leading-relaxed font-sans">
                  Şirketin kasasında {(debtHealth.cashAndEquivalentsTL / 1e9).toFixed(2)} Milyar TL nakit ve nakit benzeri varlık bulunmaktadır.
                  Kısa vadeli finansal yükümlülükler {(debtHealth.shortTermDebtTL / 1e9).toFixed(2)} Milyar TL seviyesindedir.
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 6: NAKİT AKIŞI (CASH FLOW QUALITY) */}
          {/* ============================================================== */}
          {activeSection === 'CASHFLOW' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Serbest Nakit Akışı ve Kârın Nakde Dönüşüm Kalitesi
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    cashFlow.cashConversionQuality === 'HIGH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400'
                  }`}>
                    Nakit Kalitesi: {cashFlow.cashConversionQuality}
                  </span>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider mb-1">Hesaplama Formülü:</span>
                  <strong>{cashFlow.fcfFormula}</strong>
                </div>

                {cashFlow.cashDivergenceWarning && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
                    {cashFlow.cashDivergenceWarning}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-2">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">İşletme Nakit Akışı (CFO)</span>
                    <span className="text-base font-bold text-emerald-400">{(cashFlow.operatingCashFlowTL / 1e9).toFixed(2)} Milyar TL</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Sermaye Harcamaları (CapEx)</span>
                    <span className="text-base font-bold text-rose-400">{(cashFlow.capitalExpendituresTL / 1e9).toFixed(2)} Milyar TL</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Serbest Nakit Akışı (FCF)</span>
                    <span className="text-base font-bold text-emerald-400">{(cashFlow.freeCashFlowTL / 1e9).toFixed(2)} Milyar TL</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Kâr / Nakit Oranı</span>
                    <span className="text-base font-bold text-slate-200">{cashFlow.netIncomeToCfoRatio ? `${cashFlow.netIncomeToCfoRatio}x` : '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 7: KAP AÇIKLAMALARI VE HABER ANALİZİ */}
          {/* ============================================================== */}
          {activeSection === 'KAP_NEWS' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">İnceleme Periyodu:</span>
                  {[30, 90, 180, 365].map(d => (
                    <button
                      key={d}
                      onClick={() => setKapDayFilter(d)}
                      className={`px-2.5 py-1 text-xs rounded font-mono ${
                        kapDayFilter === d ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Son {d} Gün
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredKapItems.length} Açıklama / {kapNews.uniqueEventCount} Benzersiz Olay
                </span>
              </div>

              {/* KAP/News Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">KAP Etki Puanı</span>
                  <span className="text-lg font-bold text-cyan-400">{kapNews.overallImpactScore.toFixed(1)} / 10</span>
                  <span className="text-[10px] text-slate-500 block">Nötr Nokta: 5.0</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Olumlu Olaylar</span>
                  <span className="text-lg font-bold text-emerald-400">{kapNews.positiveCount} Adet</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Olumsuz Olaylar</span>
                  <span className="text-lg font-bold text-rose-400">{kapNews.negativeCount} Adet</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Nötr Bildirimler</span>
                  <span className="text-lg font-bold text-slate-300">{kapNews.neutralCount} Adet</span>
                </div>
              </div>

              {/* List of Disclosures */}
              <div className="space-y-2.5">
                {filteredKapItems.map(item => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.isDeduplicated ? 'opacity-60 bg-slate-950/40 border-slate-800' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            item.impactClass === 'POSITIVE'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : item.impactClass === 'NEGATIVE'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.impactClass === 'POSITIVE' ? 'Olumlu' : item.impactClass === 'NEGATIVE' ? 'Olumsuz' : 'Nötr'} ({item.impactScore.toFixed(1)}/10)
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {item.publishDate.replace('T', ' ').substring(0, 16)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                            {item.source}
                          </span>
                          {item.isDeduplicated && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 flex items-center gap-1">
                              <CopyCheck className="w-3 h-3" /> Mükerrer Olay Filtrelendi
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.impactRationale}</p>
                        <div className="text-[11px] font-mono text-slate-500 pt-1 flex items-center gap-3">
                          <span>Yön: <strong className="text-slate-300">{item.financialDirection}</strong></span>
                          <span>•</span>
                          <span>Risk: <strong className="text-slate-400">{item.possibleRisks}</strong></span>
                        </div>
                      </div>

                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors shrink-0"
                      >
                        KAP Metni <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 8: SERMAYE ARTIRIMLARI (BEDELLİ / BEDELSİZ / TEMETTÜ) */}
          {/* ============================================================== */}
          {activeSection === 'CAPITAL_INCREASES' && (
            <div className="space-y-4">
              {/* Bedelli Sermaye Artırımı Deep Analysis */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-400" />
                    Bedelli Sermaye Artırımı ve Fon Kullanım Amacı Analizi
                  </h3>
                  <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                    capitalIncreases.rightsIssue?.exists ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {capitalIncreases.rightsIssue?.exists ? 'Aktif Bedelli Süreci Mevcut' : 'Bedelli Kararı Yok'}
                  </span>
                </div>

                {capitalIncreases.rightsIssue?.exists ? (
                  <div className="space-y-4 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Bedelli Artırım Oranı</span>
                        <strong className="text-base text-amber-400">%{capitalIncreases.rightsIssue.rightsRatioPct}</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Toplanacak Brüt Fon</span>
                        <strong className="text-base text-slate-100">{(capitalIncreases.rightsIssue.grossFundsPlannedTL / 1e9).toFixed(2)} Milyar TL</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Rüçhan Fiyatı</span>
                        <strong className="text-base text-slate-100">{capitalIncreases.rightsIssue.subscriptionPriceTL} TL</strong>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Süreç Durumu</span>
                        <strong className="text-xs text-cyan-400">{capitalIncreases.rightsIssue.status}</strong>
                      </div>
                    </div>

                    {/* Fon Kullanım Amacı Tablosu */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-2">
                        KAP Fon Kullanım Yeri Raporu Dağılım Tablosu
                      </h4>
                      <div className="border border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Fon Kullanım Amacı</th>
                              <th className="py-2 px-3 text-right">Ayrılan Tutar</th>
                              <th className="py-2 px-3 text-right">Oran %</th>
                              <th className="py-2 px-3">Değerlendirme</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                            {capitalIncreases.rightsIssue.useOfFundsClassification.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-900/40">
                                <td className="py-2.5 px-3 font-sans font-semibold text-slate-200">{item.purpose}</td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-100">
                                  {item.allocatedAmountTL ? `${(item.allocatedAmountTL / 1e9).toFixed(2)} Milyar TL` : '-'}
                                </td>
                                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%{item.allocatedRatioPct}</td>
                                <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">{item.evaluation}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 8-Questions Analysis Grid */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                        Bedelli Sermaye Artırımı 8 Kritik Soru Analizi
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">1. Şirket Neden Yeni Sermaye Topluyor?</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.whyRaisingCapital}</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">2. Borç Azaltımı Amaçlı mı?</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.isForDebtReduction}</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">3. Yeni Yatırımların Gelir Potansiyeli</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.investmentIncomePotential}</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">4. Şirketin Finansal Sıkıntısı Var mı?</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.hasFinancialDistress}</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">5. Pay Sahipliği ve Rüçhan Koşulları</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.shareholderConditions}</p>
                        </div>
                        <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                          <strong className="text-emerald-400 block mb-1">6. Hisse Başına Göstergeler & Seyrelme (Dilution)</strong>
                          <p className="text-slate-300 text-[11px]">{capitalIncreases.rightsIssue.eightQuestionsAnalysis.postIncreaseShareDilution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    Şirketin Sermaye Piyasası Kurulu na iletilen veya KAP üzerinden duyurulan aktif bir bedelli sermaye artırımı süreci bulunmamaktadır. Şirket faaliyet finansmanını mevcut operasyonel kârları ve iç kaynaklarıyla yürütmektedir.
                  </p>
                )}
              </div>

              {/* Bedelsiz & Temettü Bilgilendirmesi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-cyan-400" />
                    Bedelsiz Sermaye Artırımı
                  </h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {capitalIncreases.bonusIssue?.note}
                  </p>
                  <div className="text-xs font-mono text-slate-300 pt-1">
                    Son Bedelsiz Oranı: <strong>%{capitalIncreases.bonusIssue?.bonusRatioPct || 0}</strong>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Temettü Politikası ve Kâr Dağıtımı
                  </h4>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">
                    {capitalIncreases.dividendSummary?.sustainabilityNote}
                  </p>
                  <div className="text-xs font-mono text-slate-300 pt-1 flex justify-between">
                    <span>Pay Başına Brüt: <strong>{capitalIncreases.dividendSummary?.grossPerShare || 0} TL</strong></span>
                    <span>Temettü Verimi: <strong className="text-emerald-400">%{capitalIncreases.dividendSummary?.dividendYieldPct || 0}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 9: PUANLAMA SİSTEMİ (SCORING SYSTEM EXPLANATION) */}
          {/* ============================================================== */}
          {activeSection === 'SCORING' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-emerald-400" />
                  10 Üzerinden Temel Analiz Puanlama Metodolojisi
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Temel Analiz Puanı, şirketin finansal sağlamlığını 6 ana kategoride değerlendiren şeffaf bir algoritmadır. Eksik finansal veri olduğunda veya bankalarda geçerli olmayan rasyolarda (ör. EV/EBITDA) veri 0 kabul edilmez; ağırlıklar oransal olarak diğer kategorilere dağıtılır.
                </p>

                <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 font-mono text-[11px] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3 text-right">Ağırlık</th>
                        <th className="py-2.5 px-3 text-right">Hesaplanan Puan</th>
                        <th className="py-2.5 px-3">Değerlendirilen Kriterler</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Kârlılık</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%20</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.profitability.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">ROE, Brüt/Net Kâr Marjları, Kârlılık İstikrarı</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Büyüme</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%15</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.growth.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Hasılat Büyümesi, Net Kâr Büyümesi, 3 Yıllık Trend</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Borçluluk & Finansal Sağlık</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%20</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.debtHealth.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Net Borç/FAVÖK, Cari Oran, Faiz Karşılama, Finansal Sıkıntı Riski</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Nakit Akışı</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%15</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.cashFlow.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Serbest Nakit Akışı, Kârın Nakde Dönüşüm Oranı</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Değerleme</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%20</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.valuation.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">F/K, PD/DD, FD/FAVÖK, Sektörel Prim/İskonto</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-semibold font-sans">Sermaye Verimliliği</td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">%10</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-100">{fundamentalScore.categories.capitalEfficiency.score.toFixed(1)} / 10</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 text-[11px]">Aktif Kârlılığı (ROA), Sermaye Getirisi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                  <span className="text-[10px] text-slate-400 block mb-1">Puan Aralıkları ve Anlamları:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <div>8.5 – 10.0: <strong className="text-emerald-400">Çok Güçlü</strong></div>
                    <div>7.0 – 8.4: <strong className="text-emerald-300">Güçlü</strong></div>
                    <div>5.5 – 6.9: <strong className="text-cyan-300">Orta-İyi</strong></div>
                    <div>4.0 – 5.4: <strong className="text-amber-300">Orta-Alt</strong></div>
                    <div>2.0 – 3.9: <strong className="text-rose-300">Zayıf</strong></div>
                    <div>0.0 – 1.9: <strong className="text-rose-400">Çok Zayıf</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 10: HİSSE ÜZERİNDEKİ MUHTEMEL ETKİ */}
          {/* ============================================================== */}
          {activeSection === 'IMPACT' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Orta Vadeli Görünüm</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                      {probableImpact.mediumTermOutlook.classification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{probableImpact.mediumTermOutlook.description}</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Uzun Vadeli Görünüm</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                      {probableImpact.longTermOutlook.classification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{probableImpact.longTermOutlook.description}</p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Kısa Vadeli KAP Etkisi</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-bold">
                      {probableImpact.shortTermNewsImpact.classification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{probableImpact.shortTermNewsImpact.description}</p>
                </div>
              </div>

              {/* Catalysts & Watchlist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Önemli Katalizörler
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {probableImpact.keyCatalysts.map((cat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{cat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Finansal Risk Faktörleri
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {probableImpact.financialRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 11: AI TEMEL ANALİZ YORUMU & TEKNİK-TEMEL SENTEZİ */}
          {/* ============================================================== */}
          {activeSection === 'AI_SYNTHESIS' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Yapay Zekâ Destekli Temel-Teknik Bütünleşik Rapor
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Deterministik olarak hesaplanmış temel rasyolar ve teknik indikatörlerin yapılandırılmış sentezi
                    </p>
                  </div>

                  <button
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    {isGeneratingAi ? 'Rapor Üretiliyor...' : 'Yorumu Güncelle'}
                  </button>
                </div>

                {/* Temel & Teknik Uyum Rozeti */}
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">Teknik ve Temel Analiz Uyumu:</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                        {currentSynthesis.technicalAndFundamentalAlignment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                      {currentSynthesis.technicalAndFundamentalText}
                    </p>
                  </div>
                </div>

                {/* 12-Point Structured Breakdown */}
                <div className="space-y-3 text-xs font-sans text-slate-300 leading-relaxed">
                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">1. Genel Durum Değerlendirmesi:</strong>
                    <p>{currentSynthesis.generalEvaluation}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">2. Temel Analiz Puanı ve Gerekçesi:</strong>
                    <p>{currentSynthesis.fundamentalScoreRationale}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">3. Finansal Tablo Büyüklükleri ve Kârlılık:</strong>
                    <p>{currentSynthesis.financialStatementEvaluation}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">4. Değerleme ve Çarpan Görünümü:</strong>
                    <p>{currentSynthesis.valuationEvaluation}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">5. Borçluluk ve Serbest Nakit Akımı:</strong>
                    <p>{currentSynthesis.debtAndCashFlowEvaluation}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">6. Son KAP Bildirimlerinin Etkisi:</strong>
                    <p>{currentSynthesis.recentKapImpact}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">7. Bedelli Sermaye Artırımı ve Fon Kullanım Amacı:</strong>
                    <p>{currentSynthesis.rightsIssueAndFundUsage}</p>
                  </div>

                  <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-1">
                    <strong className="text-emerald-400 block font-mono">8. Genel Sonuç ve Dikkat Edilecek Eşikler:</strong>
                    <p>{currentSynthesis.overallConclusion}</p>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-500 font-sans leading-relaxed">
                  <strong>YASAL UYARI: </strong>
                  {currentSynthesis.dataReliabilityNote}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
