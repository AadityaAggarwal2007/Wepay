import axios from 'axios';
import { decrypt } from './encryption';

interface MerchantRecord {
  merchantId: string | null;
  cookie: string | null;
  token: string | null;
  upiId: string | null;
}

interface TransactionCheckOptions {
  amount?: number | string;
  timeRange?: number; // minutes
}

interface BPTransaction {
  amount: string;
  created_at?: string;
  date?: string;
  createdAt?: string;
  utr?: string;
  reference_id?: string;
  [key: string]: unknown;
}

/**
 * BharatPe Service — TypeScript port
 * Interacts with BharatPe's Enterprise API using stored credentials
 */
export class BharatPeService {
  /**
   * Common headers for BharatPe API calls
   */
  static _headers(cookie: string, token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Cookie': cookie,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://enterprise.bharatpe.in',
      'Referer': 'https://enterprise.bharatpe.in/',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['token'] = token;
    }
    return headers;
  }

  /**
   * Test if current credentials are valid
   */
  static async testConnection(merchantId: string, cookie: string, token?: string | null): Promise<boolean> {
    try {
      const response = await axios.get('https://enterprise.bharatpe.in/v1/api/brandMerchants', {
        headers: this._headers(cookie, token),
        timeout: 10000,
        validateStatus: () => true,
      });
      console.log(`[BharatPe] Test connection: status=${response.status}`);
      return response.status === 200;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[BharatPe] Connection test failed:', err.message);
      return false;
    }
  }

  /**
   * Keep the session cookie alive by making lightweight API calls
   * Returns true if session is still alive, false if expired
   */
  static async keepAlive(cookie: string, token?: string | null): Promise<boolean> {
    const endpoints = [
      { url: 'https://enterprise.bharatpe.in/v1/api/brandMerchants', method: 'GET' as const },
      { url: 'https://api-deposit.bharatpe.in/bharatpe-account/v1/account', method: 'GET' as const },
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method,
          url: endpoint.url,
          headers: this._headers(cookie, token),
          timeout: 15000,
          validateStatus: () => true,
        });

        if (response.status === 200) return true;
        if (response.status === 401 || response.status === 403) {
          console.log(`[BharatPe] Session expired (${response.status}) on ${endpoint.url}`);
          return false;
        }
        console.log(`[BharatPe] Endpoint ${endpoint.url} returned ${response.status}, trying next...`);
      } catch (error: unknown) {
        const err = error as Error;
        console.error(`[BharatPe] Keep-alive error on ${endpoint.url}:`, err.message);
      }
    }

    console.log('[BharatPe] All keep-alive endpoints failed (network issue?), retrying later');
    return true;
  }

  /**
   * Verify a UPI ID through BharatPe
   */
  static async verifyUpiId(merchantId: string, cookie: string, token: string | null, upiId: string) {
    try {
      const response = await axios.get(
        `https://enterprise.bharatpe.in/v1/api/merchantStores?merchant_id=${merchantId}`,
        {
          headers: this._headers(cookie, token),
          timeout: 10000,
          validateStatus: () => true,
        }
      );

      if (response.status === 200 && response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, message: 'Verification failed (status: ' + response.status + ')' };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[BharatPe] UPI verification failed:', err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Check recent transactions from BharatPe
   * Used to auto-detect payment completion
   */
  static async checkRecentTransactions(
    merchantId: string,
    cookie: string,
    token: string | null,
    options: TransactionCheckOptions = {}
  ): Promise<BPTransaction[] & { authFailed?: boolean }> {
    try {
      const { amount, timeRange = 15 } = options;

      const possibleEndpoints = [
        `https://enterprise.bharatpe.in/v1/api/transactions?page=1&limit=20&type=CREDIT`,
        `https://enterprise.bharatpe.in/v1/api/merchantTransactions?merchant_id=${merchantId}&page=1&limit=20`,
      ];

      for (const url of possibleEndpoints) {
        try {
          const response = await axios.get(url, {
            headers: this._headers(cookie, token),
            timeout: 10000,
            maxRedirects: 0, // Don't follow redirects — 302 means session expired
            validateStatus: () => true,
          });

          // 302 redirect = BharatPe session expired (redirects HTTPS→HTTP)
          if (response.status === 302 || response.status === 301) {
            console.log(`[BharatPe] Session expired — got ${response.status} redirect on ${url}`);
            const result: BPTransaction[] & { authFailed?: boolean } = [];
            result.authFailed = true;
            return result;
          }

          if (response.status === 401 || response.status === 403) {
            console.log(`[BharatPe] Auth failed (${response.status}) — credentials expired`);
            const result: BPTransaction[] & { authFailed?: boolean } = [];
            result.authFailed = true;
            return result;
          }

          if (response.status === 200 && response.data) {
            const transactions: BPTransaction[] =
              response.data.data || response.data.transactions || response.data || [];

            if (!Array.isArray(transactions)) continue;

            if (amount) {
              const cutoff = new Date(Date.now() - timeRange * 60 * 1000);
              return transactions.filter((txn) => {
                const txnAmount = parseFloat(txn.amount);
                const txnDate = new Date(txn.created_at || txn.date || txn.createdAt || '');
                return txnAmount === parseFloat(String(amount)) && txnDate > cutoff;
              });
            }
            return transactions;
          }
        } catch {
          // Try next endpoint
        }
      }

      return [];
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[BharatPe] Transaction check failed:', err.message);
      return [];
    }
  }

  /**
   * Get decrypted credentials from a merchant record
   */
  static getCredentials(merchant: {
    merchantId?: string | null;
    merchant_id?: string | null;
    cookie?: string | null;
    token?: string | null;
    upiId?: string | null;
    upi_id?: string | null;
  }): MerchantRecord {
    return {
      merchantId: merchant.merchantId || merchant.merchant_id || null,
      cookie: merchant.cookie ? decrypt(merchant.cookie) : null,
      token: merchant.token ? decrypt(merchant.token) : null,
      upiId: merchant.upiId || merchant.upi_id || null,
    };
  }

  /**
   * Test if a cookie+token combination is still valid
   */
  static async testCookieValid(cookie: string, token?: string | null): Promise<boolean> {
    try {
      const response = await axios.get('https://enterprise.bharatpe.in/v1/api/brandMerchants', {
        headers: this._headers(cookie, token),
        timeout: 10000,
        validateStatus: () => true,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
