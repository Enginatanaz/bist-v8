import { BISTStock, OHLCV, MarketStatus, KAPDisclosure, DataHealthReport } from '../types.js';

export interface MarketDataProvider {
  name: string;
  isRealData: boolean;
  isDelayed: boolean;
  delayMinutes: number;

  getStocks(): Promise<BISTStock[]>;
  getStock(symbol: string): Promise<BISTStock | null>;
  getOHLCV(symbol: string, timeframe?: string, limit?: number, period?: string): Promise<OHLCV[]>;
  getMarketStatus(): Promise<MarketStatus>;
  getKAPDisclosures(symbol?: string): Promise<KAPDisclosure[]>;
  getHealthReport(): Promise<DataHealthReport>;
  auditUniverseAvailability?(samplesPerSegment?: number): Promise<any>;
}
