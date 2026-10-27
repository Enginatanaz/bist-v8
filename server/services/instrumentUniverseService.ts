import { MarketSegment, InstrumentDataStatus, BISTStock } from '../types.js';

export interface UniverseRawItem {
  symbol: string;
  name: string;
  sector: string;
  subSector?: string;
  marketSegment: MarketSegment;
  indices: string[];
  status?: 'ACTIVE' | 'HALTED' | 'SUSPENDED';
  formerSymbols?: string[];
  providerSymbol?: string;
  notes?: string;
}

export interface UniverseStockRecord extends BISTStock {
  providerSymbol: string;
  unavailableReason?: string | null;
  lastErrorType?: 'DELISTED_OR_NOT_FOUND' | 'RATE_LIMITED' | 'NETWORK_TIMEOUT' | 'INSUFFICIENT_BARS' | 'EMPTY_RESPONSE' | 'SERVER_ERROR' | 'HALTED_OR_SUSPENDED' | 'UNKNOWN';
  formerSymbols?: string[];
  notes?: string;
}

/**
 * Official Borsa İstanbul Equity Universe Catalog (BIST Tüm Pay Piyasası).
 * Contains strictly equity instruments (Pay Senedi), categorised into
 * Yıldız Pazar, Ana Pazar, Alt Pazar and PÖİP.
 * Strictly excludes:
 *  - Mutual funds / Exchange Traded Funds (BYF / TEFAS like *F, GLDTR, USDTR)
 *  - Warrants (Varantlar, ending in *V)
 *  - Certificates (Sertifikalar, ending in *C)
 *  - Indices (Endeksler, e.g. XU100, XU030)
 */
