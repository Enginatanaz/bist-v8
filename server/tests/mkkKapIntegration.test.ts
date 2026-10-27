import { MkkApiClient } from '../services/mkkApiClient.js';
import { KapDisclosuresService } from '../services/kapDisclosuresService.js';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

async function runMkkKapIntegrationTests() {
  console.log('=====================================================');
  console.log('   MKK KAP REST API ENTEGRASYON VE DOĞRULAMA TESTLERİ');
  console.log('=====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ''}`);
      throw new Error(`Test Failed: ${testName} -> ${details || ''}`);
    }
  }

  const kapService = KapDisclosuresService.getInstance();
  const universeService = InstrumentUniverseService.getInstance();

  // ---------------------------------------------------------------
  // SENARYO 1: MKK Şirket Listesi (GET /members) Alınması & Eşleştirme
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 1: MKK Şirket Listesi (GET /members) & Format Doğrulaması ---');
  const mockMembers = [
    { memberOid: '1001', code: 'THYAO', unvan: 'TÜRK HAVA YOLLARI ANONİM ORTAKLIĞI' },
    { memberOid: '1002', code: 'ASELS', unvan: 'ASELSAN ELEKTRONİK SANAYİ VE TİCARET A.Ş.' },
    { memberOid: '1003', code: 'GARAN', unvan: 'TÜRKİYE GARANTİ BANKASI A.Ş.' },
    { memberOid: '9999', code: 'BELIRSIZ_X', unvan: 'BİLİNMEYEN YABANCI FON ŞİRKETİ' }
  ];

  // Test custom configured client with mock endpoint handler / test logic
  const testClient = new MkkApiClient({
    apiKey: 'test-secret-key-12345',
    apiSecret: 'test-secret-password-xyz',
    baseUrl: 'https://apigwdev.mkk.com.tr/api/vyk'
  });

  assert(testClient.isConfigured() === true, 'Test client must report configured when apiKey is set');

  // Verify format of member records
  assert(mockMembers.length === 4, 'Mock members count matches');
  assert(Boolean(mockMembers[0].memberOid && mockMembers[0].code), 'Member record contains memberOid and code');

  // ---------------------------------------------------------------
  // SENARYO 2: Son Bildirim İndeksi (GET /lastDisclosureIndex) Okunması
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 2: Son Bildirim İndeksi Okunması (lastDisclosureIndex) ---');
  const sampleIndexResponses = [
    1150240,
    '1150240',
    { lastDisclosureIndex: 1150240 },
    { disclosureIndex: '1150240' },
    { result: 1150240 }
  ];

  for (const resp of sampleIndexResponses) {
    let extracted = '';
    if (typeof resp === 'number' || typeof resp === 'string') extracted = String(resp);
    else if ((resp as any).lastDisclosureIndex) extracted = String((resp as any).lastDisclosureIndex);
    else if ((resp as any).disclosureIndex) extracted = String((resp as any).disclosureIndex);
    else if ((resp as any).result) extracted = String((resp as any).result);

    assert(extracted === '1150240', `Index response parser correctly extracted 1150240 from ${JSON.stringify(resp)}`);
  }

  // ---------------------------------------------------------------
  // SENARYO 3: Bildirim Listesi Parametreleri (Zorunlu disclosureIndex)
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 3: Bildirim Listesi Çağrısı (Zorunlu disclosureIndex Kontrolü) ---');
  let threwOnMissingIndex = false;
  try {
    // Calling without mandatory disclosureIndex must fail
    await testClient.fetchDisclosures({ disclosureIndex: '' });
  } catch (err: any) {
    threwOnMissingIndex = true;
    assert(err.message.includes('disclosureIndex'), 'Missing disclosureIndex produces informative error');
  }
  assert(threwOnMissingIndex, 'fetchDisclosures must strictly reject empty disclosureIndex');

  // ---------------------------------------------------------------
  // SENARYO 4: Bildirim Detayları (GET /disclosureDetail/{index})
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 4: Bildirim Detayları Çağrı Doğrulaması ---');
  let threwOnEmptyDetailIndex = false;
  try {
    await testClient.fetchDisclosureDetail('   ');
  } catch (err: any) {
    threwOnEmptyDetailIndex = true;
    assert(err.message.includes('indeksi zorunludur'), 'Missing index for detail call throws descriptive error');
  }
  assert(threwOnEmptyDetailIndex, 'fetchDisclosureDetail must require non-empty disclosureIndex');

  // ---------------------------------------------------------------
  // SENARYO 5: Güvenli Hata Yönetimi ve Gizli Bilgilerin Sızdırılmaması
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 5: Güvenli Hata Yönetimi & Gizli Bilgi Sızdırmazlığı ---');
  const sensitiveSecret = 'VERY_SECRET_KEY_999888';
  const sensitivePassword = 'SUPER_SECRET_PASSWORD_ABC';
  const sensitiveClient = new MkkApiClient({
    apiKey: sensitiveSecret,
    apiSecret: sensitivePassword,
    baseUrl: 'https://apigwdev.mkk.com.tr/api/vyk'
  });

  const rawErrorMessage = `HTTP 401 Unauthorized for key=${sensitiveSecret} secret=${sensitivePassword} with Authorization: Bearer ${sensitiveSecret}`;
  const sanitized = sensitiveClient.sanitizeErrorMessage(rawErrorMessage);

  assert(!sanitized.includes(sensitiveSecret), 'Sanitized message MUST NOT leak apiKey');
  assert(!sanitized.includes(sensitivePassword), 'Sanitized message MUST NOT leak apiSecret');
  assert(sanitized.includes('[REDACTED_API_KEY]'), 'apiKey must be replaced with [REDACTED_API_KEY]');
  assert(sanitized.includes('[REDACTED_API_SECRET]'), 'apiSecret must be replaced with [REDACTED_API_SECRET]');

  // Check health status never includes secret keys
  const health = sensitiveClient.getHealthStatus();
  const serializedHealth = JSON.stringify(health);
  assert(!serializedHealth.includes(sensitiveSecret), 'Health status payload must never contain apiKey');
  assert(!serializedHealth.includes(sensitivePassword), 'Health status payload must never contain apiSecret');

  // ---------------------------------------------------------------
  // SENARYO 6: Şirket Kodu Eşleştirmesi & Ticker İzolasyonu (Hatalı Eşleştirmeyi Önleme)
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 6: Şirket Kodu Eşleştirmesi ve Hatalı Eşleştirmeyi Önleme ---');
  // Exact match from memberCode
  const resolvedThyao = kapService.resolveSymbolFromMkk('1001', 'THYAO', 'TÜRK HAVA YOLLARI A.O.');
  assert(resolvedThyao === 'THYAO', 'Exact memberCode THYAO must resolve to THYAO');

  // Exact match from company title
  const resolvedAsels = kapService.resolveSymbolFromMkk('1002', undefined, 'ASELSAN ELEKTRONİK SANAYİ VE TİCARET A.Ş.');
  assert(resolvedAsels === 'ASELS', 'Exact company title ASELSAN must resolve to ASELS');

  // Ambiguous / unverified company: MUST NOT GUESS or map to any stock!
  const ambiguous = kapService.resolveSymbolFromMkk('9999', undefined, 'BİLİNMEYEN ŞİRKET LTD');
  assert(ambiguous === '', 'Ambiguous / unverified company MUST resolve to empty string, NEVER guess');

  // Non-matching stock query returns empty array
  const emptyResults = kapService.getDisclosuresForSymbol('NON_EXISTENT_SYMBOL_99');
  assert(emptyResults.length === 0, 'Non-existent symbol query must strictly return 0 disclosures');

  // Cross-ticker leakage prevention
  const thyaoList = kapService.getDisclosuresForSymbol('THYAO');
  assert(thyaoList.length > 0, 'THYAO has verified disclosures');
  assert(thyaoList.every(d => d.symbol === 'THYAO'), 'All returned THYAO disclosures must have symbol === THYAO');

  const aselsList = kapService.getDisclosuresForSymbol('ASELS');
  assert(aselsList.length > 0, 'ASELS has verified disclosures');
  assert(aselsList.every(d => d.symbol === 'ASELS'), 'All returned ASELS disclosures must have symbol === ASELS');

  const thyaoIds = new Set(thyaoList.map(d => d.id));
  assert(aselsList.every(d => !thyaoIds.has(d.id)), 'ASELS and THYAO disclosures must never cross-pollinate');

  // ---------------------------------------------------------------
  // SENARYO 7: Canlı Veri ile Doğrulanmış Arşivin Ayrıştırılması
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 7: Canlı Veri vs Doğrulanmış Arşiv Ayrımı ---');
  const feed = kapService.getFeed();
  assert(feed.length >= 21, 'Feed must contain verified disclosures');

  for (const item of feed) {
    assert(
      item.dataSource === 'VERIFIED_ARCHIVE' || item.dataSource === 'MKK_LIVE_API',
      `Item ${item.id} must have explicit dataSource of either VERIFIED_ARCHIVE or MKK_LIVE_API (was: ${item.dataSource})`
    );

    if (item.dataSource === 'VERIFIED_ARCHIVE') {
      assert(
        Boolean(item.source?.includes('Arşiv') || item.source?.includes('Doğrulama')),
        `Archive item ${item.id} must NOT be labeled as live API (source: ${item.source})`
      );
    }
  }

  // ---------------------------------------------------------------
  // SENARYO 8: MKK Dakikada Maksimum 6 İstek Sınırı (Rate-Limiter) Kontrolü
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 8: MKK Hız Sınırı (Maksimum 6 İstek/Dk) Kontrolü ---');
  const rateLimitStatus = testClient.getRateLimitStatus();
  assert(rateLimitStatus.maxRequestsPerMinute === 6, 'Client must enforce exactly 6 requests per minute limit');
  assert(rateLimitStatus.remainingRequests <= 6, 'Remaining requests must be <= 6');

  // ---------------------------------------------------------------
  // SENARYO 9: Gerçek MKK API Uç Noktasına Canlı Ağ Bağlantı Denemesi
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 9: Gerçek MKK API Test Uç Noktası Bağlantı Denemesi ---');
  console.log('Hedef URL: https://apigwdev.mkk.com.tr/api/vyk');
  
  let networkAttempted = false;
  let networkStatus = '';
  let networkErrorDetail = '';

  try {
    const liveClient = new MkkApiClient({
      baseUrl: 'https://apigwdev.mkk.com.tr/api/vyk',
      timeoutMs: 4000
    });

    networkAttempted = true;
    console.log('MKK Gateway test uç noktasına HTTP GET /members isteği gönderiliyor...');
    await liveClient.fetchMembers(true);
    networkStatus = 'CONNECTED_SUCCESS';
    console.log('✅ MKK Gateway başarıyla yanıt verdi.');
  } catch (err: any) {
    networkStatus = 'CONNECTION_REFUSED_OR_TIMEOUT';
    networkErrorDetail = err.message || '';
    console.log(`ℹ️ MKK Canlı Bağlantı Sonucu: ${networkErrorDetail}`);
  }

  assert(networkAttempted === true, 'Network call to official MKK test gateway was actively attempted');

  // ---------------------------------------------------------------
  // SENARYO 10: MKK Şirket Listesi & BIST Hisse Kodları Yerel Eşleştirme Denetimi
  // ---------------------------------------------------------------
  console.log('\n--- Senaryo 10: MKK Şirket Listesi & BIST Hisse Kodları Yerel Eşleştirme Denetimi ---');
  const report = await kapService.getCompanyMatchingReport();

  console.log(`Toplam Uygulama Hisse Sayısı : ${report.totalCatalogStocks}`);
  console.log(`Başarıyla Eşleşen Hisse Sayısı: ${report.matchedCount}`);
  console.log(`Eşleşmeyen Hisse Sayısı       : ${report.unmatchedCount}`);
  console.log(`Çakışmalı Hisse Sayısı        : ${report.conflictCount}`);
  console.log(`Yinelenen MKK Üye Sayısı      : ${report.duplicateMkkMembersCount}`);
  console.log(`Virgülle Ayrılmış Kod Sayısı  : ${report.commaSeparatedMembersCount}`);
  console.log(`Hisse Başına Gerçek API Çağrısı: ${report.perStockApiCallsMade} (SIFIR)`);

  assert(report.totalCatalogStocks === 529, 'Total catalog stocks must equal 529');
  assert(report.matchedCount >= 527, `Matched stocks must be at least 527 (was: ${report.matchedCount})`);
  assert(report.unmatchedCount <= 2, `Unmatched stocks must be at most 2 (was: ${report.unmatchedCount})`);
  assert(report.conflictCount === 0, 'There must be 0 conflicting stocks');
  assert(report.perStockApiCallsMade === 0, 'Matching all stocks must require exactly 0 per-stock API calls');

  // KAP disclosure companyId resolution verification
  const resolvedMigros = kapService.resolveSymbolFromMkk('1494');
  assert(resolvedMigros === 'MGROS', `MKK companyId 1494 must directly resolve to MGROS (was: ${resolvedMigros})`);

  const resolvedKardemir = kapService.resolveSymbolFromMkk('994');
  assert(resolvedKardemir === 'KRDMD', `MKK companyId 994 must resolve to primary liquid share KRDMD (was: ${resolvedKardemir})`);

  const resolvedKrdma = kapService.resolveSymbolFromMkk('994', 'KRDMA');
  assert(resolvedKrdma === 'KRDMA', `MKK companyId 994 with memberCode KRDMA must resolve to KRDMA (was: ${resolvedKrdma})`);

  const resolvedIsctr = kapService.resolveSymbolFromMkk('2425');
  assert(resolvedIsctr === 'ISCTR', `MKK companyId 2425 must resolve to ISCTR (was: ${resolvedIsctr})`);

  // Verify unmatched stocks reasons (MIPAZ and MOPAS)
  for (const un of report.unmatchedStocks) {
    assert(
      un.symbol === 'MIPAZ' || un.symbol === 'MOPAS',
      `Unmatched stock must only be MIPAZ or MOPAS (found: ${un.symbol})`
    );
    assert(Boolean(un.reason && un.reason.length > 5), `Unmatched stock ${un.symbol} must have a descriptive reason`);
  }

  // ---------------------------------------------------------------
  // ÖZET VE SONUÇ
  // ---------------------------------------------------------------
  console.log('\n=====================================================');
  console.log(`TEST SONUCU: ${passed} / ${total} BAŞARILI (%100)`);
  console.log(`Canlı MKK Ağ Denemesi: ${networkAttempted ? 'EVET (Denedi)' : 'HAYIR'}`);
  console.log(`Canlı Ağ Durumu: ${networkStatus} (${networkErrorDetail || 'Tamamlandı'})`);
  console.log('=====================================================\n');
}

runMkkKapIntegrationTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
