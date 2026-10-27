import { MKKMember, MKKDisclosureItem, MKKDisclosureDetail } from '../types.js';

export interface MkkApiConfig {
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRequestsPerMinute?: number;
}

export interface MkkRateLimitStatus {
  maxRequestsPerMinute: number;
  remainingRequests: number;
  resetInMs: number;
}

export interface MkkHealthStatus {
  isConfigured: boolean;
  endpoint: string;
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  rateLimit: MkkRateLimitStatus;
}

/**
 * Server-side secure HTTP Client for Merkezi Kayıt Kuruluşu (MKK)
 * Kamuyu Aydınlatma Platformu (KAP) Veri Yayın Kuruluşu (VYK) REST API.
 * 
 * Strict specifications:
 * - Base URL: https://apigwdev.mkk.com.tr/api/vyk (test environment)
 * - Required services:
 *    GET /members
 *    GET /lastDisclosureIndex
 *    GET /disclosures (with mandatory disclosureIndex param)
 *    GET /disclosureDetail/{disclosureIndex}
 * - Strict Rate-Limiting: 6 requests per minute
 * - Zero secret leakage in logs, serialized objects, or errors
 */
export class MkkApiClient {
  private static instance: MkkApiClient;

  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private timeoutMs: number;
  private readonly maxRequestsPerMinute: number = 6;

  // Rate limiter state (Sliding window of timestamps in last 60,000ms)
  private requestTimestamps: number[] = [];

  // In-memory caches to preserve MKK rate limit
  private membersCache: { data: MKKMember[]; timestamp: number } | null = null;
  private lastIndexCache: { index: string; timestamp: number } | null = null;
  private disclosuresCache: Map<string, { data: MKKDisclosureItem[]; timestamp: number }> = new Map();
  private detailCache: Map<string, { data: MKKDisclosureDetail; timestamp: number }> = new Map();

  // Health and Telemetry
  private lastAttemptAt: string | null = null;
  private lastSuccessAt: string | null = null;
  private lastError: string | null = null;
  private membersApiCallCount: number = 0;

  constructor(config?: MkkApiConfig) {
    this.apiKey = config?.apiKey ?? (process.env.MKK_KAP_API_KEY || '').trim();
    this.apiSecret = config?.apiSecret ?? (process.env.MKK_KAP_API_SECRET || '').trim();
    this.baseUrl = (config?.baseUrl ?? (process.env.MKK_KAP_API_URL || 'https://apigwdev.mkk.com.tr/api/vyk')).replace(/\/+$/, '');
    this.timeoutMs = config?.timeoutMs ?? 8000;
    if (config?.maxRequestsPerMinute) {
      this.maxRequestsPerMinute = config.maxRequestsPerMinute;
    }
  }

  public static getInstance(config?: MkkApiConfig): MkkApiClient {
    if (!MkkApiClient.instance) {
      MkkApiClient.instance = new MkkApiClient(config);
    }
    return MkkApiClient.instance;
  }

