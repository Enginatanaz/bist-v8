import { BIST_FULL_EQUITY_CATALOG } from '../services/instrumentUniverseService.js';

const toCheck = ['VAKGY', 'VKGYO', 'PEGYO', 'PEKGY', 'QNBFB', 'QNBTR', 'QNBFL', 'QNBFK', 'EFORC', 'EFOR', 'YGYO', 'YGGYO', 'DAGHL', 'DAGI', 'GRTRK', 'GRTHO', 'KOZAL', 'KOZAA', 'IPEKE', 'ROYAL', 'DIRIT', 'MIPAZ', 'DOBUR', 'KARYE'];

for (const sym of toCheck) {
  const found = BIST_FULL_EQUITY_CATALOG.filter(x => x.symbol === sym);
  if (found.length > 0) {
    console.log(`Found ${sym}:`, found.map(f => ({ name: f.name, segment: f.marketSegment, status: f.status })));
  } else {
    console.log(`Not in catalog: ${sym}`);
  }
}
