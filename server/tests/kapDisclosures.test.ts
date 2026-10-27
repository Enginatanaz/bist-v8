import { KapDisclosuresService } from '../services/kapDisclosuresService.js';

function runKapDisclosuresTests() {
  console.log('--- RUNNING KAP DISCLOSURES & INTEGRATION TESTS ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Test Failed: ${testName}`);
    }
  }

  const kapService = KapDisclosuresService.getInstance();

  // Test 1: Strict Per-Symbol Filtering (No Cross-Ticker Leakage)
  console.log('\n--- Test 1: Strict Per-Symbol Isolation ---');
  const thyaoDisclosures = kapService.getDisclosuresForSymbol('THYAO');
  assert(thyaoDisclosures.length > 0, 'THYAO must have verified disclosures');
  assert(
    thyaoDisclosures.every(d => d.symbol === 'THYAO'),
    'Every returned disclosure for THYAO must have symbol === "THYAO"',
    `Found non-THYAO items: ${thyaoDisclosures.filter(d => d.symbol !== 'THYAO').map(d => d.symbol).join(', ')}`
  );

  const aselsDisclosures = kapService.getDisclosuresForSymbol('ASELS');
  assert(aselsDisclosures.length > 0, 'ASELS must have verified disclosures');
  assert(
    aselsDisclosures.every(d => d.symbol === 'ASELS'),
    'Every returned disclosure for ASELS must have symbol === "ASELS"'
  );

  // Cross-isolation check: ASELS items must not appear in THYAO query
  const thyaoIds = new Set(thyaoDisclosures.map(d => d.id));
  assert(
    aselsDisclosures.every(d => !thyaoIds.has(d.id)),
    'THYAO and ASELS disclosures must be strictly mutually exclusive'
  );

  // Test 2: Symbol Sanitization (.IS suffix and lowercase handling)
  console.log('\n--- Test 2: Symbol Sanitization ---');
  const garanSuffixed = kapService.getDisclosuresForSymbol('garan.is');
  assert(garanSuffixed.length > 0, 'Symbol sanitization should handle lowercase and .IS suffix');
  assert(garanSuffixed.every(d => d.symbol === 'GARAN'), 'Sanitized symbols must resolve to GARAN');

  // Test 3: Chronological Sorting (Newest to Oldest Descending)
  console.log('\n--- Test 3: Chronological Ordering ---');
  for (const sym of ['THYAO', 'ASELS', 'GARAN', 'TUPRS']) {
    const list = kapService.getDisclosuresForSymbol(sym);
    for (let i = 0; i < list.length - 1; i++) {
      const timeCurrent = new Date(list[i].publishDate).getTime();
      const timeNext = new Date(list[i + 1].publishDate).getTime();
      assert(
        timeCurrent >= timeNext,
        `${sym} disclosures must be ordered newest to oldest (${list[i].publishDate} >= ${list[i + 1].publishDate})`
      );
    }
  }

  // Test 4: Deduplication Verification
  console.log('\n--- Test 4: Deduplication Logic ---');
  const feed = kapService.getFeed();
  const seenKeys = new Set<string>();
  let hasDuplicate = false;
  for (const item of feed) {
    const key = `${item.id}_${item.symbol}_${item.publishDate.substring(0, 10)}`;
    if (seenKeys.has(key)) {
      hasDuplicate = true;
      break;
    }
    seenKeys.add(key);
  }
  assert(!hasDuplicate, 'Feed must not contain duplicate disclosure items');

  // Test 5: Separation of Original KAP Text vs AI Summary
  console.log('\n--- Test 5: Original KAP Text vs AI Summary Separation ---');
  for (const item of thyaoDisclosures) {
    assert(Boolean(item.originalText && item.originalText.trim().length > 20), `${item.id} must have verbatim originalText`);
    assert(Boolean(item.aiSummary && item.aiSummary.trim().length > 20), `${item.id} must have distinct aiSummary`);
    assert(item.originalText !== item.aiSummary, `${item.id} originalText and aiSummary must be distinctly separated`);
  }

  // Test 6: Authentic Official KAP Links Verification
  console.log('\n--- Test 6: Official KAP URLs ---');
  for (const item of feed) {
    assert(
      Boolean(item.originalUrl && item.originalUrl.startsWith('https://www.kap.org.tr/tr/Bildirim/')),
      `Item ${item.id} must contain authentic KAP canonical URL starting with https://www.kap.org.tr/tr/Bildirim/`,
      item.originalUrl
    );
  }

  // Test 7: Strict Verification Flag & Metadata Completeness
  console.log('\n--- Test 7: Verification Flag & Metadata Completeness ---');
  for (const item of feed) {
    assert(item.isVerified === true, `Item ${item.id} must have isVerified === true`);
    assert(Boolean(item.companyTitle && item.companyTitle.length > 3), `Item ${item.id} must have valid companyTitle`);
    assert(Boolean(item.publishDate), `Item ${item.id} must have publishDate`);
    assert(Boolean(item.title && item.title.length > 5), `Item ${item.id} must have title`);
  }

  // Test 8: Zero Hallucinated / Fallback Disclosures for Unverified Stocks
  console.log('\n--- Test 8: Zero Hallucinations for Unverified Stocks ---');
  const unverifiedSymbol = 'XYZ_NONEXISTENT_STOCK';
  const emptyDisclosures = kapService.getDisclosuresForSymbol(unverifiedSymbol);
  assert(
    emptyDisclosures.length === 0,
    `Unverified stock ${unverifiedSymbol} must return empty array, NEVER fabricate fake disclosures`
  );

  const emptyNews = kapService.getCompanyNewsForSymbol(unverifiedSymbol);
  assert(
    emptyNews.length === 0,
    `Unverified stock ${unverifiedSymbol} must return 0 news items, eliminating all fake filler`
  );

  // Test 9: Category and Search Filtering in Feed
  console.log('\n--- Test 9: Feed Category & Search Filtering ---');
  const financialReports = kapService.getFeed({ category: 'Finansal Rapor' });
  assert(financialReports.length > 0, 'Must return financial report disclosures');
  assert(financialReports.every(d => d.category === 'Finansal Rapor'), 'All items must match category');

  const radarSearch = kapService.getFeed({ search: 'radar' });
  assert(radarSearch.length > 0, 'Search for "radar" must return ASELS disclosure');
  assert(radarSearch.some(d => d.symbol === 'ASELS'), 'ASELS must be present in radar search');

  // Test 10: KAP Status & Official MKK Migration Guide Report
  console.log('\n--- Test 10: KAP Status & MKK Migration Guide ---');
  const statusReport = kapService.getStatusReport();
  assert(Boolean(statusReport.providerName), 'Status report must define providerName');
  assert(Boolean(statusReport.sourceType), 'Status report must define sourceType');
  assert(statusReport.verifiedCount > 0, 'Status report must report verifiedCount > 0');
  assert(statusReport.coveredSymbolsCount > 0, 'Status report must report coveredSymbolsCount > 0');
  assert(statusReport.migrationGuide.length === 4, 'Migration guide must provide all 4 implementation steps');
  assert(
    statusReport.officialPortalUrl === 'https://apiportal.mkk.com.tr/',
    'Official portal URL must point to apiportal.mkk.com.tr'
  );

  console.log(`\n🎉 ALL ${passed}/${total} KAP INTEGRATION TESTS PASSED PERFECTLY!\n`);
  return { allPassed: true, passed, total };
}

// Run immediately when executed via CLI
runKapDisclosuresTests();
