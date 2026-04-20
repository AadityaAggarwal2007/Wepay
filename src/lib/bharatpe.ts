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
  txn_amount?: string;
  created_at?: string;
  date?: string;
  createdAt?: string;
  transaction_date?: string;
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
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Origin': 'https://enterprise.bharatpe.in',
      'Referer': 'https://enterprise.bharatpe.in/home',
      'X-Requested-With': 'XMLHttpRequest', // Required by Laravel CSRF
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };
    // Extract XSRF-TOKEN from cookie and set as header (Laravel requirement)
    const xsrfMatch = cookie.match(/XSRF-TOKEN=([^;]+)/);
    if (xsrfMatch) {
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfMatch[1]);
    }
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

      // BharatPe deprecated /transactions and /merchantTransactions (302 redirect).
      // New endpoint: /allHistory?type=txns works as of Apr 2026.
      const possibleEndpoints = [
        `https://enterprise.bharatpe.in/v1/api/allHistory?type=txns&merchant_id=${merchantId}&page=1&limit=20`,
        `https://enterprise.bharatpe.in/v1/api/transactions?page=1&limit=20&type=CREDIT`,
        `https://enterprise.bharatpe.in/v1/api/merchantTransactions?merchant_id=${merchantId}&page=1&limit=20`,
      ];

      for (const url of possibleEndpoints) {
        try {
          const response = await axios.get(url, {
            headers: this._headers(cookie, token),
            timeout: 10000,
            maxRedirects: 0, // Don't follow redirects — 302 means endpoint deprecated
            validateStatus: () => true,
          });

          // 302 redirect = endpoint deprecated or session expired
          if (response.status === 302 || response.status === 301) {
            console.log(`[BharatPe] Redirect on ${url.split('?')[0].split('/').pop()} — trying next endpoint`);
            continue; // Try next endpoint instead of marking as auth failure
          }

          if (response.status === 401 || response.status === 403) {
            console.log(`[BharatPe] Auth failed (${response.status}) — credentials expired`);
            const result: BPTransaction[] & { authFailed?: boolean } = [];
            result.authFailed = true;
            return result;
          }

          if (response.status === 200 && response.data) {
            // allHistory returns { success: true, data: { transactions: [...], ... } }
            // Old endpoints return { data: [...] } or { transactions: [...] }
            const raw = response.data;
            let transactions: BPTransaction[] = [];

            if (raw.data?.transactions && Array.isArray(raw.data.transactions)) {
              transactions = raw.data.transactions;
            } else if (raw.data?.data && Array.isArray(raw.data.data)) {
              transactions = raw.data.data;
            } else if (Array.isArray(raw.data)) {
              transactions = raw.data;
            } else if (Array.isArray(raw.transactions)) {
              transactions = raw.transactions;
            } else if (raw.success && raw.data && typeof raw.data === 'object') {
              // allHistory may have nested structure — look for any array
              for (const key of Object.keys(raw.data)) {
                if (Array.isArray(raw.data[key]) && raw.data[key].length > 0) {
                  transactions = raw.data[key];
                  break;
                }
              }
            }

            console.log(`[BharatPe] ${url.split('?')[0].split('/').pop()}: found ${transactions.length} transactions`);

            if (!Array.isArray(transactions) || transactions.length === 0) continue;

            if (amount) {
              const cutoff = new Date(Date.now() - timeRange * 60 * 1000);
              return transactions.filter((txn) => {
                const txnAmount = parseFloat(String(txn.amount || txn.txn_amount || '0'));
                const txnDate = new Date(String(txn.created_at || txn.date || txn.createdAt || txn.transaction_date || ''));
                return txnAmount === parseFloat(String(amount)) && txnDate > cutoff;
              });
            }
            return transactions;
          }
        } catch (err) {
          console.log(`[BharatPe] Error on ${url.split('?')[0].split('/').pop()}:`, (err as Error).message);
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