  /**
   * Checks whether API credentials are configured in the server environment.
   */
  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 0);
  }

  /**
   * Sanitizes any sensitive string (apiKey, apiSecret, auth header) from error messages or logs.
   */
  public sanitizeErrorMessage(errorStr: string): string {
    let sanitized = errorStr;
    if (this.apiKey && this.apiKey.length > 0) {
      sanitized = sanitized.split(this.apiKey).join('[REDACTED_API_KEY]');
    }
    if (this.apiSecret && this.apiSecret.length > 0) {
      sanitized = sanitized.split(this.apiSecret).join('[REDACTED_API_SECRET]');
    }
    // Also remove potential bearer / basic tokens
    sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED_TOKEN]');
    sanitized = sanitized.replace(/Basic\s+[a-zA-Z0-9+/=]+/gi, 'Basic [REDACTED_CREDENTIALS]');
    return sanitized;
  }

  /**
   * Calculates current rate limit quota and reset time.
   */
  public getRateLimitStatus(): MkkRateLimitStatus {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60_000);
    const remaining = Math.max(0, this.maxRequestsPerMinute - this.requestTimestamps.length);
    const oldest = this.requestTimestamps.length > 0 ? this.requestTimestamps[0] : now;
    const resetInMs = this.requestTimestamps.length >= this.maxRequestsPerMinute ? Math.max(0, 60_000 - (now - oldest)) : 0;

    return {
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      remainingRequests: remaining,
      resetInMs
    };
  }

  /**
   * Enforces the MKK 6 requests/minute throttle rule.
   * Delays the execution safely if quota is momentarily full, rather than immediately dropping.
   */
  private async acquireRateLimitSlot(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(t => now - t < 60_000);

    if (this.requestTimestamps.length >= this.maxRequestsPerMinute) {
      const waitTime = 60_000 - (now - this.requestTimestamps[0]) + 100;
      if (waitTime > 0 && waitTime <= 60_000) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requestTimestamps.push(Date.now());
  }

  /**
   * Prepares secure HTTP request headers based on MKK VYK API standards.
   * Matches Apinizer Gateway HTTP Basic Authentication (apiKey as username, apiSecret as password),
   * or Bearer token if an OAuth2 token is supplied.
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'BIST-Smart-Analytics-Center/1.0'
    };

    if (this.apiKey) {
      if (this.apiKey.startsWith('Bearer ') || this.apiKey.split('.').length === 3) {
        headers['Authorization'] = this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`;
      } else if (this.apiSecret) {
        // MKK Apinizer HTTP Basic Authenticator with API Key and Secret
        const basicAuth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        headers['apikey'] = this.apiKey;
      }
    }

    return headers;
  }

  /**
   * Internal HTTP execution wrapper with timeout, rate limiting, and sanitized error handling.
   */
  private async executeRequest<T>(endpointPath: string, queryParams?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = `${this.baseUrl}${endpointPath.startsWith('/') ? '' : '/'}${endpointPath}`;

    if (queryParams) {
      const cleanParams = new URLSearchParams();
      for (const [k, v] of Object.entries(queryParams)) {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams.append(k, String(v));
        }
      }
      const qs = cleanParams.toString();
      if (qs.length > 0) {
        url += (url.includes('?') ? '&' : '?') + qs;
      }
    }

    this.lastAttemptAt = new Date().toISOString();

    // Check rate limit slot
    await this.acquireRateLimitSlot();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        let safeErrorBody = this.sanitizeErrorMessage(errorBody);
        if (safeErrorBody.length > 250) safeErrorBody = safeErrorBody.substring(0, 250) + '...';

        const errorMsg = `MKK API Hatası [HTTP ${response.status} ${response.statusText}] ${endpointPath}: ${safeErrorBody}`;
        this.lastError = errorMsg;
        throw new Error(errorMsg);
      }

      const text = await response.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(text);
      } catch (parseErr) {
        throw new Error(`MKK API geçersiz JSON döndürdü [${endpointPath}]: ${text.substring(0, 100)}`);
      }

      this.lastSuccessAt = new Date().toISOString();
      this.lastError = null;
      return parsedData as T;
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
      const formatted = isAbort
        ? `MKK API zaman aşımı (${this.timeoutMs}ms) [${endpointPath}]`
        : this.sanitizeErrorMessage(err.message || 'MKK API bağlantı hatası');
      this.lastError = formatted;
      throw new Error(formatted);
    }
  }

  // =========================================================================
  // MKK VYK API CORE ENDPOINTS (1 - 4)
  // =========================================================================

  /**
   * 1. GET /members
   * Retrieves list of registered institutions/companies and their codes/OIDs.
   * Cached for 1 hour to respect rate limits.
   */
  public async fetchMembers(forceRefresh = false): Promise<MKKMember[]> {
    const now = Date.now();
    if (!forceRefresh && this.membersCache && (now - this.membersCache.timestamp < 3600_000)) {
      return this.membersCache.data;
    }

    this.membersApiCallCount++;
    const data = await this.executeRequest<any>('/members');
    let members: MKKMember[] = [];

    if (Array.isArray(data)) {
      members = data;
    } else if (data && Array.isArray(data.members)) {
      members = data.members;
    } else if (data && Array.isArray(data.result)) {
      members = data.result;
    } else if (data && Array.isArray(data.data)) {
      members = data.data;
    } else if (data && typeof data === 'object') {
      // Single object or dictionary
      members = Object.values(data);
    }

    this.membersCache = { data: members, timestamp: now };
    return members;
  }

  /**
   * Checks if members are currently held in valid in-memory cache without requiring network request.
   */
  public hasCachedMembers(): boolean {
    return Boolean(this.membersCache && (Date.now() - this.membersCache.timestamp < 3600_000));
  }

  /**
   * Returns total number of actual network calls made to GET /members.
   */
  public getMembersApiCallCount(): number {
    return this.membersApiCallCount;
  }

  /**
   * 2. GET /lastDisclosureIndex
   * Retrieves the index number of the most recent disclosure published in KAP.
   * Cached for 30 seconds.
   */
  public async fetchLastDisclosureIndex(forceRefresh = false): Promise<string> {
    const now = Date.now();
    if (!forceRefresh && this.lastIndexCache && (now - this.lastIndexCache.timestamp < 30_000)) {
      return this.lastIndexCache.index;
    }

    const data = await this.executeRequest<any>('/lastDisclosureIndex');
    let indexStr = '';

    if (typeof data === 'number' || typeof data === 'string') {
      indexStr = String(data);
    } else if (data && data.lastDisclosureIndex != null) {
      indexStr = String(data.lastDisclosureIndex);
    } else if (data && data.disclosureIndex != null) {
      indexStr = String(data.disclosureIndex);
    } else if (data && data.result != null) {
      indexStr = String(data.result);
    } else if (data && data.index != null) {
      indexStr = String(data.index);
    } else {
      throw new Error('MKK lastDisclosureIndex yanıtında indeks değeri bulunamadı.');
    }

    this.lastIndexCache = { index: indexStr, timestamp: now };
    return indexStr;
  }

  /**
   * 3. GET /disclosures
   * Retrieves disclosures based on parameters.
   * MANDATORY PARAMETER: disclosureIndex (per MKK documentation)
   * Supports optional: fromDate, toDate, memberOid, disclosureType
   */
  public async fetchDisclosures(params: {
    disclosureIndex: string | number;
    fromDate?: string;
    toDate?: string;
    memberOid?: string | number;
    disclosureType?: string;
  }): Promise<MKKDisclosureItem[]> {
    if (params.disclosureIndex === undefined || params.disclosureIndex === null || String(params.disclosureIndex).trim() === '') {
      throw new Error('MKK /disclosures çağrısı için "disclosureIndex" parametresi zorunludur.');
    }

    const cacheKey = JSON.stringify(params);
    const now = Date.now();
    const cached = this.disclosuresCache.get(cacheKey);
    if (cached && now - cached.timestamp < 30_000) {
      return cached.data;
    }

    const queryParams: Record<string, string | number | boolean | undefined> = {
      disclosureIndex: params.disclosureIndex,
      fromDate: params.fromDate,
      toDate: params.toDate,
      memberOid: params.memberOid,
      disclosureType: params.disclosureType
    };

    const data = await this.executeRequest<any>('/disclosures', queryParams);
    let items: MKKDisclosureItem[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.disclosures)) {
      items = data.disclosures;
    } else if (data && Array.isArray(data.result)) {
      items = data.result;
    } else if (data && Array.isArray(data.data)) {
      items = data.data;
    }

    this.disclosuresCache.set(cacheKey, { data: items, timestamp: now });
    return items;
  }

  /**
   * 4. GET /disclosureDetail/{disclosureIndex}
   * Retrieves full details and text of a specific disclosure.
   * Immutable once published, cached in memory for 24 hours.
   */
  public async fetchDisclosureDetail(disclosureIndex: string | number, fileType: string = 'html'): Promise<MKKDisclosureDetail> {
    const idxStr = String(disclosureIndex).trim();
    if (!idxStr) {
      throw new Error('MKK /disclosureDetail çağrısı için bildirim indeksi zorunludur.');
    }

    const cached = this.detailCache.get(idxStr);
    if (cached && Date.now() - cached.timestamp < 86400_000) {
      return cached.data;
    }

    const data = await this.executeRequest<any>(`/disclosureDetail/${encodeURIComponent(idxStr)}`, { fileType });

    // Parse subject and summary which can be objects { tr: string, en: string } or string
    const subjectStr = typeof data?.subject === 'object' && data?.subject?.tr
      ? data.subject.tr
      : (typeof data?.subject === 'string' ? data.subject : (data?.title || data?.baslik || ''));

    const summaryStr = typeof data?.summary === 'object' && data?.summary?.tr
      ? data.summary.tr
      : (typeof data?.summary === 'string' ? data.summary : (data?.ozet || ''));

    let textContent = data?.text || data?.content || data?.metin || data?.aciklama || data?.body || '';
    if (!textContent && Array.isArray(data?.htmlMessages) && data.htmlMessages[0]?.tr) {
      try {
        const rawHtml = Buffer.from(data.htmlMessages[0].tr, 'base64').toString('utf-8');
        textContent = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      } catch {
        // Fallback
      }
    }

    const stockCode = Array.isArray(data?.senderExchCodes) && data.senderExchCodes.length > 0
      ? data.senderExchCodes[0]
      : (data?.memberCode || data?.sirketKodu || data?.kod || '');

    const companyTitle = data?.senderTitle || data?.companyTitle || data?.unvan || data?.sirketUnvani || '';

    const detail: MKKDisclosureDetail = {
      disclosureIndex: idxStr,
      title: subjectStr || data?.title || 'KAP Resmî Bildirimi',
      subject: subjectStr,
      text: textContent,
      summary: summaryStr,
      publishDate: data?.time || data?.publishDate || data?.yayinTarihi || new Date().toISOString(),
      disclosureType: data?.disclosureType || data?.bildirimTuru || '',
      disclosureClass: data?.disclosureClass,
      senderId: data?.senderId,
      senderTitle: data?.senderTitle,
      senderExchCodes: data?.senderExchCodes,
      memberOid: data?.senderId || data?.companyId || data?.memberOid || data?.oid,
      memberCode: stockCode,
      companyTitle: companyTitle,
      link: data?.link || `https://www.kap.org.tr/Bildirim/${idxStr}`,
      attachments: Array.isArray(data?.attachmentUrls)
        ? data.attachmentUrls.map((u: string) => ({ name: 'Ek Belge', url: u }))
        : (Array.isArray(data?.attachments) ? data.attachments : [])
    };

    this.detailCache.set(idxStr, { data: detail, timestamp: Date.now() });
    return detail;
  }

  /**
   * Returns current API health status without exposing sensitive keys or tokens.
   */
  public getHealthStatus(): MkkHealthStatus {
    return {
      isConfigured: this.isConfigured(),
      endpoint: this.baseUrl,
      lastAttemptAt: this.lastAttemptAt,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError ? this.sanitizeErrorMessage(this.lastError) : null,
      rateLimit: this.getRateLimitStatus()
    };
  }

  /**
   * Directly tests network reachability and authentication to official MKK Gateway.
   * Never leaks API key or secret in the returned diagnostics.
   */
  public async testConnection(): Promise<{
    reachable: boolean;
    authenticated: boolean;
    statusCode: number;
    statusText: string;
    endpoint: string;
    message: string;
  }> {
    const url = `${this.baseUrl}/members`;
    this.lastAttemptAt = new Date().toISOString();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal
      });
      clearTimeout(timer);

      const statusText = response.statusText;
      const statusCode = response.status;
      const text = await response.text().catch(() => '');
      const safeText = this.sanitizeErrorMessage(text).substring(0, 200);

      if (response.ok) {
        this.lastSuccessAt = new Date().toISOString();
        this.lastError = null;
        return {
          reachable: true,
          authenticated: true,
          statusCode,
          statusText,
          endpoint: url,
          message: 'MKK API Gateway bağlantısı ve kimlik doğrulama başarılı.'
        };
      }

      this.lastError = `MKK API Hatası [HTTP ${statusCode}] /members: ${safeText}`;
      return {
        reachable: true,
        authenticated: false,
        statusCode,
        statusText,
        endpoint: url,
        message: statusCode === 401
          ? `MKK Gateway erişilebilir ancak kimlik doğrulaması yetersiz (HTTP 401). Geçerli MKK_KAP_API_KEY ve MKK_KAP_API_SECRET gereklidir.`
          : `MKK Gateway erişildi ancak durum kodu HTTP ${statusCode}: ${safeText}`
      };
    } catch (err: any) {
      clearTimeout(timer);
      const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
      const msg = isAbort
        ? `MKK Gateway bağlantı zaman aşımı (${this.timeoutMs}ms)`
        : this.sanitizeErrorMessage(err.message || 'MKK Gateway ağ bağlantı hatası');
      this.lastError = msg;
      return {
        reachable: false,
        authenticated: false,
        statusCode: 0,
        statusText: 'Network Error',
        endpoint: url,
        message: msg
      };
    }
  }

  /**
   * Clears in-memory caches (e.g. for testing or forced reload).
   */
  public clearCache(): void {
    this.membersCache = null;
    this.lastIndexCache = null;
    this.disclosuresCache.clear();
    this.detailCache.clear();
    this.requestTimestamps = [];
  }
}
