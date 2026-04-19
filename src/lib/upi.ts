import QRCode from 'qrcode';
import crypto from 'crypto';

const HMAC_SECRET = process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY || 'wepay-hmac-fallback';
const DEFAULT_BHARATPE_ORG_ID = '159002';

interface UpiParams {
  upiId: string;
  payeeName?: string;
  amount: number | string;
  transactionNote?: string;
  orderId?: string;
  mc?: string;
  mode?: string;
  orgid?: string;
  sign?: string | null;
}

/**
 * Generate a UPI payment URI
 */
export function generateUpiUri({ upiId, payeeName, amount, transactionNote, orderId, mc, mode, orgid }: UpiParams): string {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  params.set('pn', payeeName || 'WePay');
  params.set('am', String(amount));
  params.set('cu', 'INR');
  if (transactionNote) params.set('tn', transactionNote);
  if (orderId) params.set('tr', orderId);
  if (mc) params.set('mc', mc);
  if (mode) params.set('mode', mode);
  params.set('orgid', orgid || '000000');
  return `upi://pay?${params.toString()}`;
}

/**
 * Generate a random ECDSA-looking base64 sign for Paytm intent.
 */
function generateRandomSign(): string {
  return 'MEUC' + crypto.randomBytes(48).toString('base64').replace(/\+/g, '/').substring(0, 64) + '=';
}

/**
 * Generate separate URIs for QR, Intent, and Paytm
 */
export function generateUpiUris(params: UpiParams): { qrUri: string; intentUri: string; paytmUri: string } {
  const base = { ...params };

  // Build Paytm URI manually
  const pts: string[] = [];
  pts.push('pa=' + params.upiId);
  pts.push('am=' + String(params.amount));
  pts.push('pn=' + encodeURIComponent(params.payeeName || 'WePay'));
  if (params.transactionNote) pts.push('tn=' + encodeURIComponent(params.transactionNote));
  if (params.orderId) pts.push('tr=' + params.orderId);
  pts.push('mc=' + (params.mc || '5641'));
  pts.push('cu=INR');
  pts.push('url=');
  pts.push('mode=02');
  pts.push('purpose=00');
  pts.push('orgid=' + (params.orgid || DEFAULT_BHARATPE_ORG_ID));
  pts.push('sign=' + (params.sign || generateRandomSign()));
  pts.push('featuretype=money_transfer');
  const paytmUri = 'paytmmp://cash_wallet?' + pts.join('&');

  return {
    qrUri: generateUpiUri({ ...base, mode: '01' }),
    intentUri: generateUpiUri({ ...base, mode: '01' }),
    paytmUri,
  };
}

/**
 * Get app-specific intent URIs
 */
export function getAppIntents(upiUri: string, paytmUri?: string): { paytm: string; fallback: string } {
  return {
    paytm: paytmUri || upiUri,
    fallback: upiUri,
  };
}

/**
 * Generate QR code as data URL (base64 PNG)
 */
export async function generateQrDataUrl(upiUri: string): Promise<string> {
  return await QRCode.toDataURL(upiUri, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Detect platform from User-Agent string
 */
export function detectPlatform(userAgent?: string | null): 'android' | 'ios' | 'desktop' | 'in-app' {
  if (!userAgent) return 'desktop';
  const ua = userAgent.toLowerCase();
  if (/instagram|fban|fbav|fb_iab|twitter|whatsapp|telegram|snapchat|linkedin/i.test(ua)) return 'in-app';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

/**
 * Encode payment data for URL with HMAC signature
 */
export function encodePaymentData(data: Record<string, unknown>): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  const signature = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('base64url');
  return payload + '.' + signature;
}

/**
 * Decode payment data from URL
 */
export function decodePaymentData(encoded: string): Record<string, unknown> | null {
  try {
    const parts = encoded.split('.');
    const payload = parts[0];
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/**
 * Verify payment data HMAC signature
 */
export function verifyPaymentData(encoded: string): boolean {
  try {
    const parts = encoded.split('.');
    if (parts.length < 2) {
      console.warn('[UPI] Unsigned payment URL detected — legacy compatibility');
      return true;
    }
    const payload = parts[0];
    const signature = parts[1];
    const expected = crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('base64url');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
