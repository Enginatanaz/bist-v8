export interface CandleRecord {
  symbol: string;
  provider: string;
  instrumentId: string;
  candleStart: string;       // ISO timestamp
  candleEnd: string;         // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose?: number;
  volume: number;
  turnoverTL?: number;       // İşlem hacmi (TL)
  providerTimestamp: string;
  receivedAt: string;
  timeframe: string;
  isClosed?: boolean;
  validationStatus: 'VALID' | 'CORRECTED' | 'REJECTED';
  validationErrors?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  totalCandles: number;
  validCandlesCount: number;
  rejectedCandlesCount: number;
  correctedCandlesCount: number;
  errors: string[];
  warnings: string[];
  metrics: {
    highLowIntegrity: boolean;
    nonNegativeVolume: boolean;
    chronologicalOrder: boolean;
    duplicatesFound: number;
    gapsDetected: number;
    maxGapDays: number;
  };
}

export class MarketDataValidator {
  /**
   * Validates an array of candles strictly against financial rules (Rule 1.3)
   */
  static validateCandles(
    candles: CandleRecord[],
    symbol: string,
    timeframe: string = '1d'
  ): { validated: CandleRecord[]; result: ValidationResult } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validated: CandleRecord[] = [];

    let duplicatesFound = 0;
    let gapsDetected = 0;
    let maxGapDays = 0;
    let highLowIntegrity = true;
    let nonNegativeVolume = true;
    let chronologicalOrder = true;
    let correctedCount = 0;
    let rejectedCount = 0;

    const seenTimestamps = new Set<string>();

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const candleErrors: string[] = [];
      let status: CandleRecord['validationStatus'] = 'VALID';

      // 1. Basic price sanity
      if (isNaN(c.open) || isNaN(c.high) || isNaN(c.low) || isNaN(c.close) || c.close <= 0) {
        rejectedCount++;
        errors.push(`${c.candleStart}: Fiyat değerleri NaN veya sıfır/negatif.`);
        continue;
      }

      // 2. High/Low Integrity Check
      if (c.high < c.low) {
        highLowIntegrity = false;
        candleErrors.push(`En yüksek fiyat (${c.high}), en düşük fiyattan (${c.low}) küçük.`);
        status = 'CORRECTED';
        const temp = c.high;
        c.high = c.low;
        c.low = temp;
        correctedCount++;
      }
      if (c.high < c.open || c.high < c.close) {
        highLowIntegrity = false;
        candleErrors.push(`Yüksek fiyat (${c.high}) açılış (${c.open}) veya kapanıştan (${c.close}) düşük.`);
        status = 'CORRECTED';
        c.high = Math.max(c.high, c.open, c.close);
        correctedCount++;
      }
      if (c.low > c.open || c.low > c.close) {
        highLowIntegrity = false;
        candleErrors.push(`Düşük fiyat (${c.low}) açılış (${c.open}) veya kapanıştan (${c.close}) yüksek.`);
        status = 'CORRECTED';
        c.low = Math.min(c.low, c.open, c.close);
        correctedCount++;
      }

      // 3. Volume Check
      if (c.volume < 0 || isNaN(c.volume)) {
        nonNegativeVolume = false;
        candleErrors.push(`Hacim negatif veya geçersiz (${c.volume}).`);
        c.volume = 0;
        status = 'CORRECTED';
        correctedCount++;
      }

      // 4. Duplicate Check
      const timeKey = `${c.symbol}_${c.candleStart}`;
      if (seenTimestamps.has(timeKey)) {
        duplicatesFound++;
        warnings.push(`${c.candleStart}: Yinelenen mum tespit edildi ve elendi.`);
        continue;
      }
      seenTimestamps.add(timeKey);

      // 5. Chronological Order & Gap Check
      if (validated.length > 0) {
        const prev = validated[validated.length - 1];
        const prevTime = new Date(prev.candleStart).getTime();
        const curTime = new Date(c.candleStart).getTime();

        if (curTime <= prevTime) {
          chronologicalOrder = false;
          errors.push(`${c.candleStart}: Zaman sıralaması bozuk (önceki: ${prev.candleStart}).`);
        }

        // Gap detection for daily candles (skip weekends)
        if (timeframe === '1d') {
          const diffDays = (curTime - prevTime) / 86400000;
          if (diffDays > 4) { // More than a weekend + 1 holiday
            gapsDetected++;
            if (diffDays > maxGapDays) maxGapDays = Math.round(diffDays);
            warnings.push(`${prev.candleStart} ile ${c.candleStart} arasında ${Math.round(diffDays)} günlük veri boşluğu mevcut.`);
          }
        }
      }

      c.validationStatus = status;
      c.validationErrors = candleErrors.length > 0 ? candleErrors : undefined;
      validated.push(c);
    }

    // Sort chronologically if order was disturbed
    if (!chronologicalOrder) {
      validated.sort((a, b) => new Date(a.candleStart).getTime() - new Date(b.candleStart).getTime());
    }

    const result: ValidationResult = {
      isValid: errors.length === 0,
      totalCandles: candles.length,
      validCandlesCount: validated.length,
      rejectedCandlesCount: rejectedCount,
      correctedCandlesCount: correctedCount,
      errors,
      warnings,
      metrics: {
        highLowIntegrity,
        nonNegativeVolume,
        chronologicalOrder,
        duplicatesFound,
        gapsDetected,
        maxGapDays
      }
    };

    return { validated, result };
  }
}