export const BIST_FULL_EQUITY_CATALOG: UniverseRawItem[] = [
  // ==========================================
  // 1. YILDIZ PAZAR (High Liquidity & Large/Mid Caps)
  // ==========================================
  { symbol: 'THYAO', name: 'Türk Hava Yolları A.O.', sector: 'Ulaştırma', subSector: 'Havayolu Taşımacılığı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST ULASTIRMA'] },
  { symbol: 'GARAN', name: 'Türkiye Garanti Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'AKBNK', name: 'Akbank T.A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'ISCTR', name: 'Türkiye İş Bankası A.Ş. (C)', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'YKBNK', name: 'Yapı ve Kredi Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'VAKBN', name: 'Türkiye Vakıflar Bankası T.A.O.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'HALKB', name: 'Türkiye Halk Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'TSKB', name: 'Türkiye Sınai Kalkınma Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Kalkınma Bankacılığı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'ALBRK', name: 'Albaraka Türk Katılım Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Katılım Bankacılığı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'SKBNK', name: 'Şekerbank T.A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bankacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST BANKA'] },
  { symbol: 'KCHOL', name: 'Koç Holding A.Ş.', sector: 'Holdingler', subSector: 'Çoklu Faaliyet', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST HOLDING'] },
  { symbol: 'SAHOL', name: 'Hacı Ömer Sabancı Holding A.Ş.', sector: 'Holdingler', subSector: 'Çoklu Faaliyet', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST HOLDING'] },
  { symbol: 'SISE', name: 'Türkiye Şişe ve Cam Fabrikaları A.Ş.', sector: 'Sanayi', subSector: 'Cam ve Seramik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST SINAI'] },
  { symbol: 'TUPRS', name: 'Tüpraş - Türkiye Petrol Rafinerileri A.Ş.', sector: 'Sanayi', subSector: 'Petrol ve Rafineri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST SINAI'] },
  { symbol: 'EREGL', name: 'Ereğli Demir ve Çelik Fabrikaları T.A.Ş.', sector: 'Sanayi', subSector: 'Metal Ana Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST SINAI'] },
  { symbol: 'ASELS', name: 'Aselsan Elektronik Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Savunma ve Elektronik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST TEKNOLOJI'] },
  { symbol: 'BIMAS', name: 'BİM Birleşik Mağazalar A.Ş.', sector: 'Hizmetler', subSector: 'Perakende Ticaret', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST HIZMETLER'] },
  { symbol: 'ENKAI', name: 'Enka İnşaat ve Sanayi A.Ş.', sector: 'İnşaat', subSector: 'Müteahhitlik ve Enerji', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ARCLK', name: 'Arçelik A.Ş.', sector: 'Tüketim', subSector: 'Dayanıklı Tüketim', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'FROTO', name: 'Ford Otomotiv Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Otomotiv Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TOASO', name: 'Tofaş Türk Otomobil Fabrikası A.Ş.', sector: 'Sanayi', subSector: 'Otomotiv Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TTKOM', name: 'Türk Telekomünikasyon A.Ş.', sector: 'Teknoloji', subSector: 'Telekomünikasyon', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST ILETISIM'] },
  { symbol: 'TCELL', name: 'Turkcell İletişim Hizmetleri A.Ş.', sector: 'Teknoloji', subSector: 'Telekomünikasyon', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST ILETISIM'] },
  { symbol: 'EKGYO', name: 'Emlak Konut Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST GYO'] },
  { symbol: 'PGSUS', name: 'Pegasus Hava Taşımacılığı A.Ş.', sector: 'Ulaştırma', subSector: 'Havayolu Taşımacılığı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST ULASTIRMA'] },
  { symbol: 'MGROS', name: 'Migros Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Perakende Ticaret', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'KOZAL', name: 'Koza Altın İşletmeleri A.Ş.', sector: 'Madencilik', subSector: 'Kıymetli Madenler', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST MADENCILIK'], formerSymbols: ['KOZAL'], providerSymbol: 'TRALT.IS', notes: 'BIST unvan/kod değişimi: Türk Altın İşletmeleri A.Ş. (TRALT)' },
  { symbol: 'KOZAA', name: 'Koza Anadolu Metal Madencilik İşletmeleri A.Ş.', sector: 'Madencilik', subSector: 'Madencilik ve Metal', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'], formerSymbols: ['KOZAA'], providerSymbol: 'TRMET.IS', notes: 'BIST unvan/kod değişimi: TR Anadolu Metal Madencilik A.Ş. (TRMET)' },
  { symbol: 'IPEKE', name: 'İpek Doğal Enerji Kaynakları Araştırma ve Üretim A.Ş.', sector: 'Enerji', subSector: 'Petrol ve Gaz Arama', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'], formerSymbols: ['IPEKE'], providerSymbol: 'TRENJ.IS', notes: 'BIST unvan/kod değişimi: TR Doğal Enerji A.Ş. (TRENJ)' },
  { symbol: 'PETKM', name: 'Petkim Petrokimya Holding A.Ş.', sector: 'Sanayi', subSector: 'Kimya ve Plastik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST KIMYA'] },
  { symbol: 'SMRTG', name: 'Smart Güneş Enerjisi Teknolojileri A.Ş.', sector: 'Enerji', subSector: 'Yenilenebilir Enerji', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST ELEKTRIK'] },
  { symbol: 'EUPWR', name: 'Europower Enerji ve Otomasyon Teknolojileri Sanayi A.Ş.', sector: 'Enerji', subSector: 'Elektrik Ekipmanları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ASTOR', name: 'Astor Enerji A.Ş.', sector: 'Sanayi', subSector: 'Transformatör ve Elektrik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ALARK', name: 'Alarko Holding A.Ş.', sector: 'Holdingler', subSector: 'Holding ve Taahhüt', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'KONTR', name: 'Kontrolmatik Teknoloji Enerji ve Mühendislik A.Ş.', sector: 'Teknoloji', subSector: 'Mühendislik ve Enerji', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'MIATK', name: 'Mia Teknoloji A.Ş.', sector: 'Teknoloji', subSector: 'Yazılım ve Bilişim', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST BILISIM'] },
  { symbol: 'REEDR', name: 'Reeder Teknoloji Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Elektronik ve Tüketici Donanımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BRSAN', name: 'Borusan Birleşik Boru Fabrikaları Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Boru ve Metal Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'CWENE', name: 'CW Enerji Mühendislik Ticaret ve Sanayi A.Ş.', sector: 'Enerji', subSector: 'Güneş Enerjisi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'CANTE', name: 'Çan2 Termik A.Ş.', sector: 'Enerji', subSector: 'Termik Santral', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SASA', name: 'SASA Polyester Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Polyester ve Kimya', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST KIMYA'] },
  { symbol: 'HEKTS', name: 'Hektaş Ticaret T.A.Ş.', sector: 'Sanayi', subSector: 'Tarım ve Kimya', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM', 'BIST KIMYA'] },
  { symbol: 'GUBRF', name: 'Gübre Fabrikaları T.A.Ş.', sector: 'Sanayi', subSector: 'Gübre ve Kimya', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'KLSER', name: 'Kaleseramik Çanakkale Kalebodur Seramik Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Seramik ve Yapı Malzemeleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'VESBE', name: 'Vestel Beyaz Eşya Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Beyaz Eşya', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'VESTL', name: 'Vestel Elektronik Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Tüketici Elektroniği', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'OYAKC', name: 'Oyak Çimento Fabrikaları A.Ş.', sector: 'Sanayi', subSector: 'Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'CIMSA', name: 'Çimsa Çimento Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Çimento ve Yapı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AKCNS', name: 'Akçansa Çimento Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Çimento ve Hazır Beton', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'DOHOL', name: 'Doğan Şirketler Grubu Holding A.Ş.', sector: 'Holdingler', subSector: 'Çoklu Yatırım', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TAVHL', name: 'TAV Havalimanları Holding A.Ş.', sector: 'Ulaştırma', subSector: 'Havalimanı İşletmeciliği', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'DOAS', name: 'Doğuş Otomotiv Servis ve Ticaret A.Ş.', sector: 'Ticaret', subSector: 'Otomotiv İthalat ve Distribütörlük', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'CCOLA', name: 'Coca-Cola İçecek A.Ş.', sector: 'Tüketim', subSector: 'Meşrubat ve İçecek', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'AEFES', name: 'Anadolu Efes Biracılık ve Malt Sanayii A.Ş.', sector: 'Tüketim', subSector: 'İçecek Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'MAVI', name: 'Mavi Giyim Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Giyim ve Moda', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'SOKM', name: 'Şok Marketler Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Perakende Market', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'AGHOL', name: 'AG Anadolu Grubu Holding A.Ş.', sector: 'Holdingler', subSector: 'Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'OTKAR', name: 'Otokar Otomotiv ve Savunma Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Savunma ve Otobüs', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'KRDMD', name: 'Kardemir Karabük Demir Çelik Sanayi ve Ticaret A.Ş. (D)', sector: 'Sanayi', subSector: 'Demir Çelik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'KRDMA', name: 'Kardemir Karabük Demir Çelik Sanayi ve Ticaret A.Ş. (A)', sector: 'Sanayi', subSector: 'Demir Çelik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRDMB', name: 'Kardemir Karabük Demir Çelik Sanayi ve Ticaret A.Ş. (B)', sector: 'Sanayi', subSector: 'Demir Çelik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GESAN', name: 'Girişim Elektrik Sanayi Taahhüt ve Ticaret A.Ş.', sector: 'Enerji', subSector: 'Elektrik Taahhüt ve Mühendislik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ALFAS', name: 'Alfa Solar Enerji Sanayi ve Ticaret A.Ş.', sector: 'Enerji', subSector: 'Güneş Paneli Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ODAS', name: 'Odaş Elektrik Üretim Sanayi Ticaret A.Ş.', sector: 'Enerji', subSector: 'Elektrik Üretimi ve Maden', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ENJSA', name: 'Enerjisa Enerji A.Ş.', sector: 'Enerji', subSector: 'Elektrik Dağıtım ve Perakende', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 30', 'BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ULKER', name: 'Ülker Bisküvi Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Gıda ve Şekerleme', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ISGYO', name: 'İş Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM', 'BIST GYO'] },
  { symbol: 'TRGYO', name: 'Torunlar Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST GYO'] },
  { symbol: 'OZKGY', name: 'Özak Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST GYO'] },
  { symbol: 'KLGYO', name: 'Kiler Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST GYO'] },
  { symbol: 'BRISA', name: 'Brisa Bridgestone Sabancı Lastik Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Otomotiv Yan Sanayi (Lastik)', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KORDS', name: 'Kordsa Teknik Tekstil A.Ş.', sector: 'Sanayi', subSector: 'Teknik Tekstil ve Kompozit', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SELEC', name: 'Selçuk Ecza Deposu Ticaret ve Sanayi A.Ş.', sector: 'Sağlık', subSector: 'İlaç Dağıtımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'LOGO', name: 'Logo Yazılım Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Kurumsal Yazılım (ERP)', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST BILISIM'] },
  { symbol: 'NETAS', name: 'Netaş Telekomünikasyon A.Ş.', sector: 'Teknoloji', subSector: 'Bilişim ve Telekom Altyapı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'INDES', name: 'İndeks Bilgisayar Sistemleri Mühendislik Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Bilişim Distribütörlüğü', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TABGD', name: 'TAB Gıda Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Hızlı Servis Restoranları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TURSG', name: 'Türkiye Sigorta A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Elementer Sigortacılık', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM', 'BIST SIGORTA'] },
  { symbol: 'ANHYT', name: 'Anadolu Hayat Emeklilik A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Hayat ve Bireysel Emeklilik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AGESA', name: 'Agesa Hayat ve Emeklilik A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Bireysel Emeklilik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ISMEN', name: 'İş Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum ve Yatırım Bankacılığı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'AKFGY', name: 'Akfen Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ANSGR', name: 'Anadolu Anonim Türk Sigorta Şirketi', sector: 'Mali Kuruluşlar', subSector: 'Sigorta', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ARDYZ', name: 'Ard Grup Bilişim Teknolojileri A.Ş.', sector: 'Teknoloji', subSector: 'Yazılım ve Entegrasyon', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BAGFS', name: 'Bağfaş Bandırma Gübre Fabrikaları A.Ş.', sector: 'Sanayi', subSector: 'Kimyevi Gübre', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BERA', name: 'Bera Holding A.Ş.', sector: 'Holdingler', subSector: 'Çoklu Yatırım', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BUCIM', name: 'Bursa Çimento Fabrikası A.Ş.', sector: 'Sanayi', subSector: 'Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'CLEBI', name: 'Çelebi Hava Servisi A.Ş.', sector: 'Ulaştırma', subSector: 'Havalimanı Yer Hizmetleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'DEVA', name: 'Deva Holding A.Ş.', sector: 'Sağlık', subSector: 'İlaç Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ECILC', name: 'Eczacıbaşı İlaç Sınai ve Finansal Yatırımlar Sanayi ve Ticaret A.Ş.', sector: 'Sağlık', subSector: 'İlaç ve Sağlık Yatırımları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ECZYT', name: 'Eczacıbaşı Yatırım Holding Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Holding ve Menkul Kıymet', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'EGEEN', name: 'Ege Endüstri ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Dingil ve Otomotiv Aksamı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GENIL', name: 'Gen İlaç ve Sağlık Ürünleri Sanayi ve Ticaret A.Ş.', sector: 'Sağlık', subSector: 'Biyoteknoloji ve İlaç', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GSDHO', name: 'GSD Holding A.Ş.', sector: 'Holdingler', subSector: 'Denizcilik ve Bankacılık Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ISFIN', name: 'İş Finansal Kiralama A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Finansal Kiralama (Leasing)', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KARSN', name: 'Karsan Otomotiv Sanayii ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Ticari Araç ve Elektrikli Otobüs', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KARTN', name: 'Kartonsan Karton Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Karton ve Ambalaj', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KCAER', name: 'Kocaer Çelik Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Profil ve Çelik İmalatı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KERVT', name: 'Kerevitaş Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Dondurulmuş Gıda ve Margarin', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KMPUR', name: 'Kimteks Poliüretan Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Poliüretan ve Kimya', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KONKA', name: 'Konya Kağıt Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Yazı Tabı Kağıtları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KONYA', name: 'Konya Çimento Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KRVGD', name: 'Kervan Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Yumuşak Şeker ve Gıda', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MAGEN', name: 'Margün Enerji Üretim Sanayi ve Ticaret A.Ş.', sector: 'Enerji', subSector: 'Güneş Enerjisi Santralleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MOBTL', name: 'Mobiltel İletişim Hizmetleri Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Telekom Cihaz Distribütörlüğü', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MPARK', name: 'MLP Sağlık Hizmetleri A.Ş. (Medical Park)', sector: 'Sağlık', subSector: 'Özel Hastane İşletmeciliği', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'NTHOL', name: 'Net Holding A.Ş.', sector: 'Hizmetler', subSector: 'Turizm ve Otelcilik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'NUHCM', name: 'Nuh Çimento Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ORGE', name: 'Orge Enerji Elektrik Taahhüt A.Ş.', sector: 'İnşaat', subSector: 'Elektrik Taahhüt', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'PARSN', name: 'Parsan Makina Parçaları Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Dövme Çelik ve Ağır Parça', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'PENTA', name: 'Penta Teknoloji Ürünleri Dağıtım Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Bilişim Dağıtım', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'POLHO', name: 'Polisan Holding A.Ş.', sector: 'Holdingler', subSector: 'Boya, Kimya ve Liman Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'QUAGR', name: 'Qua Granite Hayal Yapı ve Ürünleri Sanayi Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Teknik Granit ve Seramik', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'RTALB', name: 'RTA Laboratuvarları Biyolojik Ürünler İlaç ve Makina Sanayi A.Ş.', sector: 'Sağlık', subSector: 'Tanı Kitleri ve Biyoloji', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SARKY', name: 'Sarkuysan Elektrolitik Bakır Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Bakır ve İletken Teller', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SAYAS', name: 'Say Yenilenebilir Enerji Ekipmanları Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Rüzgar Türbini Kule Ekipmanları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SDTTR', name: 'SDT Uzay ve Savunma Teknolojileri A.Ş.', sector: 'Teknoloji', subSector: 'Radar ve Savunma Elektroniği', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SNGYO', name: 'Sinpaş Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SUNTK', name: 'Sun Tekstil Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Tekstil ve Konfeksiyon', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SUWEN', name: 'Suwen Tekstil Sanayi Pazarlama A.Ş.', sector: 'Tüketim', subSector: 'İç Giyim Perakende', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TATGD', name: 'Tat Gıda Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Salça ve Konserve', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TKFEN', name: 'Tekfen Holding A.Ş.', sector: 'Holdingler', subSector: 'Müteahhitlik ve Tarım Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TMSN', name: 'Tümosan Motor ve Traktör Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Traktör ve Dizel Motor', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TRCAS', name: 'Turcas Petrol A.Ş.', sector: 'Enerji', subSector: 'Petrol Dağıtım ve Enerji Yatırımları', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TTRAK', name: 'Türk Traktör ve Ziraat Makineleri A.Ş.', sector: 'Sanayi', subSector: 'Tarım Makineleri ve Traktör', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'TURGG', name: 'Türker Proje Gayrimenkul ve Yatırım Geliştirme A.Ş.', sector: 'Gayrimenkul', subSector: 'Gayrimenkul Geliştirme', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'VAKFN', name: 'Vakıf Finansal Kiralama A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Leasing', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'VBTYZ', name: 'VBT Yazılım A.Ş.', sector: 'Teknoloji', subSector: 'Kurumsal BT ve Anaçatı Sistemleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'VERUS', name: 'Verusa Holding A.Ş.', sector: 'Holdingler', subSector: 'Girişim Sermayesi ve Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'YATAS', name: 'Yataş Yatak ve Yorgan Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Mobilya ve Yatak', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'YEOTK', name: 'YEO Teknoloji Enerji ve Endüstri A.Ş.', sector: 'Teknoloji', subSector: 'Otomasyon ve Elektrifikasyon', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ZOREN', name: 'Zorlu Enerji Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Jeotermal ve Rüzgar Santralleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'AHGAZ', name: 'Ahlatcı Doğal Gaz Dağıtım Enerji ve Yatırım A.Ş.', sector: 'Enerji', subSector: 'Doğal Gaz Dağıtımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AKFYE', name: 'Akfen Yenilenebilir Enerji A.Ş.', sector: 'Enerji', subSector: 'Temiz Enerji Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AKSA', name: 'Aksa Akrilik Kimya Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Akrilik Elyaf', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'AKSEN', name: 'Aksa Enerji Üretim A.Ş.', sector: 'Enerji', subSector: 'Bağımsız Enerji Üreticisi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 50', 'BIST 100', 'BIST TUM'] },
  { symbol: 'ARASE', name: 'Doğu Aras Enerji Yatırımları A.Ş.', sector: 'Enerji', subSector: 'Elektrik Dağıtım', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ATAKP', name: 'Atakey Patates Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Dondurulmuş Patates Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ATATP', name: 'ATP Ticari Bilgisayar Ağı ve Elektrik Veri Üretim A.Ş.', sector: 'Teknoloji', subSector: 'Fintech ve Konuk Ağırlama Yazılımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AVPGY', name: 'Avrupakent Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AYDEM', name: 'Aydem Yenilenebilir Enerji A.Ş.', sector: 'Enerji', subSector: 'Hidroelektrik ve Rüzgar', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'AYGAZ', name: 'Aygaz A.Ş.', sector: 'Enerji', subSector: 'LPG Dağıtım ve Otogaz', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BARMA', name: 'Barem Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Oluklu Mukavva ve Ofset Kutu', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BASGZ', name: 'Başkent Doğalgaz Dağıtım Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Enerji', subSector: 'Gaz Dağıtım GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BFREN', name: 'Bosch Fren Sistemleri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Fren Hidrolik Aksamı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BIENY', name: 'Bien Yapı Ürünleri Sanayi Turizm ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Seramik ve Banyo Gereçleri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BINHO', name: '1000 Yatırımlar Holding A.Ş.', sector: 'Holdingler', subSector: 'Mikromobilite ve Yatırım Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BIOEN', name: 'Biotrend Çevre ve Enerji Yatırımları A.Ş.', sector: 'Enerji', subSector: 'Biyokütle ve Atık Gazı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BOBET', name: 'Boğaziçi Beton Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Hazır Beton ve Agrega', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BORLS', name: 'Borlease Otomotiv A.Ş.', sector: 'Hizmetler', subSector: 'Operasyonel Filo Kiralama', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BORSK', name: 'Bor Şeker A.Ş.', sector: 'Tüketim', subSector: 'Şeker İmalatı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BRLSM', name: 'Birleşim Mühendislik Isıtma Soğutma Havalandırma Sanayi A.Ş.', sector: 'İnşaat', subSector: 'Mekanik ve Elektrik Taahhüt', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BRYAT', name: 'Borusan Yatırım ve Pazarlama A.Ş.', sector: 'Holdingler', subSector: 'Yatırım ve İştirak Holding', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BSOKE', name: 'Batısöke Söke Çimento Sanayii T.A.Ş.', sector: 'Sanayi', subSector: 'Klinker ve Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BTCIM', name: 'Batıçim Batı Anadolu Çimento Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Çimento Grubu', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BVSAN', name: 'Bülbüloğlu Vinç Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Endüstriyel Gezer Köprülü Vinç', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'BYDNR', name: 'Baydöner Restoranları A.Ş.', sector: 'Hizmetler', subSector: 'Restoran Zinciri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'CATES', name: 'Çates Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Kömür Santrali Enerji Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'CVKMD', name: 'CVK Maden İşletmeleri Sanayi ve Ticaret A.Ş.', sector: 'Madencilik', subSector: 'Krom ve Kurşun-Çinko', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'DAPGM', name: 'DAP Gayrimenkul Geliştirme A.Ş.', sector: 'Gayrimenkul', subSector: 'Konut ve Proje Geliştirme', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'DMRGD', name: 'DMR Unlu Mamuller Üretim Gıda Toptan Perakende İhracat A.Ş.', sector: 'Tüketim', subSector: 'Simit Sarayı İmalat Grubu', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'EBEBK', name: 'Ebebek Mağazacılık A.Ş.', sector: 'Hizmetler', subSector: 'Anne Bebek Perakende', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'EKOS', name: 'Ekos Teknoloji ve Elektrik A.Ş.', sector: 'Enerji', subSector: 'Orta ve Yüksek Gerilim Şalt', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'EKSUN', name: 'Eksun Gıda Tarım Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Endüstriyel Un ve Paket Un', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ENERY', name: 'Enerya Enerji A.Ş.', sector: 'Enerji', subSector: 'Şehir İçi Doğalgaz Dağıtım', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'FZLGY', name: 'Fuzul Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GIPTA', name: 'Gıpta Ofis Kırtasiye ve Promosyon Ürünleri İmalat Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Kırtasiye ve Defter', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GOKNR', name: 'Göknur Gıda Maddeleri Enerji İmalat İthalat İhracat Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Meyve Suyu Konsantresi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GRSEL', name: 'Gür-Sel Turizm Taşımacılık ve Servis Ticaret A.Ş.', sector: 'Ulaştırma', subSector: 'Personel ve Öğrenci Servis', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'GWIND', name: 'Galata Wind Enerji A.Ş.', sector: 'Enerji', subSector: 'Rüzgar ve Güneş Enerjisi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'HATSN', name: 'Hatsan Gemi İnşaa Bakım Onarım Deniz Nakliyat Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Tersane ve Gemi Onarımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'HRKET', name: 'Hareket Proje Taşımacılığı ve Yük Mühendisliği A.Ş.', sector: 'Ulaştırma', subSector: 'Ağır Nakliyat ve Vinç', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'HTTBT', name: 'Hitit Bilgisayar Hizmetleri A.Ş.', sector: 'Teknoloji', subSector: 'Havacılık Rezervasyon Yazılımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'IMASM', name: 'İmaş Makina Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Değirmen Makineleri İmalatı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'IZENR', name: 'İzdemir Enerji Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Termik Santral Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KAYSE', name: 'Kayseri Şeker Fabrikası A.Ş.', sector: 'Tüketim', subSector: 'Şeker ve Tarım Sanayi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KBORU', name: 'Kuzey Boru A.Ş.', sector: 'Sanayi', subSector: 'Altyapı ve Plastik Boru', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KOTON', name: 'Koton Mağazacılık Tekstil Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Hazır Giyim Perakendeciliği', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KTLEV', name: 'Katılımevim Tasarruf Finansman A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Tasarruf Finansman Şirketi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'KZGYO', name: 'Kuzugrup Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'LILAK', name: 'Lila Kağıt Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Temizlik Kağıtları İmalatı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MACKO', name: 'Maçkolik İnternet Hizmetleri Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Dijital Spor Yayıncılığı ve Reklam', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MARBL', name: 'Tureks Turunç Madencilik İç ve Dış Ticaret A.Ş.', sector: 'Madencilik', subSector: 'Mermer ve Traverten İşleme', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MEKAG', name: 'Meka Beton Santralleri İmalat Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Beton Santralleri ve Kırma Eleme', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MHRGY', name: 'MHR Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'MOGAN', name: 'Mogan Enerji Yatırım Holding A.Ş.', sector: 'Enerji', subSector: 'Jeotermal ve Rüzgar Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'OBAMS', name: 'Oba Makarnacılık Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Makarna ve İrmik Üretimi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'OFSYM', name: 'Ofis Yem Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Karma Hayvan Yemi', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'PASEU', name: 'Pasifik Donanım ve Yazılım Bilgi Teknolojileri A.Ş.', sector: 'Teknoloji', subSector: 'Siber Güvenlik ve Ağ Donanımı', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'PSGYO', name: 'Pasifik Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'RUBNS', name: 'Rubenis Mensucat Sanayi Ticaret A.Ş.', sector: 'Sanayi', subSector: 'İplik ve Kumaş Dokuma', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SOKE', name: 'Söke Değirmencilik Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Perakende ve Endüstriyel Un', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'SURGY', name: 'Sur Tatil Evleri Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TARKM', name: 'Tarkim Bitki Koruma Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Zirai İlaç ve Bitki Koruma', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TATEN', name: 'Tatlıpınar Enerji Üretim A.Ş.', sector: 'Enerji', subSector: 'Rüzgar Santrali Portföyü', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'TERA', name: 'Tera Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ONRYT', name: 'Onur Yüksek Teknoloji A.Ş.', sector: 'Teknoloji', subSector: 'Haberleşme ve Savunma Teknolojileri', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'LMKDC', name: 'Limak Doğu Anadolu Çimento Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Çimento', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'ENTRA', name: 'IC Enterra Yenilenebilir Enerji A.Ş.', sector: 'Enerji', subSector: 'Yenilenebilir Enerji', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM'] },
  { symbol: 'RGYAS', name: 'Rönesans Gayrimenkul Yatırım A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'YILDIZ_PAZAR', indices: ['BIST 100', 'BIST TUM', 'BIST GYO'] },

  // ==========================================
  // 2. ANA PAZAR (Active Small & Mid Cap Shares)
  // ==========================================
  { symbol: 'ACSEL', name: 'Acıselsan Acıpayam Selüloz Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Karboksimetil Selüloz', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ADEL', name: 'Adel Kalemcilik Ticaret ve Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Kırtasiye ve Yazı Gereçleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ADESE', name: 'Adese Gayrimenkul Yatırım A.Ş.', sector: 'Gayrimenkul', subSector: 'Gayrimenkul Yatırım', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AFYON', name: 'Afyon Çimento Sanayi T.A.Ş.', sector: 'Sanayi', subSector: 'Klinker ve Çimento', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AGROT', name: 'Agrotech Yüksek Teknoloji ve Yatırım A.Ş.', sector: 'Teknoloji', subSector: 'Tarım Teknolojileri ve Yazılım', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AGYO', name: 'Atakule Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AKENR', name: 'Akenerji Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Doğal Gaz ve Hidroelektrik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AKGRT', name: 'Aksigorta A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Kaza ve Yangın Sigortası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AKMGY', name: 'Akmerkez Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'AVM İşletmeciliği GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AKSUE', name: 'Aksu Enerji ve Ticaret A.Ş.', sector: 'Enerji', subSector: 'Hidroelektrik Santrali', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AKYHO', name: 'Akdeniz Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Hizmet ve Temizlik Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALCAR', name: 'Alarko Carrier Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'İklimlendirme ve Kombi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALCTL', name: 'Alcatel Lucent Teletaş Telekomünikasyon A.Ş.', sector: 'Teknoloji', subSector: 'Optik İletişim Donanımı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALKA', name: 'Alkim Kağıt Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Fotokopi ve Baskı Kağıdı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALKIM', name: 'Alkim Alkali Kimya A.Ş.', sector: 'Sanayi', subSector: 'Sodyum Sülfat ve Tuz', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALMAD', name: 'Altınyağ Madencilik ve Kimya Sanayi Ticaret A.Ş.', sector: 'Madencilik', subSector: 'Kömür Madenciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALTNY', name: 'Altınay Savunma Teknolojileri A.Ş.', sector: 'Teknoloji', subSector: 'İnsansız Sistemler ve Robotik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ALVES', name: 'Alves Kablo Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Enerji ve Tesisat Kabloları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ANELE', name: 'Anel Elektrik Proje Taahhüt ve Ticaret A.Ş.', sector: 'İnşaat', subSector: 'Elektromekanik Taahhüt', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ANGEN', name: 'Anatolia Tanı ve Biyoteknolojik Ürünler Araştırma Geliştirme Sanayi ve Ticaret A.Ş.', sector: 'Sağlık', subSector: 'Moleküler Biyoloji ve PCR Kiti', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ARENA', name: 'Arena Bilgisayar Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Bilişim Teknolojileri Dağıtımı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ARSAN', name: 'Arsan Tekstil Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'İplik ve Gaz Dağıtım Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ARTMS', name: 'Artemis Halı A.Ş.', sector: 'Tüketim', subSector: 'Makine Halısı Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ARZUM', name: 'Arzum Elektrikli Ev Aletleri Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Küçük Ev Aletleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ASGYO', name: 'Asce Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ASUZU', name: 'Anadolu Isuzu Otomotiv Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Kamyonet ve Otobüs', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ATAGY', name: 'Ata Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ATEKS', name: 'Akın Tekstil A.Ş.', sector: 'Sanayi', subSector: 'Dokuma Kumaş Sanayi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ATLAS', name: 'Atlas Menkul Kıymetler Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Portföy Yönetim Ortaklığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AVGYO', name: 'Avrasya Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AVHOL', name: 'Avrupa Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Sağlık ve Turizm Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AVOD', name: 'A.V.O.D. Kurutulmuş Gıda ve Tarım Ürünleri Sanayi Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Kurutulmuş Domates ve Sebze', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AVTUR', name: 'Avrasya Petrol ve Turistik Tesisler Yatırımlar A.Ş.', sector: 'Hizmetler', subSector: 'Turistik Tesis İşletmeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AYCES', name: 'Altın Yunus Çeşme Turistik Tesisler A.Ş.', sector: 'Hizmetler', subSector: 'Resort Otelcilik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AYEN', name: 'Ayen Enerji A.Ş.', sector: 'Enerji', subSector: 'Rüzgar ve Hidroelektrik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AYES', name: 'Ayes Çelik Hasır ve Çit Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Çelik Hasır ve Tel', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'AZTEK', name: 'Aztek Teknoloji Ürünleri Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Tüketici Elektroniği ve Ses Sistemleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BAKAB', name: 'Bak Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Esnek Ambalaj', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BANVT', name: 'Banvit Bandırma Vitaminli Yem Sanayii A.Ş.', sector: 'Tüketim', subSector: 'Beyaz Et ve Yem Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BAYRK', name: 'Bayrak EBT Taban Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Ayakkabı Tabanı İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BEGYO', name: 'Batı Ege Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BEYAZ', name: 'Beyaz Filo Oto Kiralama A.Ş.', sector: 'Hizmetler', subSector: 'Araç Kiralama ve Sıfır Araç Satış', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BIGCH', name: 'Büyük Şefler Gıda Turizm Tekstil Danışmanlık Organizasyon Eğitim Restorancılık A.Ş. (BigChefs)', sector: 'Hizmetler', subSector: 'Restoran ve Cafe Zinciri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BIZIM', name: 'Bizim Toptan Satış Mağazaları A.Ş.', sector: 'Hizmetler', subSector: 'Toptan Market Zinciri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BJKAS', name: 'Beşiktaş Futbol Yatırımları Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Profesyonel Spor Kulübü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BLCYT', name: 'Bilici Yatırım Sanayi ve Ticaret A.Ş.', sector: 'Holdingler', subSector: 'Tekstil ve Otelcilik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BMSCH', name: 'BMS Çelik Hasır Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Çelik Hasır İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BMSTL', name: 'BMS Birleşik Metal Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Galvanizli Çelik Tel', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BNTAS', name: 'Bantaş Bandırma Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Teneke Kutu Ambalaj', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BOSSA', name: 'Bossa Ticaret ve Sanayi İşletmeleri T.A.Ş.', sector: 'Sanayi', subSector: 'Denim ve Dokuma Kumaş', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BRKSN', name: 'Berkosan Yalıtım ve Tecrit Maddeleri Üretim ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Polietilen Yalıtım', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BURCE', name: 'Bursa Çelik Döküm Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Ağır Çelik Döküm', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BURVA', name: 'Burçelik Vana Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Endüstriyel Vana İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CELHA', name: 'Çelik Halat ve Tel Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Çelik Halat ve Tel Halat', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CEMAS', name: 'Çemaş Döküm Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Döküm Sanayi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CEMTS', name: 'Çemtaş Çelik Makina Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Vasıflı Çelik ve Denge Çubuğu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CEOEM', name: 'Ceo Event Medya A.Ş.', sector: 'Hizmetler', subSector: 'Etkinlik ve Kongre Yönetimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CONSE', name: 'Consus Enerji İşletmeciliği A.Ş.', sector: 'Enerji', subSector: 'Biyokütle ve Güneş Enerjisi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CRFSA', name: 'CarrefourSA Carrefour Sabancı Ticaret Merkezi A.Ş.', sector: 'Hizmetler', subSector: 'Süpermarket ve Hipermarket', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'CUSAN', name: 'Çuhadaroğlu Metal Sanayi ve Pazarlama A.Ş.', sector: 'Sanayi', subSector: 'Alüminyum Profil ve Mimari Sistemler', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DAGI', name: 'Dagi Giyim Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'İç Giyim ve Ev Giyimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DAGHL', name: 'Dagi Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Finansal Yatırım Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], status: 'HALTED', notes: 'Dagi Yatırım Holding borsa kotundan çıkarılmıştır.' },
  { symbol: 'DARDL', name: 'Dardanel Önentaş Gıda Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Ton Balığı ve Konserve', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DENGE', name: 'Denge Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Gayrimenkul ve Medya Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DERHL', name: 'Derlüks Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Deri, Tekstil ve Enerji Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DERIM', name: 'Derimod Konfeksiyon Ayakkabı Deri Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Deri Ceket ve Ayakkabı Mağazacılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DESA', name: 'Desa Deri Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Lüks Deri Mamulleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DESPC', name: 'Despec Bilgisayar Pazarlama ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Tüketim Malzemeleri ve Aksesuar Dağıtımı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DGATE', name: 'Datagate Bilgisayar Malzemeleri Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Akıllı Telefon ve Bilgisayar Distribütörlüğü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DGGYO', name: 'Doğuş Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Ticari GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DITAS', name: 'Ditaş Doğan Yedek Parça İmalat ve Teknik A.Ş.', sector: 'Sanayi', subSector: 'Rotbaşı ve Süspansiyon Parçaları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DMSAS', name: 'Demisaş Döküm Emaye Mamulleri Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Gri ve Sfero Döküm', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DNISI', name: 'Dinamik Isı Makina Yalıtım Malzemeleri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Köpük Yalıtım Malzemeleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DOBUR', name: 'Doğan Burda Dergi Yayıncılık ve Pazarlama A.Ş.', sector: 'Hizmetler', subSector: 'Süreli Yayıncılık', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], status: 'HALTED', notes: 'Hâkim ortak alım teklifi sonrası borsa kotundan çıkarılmıştır.' },
  { symbol: 'DOCO', name: 'DO & CO AG', sector: 'Hizmetler', subSector: 'Gurme Uçak İkram Hizmetleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DOGUB', name: 'Doğusan Boru Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Asbestli Çimento ve Kiremit', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DOKTA', name: 'Döktaş Dökümcülük Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Otomotiv Döküm Parçaları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DURDO', name: 'Duran Doğan Basım ve Ambalaj Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Karton Ambalaj ve Matbaa', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DYOBY', name: 'Dyo Boya Fabrikaları Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'İnşaat ve Sanayi Boyaları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DZGYO', name: 'Deniz Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EDATA', name: 'E-Data Teknoloji Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Katma Değerli Distribütörlük ve Güvenlik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EDIP', name: 'Edip Gayrimenkul Yatırım Sanayi ve Ticaret A.Ş.', sector: 'Gayrimenkul', subSector: 'Gayrimenkul Geliştirme', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EGEPO', name: 'Nasmed Özel Sağlık Hizmetleri Ticaret A.Ş. (Egepol Hastaneleri)', sector: 'Sağlık', subSector: 'Özel Sağlık ve Hastane Hizmetleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EGGUB', name: 'Ege Gübre Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Gübre İmalatı ve Liman Hizmetleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EGPRO', name: 'Ege Profil Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'PVC Kapı ve Pencere Profili (Egepen/Winsa)', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EGSER', name: 'Ege Seramik Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Seramik Karo ve Fayans', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ELITE', name: 'Elite Naturel Organik Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Organik Meyve Suyu ve İhracat', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EMKEL', name: 'Emek Elektrik Endüstrisi A.Ş.', sector: 'Sanayi', subSector: 'Akım ve Gerilim Transformatörleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ENSRI', name: 'Ensari Deri Gıda Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Kürk Süet ve Deri Tabaklama', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EPLAS', name: 'Egeplast Ege Plastik Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Plastik Altyapı Boruları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ERBOS', name: 'Erbosan Erciyas Boru Sanayii ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Dikişli Çelik Boru', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ERCB', name: 'Erciyas Çelik Boru Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Spiral Kaynaklı Petrol Borusu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ERSU', name: 'Ersu Meyve Suyu ve Gıda Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Meyve Suyu ve Püre', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ESCAR', name: 'Escar Turizm Taşımacılık Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Uzun Dönemli Filo Kiralama', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ESCOM', name: 'Escort Teknoloji Yatırım A.Ş.', sector: 'Teknoloji', subSector: 'Girişim Sermayesi ve Teknoloji Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ESEN', name: 'Esenboğa Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Güneş Santrali Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ETILR', name: 'Etiler Gıda ve Ticari Yatırımlar Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Büfe ve Fast Food Franchise', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EUHOL', name: 'Euro Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Finans ve Gayrimenkul Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EYGYO', name: 'EYG Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FADE', name: 'Fade Gıda Yatırım Sanayi Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Kurutulmuş Domates ve Fide Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FENER', name: 'Fenerbahçe Futbol A.Ş.', sector: 'Hizmetler', subSector: 'Spor Kulübü ve Medya Gelirleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FLAP', name: 'Flap Kongre Toplantı Hizmetleri Otomotiv ve Turizm A.Ş.', sector: 'Hizmetler', subSector: 'Kongre ve Toplantı Organizasyonu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FMIZP', name: 'Federal-Mogul İzmit Piston ve Pim Üretim Tesisleri A.Ş.', sector: 'Sanayi', subSector: 'Motor Piston ve Pim', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FONET', name: 'Fonet Bilgi Teknolojileri A.Ş.', sector: 'Teknoloji', subSector: 'Hastane Bilgi Yönetim Sistemleri (HBYS)', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FORMT', name: 'Formet Metal ve Cam Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Çelik Kapı ve Dayanıklı Tüketim', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FORTE', name: 'Forte Bilgi İletişim Teknolojileri ve Savunma Sanayi A.Ş.', sector: 'Teknoloji', subSector: 'Sistem Entegrasyonu ve Yazılım', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'FRIGO', name: 'Frigo-Pak Gıda Maddeleri Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Meyve Konservesi ve Narenciye', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GARFA', name: 'Garanti Faktoring A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Faktoring', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GEDIK', name: 'Gedik Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum ve Yatırım Danışmanlığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GEDZA', name: 'Gediz Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Polipropilen Oluklu Levha', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GENTS', name: 'Gentaş Dekoratif Yüzeyler Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Laminat ve Werzalit Masa Tablası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GEREL', name: 'Gersan Elektrik Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Busbar ve Elektrikli Araç Şarj Ünitesi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GLBMD', name: 'Global Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GLCVY', name: 'Gelecek Varlık Yönetimi A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Tahsilat ve Varlık Yönetimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GLRYH', name: 'Güler Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Finansal Hizmetler Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GLYHO', name: 'Global Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Kruvaziyer Liman ve Gaz Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GMTAS', name: 'Gimat Mağazacılık Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Gıda Perakendeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GOLTS', name: 'Göltaş Göller Bölgesi Çimento Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Klinker ve Çimento', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GOODY', name: 'Goodyear Lastikleri T.A.Ş.', sector: 'Sanayi', subSector: 'Otomobil ve Kamyon Lastiği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GOZDE', name: 'Gözde Girişim Sermayesi Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Girişim Sermayesi (Yıldız Holding)', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GRNYO', name: 'Garanti Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Menkul Kıymet Yatırım Ortaklığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GRTHO', name: 'Grainturk Holding A.Ş.', sector: 'Tüketim', subSector: 'Tahıl Ticareti ve Lisanslı Depoculuk', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['GRTRK'], providerSymbol: 'GRTHO.IS' },
  { symbol: 'GSDDE', name: 'GSD Denizcilik Gayrimenkul İnşaat Sanayi ve Ticaret A.Ş.', sector: 'Ulaştırma', subSector: 'Kuru Yük Gemisi Taşımacılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GSRAY', name: 'Galatasaray Sportif Sınai ve Ticari Yatırımlar A.Ş.', sector: 'Hizmetler', subSector: 'Spor Kulübü ve Mağazacılık', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'GZNMI', name: 'Gezinomi Seyahat Otomotiv Turizm Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Online Seyahat ve Tur Operatörlüğü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HATEK', name: 'Hateks Hatay Tekstil İşletmeleri A.Ş.', sector: 'Sanayi', subSector: 'Pamuk İpliği ve Havlu Bornoz', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HDFGS', name: 'Hedef Girişim Sermayesi Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Girişim Sermayesi Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HEDEF', name: 'Hedef Holding A.Ş.', sector: 'Holdingler', subSector: 'Fintech ve Yatırım Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HKTM', name: 'Hidropar Hareket Kontrol Teknolojileri Merkezi Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Mekatronik ve Robotik Otomasyon', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HLGYO', name: 'Halk Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HUBVC', name: 'Hub Girişim Sermayesi Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Erken Aşama Girişim Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HUNER', name: 'Hun Yenilenebilir Enerji Üretim A.Ş.', sector: 'Enerji', subSector: 'Güneş ve Biyokütle', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HURGZ', name: 'Hürriyet Gazetecilik ve Matbaacılık A.Ş.', sector: 'Hizmetler', subSector: 'Gazete ve Dijital Medya', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ICBCT', name: 'ICBC Turkey Bank A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Ticari Bankacılık', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IDGYO', name: 'İdealist Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IEYHO', name: 'Işıklar Enerji ve Yapı Holding A.Ş.', sector: 'Holdingler', subSector: 'Tuğla ve Ambalaj Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHAAS', name: 'İhlas Haber Ajansı A.Ş.', sector: 'Hizmetler', subSector: 'Haber Ajansı ve Görsel Medya', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHEVA', name: 'İhlas Ev Aletleri İmalat Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Su Arıtma ve Temizlik Robotu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHGZT', name: 'İhlas Gazetecilik A.Ş.', sector: 'Hizmetler', subSector: 'Türkiye Gazetesi ve Matbaa', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHLAS', name: 'İhlas Holding A.Ş.', sector: 'Holdingler', subSector: 'Medya, Gayrimenkul ve Sağlık Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHLGM', name: 'İhlas Gayrimenkul Proje Geliştirme ve Ticaret A.Ş.', sector: 'Gayrimenkul', subSector: 'Gayrimenkul Projeleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IHYAY', name: 'İhlas Yayın Holding A.Ş.', sector: 'Hizmetler', subSector: 'Yayıncılık ve İletişim', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'INFO', name: 'İnfo Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum ve Finansal Servisler', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'INGRM', name: 'Ingram Micro Bilişim Sistemleri A.Ş.', sector: 'Teknoloji', subSector: 'Katma Değerli Teknoloji Dağıtımı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'INVES', name: 'Investco Holding A.Ş.', sector: 'Holdingler', subSector: 'Yenilenebilir Enerji ve Maden Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ISDMR', name: 'İskenderun Demir ve Çelik A.Ş.', sector: 'Sanayi', subSector: 'Entegre Yassı Çelik Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ISGSY', name: 'İş Girişim Sermayesi Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Girişim Sermayesi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ISKPL', name: 'Işık Plastik Sanayi ve Dış Ticaret Pazarlama A.Ş.', sector: 'Sanayi', subSector: 'Termoplastik Levha İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ISSEN', name: 'İşbir Sentetik Dokuma Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Bigbag ve Endüstriyel Ambalaj', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ISYAT', name: 'İş Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Portföy Yönetim Ortaklığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IZFAS', name: 'İzmir Fırça Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Boya ve Temizlik Fırçası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IZINV', name: 'İz Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Yatırım Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'IZMDC', name: 'İzmir Demir Çelik Sanayi A.Ş.', sector: 'Sanayi', subSector: 'İnşaat Demiri ve Kütük', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'JANTS', name: 'Jantsa Jant Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Ticari ve Zirai Araç Jantı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KAREL', name: 'Karel Elektronik Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Santral ve Savunma Elektroniği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KARYE', name: 'Kartal Yenilenebilir Enerji Üretim A.Ş.', sector: 'Enerji', subSector: 'Güneş Enerjisi Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], status: 'HALTED', notes: 'Ahlatcı Doğal Gaz ile birleşme nedeniyle borsa kotundan çıkarılmıştır.' },
  { symbol: 'KATMR', name: 'Katmerciler Araç Üstü Ekipman Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Zırhlı Araç ve İtfaiye Üst Yapı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KFEIN', name: 'Kafein Yazılım Hizmetleri Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Bankacılık ve Telekom Yazılım Çözümleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KGYO', name: 'Koray Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KIMMR', name: 'Erson Kimya Gıda Sanayi ve Ticaret A.Ş. (Kim Market)', sector: 'Hizmetler', subSector: 'Süpermarket Mağazacılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KLKIM', name: 'Kalekim Kimyevi Maddeler Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Yapı Kimyasalları ve Seramik Yapıştırıcı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KLMSN', name: 'Klimasan Klima Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Ticari Soğutucu ve Dondurucu Dolaplar', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KLNMA', name: 'Türkiye Kalkınma ve Yatırım Bankası A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Kalkınma ve Yatırım Bankası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KLRHO', name: 'Kiler Holding A.Ş.', sector: 'Holdingler', subSector: 'İnşaat, Enerji ve Şeker Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KLSYN', name: 'Koleksiyon Mobilya Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Ofis ve Yaşam Alanı Mobilyası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KNFRT', name: 'Konfrut Tarım A.Ş.', sector: 'Tüketim', subSector: 'Meyve Konsantresi ve Soğuk Hava Depoculuğu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KOCMT', name: 'Koç Metalurji A.Ş.', sector: 'Sanayi', subSector: 'İnşaat Çeliği ve Kütük Demir', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KOPOL', name: 'Koza Polyester Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Polyester Elyaf Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRGYO', name: 'Körfez Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRONT', name: 'Kron Teknoloji A.Ş.', sector: 'Teknoloji', subSector: 'Ayrıcalıklı Erişim Yönetimi (PAM) ve Ağ Yönetimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRPLS', name: 'Koroplast Temizlik Ambalaj Ürünleri Sanayi ve Dış Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Çöp Torbası ve Mutfak Sarf Malzemeleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRSTL', name: 'Kristal Kola ve Meşrubat Sanayi Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Gazlı Meşrubat ve Maden Suyu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KRTEK', name: 'Karsu Tekstil Sanayii ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Modal ve Tencel İplik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KTSKR', name: 'Kütahya Şeker Fabrikası A.Ş.', sector: 'Tüketim', subSector: 'Kristal Şeker ve Melas', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KUTPO', name: 'Kütahya Porselen Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Porselen Sofra Eşyası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KUYAS', name: 'Kuyas Yatırım A.Ş.', sector: 'Gayrimenkul', subSector: 'Kuyumcukent ve Sanayi Sitesi İnşaatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KZBGY', name: 'Kızılbük Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Termal Resort GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'LIDER', name: 'Lider Filo Yönetim Hizmetleri A.Ş.', sector: 'Hizmetler', subSector: 'Kurumsal Filo Kiralama', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'LIDFA', name: 'Lider Faktoring A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'KOBİ Faktoringi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'LINK', name: 'Link Bilgisayar Sistemleri Yazılımı ve Donanımı Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Muhasebe ve Finans Yazılımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'LKMNH', name: 'Lokman Hekim Engürüsağ Sağlık Turizm Eğitim Hizmetleri ve İnşaat Taahhüt A.Ş.', sector: 'Sağlık', subSector: 'Özel Hastane İşletmeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ORCAY', name: 'Orçay Ortaköy Çay Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Siyah Çay Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], providerSymbol: 'ORCAY.IS' },
  { symbol: 'LUKSK', name: 'Lüks Kadife Ticaret ve Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Kadife Kumaş Sanayi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MAALT', name: 'Marmaris Altınyunus Turistik Tesisler A.Ş.', sector: 'Hizmetler', subSector: 'Divan Otelcilik Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MAKIM', name: 'Makim Makina Teknolojileri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Turnike Sistemleri ve Hassas Döküm', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MAKTK', name: 'Makina Takım Endüstrisi A.Ş.', sector: 'Sanayi', subSector: 'Matkap Ucu ve Kesici Takımlar', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MANAS', name: 'Manas Enerji Yönetimi Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Akıllı Sayaç Sistemleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MEDTR', name: 'Tıbbi Tıbbi Cihazlar ve Medikal Sanayi Ticaret A.Ş. (Meditera)', sector: 'Sağlık', subSector: 'Serum Setleri ve Tıbbi Cihaz', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MEGAP', name: 'Mega Polietilen Köpük Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Polietilen Köpük ve Tekstil', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MEGMT', name: 'Mega Metal Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Süper İnce Bakır Tel İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MERCN', name: 'Mercan Kimya Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Parafin ve Kimyevi Maddeler', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MERIT', name: 'Merit Turizm Yatırımları ve İşletmecilik A.Ş.', sector: 'Hizmetler', subSector: 'Otelcilik ve Casino İşletmeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MIPAZ', name: 'Milpa Ticari ve Sınai Ürünler Pazarlama Sanayi ve Ticaret A.Ş.', sector: 'Holdingler', subSector: 'Ticaret ve Gayrimenkul', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], status: 'HALTED', notes: 'Ortaklıktan çıkarma süreciyle borsa kotundan çıkarılmıştır.' },
  { symbol: 'MOPAS', name: 'Mopaş Marketçilik Gıda Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Perakende Market Zinciri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MRGYO', name: 'Martı Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Turizm GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MRSHL', name: 'Marshall Boya ve Vernik Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Dekoratif Boya', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MSGYO', name: 'Mistral Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MTRKS', name: 'Matriks Bilgi Dağıtım Hizmetleri A.Ş.', sector: 'Teknoloji', subSector: 'Finansal Terminal ve Algoritmik İşlem', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MTRYO', name: 'Metro Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Menkul Kıymet Yatırım Ortaklığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'NATEN', name: 'Naturel Yenilenebilir Enerji Ticaret A.Ş.', sector: 'Enerji', subSector: 'Güneş Santrali Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'NTGAZ', name: 'Naturelgaz Sanayi ve Ticaret A.Ş.', sector: 'Enerji', subSector: 'Taşımalı Doğal Gaz (CNG ve LNG)', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'NUGYO', name: 'Nurol Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OBASE', name: 'Obase Bilgisayar ve Danışmanlık Hizmetleri Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Perakende Çözümleri ve Veri Analitiği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ONCSM', name: 'Oncosem Onkolojik Sistemler Sanayi ve Ticaret A.Ş.', sector: 'Sağlık', subSector: 'Kemoterapi İlaç Hazırlama Sistemleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ORMA', name: 'Orma Orman Mamulleri İntegre Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Yonga Levha ve Melamin Kaplı Panel', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OSMEN', name: 'Osmanlı Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OSTIM', name: 'Ostim Endüstriyel Yatırımlar ve İşletme A.Ş.', sector: 'Holdingler', subSector: 'Organize Sanayi Bölgesi İşletmeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OTTO', name: 'Otto Holding A.Ş.', sector: 'Holdingler', subSector: 'Medya ve Prodüksiyon Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OYAYO', name: 'Oyak Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Portföy Yatırım Ortaklığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OYLUM', name: 'Oylum Sınai Yatırımlar A.Ş.', sector: 'Tüketim', subSector: 'Bisküvi, Gofret ve Şekerleme', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OZGYO', name: 'Özderici Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OZRDN', name: 'Özerden Ambalaj Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Balonlu Naylon ve Koruyucu Ambalaj', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'OZSUB', name: 'Özsu Balık Üretim A.Ş.', sector: 'Tüketim', subSector: 'Kültür Balıkçılığı (Levrek ve Çipura)', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PAGYO', name: 'Panora Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'AVM GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PAMEL', name: 'Pamukova Yenilenebilir Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Hidroelektrik Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PAPIL', name: 'Papilon Savunma Güvenlik Sistemleri Bilişim Mühendislik Hizmetleri İthalat İhracat Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Biyometrik Kimliklendirme ve Parmak İzi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PCILT', name: 'PC İletişim ve Medya Hizmetleri Sanayi Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Medya Planlama ve Reklam Satın Alma', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PEGYO', name: 'Pera Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['PEHOL'], status: 'HALTED', notes: 'Unvan ve yapı değişikliğine gitmiştir (Pera Yatırım Holding / PEHOL).' },
  { symbol: 'PEKGY', name: 'Peker Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Uluslararası GYO Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PENGD', name: 'Penguen Gıda Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Turşu, Konserve ve Reçel', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PETUN', name: 'Pınar Entegre Et ve Un Sanayii A.Ş.', sector: 'Tüketim', subSector: 'Et ve Şarküteri Ürünleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PINSU', name: 'Pınar Su ve İçecek Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Doğal Kaynak Suyu ve Maden Suyu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PKART', name: 'Plastikkart Akıllı Kart İletişim Sistemleri Sanayi ve Ticaret A.Ş.', sector: 'Teknoloji', subSector: 'Banka ve SIM Kart İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PKENT', name: 'Petrokent Turizm A.Ş.', sector: 'Hizmetler', subSector: 'Tatil Köyü İşletmeciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PLTUR', name: 'Platform Turizm Taşımacılık Gıda İnşaat Temizlik Hizmetleri Sanayi ve Ticaret A.Ş.', sector: 'Ulaştırma', subSector: 'Personel Taşımacılığı ve Filo', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PNLSN', name: 'Panelsan Çatı Cephe Sistemleri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Sandviç Panel ve EPS Yalıtım', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PNSUT', name: 'Pınar Süt Mamülleri Sanayii A.Ş.', sector: 'Tüketim', subSector: 'Süt, Peynir ve Yoğurt', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'POLTK', name: 'Politeknik Metal Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Alüminyum Yüzey İşlem Kimyasalları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PRDGS', name: 'Pardus Girişim Sermayesi Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Girişim Sermayesi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PRKAB', name: 'Türk Prysmian Kablo ve Sistemleri A.Ş.', sector: 'Sanayi', subSector: 'Yüksek Gerilim ve Fiber Optik Kablo', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PRKME', name: 'Park Elektrik Üretim Madencilik Sanayi ve Ticaret A.Ş.', sector: 'Madencilik', subSector: 'Krom ve Boksit Madenciliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PRZMA', name: 'Prizma Pres Matbaacılık Yayıncılık Sanayi ve Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Ticari Matbaacılık', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'PSDTC', name: 'Pastavilla Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Makarna ve Gıda', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'QNBTR', name: 'QNB Bank A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Banka', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['QNBFB'], providerSymbol: 'QNBTR.IS' },
  { symbol: 'QNBFK', name: 'QNB Finans Finansal Kiralama A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Leasing Hizmetleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['QNBFL'], providerSymbol: 'QNBFK.IS' },
  { symbol: 'RALYH', name: 'Ral Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'İnşaat ve Eğitim Holdingi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'RAYSG', name: 'Ray Sigorta A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Kasko ve Sağlık Sigortası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'RNPOL', name: 'Rainbow Polikarbonat Sanayi Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Polikarbonat Çatı Levhası', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'RYGYO', name: 'Reysaş Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Lojistik Depo GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'RYSAS', name: 'Reysaş Taşımacılık ve Lojistik Ticaret A.Ş.', sector: 'Ulaştırma', subSector: 'Entegre Depo ve Demiryolu Taşımacılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SAFKR', name: 'Safkar Ege Soğutmacılık Klima Soğuk Hava Tesisleri İhracat İthalat Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Mobil İklimlendirme ve Soğutucu Üniteler', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SAMAT', name: 'Saray Matbaacılık Kağıtçılık Kırtasiyecilik Ticaret ve Sanayi A.Ş.', sector: 'Hizmetler', subSector: 'Yayın ve Matbaa', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SANEL', name: 'San-El Mühendislik Elektrik Taahhüt Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Alçak Gerilim Pano ve Şalt', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SANFM', name: 'Sanifoam Sünger Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Akustik Ses Yalıtımı ve Poliüretan Sünger', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SANKO', name: 'Sanko Pazarlama İthalat İhracat A.Ş.', sector: 'Ticaret', subSector: 'İplik ve Kumaş Pazarlaması', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SEKFK', name: 'Şeker Finansal Kiralama A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Leasing', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SEKUR', name: 'Sekuro Plastik Ambalaj Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Endüstriyel Streç Film', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SELVA', name: 'Selva Gıda Sanayi A.Ş.', sector: 'Tüketim', subSector: 'Makarna ve Un Sanayi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SEYKM', name: 'Seyitler Kimya Sanayi A.Ş.', sector: 'Sağlık', subSector: 'Tıbbi Flaster ve Yara Bandı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SILVR', name: 'Silverline Endüstri ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Ankastre Ocak ve Davlumbaz', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SKTAS', name: 'Söktaş Tekstil Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Lüks Gömleklik Pamuklu Kumaş', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SKYMD', name: 'Şeker Yatırım Menkul Değerler A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Aracı Kurum', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SMART', name: 'Smartiks Yazılım A.Ş.', sector: 'Teknoloji', subSector: 'Müşteri İlişkileri Yönetimi (CRM) Yazılımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SNICA', name: 'Sanica Isı Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Panel Radyatör ve Kombi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SRVGY', name: 'Servet Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Almanya Ticari Gayrimenkul Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SUMAS', name: 'Sumaş Sarıçam Parke Kereste Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Masif Ahşap ve Kereste', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TBORG', name: 'Türk Tuborg Bira ve Malt Sanayii A.Ş.', sector: 'Tüketim', subSector: 'Bira ve İçecek İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TDGYO', name: 'Trend Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TEKTU', name: 'Tek-Art Turizm Zigana A.Ş.', sector: 'Hizmetler', subSector: 'Turizm ve Otelcilik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TEZOL', name: 'Europap Tezol Kağıt Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Temizlik Kağıtları İmalatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TGSAS', name: 'TGS Dış Ticaret A.Ş.', sector: 'Ticaret', subSector: 'Sektörel Dış Ticaret Şirketi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TKNSA', name: 'Teknosa İç ve Dış Ticaret A.Ş.', sector: 'Hizmetler', subSector: 'Teknoloji Perakende Mağazacılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TLMAN', name: 'Trabzon Liman İşletmeciliği A.Ş.', sector: 'Ulaştırma', subSector: 'Liman Yükleme ve Boşaltma', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TMPOL', name: 'Temapol Polimer Plastik ve İnşaat Sanayi Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Akrilik ve ABS Plastik Levha', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TNZTP', name: 'Tapdi Oksijen Özel Sağlık ve Eğitim Hizmetleri Sanayi Ticaret A.Ş. (Tınaztepe Sağlık Grubu)', sector: 'Sağlık', subSector: 'Özel Hastane ve Sağlık Kampüsü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TRILC', name: 'Türk İlaç ve Serum Sanayi A.Ş.', sector: 'Sağlık', subSector: 'Serum, Aşı ve Parenteral Solüsyon', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TSGYO', name: 'TSKB Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TSPOR', name: 'Trabzonspor Sportif Yatırım ve Futbol İşletmeciliği T.A.Ş.', sector: 'Hizmetler', subSector: 'Spor Kulübü ve Gelirleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TUCLK', name: 'Tuğçelik Alüminyum ve Metal Mamülleri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Yüksek Basınçlı Alüminyum Enjeksiyon', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'TUKAS', name: 'Tukaş Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Salça, Sebze Konservesi ve Sos', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ULUFA', name: 'Ulusal Faktoring A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Ticari Faktoring', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ULUSE', name: 'Ulusoy Elektrik İmalat Taahhüt ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Modüler Hücre ve Beton Köşk', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ULUUN', name: 'Ulusoy Un Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Buğday Unu İmalat ve İhracatı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'UNLU', name: 'Ünlü Yatırım Holding A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Yatırım Bankacılığı ve Birleşmeler', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'USAK', name: 'Uşak Seramik Sanayi A.Ş.', sector: 'Sanayi', subSector: 'Seramik Karo ve Yer Karosu', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'VAKKO', name: 'Vakko Tekstil ve Hazır Giyim Sanayi İşletmeleri A.Ş.', sector: 'Tüketim', subSector: 'Lüks Moda ve Konfeksiyon', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'VANGD', name: 'Vanet Gıda Sanayi İç ve Dış Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Et Entegre Tesisi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'VKFYO', name: 'Vakıf Menkul Kıymet Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Menkul Kıymet Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'VKGYO', name: 'Vakıf Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['VAKGY'], providerSymbol: 'VKGYO.IS' },
  { symbol: 'VRGYO', name: 'Vera Konsept Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Karma Yaşam Projeleri GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YAPRK', name: 'Yaprak Süt ve Besi Çiftlikleri Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Damızlık Süt Sığırcılığı', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YAYLA', name: 'Yayla Enerji Üretim Turizm ve İnşaat Ticaret A.Ş.', sector: 'Enerji', subSector: 'Rüzgar Santrali Yatırımları', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YGGYO', name: 'Yeni Gimat Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Ankamall AVM GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YGYO', name: 'Yeşil Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'Konut GYO Projeleri', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], notes: 'Sağlayıcı veri akışında güncelleme bekliyor.' },
  { symbol: 'YUNSA', name: 'Yünsa Yünlü Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Yünlü Dokuma Kumaş', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YYAPI', name: 'Yeşil Yapı Endüstrisi A.Ş.', sector: 'İnşaat', subSector: 'Altyapı ve Konut Müteahhitliği', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YYLGD', name: 'Yayla Agro Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Bakliyat ve Hazır Yemek', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ZEDUR', name: 'Zedur Enerji Elektrik Üretim A.Ş.', sector: 'Enerji', subSector: 'Hidroelektrik ve GES Portföyü', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ZRGYO', name: 'Ziraat Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'İstanbul Finans Merkezi GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'HOROZ', name: 'Horoz Lojistik Kargo Hizmetleri Ticaret A.Ş.', sector: 'Ulaştırma', subSector: 'Entegre Lojistik', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DOFER', name: 'Dofer Yapı Malzemeleri Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Demir Çelik ve Hasır', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SEGYO', name: 'Şeker Gayrimenkul Yatırım Ortaklığı A.Ş.', sector: 'Gayrimenkul', subSector: 'GYO', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DURKN', name: 'Durukan Şekerleme Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Şekerleme Üretimi', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'BAHKM', name: 'Bahadır Kimya Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Kimya ve Boya', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EFOR', name: 'Efor Çay Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Gıda ve Çay', marketSegment: 'ANA_PAZAR', indices: ['BIST TUM'], formerSymbols: ['EFORC'], providerSymbol: 'EFOR.IS' },

  // ==========================================
  // 3. ALT PAZAR (Emerging & Smaller Capitalized Equities)
  // ==========================================
  { symbol: 'BALAT', name: 'Balatacılar Balatacılık Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Fren Balatası İmalatı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'COSMO', name: 'Cosmos Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Endüstriyel Soğutma ve Yatırım', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'DIRIT', name: 'Diriteks Diriliş Tekstil Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Battaniye ve Tekstil', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'], status: 'HALTED', notes: 'Yakın İzleme Pazarı / İşlem Sırası Geçici Durduruldu' },
  { symbol: 'EKIZ', name: 'Ekiz Kimya Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Zeytinyağı ve Sabun İmalatı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EMNIS', name: 'Eminiş Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Plastik ve Metal Ambalaj', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ETYAT', name: 'Euro Trend Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Menkul Kıymet Yatırımı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'EUKYO', name: 'Euro Kapital Yatırım Ortaklığı A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Menkul Kıymet Yatırımı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KAPLM', name: 'Kaplamin Ambalaj Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Oluklu Mukavva Kutu', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KSTUR', name: 'Kuştur Kuşadası Turizm Endüstrisi A.Ş.', sector: 'Hizmetler', subSector: 'Tatil Köyü', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'KUVVA', name: 'Kuvva Gıda Ticaret ve Yatırım A.Ş.', sector: 'Tüketim', subSector: 'Gıda Yatırımları', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MARKA', name: 'Marka Yatırım Holding A.Ş.', sector: 'Holdingler', subSector: 'Hizmet Yatırımları Holdingi', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MARTI', name: 'Martı Otel İşletmeleri A.Ş.', sector: 'Hizmetler', subSector: 'Resort Otelleri ve Marina', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MERKO', name: 'Merko Gıda Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Salça ve Domates Türevleri İhracatı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'METRO', name: 'Metro Ticari ve Mali Yatırımlar Holding A.Ş.', sector: 'Holdingler', subSector: 'Yatırım Holdingi', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'METUR', name: 'Metemtur Otelcilik ve Turizm Yatırımları A.Ş.', sector: 'Hizmetler', subSector: 'Turizm ve Gayrimenkul', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'MZHLD', name: 'Mazhar Zorlu Holding A.Ş.', sector: 'Holdingler', subSector: 'Plastik ve Boru Holdingi', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'NIBAS', name: 'Niğbaş Niğde Beton Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Prefabrik Beton Yapı Elemanları', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'RODRG', name: 'Rodrigo Tekstil Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Denim Giyim ve Aksesuar', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'ROYAL', name: 'Royal Halı İplik Tekstil Mobilya Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Halı ve İplik', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'], status: 'SUSPENDED', notes: 'Kottan Çıkarılan / İşlem Sırası Kapalı' },
  { symbol: 'SELGD', name: 'Selçuk Gıda Endüstri İhracat İthalat A.Ş.', sector: 'Tüketim', subSector: 'Kurutulmuş İncir ve Meyve İhracatı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'SONME', name: 'Sönmez Filament Sentetik İplik ve Elyaf Sanayii A.Ş.', sector: 'Sanayi', subSector: 'Filament İplik ve Çimento Yatırımı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'UFUK', name: 'Ufuk Yatırım Yönetim ve Gayrimenkul A.Ş.', sector: 'Holdingler', subSector: 'Yatırım Yönetimi', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'VKING', name: 'Viking Kağıt ve Selüloz A.Ş.', sector: 'Sanayi', subSector: 'Tuvalet Kağıdı ve Havlu', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },
  { symbol: 'YONGA', name: 'Yonga Mobilya Sanayi ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Masif Meşe Mobilya İhracatı', marketSegment: 'ALT_PAZAR', indices: ['BIST TUM'] },

  // ==========================================
  // 4. PÖİP & DİĞER PAZARLAR (Pre-Market / Structured Trading)
  // ==========================================
  { symbol: 'BASCM', name: 'Baştaş Başkent Çimento Sanayi ve Ticaret A.Ş.', sector: 'Sanayi', subSector: 'Klinker ve Çimento', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'BRKO', name: 'Birko Birleşik Koyunlular Mensucat Ticaret ve Sanayi A.Ş.', sector: 'Sanayi', subSector: 'İplik ve Dokuma', marketSegment: 'POIP', indices: ['BIST TUM'], status: 'HALTED', notes: 'İşlem Sırası Geçici Kapalı' },
  { symbol: 'CRDFA', name: 'Creditwest Faktoring A.Ş.', sector: 'Mali Kuruluşlar', subSector: 'Faktoring', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'ISBTR', name: 'Türkiye İş Bankası A.Ş. (B)', sector: 'Mali Kuruluşlar', subSector: 'B Grubu Paylar', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'ISKUR', name: 'Türkiye İş Bankası A.Ş. (Kurucu)', sector: 'Mali Kuruluşlar', subSector: 'Kurucu İntifa Payları', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'ISATR', name: 'Türkiye İş Bankası A.Ş. (A)', sector: 'Mali Kuruluşlar', subSector: 'A Grubu Paylar', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'MMCAS', name: 'MMC Sanayi ve Ticari Yatırımlar A.Ş.', sector: 'Holdingler', subSector: 'Yatırım Hizmetleri', marketSegment: 'POIP', indices: ['BIST TUM'], status: 'HALTED', notes: 'İşlem Sırası Geçici Kapalı' },
  { symbol: 'SNKRN', name: 'Senkron Siber Savunma Yazılım Çözümleri A.Ş.', sector: 'Teknoloji', subSector: 'Siber Savunma ve Entegrasyon', marketSegment: 'POIP', indices: ['BIST TUM'] },
  { symbol: 'UMPAS', name: 'Umpaş Holding A.Ş.', sector: 'Holdingler', subSector: 'Seramik ve Ambalaj Holdingi', marketSegment: 'POIP', indices: ['BIST TUM'], status: 'HALTED', notes: 'İşlem Sırası Geçici Kapalı' },
  { symbol: 'KENT', name: 'Kent Gıda Maddeleri Sanayii ve Ticaret A.Ş.', sector: 'Tüketim', subSector: 'Şekerleme ve Sakız', marketSegment: 'POIP', indices: ['BIST TUM'] }
];

export interface UniverseStatistics {
  totalEquityCount: number;
  yildizPazarCount: number;
  anaPazarCount: number;
  altPazarCount: number;
  digerPazarCount: number;
  activeCount: number;
  haltedCount: number;
  suspendedCount: number;
  verifiedCount: number;
  staleCount: number;
  unavailableCount: number;
  notTestedCount: number;
  duplicateCount: number;
  nonEquityLeakCount: number;
  lastUniverseUpdateTime: string;
  unavailableSymbols: { symbol: string; segment: string; reason: string; timestamp: string }[];
}

/**
 * Singleton Service governing the central BIST equity universe.
 * Decouples listing catalog from runtime market feed availability.
 */
export class InstrumentUniverseService {
  private static instance: InstrumentUniverseService;
  private catalog: Map<string, UniverseStockRecord> = new Map();
  private lastCatalogUpdate: string = new Date().toISOString();
  private duplicateDetectedCount = 0;
  private nonEquityLeakCount = 0;

  private constructor() {
    this.bootstrapUniverse();
  }

  static getInstance(): InstrumentUniverseService {
    if (!InstrumentUniverseService.instance) {
      InstrumentUniverseService.instance = new InstrumentUniverseService();
    }
    return InstrumentUniverseService.instance;
  }

  private bootstrapUniverse() {
    const seenSymbols = new Set<string>();
    let dupCount = 0;
    let leakCount = 0;

    for (const raw of BIST_FULL_EQUITY_CATALOG) {
      const sym = raw.symbol.toUpperCase().trim();

      // Duplicate check
      if (seenSymbols.has(sym)) {
        dupCount++;
        continue;
      }
      seenSymbols.add(sym);

      // Non-equity leak check (warrants ending in V with specific structure, funds like GLDTR/USDTR, indices XU*)
      const isFund = sym.endsWith('F') && (sym.length >= 6 || !['GUBRF', 'HEDEF'].includes(sym)); // e.g. ZPX10F, excludes genuine equities
      const isWarrant = (sym.endsWith('V') && sym.length >= 6) || sym.startsWith('DX') || sym.startsWith('IY');
      const isIndex = sym.startsWith('XU') || sym.startsWith('XB') || sym.startsWith('XY');
      const isCert = sym.endsWith('C') && sym.length >= 6;

      if (isFund || isWarrant || isIndex || isCert) {
        leakCount++;
        continue; // Discard invalid non-equity instrument
      }

      const defaultRecord: UniverseStockRecord = {
        symbol: sym,
        name: raw.name,
        sector: raw.sector,
        subSector: raw.subSector,
        marketSegment: raw.marketSegment,
        indices: raw.indices,
        instrumentType: 'EQUITY',
        providerSymbol: raw.providerSymbol || `${sym}.IS`,
        dataStatus: raw.status === 'HALTED' || raw.status === 'SUSPENDED' ? 'UNAVAILABLE' : 'NOT_TESTED',
        lastVerifiedAt: null,
        unavailableReason: raw.notes || null,
        lastPrice: 0,
        change: 0,
        changePercent: 0,
        open: 0,
        high: 0,
        low: 0,
        previousClose: 0,
        volume: 0,
        volumeTL: 0,
        marketCapTL: 0,
        status: raw.status || 'ACTIVE',
        formerSymbols: raw.formerSymbols,
        notes: raw.notes,
        updatedAt: new Date().toISOString(),
        isDelayed: true,
        delayMinutes: 15
      };

      this.catalog.set(sym, defaultRecord);
    }

    this.duplicateDetectedCount = dupCount;
    this.nonEquityLeakCount = leakCount;
    this.lastCatalogUpdate = new Date().toISOString();
  }

  /**
   * Retrieves all instruments, with optional filtering.
   */
  getAllInstruments(filters?: {
    marketSegment?: string;
    sector?: string;
    index?: string;
    search?: string;
    dataStatus?: InstrumentDataStatus;
  }): UniverseStockRecord[] {
    let items = Array.from(this.catalog.values());

    if (filters?.marketSegment && filters.marketSegment !== 'ALL') {
      items = items.filter(i => i.marketSegment === filters.marketSegment);
    }
    if (filters?.sector && filters.sector !== 'ALL') {
      items = items.filter(i => i.sector === filters.sector);
    }
    if (filters?.index && filters.index !== 'ALL') {
      items = items.filter(i => i.indices.includes(filters.index!));
    }
    if (filters?.dataStatus && filters.dataStatus !== ('ALL' as any)) {
      items = items.filter(i => i.dataStatus === filters.dataStatus);
    }
    if (filters?.search) {
      const q = filters.search.toUpperCase().trim();
      items = items.filter(i => i.symbol.includes(q) || i.name.toUpperCase().includes(q));
    }

    return items;
  }

  getInstrument(symbol: string): UniverseStockRecord | null {
    const cleanSym = symbol.toUpperCase().replace('.IS', '').trim();
    return this.catalog.get(cleanSym) || null;
  }

  getStock(symbol: string): UniverseStockRecord | null {
    return this.getInstrument(symbol);
  }

  hasInstrument(symbol: string): boolean {
    const cleanSym = symbol.toUpperCase().replace('.IS', '').trim();
    return this.catalog.has(cleanSym);
  }

  /**
   * Updates real-time market data and verification state.
   */
  updateMarketQuote(
    symbol: string,
    quoteData: Partial<BISTStock>,
    status: InstrumentDataStatus = 'VERIFIED'
  ) {
    const cleanSym = symbol.toUpperCase().replace('.IS', '').trim();
    const existing = this.catalog.get(cleanSym);
    if (!existing) return;

    Object.assign(existing, quoteData);
    existing.dataStatus = status;
    if (status === 'VERIFIED') {
      existing.lastVerifiedAt = new Date().toISOString();
      existing.unavailableReason = null;
    }
    this.catalog.set(cleanSym, existing);
  }

  /**
   * Returns the exact provider ticker symbol (e.g. GRTHO.IS, QNBTR.IS, VKGYO.IS, etc.)
   */
  getProviderSymbol(symbol: string): string {
    const cleanSym = symbol.toUpperCase().replace('.IS', '').trim();
    const existing = this.catalog.get(cleanSym);
    if (existing && existing.providerSymbol) {
      return existing.providerSymbol;
    }
    return `${cleanSym}.IS`;
  }

  /**
   * Flags instrument as unavailable or invalid with clear reason and structured error type.
   */
  markDataFailure(
    symbol: string,
    status: 'UNAVAILABLE' | 'INVALID' | 'STALE',
    reason: string,
    errorType?: 'DELISTED_OR_NOT_FOUND' | 'RATE_LIMITED' | 'NETWORK_TIMEOUT' | 'INSUFFICIENT_BARS' | 'EMPTY_RESPONSE' | 'SERVER_ERROR' | 'HALTED_OR_SUSPENDED' | 'UNKNOWN'
  ) {
    const cleanSym = symbol.toUpperCase().replace('.IS', '').trim();
    const existing = this.catalog.get(cleanSym);
    if (!existing) return;

    existing.dataStatus = status;
    existing.unavailableReason = reason;
    if (errorType) {
      existing.lastErrorType = errorType;
    }
    this.catalog.set(cleanSym, existing);
  }

  /**
   * Generates exact universe telemetry and segment statistics.
   */
  getStatistics(): UniverseStatistics {
    const all = Array.from(this.catalog.values());

    let yildiz = 0;
    let ana = 0;
    let alt = 0;
    let poip = 0;
    let active = 0;
    let halted = 0;
    let suspended = 0;
    let verified = 0;
    let stale = 0;
    let unavailable = 0;
    let notTested = 0;
    const unavailableSymbols: { symbol: string; segment: string; reason: string; timestamp: string }[] = [];

    for (const item of all) {
      if (item.marketSegment === 'YILDIZ_PAZAR') yildiz++;
      else if (item.marketSegment === 'ANA_PAZAR') ana++;
      else if (item.marketSegment === 'ALT_PAZAR') alt++;
      else poip++;

      if (item.status === 'ACTIVE') active++;
      else if (item.status === 'HALTED') halted++;
      else if (item.status === 'SUSPENDED') suspended++;

      if (item.dataStatus === 'VERIFIED') verified++;
      else if (item.dataStatus === 'STALE') stale++;
      else if (item.dataStatus === 'UNAVAILABLE') {
        unavailable++;
        unavailableSymbols.push({
          symbol: item.symbol,
          segment: item.marketSegment,
          reason: item.unavailableReason || 'Sağlayıcı veri akışı sağlamıyor',
          timestamp: item.updatedAt
        });
      } else if (item.dataStatus === 'NOT_TESTED') {
        notTested++;
      }
    }

    return {
      totalEquityCount: all.length,
      yildizPazarCount: yildiz,
      anaPazarCount: ana,
      altPazarCount: alt,
      digerPazarCount: poip,
      activeCount: active,
      haltedCount: halted,
      suspendedCount: suspended,
      verifiedCount: verified,
      staleCount: stale,
      unavailableCount: unavailable,
      notTestedCount: notTested,
      duplicateCount: this.duplicateDetectedCount,
      nonEquityLeakCount: this.nonEquityLeakCount,
      lastUniverseUpdateTime: this.lastCatalogUpdate,
      unavailableSymbols: unavailableSymbols.slice(0, 30)
    };
  }
}
