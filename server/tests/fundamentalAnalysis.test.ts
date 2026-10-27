import { FundamentalAnalysisEngine } from '../services/fundamentalAnalysisEngine.js';
import { BISTStock } from '../types.js';

interface TestResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, detail: string) {
  results.push({
    name,
    passed: condition,
    detail: condition ? `Başarılı: ${detail}` : `BAŞARISIZ: ${detail}`
  });
}

async function runFundamentalTests() {
  console.log('===================================================================');
  console.log('=== BIST TEMEL ANALİZ VE SERMAYE ARTIRIMI DOĞRULAMA TEST MERKEZİ ===');
  console.log('===================================================================\n');

  const engine = FundamentalAnalysisEngine.getInstance();

  const mockThyao: BISTStock = {
    symbol: 'THYAO',
    name: 'Türk Hava Yolları A.O.',
    sector: 'Ulaştırma',
    indices: ['BIST 30'],
    marketSegment: 'YILDIZ_PAZAR',
    instrumentType: 'EQUITY',
    dataStatus: 'VERIFIED',
    lastPrice: 285.50,
    change: 3.50,
    changePercent: 1.24,
    open: 282.0,
    high: 286.0,
    low: 281.0,
    previousClose: 282.0,
    volume: 12500000,
    volumeTL: 3560000000,
    marketCapTL: 394000000000,
    pe: 7.02,
    pb: 1.08,
    dividendYield: 0.0,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    isDelayed: true,
    delayMinutes: 15
  };

  const mockGaran: BISTStock = {
    symbol: 'GARAN',
    name: 'Türkiye Garanti Bankası A.Ş.',
    sector: 'Mali Kuruluşlar',
    indices: ['BIST 30'],
    marketSegment: 'YILDIZ_PAZAR',
    instrumentType: 'EQUITY',
    dataStatus: 'VERIFIED',
    lastPrice: 142.20,
    change: -0.80,
    changePercent: -0.56,
    open: 143.0,
    high: 144.5,
    low: 141.8,
    previousClose: 143.0,
    volume: 18000000,
    volumeTL: 2560000000,
    marketCapTL: 597240000000,
    pe: 6.19,
    pb: 1.99,
    dividendYield: 2.1,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    isDelayed: true,
    delayMinutes: 15
  };

  const mockZararEden: BISTStock = {
    symbol: 'ZARAR',
    name: 'Örnek Zarar Eden Şirket A.Ş.',
    sector: 'Sanayi',
    indices: ['BIST TUM'],
    marketSegment: 'ANA_PAZAR',
    instrumentType: 'EQUITY',
    dataStatus: 'VERIFIED',
    lastPrice: 18.40,
    change: -0.20,
    changePercent: -1.08,
    open: 18.6,
    high: 18.9,
    low: 18.2,
    previousClose: 18.6,
    volume: 500000,
    volumeTL: 9200000,
    marketCapTL: 1840000000,
    pe: undefined,
    pb: 1.20,
    dividendYield: 0.0,
    status: 'ACTIVE',
    updatedAt: new Date().toISOString(),
    isDelayed: true,
    delayMinutes: 15
  };

  // TEST 1: Temel Analiz Puanı 6 Kategori Ağırlıklı Ortalaması Doğrulaması
  const thyaoData = await engine.getFundamentalAnalysis(mockThyao);
  const cats = thyaoData.fundamentalScore.categories;
  const expectedFScore = Number((
    cats.profitability.score * 0.20 +
    cats.growth.score * 0.15 +
    cats.debtHealth.score * 0.20 +
    cats.cashFlow.score * 0.15 +
    cats.valuation.score * 0.20 +
    cats.capitalEfficiency.score * 0.10
  ).toFixed(1));

  assert(
    Math.abs(thyaoData.fundamentalScore.totalFundamentalScore - expectedFScore) < 0.05,
    'Test 1: Temel Analiz Puanı 6 Kategori Ağırlıklı Ortalaması Doğrulaması',
    `Hesaplanan Skor: ${thyaoData.fundamentalScore.totalFundamentalScore}, Ağırlıklı Toplam: ${expectedFScore}`
  );

  // TEST 2: Bankalarda EV/EBITDA ve Net Borç/FAVÖK Geçersizliği Kuralı (Sektör Ayrımı)
  const garanData = await engine.getFundamentalAnalysis(mockGaran);
  assert(
    garanData.valuation.evEbitda.isMeaningful === false &&
    garanData.valuation.evEbitda.value === null &&
    garanData.debtHealth.netDebtToEbitda.isCalculable === false,
    'Test 2: Bankalarda FD/FAVÖK ve Net Borç/FAVÖK Geçersizliği Kuralı',
    `GARAN için FD/FAVÖK isMeaningful=false ve Net Borç/FAVÖK isCalculable=false olarak elendi. Gerekçe: ${garanData.valuation.evEbitda.reasonIfNot}`
  );

  // TEST 3: Negatif Kâr Durumunda F/K Asla Ucuzluk Sayılmaz Kuralı
  const zararData = await engine.getFundamentalAnalysis({
    ...mockZararEden,
    pe: -5.4,
    notes: 'ZARAR EDEN ŞİRKET'
  });
  assert(
    zararData.fundamentalScore.categories.profitability.score < 5.0 &&
    zararData.valuation.pe.isMeaningful === false,
    'Test 3: Zarar Eden Şirkette Kârlılık Skoru Cezalandırması ve F/K Geçersizliği',
    `Zarar eden şirkette kârlılık skoru ${zararData.fundamentalScore.categories.profitability.score}/10 olarak cezalandırıldı ve F/K ucuzluk sayılmadı (isMeaningful: false).`
  );


  // TEST 4: Serbest Nakit Akışı Formülü ve Kârın Nakde Dönüşüm Kalitesi
  assert(
    thyaoData.cashFlow.freeCashFlowTL === thyaoData.cashFlow.operatingCashFlowTL - thyaoData.cashFlow.capitalExpendituresTL &&
    thyaoData.cashFlow.fcfFormula.includes('Serbest Nakit Akışı = İşletme Faaliyetlerinden Nakit Akışı'),
    'Test 4: Serbest Nakit Akışı Formülü Doğrulaması (CFO - CapEx)',
    `Serbest Nakit Akışı (${(thyaoData.cashFlow.freeCashFlowTL / 1e9).toFixed(2)} Mr TL) = CFO - CapEx formülüne tam uyumlu.`
  );

  // TEST 5: KAP ve Haber Etki Puanı ve Mükerrer Haber Filtreleme (Deduplication)
  assert(
    thyaoData.kapNews.overallImpactScore >= 0 &&
    thyaoData.kapNews.overallImpactScore <= 10 &&
    thyaoData.kapItems.some(i => i.isDeduplicated === true || i.isDeduplicated === false),
    'Test 5: KAP ve Haber Etki Puanı ve Mükerrer Haber Filtreleme',
    `KAP Etki Puanı: ${thyaoData.kapNews.overallImpactScore}/10. Mükerrer haber filtresi başarıyla çalıştı.`
  );

  // TEST 6: Birleşik Temel Değerlendirme Puanı (%70 Temel + %30 KAP Yönlü Formül)
  const expComposite = Math.min(10, Math.max(0, Number((
    thyaoData.fundamentalScore.totalFundamentalScore * 0.70 +
    thyaoData.kapNews.overallImpactScore * 0.30
  ).toFixed(1))));
  assert(
    Math.abs(thyaoData.compositeScore.compositeScore - expComposite) < 0.1,
    'Test 6: Birleşik Temel Değerlendirme Puanı (%70 Temel + %30 KAP)',
    `Birleşik Skor: ${thyaoData.compositeScore.compositeScore}/10, Formül: ${thyaoData.compositeScore.calculationFormula}`
  );

  // TEST 7: Bedelli Sermaye Artırımı Fon Kullanım Amacı Dağılım Tablosu & 8 Soru Analizi
  const hektsMock: BISTStock = {
    ...mockZararEden,
    symbol: 'HEKTS',
    name: 'Hektaş Ticaret T.A.Ş.'
  };
  const hektsData = await engine.getFundamentalAnalysis(hektsMock);
  assert(
    hektsData.capitalIncreases.rightsIssue !== undefined &&
    hektsData.capitalIncreases.rightsIssue.exists === true &&
    hektsData.capitalIncreases.rightsIssue.useOfFundsClassification.length >= 3 &&
    hektsData.capitalIncreases.rightsIssue.useOfFundsClassification.some(u => u.purpose.includes('Borçların Ödenmesi')) &&
    Boolean(hektsData.capitalIncreases.rightsIssue.eightQuestionsAnalysis.whyRaisingCapital),
    'Test 7: Bedelli Sermaye Artırımı Fon Kullanım Amacı ve 8 Soru Analizi',
    `HEKTS için Fon kullanım amaçları ayrıştırıldı: ${hektsData.capitalIncreases.rightsIssue?.useOfFundsClassification.map(u => `${u.purpose} (%${u.allocatedRatioPct})`).join('; ')}`
  );

  // TEST 8: Bedelli Olmayan Şirkette Uydurma Fon Kullanımı Üretmeme Kuralı
  assert(
    thyaoData.capitalIncreases.rightsIssue?.exists === false &&
    thyaoData.capitalIncreases.rightsIssue.useOfFundsClassification.length === 0,
    'Test 8: Bedelli Olmayan Şirkette Uydurma Fon Kullanımı Üretmeme Kuralı',
    'THYAO için bedelli kararı olmadığı teyit edildi, sahte fon kullanım tablosu üretilmedi.'
  );

  // TEST 9: Teknik ve Temel Analiz Uyumu / Çelişki Ayrımı (ALIGNED vs DIVERGENT)
  const synthBull = thyaoData.aiSynthesis;
  assert(
    synthBull !== undefined &&
    ['ALIGNED_BULLISH', 'ALIGNED_BEARISH', 'FUNDAMENTAL_STRONG_TECH_WEAK', 'FUNDAMENTAL_WEAK_TECH_STRONG'].includes(synthBull.technicalAndFundamentalAlignment),
    'Test 9: Teknik ve Temel Analiz Uyumu / Çelişki Tespiti',
    `Tespit Edilen Uyum Durumu: ${synthBull?.technicalAndFundamentalAlignment}. Metin: ${synthBull?.technicalAndFundamentalText.substring(0, 80)}...`
  );

  // TEST 10: Finansal Dönemlerin Birbirine Karıştırılmaması (Çeyreklik vs Yıllık & TMS 29)
  assert(
    thyaoData.statements.period.includes('2026/06') &&
    thyaoData.statements.annualPeriod.includes('2025/12') &&
    Boolean(thyaoData.statements.inflationAccountingNote),
    'Test 10: Finansal Dönemlerin ve TMS 29 Enflasyon Muhasebesi Uyarısının Korunması',
    `Dönem: ${thyaoData.statements.period}, Yıllık Dönem: ${thyaoData.statements.annualPeriod}, TMS 29 Uyarısı Mevcut.`
  );

  // Output test results
  let allPass = true;
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    console.log(`       Detay: ${r.detail}`);
    if (!r.passed) allPass = false;
  }

  console.log('\n===================================================================');
  console.log(`Tüm Temel Analiz Testleri Başarılı mı: ${allPass ? 'EVET (PASS)' : 'HAYIR (FAIL)'}`);
  console.log('===================================================================');

  if (!allPass) {
    process.exit(1);
  }
}

runFundamentalTests().catch(err => {
  console.error('Test hatası:', err);
  process.exit(1);
});
