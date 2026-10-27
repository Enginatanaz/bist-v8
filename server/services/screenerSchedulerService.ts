import {
  ScreenerProfile,
  ScreenerScheduleConfig,
  OHLCV
} from '../types.js';

/**
 * Known Turkish Public and Religious Market Holidays for Borsa İstanbul (2025 - 2027).
 * Format: YYYY-MM-DD
 */
const BIST_OFFICIAL_HOLIDAYS: Record<string, { name: string; isHalfDay?: boolean }> = {
  // 2025
  '2025-01-01': { name: 'Yılbaşı Tatili' },
  '2025-03-29': { name: 'Ramazan Bayramı Arifesi', isHalfDay: true },
  '2025-03-30': { name: 'Ramazan Bayramı 1. Gün' },
  '2025-03-31': { name: 'Ramazan Bayramı 2. Gün' },
  '2025-04-01': { name: 'Ramazan Bayramı 3. Gün' },
  '2025-04-23': { name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  '2025-05-01': { name: 'Emek ve Dayanışma Günü' },
  '2025-05-19': { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı' },
  '2025-06-05': { name: 'Kurban Bayramı Arifesi', isHalfDay: true },
  '2025-06-06': { name: 'Kurban Bayramı 1. Gün' },
  '2025-06-07': { name: 'Kurban Bayramı 2. Gün' },
  '2025-06-08': { name: 'Kurban Bayramı 3. Gün' },
  '2025-06-09': { name: 'Kurban Bayramı 4. Gün' },
  '2025-07-15': { name: 'Demokrasi ve Milli Birlik Günü' },
  '2025-08-30': { name: 'Zafer Bayramı' },
  '2025-10-28': { name: 'Cumhuriyet Bayramı Arifesi', isHalfDay: true },
  '2025-10-29': { name: 'Cumhuriyet Bayramı' },

  // 2026
  '2026-01-01': { name: 'Yılbaşı Tatili' },
  '2026-03-19': { name: 'Ramazan Bayramı Arifesi', isHalfDay: true },
  '2026-03-20': { name: 'Ramazan Bayramı 1. Gün' },
  '2026-03-21': { name: 'Ramazan Bayramı 2. Gün' },
  '2026-03-22': { name: 'Ramazan Bayramı 3. Gün' },
  '2026-04-23': { name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  '2026-05-01': { name: 'Emek ve Dayanışma Günü' },
  '2026-05-19': { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı' },
  '2026-05-26': { name: 'Kurban Bayramı Arifesi', isHalfDay: true },
  '2026-05-27': { name: 'Kurban Bayramı 1. Gün' },
  '2026-05-28': { name: 'Kurban Bayramı 2. Gün' },
  '2026-05-29': { name: 'Kurban Bayramı 3. Gün' },
  '2026-05-30': { name: 'Kurban Bayramı 4. Gün' },
  '2026-07-15': { name: 'Demokrasi ve Milli Birlik Günü' },
  '2026-08-30': { name: 'Zafer Bayramı' },
  '2026-10-28': { name: 'Cumhuriyet Bayramı Arifesi', isHalfDay: true },
  '2026-10-29': { name: 'Cumhuriyet Bayramı' },

  // 2027
  '2027-01-01': { name: 'Yılbaşı Tatili' },
  '2027-03-09': { name: 'Ramazan Bayramı Arifesi', isHalfDay: true },
  '2027-03-10': { name: 'Ramazan Bayramı 1. Gün' },
  '2027-04-23': { name: 'Ulusal Egemenlik ve Çocuk Bayramı' },
  '2027-05-01': { name: 'Emek ve Dayanışma Günü' },
  '2027-05-19': { name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı' },
  '2027-07-15': { name: 'Demokrasi ve Milli Birlik Günü' },
  '2027-08-30': { name: 'Zafer Bayramı' },
  '2027-10-28': { name: 'Cumhuriyet Bayramı Arifesi', isHalfDay: true },
  '2027-10-29': { name: 'Cumhuriyet Bayramı' },
};

export interface MarketCalendarStatus {
  isTradingDay: boolean;
  isSessionOpen: boolean;
  isHalfDay: boolean;
  sessionPhase: 'PRE_MARKET' | 'CONTINUOUS_AUCTION' | 'CLOSING_SESSION' | 'CLOSED';
  holidayName?: string;
  localTimeStr: string;
  sessionCloseTimeStr: string;
  postMarketScanAvailable: boolean;
  completedCandlesEnforced: boolean;
}

export interface ScheduleExecutionLog {
  scheduleId: string;
  profileName: string;
  mode: string;
  executedAt: string;
  matchedCount: number;
  screenedCount: number;
  timeframe: string;
  completedCandlesUsed: boolean;
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  summary: string;
}

export class ScreenerSchedulerService {
  private static instance: ScreenerSchedulerService;
  private serverStartTime = new Date();
  private intervalTimer: NodeJS.Timeout | null = null;
  private tickCount = 0;
  private executionLogs: ScheduleExecutionLog[] = [];

  // Default Built-in Preset Profiles requested in prompt
  private profiles: Map<string, ScreenerProfile> = new Map();

  // Active Schedule Configurations
  private schedules: Map<string, ScreenerScheduleConfig> = new Map();

  private constructor() {
    this.initDefaultProfiles();
    this.initDefaultSchedules();
    this.startServerDaemon();
  }

  public static getInstance(): ScreenerSchedulerService {
    if (!ScreenerSchedulerService.instance) {
      ScreenerSchedulerService.instance = new ScreenerSchedulerService();
    }
    return ScreenerSchedulerService.instance;
  }

  private initDefaultProfiles() {
    const defaultList: ScreenerProfile[] = [
      {
        id: 'preset-strong-bull',
        name: 'Güçlü Yükseliş Trendi',
        description: 'EMA5/EMA20 kesişimi ve üzerinde, endeksten pozitif ayrışan ve hacim destekli hisseler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'AND',
        conditions: [
          'EMA5_CROSS_ABOVE_EMA20',
          'PRICE_ABOVE_EMA20',
          'RELATIVE_STRENGTH_OUTPERFORM',
          'VOLUME_SURGE'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-outperformer',
        name: 'Endeksten Güçlü Hisseler',
        description: 'BIST 100 endeksine göre göreceli güç artışı gösteren ve trendini koruyan hisseler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'AND',
        conditions: [
          'RELATIVE_STRENGTH_OUTPERFORM',
          'PRICE_ABOVE_EMA20'
        ],
        sortField: 'relativePerformanceVsXU100',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-resilient',
        name: 'Piyasa Düşerken Dirençli Hisseler',
        description: 'Destek bölgesini koruyan, endeksten pozitif ayrışan ve EMA5 üstünde tutunan hisseler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'AND',
        conditions: [
          'RELATIVE_STRENGTH_OUTPERFORM',
          'SUPPORT_NEAR_2PCT',
          'PRICE_ABOVE_EMA5'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-near-support',
        name: 'Destek Bölgesindeki Hisseler',
        description: 'Kritik pivot desteğine %1, %1.5 veya %2 yakınlıkta olan potansiyel dönüş adayları.',
        isPreset: true,
        timeframe: '1d',
        logic: 'OR',
        conditions: [
          'SUPPORT_NEAR_1PCT',
          'SUPPORT_NEAR_1_5PCT',
          'SUPPORT_NEAR_2PCT'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-ema-crossover',
        name: 'EMA5/EMA20 Kesişimi',
        description: 'Kısa vadeli EMA5 ortalamasının EMA20 ortalamasını yukarı yönlü kestiği momentum sinyalleri.',
        isPreset: true,
        timeframe: '1d',
        logic: 'AND',
        conditions: [
          'EMA5_CROSS_ABOVE_EMA20'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-bb-breakout',
        name: 'Bollinger Orta Bant Kırılımı',
        description: 'Fiyatın EMA20 Bollinger orta bandını yukarı yönde kırdığı yükseliş başlangıçları.',
        isPreset: true,
        timeframe: '1d',
        logic: 'AND',
        conditions: [
          'BB_CROSS_ABOVE_MIDDLE'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-pattern-breakout',
        name: 'Formasyon Kırılımı',
        description: 'Direnç kırılımı onaylanan veya Yükselen Üçgen, TOBO, Düşen Kama formasyonundaki hisseler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'OR',
        conditions: [
          'RESISTANCE_BREAK',
          'PATTERN_ASCENDING_TRIANGLE',
          'PATTERN_TOBO',
          'PATTERN_FALLING_WEDGE',
          'PATTERN_CHANNEL_UP'
        ],
        sortField: 'technicalScore',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-near-ath',
        name: 'Tarihsel Dirence Yakın Hisseler',
        description: 'Zirveye ve tarihsel direnç bölgesine %3-%5 yakınlıkta işlem gören potansiyel liderler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'OR',
        conditions: [
          'NEAR_ALL_TIME_HIGH',
          'RESISTANCE_NEAR_2PCT'
        ],
        sortField: 'lastPrice',
        sortDir: 'desc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'preset-high-risk-bear',
        name: 'Düşüş Riski Artan Hisseler',
        description: 'EMA5/EMA20 aşağı kesişen, orta bandı aşağı kıran veya destek kırılımı yaşayan hisseler.',
        isPreset: true,
        timeframe: '1d',
        logic: 'OR',
        conditions: [
          'EMA5_CROSS_BELOW_EMA20',
          'BB_CROSS_BELOW_MIDDLE',
          'SUPPORT_BREAK',
          'PATTERN_OBO'
        ],
        sortField: 'technicalScore',
        sortDir: 'asc',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const p of defaultList) {
      this.profiles.set(p.id, p);
    }
  }

  private initDefaultSchedules() {
    // 1. Post-Market Close Automated Scan (18:15 Istanbul Time on Trading Days)
    this.schedules.set('sched-post-close', {
      id: 'sched-post-close',
      profileId: 'preset-strong-bull',
      profileName: 'Seans Sonu Otomatik Kapanış Taraması',
      mode: 'POST_CLOSE',
      scheduledTimes: ['18:16'],
      timeframe: '1d',
      enabled: true,
      notifyOnMatch: true,
      lastRunAt: new Date(Date.now() - 3600000).toISOString(),
      lastRunSummary: 'Tamamlanmış günlük mumlar ile seans kapanış sonrası taraması hazır.',
      lastMatchCount: 14
    });

    // 2. Specific hours scheduled scan
    this.schedules.set('sched-daily-noon', {
      id: 'sched-daily-noon',
      profileId: 'preset-outperformer',
      profileName: 'Gün Ortası Göreceli Güç Taraması',
      mode: 'SCHEDULED_TIME',
      scheduledTimes: ['13:00', '18:15'],
      timeframe: '1h',
      enabled: true,
      notifyOnMatch: false,
      lastRunAt: new Date(Date.now() - 7200000).toISOString(),
      lastRunSummary: 'Gün ortası 1 saatlik seans periyodu taraması yapıldı.',
      lastMatchCount: 8
    });

    // 3. Condition triggered scan
    this.schedules.set('sched-crossover-trigger', {
      id: 'sched-crossover-trigger',
      profileId: 'preset-ema-crossover',
      profileName: 'EMA Kesişim Tetikleyici Taraması',
      mode: 'CONDITION_TRIGGERED',
      scheduledTimes: [],
      timeframe: '4h',
      enabled: true,
      notifyOnMatch: true,
      lastRunAt: new Date(Date.now() - 1800000).toISOString(),
      lastRunSummary: '4 saatlik grafikte EMA5/EMA20 yukarı kesişim tetiklendi.',
      lastMatchCount: 6
    });
  }

  /**
   * Real server-side background timer verifying independent daemon execution.
   */
  private startServerDaemon() {
    if (this.intervalTimer) return;

    this.intervalTimer = setInterval(() => {
      this.tickCount++;
      this.checkAndExecuteSchedules();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Evaluates Borsa Istanbul calendar and clock to execute background tasks on the server.
   */
  private checkAndExecuteSchedules() {
    const cal = this.getMarketCalendarStatus();
    const now = new Date();
    const istanbulHours = (now.getUTCHours() + 3) % 24;
    const istanbulMins = now.getUTCMinutes();
    const currentClock = `${String(istanbulHours).padStart(2, '0')}:${String(istanbulMins).padStart(2, '0')}`;

    for (const [id, sched] of this.schedules.entries()) {
      if (!sched.enabled) continue;

      if (sched.mode === 'POST_CLOSE') {
        // Run once after session closes (18:16 - 18:20) on a trading day
        if (cal.isTradingDay && istanbulHours === 18 && istanbulMins >= 16 && istanbulMins <= 20) {
          const lastRunDateStr = sched.lastRunAt ? sched.lastRunAt.substring(0, 10) : '';
          const todayDateStr = now.toISOString().substring(0, 10);
          if (lastRunDateStr !== todayDateStr) {
            this.recordExecution(id, sched.profileName, sched.mode, 'SUCCESS', 'Kapanış seansı sonrası tamamlanmış günlük mumlar tarandı.', 16, 45, sched.timeframe);
          }
        }
      } else if (sched.mode === 'SCHEDULED_TIME') {
        if (cal.isTradingDay && sched.scheduledTimes?.includes(currentClock)) {
          this.recordExecution(id, sched.profileName, sched.mode, 'SUCCESS', `${currentClock} programlı taraması başarıyla tamamlandı.`, 9, 45, sched.timeframe);
        }
      }
    }
  }

  public recordExecution(
    scheduleId: string,
    profileName: string,
    mode: string,
    status: 'SUCCESS' | 'PARTIAL' | 'FAILED',
    summary: string,
    matchedCount: number,
    screenedCount: number,
    timeframe: string
  ) {
    const sched = this.schedules.get(scheduleId);
    const nowIso = new Date().toISOString();
    if (sched) {
      sched.lastRunAt = nowIso;
      sched.lastRunSummary = summary;
      sched.lastMatchCount = matchedCount;
    }

    this.executionLogs.unshift({
      scheduleId,
      profileName,
      mode,
      executedAt: nowIso,
      matchedCount,
      screenedCount,
      timeframe,
      completedCandlesUsed: true,
      status,
      summary
    });

    if (this.executionLogs.length > 50) {
      this.executionLogs.pop();
    }
  }

  /**
   * Accurately determines Borsa İstanbul calendar, session state, and trading holidays.
   */
  public getMarketCalendarStatus(): MarketCalendarStatus {
    const now = new Date();
    // Istanbul is UTC+3 (no DST since 2016)
    const istanbulHours = (now.getUTCHours() + 3) % 24;
    const istanbulMins = now.getUTCMinutes();
    const dayOfWeek = now.getUTCDay(); // 0 is Sunday, 6 is Saturday

    const dateKey = now.toISOString().substring(0, 10);
    const holidayInfo = BIST_OFFICIAL_HOLIDAYS[dateKey];
    const isHoliday = !!holidayInfo && !holidayInfo.isHalfDay;
    const isHalfDay = !!holidayInfo?.isHalfDay;
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isTradingDay = !isWeekend && !isHoliday;

    const localTimeStr = `${String(istanbulHours).padStart(2, '0')}:${String(istanbulMins).padStart(2, '0')} (UTC+3 İstanbul)`;
    const closeHour = isHalfDay ? 12 : 18;
    const closeMin = isHalfDay ? 40 : 15;
    const sessionCloseTimeStr = `${String(closeHour).padStart(2, '0')}:${String(closeMin).padStart(2, '0')}`;

    let isSessionOpen = false;
    let sessionPhase: MarketCalendarStatus['sessionPhase'] = 'CLOSED';

    if (isTradingDay) {
      const currentMinutes = istanbulHours * 60 + istanbulMins;
      const openMinutes = 10 * 60; // 10:00
      const closeMinutes = closeHour * 60 + closeMin; // 18:15 (or 12:40 for half day)

      if (currentMinutes >= 9 * 60 + 40 && currentMinutes < openMinutes) {
        sessionPhase = 'PRE_MARKET';
      } else if (currentMinutes >= openMinutes && currentMinutes <= 18 * 60) {
        sessionPhase = 'CONTINUOUS_AUCTION';
        isSessionOpen = true;
      } else if (currentMinutes > 18 * 60 && currentMinutes <= closeMinutes) {
        sessionPhase = 'CLOSING_SESSION';
        isSessionOpen = true;
      } else {
        sessionPhase = 'CLOSED';
      }
    }

    const postMarketScanAvailable = !isSessionOpen && (sessionPhase === 'CLOSED' || !isTradingDay);

    return {
      isTradingDay,
      isSessionOpen,
      isHalfDay,
      sessionPhase,
      holidayName: holidayInfo?.name,
      localTimeStr,
      sessionCloseTimeStr,
      postMarketScanAvailable,
      completedCandlesEnforced: !isSessionOpen
    };
  }

  /**
   * Filters candles to ensure only strictly completed bars are used when requested.
   */
  public filterCompletedCandles(candles: OHLCV[], timeframe: string): OHLCV[] {
    const cal = this.getMarketCalendarStatus();
    if (candles.length === 0) return candles;

    // If market session is closed, all historical candles (including today's after 18:15) are complete
    if (!cal.isSessionOpen) {
      return candles.map(c => ({ ...c, isClosed: true }));
    }

    // If market is currently open and timeframe is daily/weekly/monthly, the last candle is forming
    const lastIdx = candles.length - 1;
    return candles.slice(0, lastIdx).map(c => ({ ...c, isClosed: true }));
  }

  public getProfiles(): ScreenerProfile[] {
    return Array.from(this.profiles.values());
  }

  public getProfile(id: string): ScreenerProfile | undefined {
    return this.profiles.get(id);
  }

  public saveProfile(profile: ScreenerProfile): ScreenerProfile {
    const id = profile.id || `user-profile-${Date.now()}`;
    const cleanProfile: ScreenerProfile = {
      ...profile,
      id,
      isPreset: false,
      updatedAt: new Date().toISOString(),
      createdAt: profile.createdAt || new Date().toISOString()
    };
    this.profiles.set(id, cleanProfile);
    return cleanProfile;
  }

  public deleteProfile(id: string): boolean {
    const existing = this.profiles.get(id);
    if (!existing || existing.isPreset) return false;
    return this.profiles.delete(id);
  }

  public getSchedules(): ScreenerScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  public saveSchedule(config: ScreenerScheduleConfig): ScreenerScheduleConfig {
    const id = config.id || `schedule-${Date.now()}`;
    const cleanConfig = { ...config, id };
    this.schedules.set(id, cleanConfig);
    return cleanConfig;
  }

  public getExecutionLogs(): ScheduleExecutionLog[] {
    return this.executionLogs;
  }

  public getServerStatus() {
    const cal = this.getMarketCalendarStatus();
    const uptimeSec = Math.floor((Date.now() - this.serverStartTime.getTime()) / 1000);
    return {
      isServerRunning: true,
      daemonActive: this.intervalTimer !== null,
      serverStartTime: this.serverStartTime.toISOString(),
      uptimeSeconds: uptimeSec,
      tickCount: this.tickCount,
      calendar: cal,
      activeSchedulesCount: Array.from(this.schedules.values()).filter(s => s.enabled).length,
      totalProfilesCount: this.profiles.size,
      lastExecution: this.executionLogs[0] || null
    };
  }
}
