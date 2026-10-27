import YahooFinance from 'yahoo-finance2';
import { InstrumentUniverseService } from '../services/instrumentUniverseService.js';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const candidates = [
  { symbol: 'VKGYO', name: 'Vakıf GYO' },
  { symbol: 'PEKGY', name: 'Pera GYO' },
  { symbol: 'QNBTR', name: 'QNB Bank' },
  { symbol: 'QNBFK', name: 'QNB Finansleasing' },
  { symbol: 'QNBFL', name: 'QNB Finans Finansal Kiralama' },
  { symbol: 'LMKDC', name: 'Limak Doğu Anadolu Çimento' },
  { symbol: 'EFOR', name: 'Efor' },
  { symbol: 'EFORC', name: 'Efor Çay' },
  { symbol: 'YGGYO', name: 'Yeni Gimat GYO' },
  { symbol: 'YYGYO', name: 'Yeşil GYO' },
  { symbol: 'YGYO', name: 'Yeşil GYO' },
  { symbol: 'DAGI', name: 'Dagi Giyim' },
  { symbol: 'DAGHL', name: 'Dagi Yatırım Holding' },
  { symbol: 'DOBUR', name: 'Doğan Burda' },
  { symbol: 'KARYE', name: 'Kartal Yenilenebilir' },
  { symbol: 'MIPAZ', name: 'Milpa' },
  { symbol: 'MARKA', name: 'Marka Yatırım Holding' },
  { symbol: 'METUR', name: 'Metemtur' },
  { symbol: 'SELGD', name: 'Selçuk Gıda' },
  { symbol: 'SNKRN', name: 'Senkron' },
  { symbol: 'KERVT', name: 'Kerevitaş' },
  { symbol: 'ALMAD', name: 'Altınyağ' },
  { symbol: 'GRTRK', name: 'Grainturk' },
  { symbol: 'GTRK', name: 'Grainturk' }
];

async function checkCandidates() {
  for (const c of candidates) {
    try {
      const q: any = await yf.quote(`${c.symbol}.IS`);
      if (q && q.regularMarketPrice != null) {
        console.log(`[MATCH FOUND] ${c.symbol}.IS: Price=${q.regularMarketPrice}, ShortName=${q.shortname}`);
      } else {
        // try chart
        const chart: any = await yf.chart(`${c.symbol}.IS`, { period1: new Date(Date.now() - 10 * 86400000), interval: '1d' });
        console.log(`[CHART ONLY] ${c.symbol}.IS: candles=${chart?.quotes?.length}`);
      }
    } catch (e: any) {
      console.log(`[FAILED] ${c.symbol}.IS: ${e.message}`);
    }
  }
}

checkCandidates().catch(console.error);
