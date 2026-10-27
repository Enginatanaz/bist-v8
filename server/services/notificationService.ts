import {
  MarketAlertRule,
  AlertTriggerLog,
  DualTrackConditionType,
  OHLCV
} from '../types.js';
import { evaluateDualTrackConditions } from '../indicators/relativeStrengthEngine.js';

/**
 * Service managing user-defined conditional alerts and notification deduplication.
 */
export class NotificationService {
  private static instance: NotificationService;

  private alerts: Map<string, MarketAlertRule> = new Map();
  private triggerHistory: AlertTriggerLog[] = [];
  // Key: `${alertId}_${condition}_${dataTimestamp}` to strictly prevent repeat spam
  private deduplicationCache: Set<string> = new Set();

  private constructor() {
    this.seedDefaultAlerts();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private seedDefaultAlerts() {
    const defaultAlerts: MarketAlertRule[] = [
      {
        id: 'alt_eregl_xu100',
        symbol: 'EREGL',
        indexSymbol: 'XU100',
        timeframe: '1d',
        conditions: ['STOCK_BELOW_EMA20', 'STOCK_LOST_RS', 'EMA5_CROSS_EMA20_DOWN'],
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        lastTriggeredAt: new Date(Date.now() - 86400000).toISOString(),
        lastTriggerReason: 'Hisse EMA20 Altına İndi ve Göreceli Güç Kaybetti',
        notes: 'EREGL BIST 100 karşılaştırmalı trend ve göreceli güç takip kuralı'
      },
      {
        id: 'alt_thyao_xu100',
        symbol: 'THYAO',
        indexSymbol: 'XU100',
        timeframe: '4h',
        conditions: ['STOCK_BROKE_SUPPORT', 'SUPPORT_BREAK_WITH_VOLUME'],
        status: 'ACTIVE',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: 'THYAO 4 saatlikte hacimli destek kırılımı koruma alarmı'
      },
      {
        id: 'alt_garan_xbank',
        symbol: 'GARAN',
        indexSymbol: 'XBANK',
        timeframe: '1d',
        conditions: ['INDEX_BELOW_EMA20', 'UPWARD_CHANNEL_BROKEN'],
        status: 'PAUSED',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        notes: 'Banka endeksi zayıflığı ve Garanti kanal kırılımı'
      }
    ];

    for (const a of defaultAlerts) {
      this.alerts.set(a.id, a);
    }

    // Seed sample trigger log
    this.triggerHistory.push({
      id: 'log_seed_1',
      alertId: 'alt_eregl_xu100',
      symbol: 'EREGL',
      indexSymbol: 'XU100',
      condition: 'STOCK_BELOW_EMA20',
      conditionTitle: 'Hisse EMA20 Altına İndi',
      dataTimestamp: '2026-10-23',
      recordedAt: new Date(Date.now() - 86400000).toISOString(),
      priceAtTrigger: 54.20,
      indexPriceAtTrigger: 11096.56,
      explanation: 'EREGL kapanış fiyatı 54.20 TL ile 20 günlük EMA (54.85 TL) altına geriledi.'
    });
  }

  public getAllAlerts(): MarketAlertRule[] {
    return Array.from(this.alerts.values());
  }

  public getAlert(id: string): MarketAlertRule | undefined {
    return this.alerts.get(id);
  }

  public createAlert(rule: Omit<MarketAlertRule, 'id' | 'createdAt' | 'updatedAt'>): MarketAlertRule {
    const id = `alt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newAlert: MarketAlertRule = {
      ...rule,
      id,
      symbol: rule.symbol.toUpperCase(),
      indexSymbol: (rule.indexSymbol || 'XU100').toUpperCase(),
      timeframe: rule.timeframe || '1d',
      conditions: rule.conditions && rule.conditions.length > 0 ? rule.conditions : ['STOCK_BELOW_EMA20'],
      status: rule.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      lastTriggeredAt: null,
      lastTriggerReason: null
    };

    this.alerts.set(id, newAlert);
    return newAlert;
  }

  public updateAlert(id: string, updates: Partial<MarketAlertRule>): MarketAlertRule | null {
    const existing = this.alerts.get(id);
    if (!existing) return null;

    const updated: MarketAlertRule = {
      ...existing,
      ...updates,
      id: existing.id,
      symbol: updates.symbol ? updates.symbol.toUpperCase() : existing.symbol,
      indexSymbol: updates.indexSymbol ? updates.indexSymbol.toUpperCase() : existing.indexSymbol,
      updatedAt: new Date().toISOString()
    };

    this.alerts.set(id, updated);
    return updated;
  }

  public deleteAlert(id: string): boolean {
    return this.alerts.delete(id);
  }

  public toggleAlertStatus(id: string): MarketAlertRule | null {
    const alert = this.alerts.get(id);
    if (!alert) return null;

    alert.status = alert.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    alert.updatedAt = new Date().toISOString();
    return alert;
  }

  public getTriggerHistory(limit = 50): AlertTriggerLog[] {
    return [...this.triggerHistory]
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Evaluate an alert rule against actual candles.
   * Prevents repeat notifications for continuing conditions (Deduplication).
   */
  public evaluateAlert(
    alertId: string,
    stockCandles: OHLCV[],
    indexCandles: OHLCV[]
  ): AlertTriggerLog[] {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.status !== 'ACTIVE') return [];

    const statuses = evaluateDualTrackConditions(stockCandles, indexCandles);
    const triggeredLogs: AlertTriggerLog[] = [];

    const lastStockCandle = stockCandles[stockCandles.length - 1];
    const lastIndexCandle = indexCandles[indexCandles.length - 1];

    if (!lastStockCandle || !lastIndexCandle) return [];

    const dataTimestamp = lastStockCandle.dateStr || new Date(lastStockCandle.timestamp).toISOString().slice(0, 10);
    const priceAtTrigger = lastStockCandle.close;
    const indexPriceAtTrigger = lastIndexCandle.close;

    for (const conditionType of alert.conditions) {
      const match = statuses.find(s => s.condition === conditionType && s.isTriggered);
      if (match) {
        // Deduplication Check: do not trigger again for same alert + condition + dataTimestamp
        const dedupeKey = `${alert.id}_${conditionType}_${dataTimestamp}`;
        if (!this.deduplicationCache.has(dedupeKey)) {
          this.deduplicationCache.add(dedupeKey);

          const log: AlertTriggerLog = {
            id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            alertId: alert.id,
            symbol: alert.symbol,
            indexSymbol: alert.indexSymbol,
            condition: conditionType,
            conditionTitle: match.title,
            dataTimestamp,
            recordedAt: new Date().toISOString(),
            priceAtTrigger,
            indexPriceAtTrigger,
            explanation: `${alert.symbol} (${priceAtTrigger} TL) için '${match.title}' koşulu sağlandı: ${match.description} (${match.valueDescription})`
          };

          this.triggerHistory.unshift(log);
          triggeredLogs.push(log);

          alert.lastTriggeredAt = log.recordedAt;
          alert.lastTriggerReason = match.title;
        }
      }
    }

    return triggeredLogs;
  }
}
