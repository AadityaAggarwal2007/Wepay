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
   * Check recent transactions from BharatPe using the Tesseract Payments API
   * This is the correct API endpoint (payments-tesseract.bharatpe.in)
   * It only requires the `token` header — no cookies needed!
   */
  static async checkRecentTransactions(
    merchantId: string,
    cookie: string,
    token: string | null,
    options: TransactionCheckOptions = {}
  ): Promise<BPTransaction[] & { authFailed?: boolean }> {
    try {
      const { amount, timeRange = 15 } = options;

      if (!token) {
        console.log('[BharatPe] No token available — cannot check transactions');
        const result: BPTransaction[] & { authFailed?: boolean } = [];
        result.authFailed = true;
        return result;
      }

      // Use epoch milliseconds for date range
      const now = Date.now();
      const sDate = now - (timeRange * 60 * 1000); // timeRange minutes ago
      const eDate = now;

      const url = `https://payments-tesseract.bharatpe.in/api/v1/merchant/transactions?module=PAYMENT_QR&merchantId=${merchantId}&sDate=${sDate}&eDate=${eDate}&pageSize=20&pageCount=0&isFromOtDashboard=1`;

      const response = await axios.get(url, {
        headers: {
          'token': token,
          'Accept': 'application/json',
          'Origin': 'https://enterprise.bharatpe.in',
          'Referer': 'https://enterprise.bharatpe.in/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      if (response.status === 401 || response.status === 403) {
        console.log(`[BharatPe] Auth failed (${response.status}) — token expired`);
        const result: BPTransaction[] & { authFailed?: boolean } = [];
        result.authFailed = true;
        return result;
      }

      if (response.status === 200 && response.data?.status === true) {
        const rawTxns = response.data.data?.transactions || [];
        console.log(`[BharatPe] Tesseract API: found ${rawTxns.length} transactions`);

        // Map Tesseract format to our BPTransaction format
        const transactions: BPTransaction[] = rawTxns.map((txn: Record<string, unknown>) => ({
          amount: String(txn.amount || '0'),
          bankReferenceNo: txn.bankReferenceNo as string,
          utr: txn.bankReferenceNo as string,
          created_at: txn.paymentTimestamp ? new Date(txn.paymentTimestamp as number).toISOString() : '',
          payerName: txn.payerName as string,
          status: txn.status as string,
          type: txn.type as string,
        }));

        if (amount) {
          return transactions.filter((txn) => {
            const txnAmount = parseFloat(String(txn.amount || '0'));
            return txnAmount === parseFloat(String(amount)) && txn.status === 'SUCCESS';
          });
        }
        return transactions;
      }

      console.log(`[BharatPe] Tesseract API: status=${response.status}, message=${response.data?.message || 'unknown'}`);
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
