import { GoogleGenAI } from '@google/genai';
import {
  BISTStock,
  TechnicalIndicators,
  SupportResistanceZone,
  ChartPattern,
  MultiTimeframeTrend,
  ScenarioHorizon
} from '../types.js';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiInstance;
}

export interface AnalyticalReportRequest {
  stock: BISTStock;
  indicators: TechnicalIndicators;
  zones: SupportResistanceZone[];
  patterns: ChartPattern[];
  trends: MultiTimeframeTrend[];
  horizons: {
    horizon5d: ScenarioHorizon;
    horizon7d: ScenarioHorizon;
    horizon10d: ScenarioHorizon;
  };
}

export interface AnalyticalReportResponse {
  summary: string;
  trendEvaluation: string;
  scenarioAnalysis: string;
  riskAndInvalidationRules: string;
  keyLevelsSummary: string;
  disclaimer: string;
  isAiGenerated: boolean;
}

/**
 * Generate structured analytical narrative report from deterministic financial results.
 * Follows Rule 4: "Yapay zekâ yalnızca hesaplanmış sonuçları açıklamak, karşılaştırmak
 * ve kullanıcının anlayacağı bir rapora dönüştürmek için kullanılacak."
 */
export async function generateAnalyticalReport(data: AnalyticalReportRequest): Promise<AnalyticalReportResponse> {
  const { stock, indicators, zones, patterns, trends, horizons } = data;
  const ai = getAI();

  const disclaimerText = 'YASAL UYARI: Burada yer alan analiz ve modellemeler yatırım danışmanlığı kapsamında olmayıp deterministik teknik göstergeler ve istatistiksel olasılık dağılımlarına dayanmaktadır. Sermaye piyasalarında kesinlik veya getiri garantisi bulunmamaktadır.';

  // If Gemini API is available, request objective professional financial commentary
  if (ai) {
    try {
      const prompt = `Sen Borsa İstanbul (BIST) piyasasında uzman, tarafsız ve risk bilinci yüksek bir Baş Nicel Analistsin.
Aşağıda ${stock.symbol} (${stock.name}) hissesine ait deterministik olarak hesaplanmış gerçek teknik göstergeler, formasyonlar, destek/direnç bölgeleri ve 5/7/10 günlük senaryo olasılıkları verilmiştir.

Verilen matematiksel veriler:
- Son Fiyat: ${stock.lastPrice} TL (Günlük Değişim: %${stock.changePercent})
- Sektör: ${stock.sector} | Endeksler: ${stock.indices.join(', ')}
- F/K: ${stock.pe || '-'} | PD/DD: ${stock.pb || '-'} | Temettü Verimi: %${stock.dividendYield || 0}
- RSI (14): ${indicators.rsi14 || '-'}
- MACD: Çizgi=${indicators.macd?.macdLine}, Sinyal=${indicators.macd?.signalLine}, Histogram=${indicators.macd?.histogram}
- Hareketli Ortalamalar: EMA5=${indicators.ema5}, EMA20=${indicators.ema20}, EMA50=${indicators.ema50}, EMA200=${indicators.ema200}
- EMA Trend Yönleri: EMA5=${indicators.emaTrends?.ema5Trend}, EMA20=${indicators.emaTrends?.ema20Trend}, Ana Trend=${indicators.emaTrends?.mainTrend}, Kesişim=${indicators.emaTrends?.crossover}
- Bollinger Bantları (EMA20 Orta Bant): Üst=${indicators.bollinger?.upper}, Orta=${indicators.bollinger?.middle}, Alt=${indicators.bollinger?.lower}, Bant Genişliği=%${indicators.bollinger?.bandwidth}
- ATR (14): ${indicators.atr14} TL (Günlük ortalama dalga boyu)
- Hacim Oranı (Günlük / 20 EMA Ort.): ${indicators.volumeRatio}x
- Tespit Edilen Formasyonlar: ${patterns.map(p => `${p.turkishName} (${p.status}, Hedef: ${p.targetPrice} TL, Stop: ${p.stopLossPrice} TL)`).join('; ') || 'Önemli formasyon bulunmuyor'}
- Destek & Direnç Bölgeleri: ${zones.map(z => `${z.type === 'SUPPORT' ? 'Destek' : 'Direnç'}: ${z.priceLow}-${z.priceHigh} TL (Güç: ${z.strengthScore}/100)`).join('; ')}
- 5 Günlük Senaryo Olasılıkları: Boğa %${horizons.horizon5d.bullish.probability} (Hedef ${horizons.horizon5d.bullish.targetLow}-${horizons.horizon5d.bullish.targetHigh} TL), Nötr %${horizons.horizon5d.base.probability}, Ayı %${horizons.horizon5d.bearish.probability} (Hedef ${horizons.horizon5d.bearish.targetLow}-${horizons.horizon5d.bearish.targetHigh} TL)
- 10 Günlük %95 Parametrik VaR Risk: -%${horizons.horizon10d.var95LossPct}

GÖREVİN:
Bu deterministik sonuçları yatırımcının kolayca anlayabileceği, abartısız, kesinlik veya al/sat tavsiyesi içermeyen profesyonel bir teknik rapora dönüştür.
Yanıtını JSON formatında şu anahtarlarla ver:
{
  "summary": "2-3 cümlelik genel durum ve hissenin anlık teknik görünümü",
  "trendEvaluation": "Kısa ve orta vadeli hareketli ortalamalar ile momentum göstergelerinin (RSI, MACD) yön analizi",
  "scenarioAnalysis": "5, 7 ve 10 günlük senaryo koridorlarının piyasa koşullarına göre yorumu",
  "riskAndInvalidationRules": "Bu analizi geçersiz kılacak kritik seviyeler ve olası piyasa riskleri",
  "keyLevelsSummary": "Önümüzdeki günlerde izlenmesi gereken en kritik 2 destek ve 2 direnç eşiği"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          summary: parsed.summary || `${stock.symbol} için teknik görünüm dengeli seyretmektedir.`,
          trendEvaluation: parsed.trendEvaluation || '',
          scenarioAnalysis: parsed.scenarioAnalysis || '',
          riskAndInvalidationRules: parsed.riskAndInvalidationRules || '',
          keyLevelsSummary: parsed.keyLevelsSummary || '',
          disclaimer: disclaimerText,
          isAiGenerated: true
        };
      }
    } catch {
      // Fallback to deterministic template below
    }
  }

  // Deterministic rule-based analytical report fallback (EMA Tabanlı)
  const isAboveEma20 = indicators.ema20 ? stock.lastPrice > indicators.ema20 : true;
  const isAboveEma50 = indicators.ema50 ? stock.lastPrice > indicators.ema50 : true;
  const isRsiOverbought = (indicators.rsi14 || 50) > 70;
  const isRsiOversold = (indicators.rsi14 || 50) < 30;

  let trendText = `${stock.symbol} ${stock.lastPrice} TL seviyesinde işlem görmekte olup `;
  if (isAboveEma20 && isAboveEma50) {
    trendText += 'kısa ve orta vadeli EMA20 ve EMA50 ortalamalarının üzerinde güçlü boğa trend yapısını korumaktadır. ';
  } else if (isAboveEma20) {
    trendText += 'EMA20 üzerinde pozitif ara trend bölgesindedir. ';
  } else {
    trendText += 'EMA20 ve EMA50 ortalamalarının altında temkinli/ayı baskılı bölgede hareket etmektedir. ';
  }

  if (isRsiOverbought) {
    trendText += `RSI göstergesi ${indicators.rsi14} değeri ile aşırı alım bölgesinde olup kâr satışları olasılığı göz önünde bulundurulmalıdır.`;
  } else if (isRsiOversold) {
    trendText += `RSI göstergesi ${indicators.rsi14} değeri ile aşırı satım bölgesinde olup tepki alımı potansiyeli taşımaktadır.`;
  } else {
    trendText += `RSI (14) ${indicators.rsi14} seviyesi ile nötr denge aralığındadır.`;
  }

  const nearestSupport = zones.find(z => z.type === 'SUPPORT');
  const nearestResistance = zones.find(z => z.type === 'RESISTANCE');

  return {
    summary: `${stock.symbol} hissesinde son fiyat ${stock.lastPrice} TL, günlük değişim %${stock.changePercent} düzeyindedir. Hacim rasyosu ${indicators.volumeRatio}x olup teknik volatilite kontrollü seyretmektedir.`,
    trendEvaluation: trendText,
    scenarioAnalysis: `Matematiksel modelleme; 5 günlük vadede %${horizons.horizon5d.bullish.probability} boğa, %${horizons.horizon5d.base.probability} dengeli ve %${horizons.horizon5d.bearish.probability} düzeltme olasılığı hesaplamıştır. 5 günlük volatilite koridoru ${horizons.horizon5d.bearish.targetLow} - ${horizons.horizon5d.bullish.targetHigh} TL bandını işaret etmektedir.`,
    riskAndInvalidationRules: `Pozitif senaryoyu geçersiz kılabilecek kritik stop seviyesi ${horizons.horizon5d.bullish.invalidationPrice} TL altı kalıcılıktır. 10 günlük vadede %95 güven aralığında maksimum tahmini dalgalanma riski %${horizons.horizon10d.var95LossPct} seviyesindedir.`,
    keyLevelsSummary: `Kritik Destek: ${nearestSupport ? `${nearestSupport.priceLow} - ${nearestSupport.priceHigh} TL (Güç: ${nearestSupport.strengthScore}/100)` : 'Mevcut veride destek teyidi aranıyor'}. Kritik Direnç: ${nearestResistance ? `${nearestResistance.priceLow} - ${nearestResistance.priceHigh} TL (Güç: ${nearestResistance.strengthScore}/100)` : 'Direnç eşiği hesaplanıyor'}.`,
    disclaimer: disclaimerText,
    isAiGenerated: false
  };
}

/**
 * Generate comprehensive AI Fundamental Analysis Narrative & Synthesis.
 * Combines fundamental score, statements, valuation, cash flow, debt health,
 * KAP disclosures, rights issue analysis, and technical-fundamental alignment.
 */
export async function generateFundamentalAISynthesis(data: {
  stock: BISTStock;
  fundamental: import('../types.js').StockFundamentalCenterData;
  technical?: any;
}): Promise<import('../types.js').AIFundamentalSynthesis> {
  const { stock, fundamental, technical } = data;
  const ai = getAI();

  if (ai) {
    try {
      const prompt = `Sen Borsa İstanbul (BIST) Sermaye Piyasaları Kıdemli Temel ve Nicel Analistisin.
Aşağıda ${stock.symbol} (${stock.name}) hissesine ait gerçek finansal tablo sonuçları, temel analiz puanı, değerleme oranları, borçluluk, nakit akışı, KAP açıklamaları ve teknik göstergeler verilmiştir:

TEMEL VERİLER:
- Son Fiyat: ${stock.lastPrice} TL (Günlük Değişim: %${stock.changePercent})
- Sektör: ${stock.sector} | Piyasa Değeri: ${(stock.marketCapTL / 1e9).toFixed(2)} Milyar TL
- Finansal Dönem: ${fundamental.period}
- Temel Analiz Puanı: ${fundamental.fundamentalScore.totalFundamentalScore}/10 (${fundamental.fundamentalScore.ratingCategory})
- KAP ve Haber Etki Puanı: ${fundamental.kapNews.overallImpactScore}/10 (Son 90 Günlük Eğilim: ${fundamental.kapNews.newsFlowTrend90d})
- Birleşik Temel Değerlendirme Puanı: ${fundamental.compositeScore.compositeScore}/10
- F/K: ${fundamental.valuation.pe.value || 'Hesaplanamıyor'} (${fundamental.valuation.pe.reasonIfNot})
- PD/DD: ${fundamental.valuation.pb.value || '-'} | Sektör Ortalaması: F/K ${fundamental.valuation.sectorComparison.sectorAvgPe}, PD/DD ${fundamental.valuation.sectorComparison.sectorAvgPb}
- Net Kâr: ${(fundamental.statements.incomeStatement.netIncome / 1e9).toFixed(2)} Milyar TL | Hasılat: ${(fundamental.statements.incomeStatement.revenue / 1e9).toFixed(2)} Milyar TL
- Toplam Özkaynak: ${(fundamental.statements.balanceSheet.totalEquity / 1e9).toFixed(2)} Milyar TL | Toplam Varlıklar: ${(fundamental.statements.balanceSheet.totalAssets / 1e9).toFixed(2)} Milyar TL
- ROE (Özsermaye Kârlılığı): %${fundamental.profitability.roePct || '-'} | ROA: %${fundamental.profitability.roaPct || '-'}
- Serbest Nakit Akışı: ${(fundamental.cashFlow.freeCashFlowTL / 1e9).toFixed(2)} Milyar TL | Nakit Kalitesi: ${fundamental.cashFlow.cashConversionQuality}
- Borç Durumu: ${fundamental.debtHealth.netDebtTL < 0 ? 'Net Nakit Pozisyonu' : 'Net Borç: ' + (fundamental.debtHealth.netDebtTL / 1e9).toFixed(2) + ' Milyar TL'} (Net Borç/FAVÖK: ${fundamental.debtHealth.netDebtToEbitda.value ?? 'Hesaplanamıyor'})
- Finansal Sıkıntı Riski: ${fundamental.debtHealth.distressRiskFlag ? 'VAR: ' + fundamental.debtHealth.distressRiskNotes.join(', ') : 'YOK'}
- Bedelli Sermaye Artırımı: ${fundamental.capitalIncreases.rightsIssue?.exists ? `VAR (Rüçhan Oranı: %${fundamental.capitalIncreases.rightsIssue.rightsRatioPct}, Brüt Fon: ${(fundamental.capitalIncreases.rightsIssue.grossFundsPlannedTL / 1e9).toFixed(2)} Milyar TL, Fon Kullanımı: ${fundamental.capitalIncreases.rightsIssue.useOfFundsClassification.map(u => u.purpose).join(', ')})` : 'YOK'}
- Son Önemli KAP Olayı: ${fundamental.kapNews.topPositiveEvent?.title || 'Rutin açıklamalar'}
- Teknik Durum: ${technical?.indicators?.ema20 ? (stock.lastPrice > technical.indicators.ema20 ? 'Fiyat EMA20 Üzerinde (Pozitif Trend)' : 'Fiyat EMA20 Altında (Düzeltme Eğilimi)') : 'Teknik veri nötr'}

GÖREVİN:
Bu verileri yatırımcının kolayca anlayabileceği, abartısız, kesinlik içermeyen, rasyonel ve profesyonel bir temel-teknik sentez raporuna dönüştür.
Yanıtını JSON formatında şu anahtarlarla ver:
{
  "generalEvaluation": "Genel temel değerlendirme ve şirket durumu",
  "fundamentalScoreRationale": "Temel analiz puanının hangi bileşenlerden oluştuğunun gerekçesi",
  "financialStatementEvaluation": "Bilanço, gelir tablosu büyüklükleri ve operasyonel performans yorumu",
  "valuationEvaluation": "F/K, PD/DD ve sektör kıyaslaması yorumu",
  "debtAndCashFlowEvaluation": "Borçluluk düzeyi, faiz karşılama ve serbest nakit akım durumu",
  "recentKapImpact": "Son 90 günlük KAP açıklamalarının ve haberlerin hisse üzerindeki yönlü etkisi",
  "newsProsAndCons": "Haber ve bildirim akışının en belirgin olumlu ve olumsuz yönleri",
  "rightsIssueAndFundUsage": "Bedelli sermaye artırımı varsa fon kullanım amaçlarının değerlendirmesi, yoksa sermaye güvencesi",
  "technicalAndFundamentalAlignment": "ALIGNED_BULLISH | ALIGNED_BEARISH | FUNDAMENTAL_STRONG_TECH_WEAK | FUNDAMENTAL_WEAK_TECH_STRONG | CONTRADICTORY | INSUFFICIENT_DATA",
  "technicalAndFundamentalText": "Teknik göstergeler ile temel veriler arasındaki uyum veya çelişki analizi",
  "criticalRisks": ["Risk 1", "Risk 2", "Risk 3"],
  "upcomingCatalystsToWatch": ["Katalizör 1", "Katalizör 2"],
  "overallConclusion": "Genel sonuç, dikkat edilecek hususlar ve veri güvenilirlik notu"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          generalEvaluation: parsed.generalEvaluation || fundamental.aiSynthesis?.generalEvaluation || '',
          fundamentalScoreRationale: parsed.fundamentalScoreRationale || fundamental.aiSynthesis?.fundamentalScoreRationale || '',
          financialStatementEvaluation: parsed.financialStatementEvaluation || fundamental.aiSynthesis?.financialStatementEvaluation || '',
          valuationEvaluation: parsed.valuationEvaluation || fundamental.aiSynthesis?.valuationEvaluation || '',
          debtAndCashFlowEvaluation: parsed.debtAndCashFlowEvaluation || fundamental.aiSynthesis?.debtAndCashFlowEvaluation || '',
          recentKapImpact: parsed.recentKapImpact || fundamental.aiSynthesis?.recentKapImpact || '',
          newsProsAndCons: parsed.newsProsAndCons || fundamental.aiSynthesis?.newsProsAndCons || '',
          rightsIssueAndFundUsage: parsed.rightsIssueAndFundUsage || fundamental.aiSynthesis?.rightsIssueAndFundUsage || '',
          technicalAndFundamentalAlignment: parsed.technicalAndFundamentalAlignment || fundamental.aiSynthesis?.technicalAndFundamentalAlignment || 'ALIGNED_BULLISH',
          technicalAndFundamentalText: parsed.technicalAndFundamentalText || fundamental.aiSynthesis?.technicalAndFundamentalText || '',
          criticalRisks: parsed.criticalRisks || fundamental.aiSynthesis?.criticalRisks || [],
          upcomingCatalystsToWatch: parsed.upcomingCatalystsToWatch || fundamental.aiSynthesis?.upcomingCatalystsToWatch || [],
          overallConclusion: parsed.overallConclusion || fundamental.aiSynthesis?.overallConclusion || '',
          dataReliabilityNote: 'KAP ve bağımsız denetimden geçmiş finansal tablolara dayanmaktadır. Yatırım tavsiyesi değildir.',
          generatedAt: new Date().toISOString(),
          isAiGenerated: true
        };
      }
    } catch {
      // Fallback to deterministic synthesis
    }
  }

  return fundamental.aiSynthesis!;
}

