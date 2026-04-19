import axios from 'axios';
import crypto from 'crypto';
import { prisma } from './db';

interface WebhookTransaction {
  id: number;
  orderId: string;
  status: string;
  customerMobile?: string | null;
  amount: number;
  utr?: string | null;
  remark1?: string | null;
  remark2?: string | null;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Send webhook notification to merchant's configured URL
 * Retries up to 3 times with exponential backoff
 */
export async function sendWebhook(
  transaction: WebhookTransaction,
  webhookUrl: string,
  webhookSecret?: string | null
): Promise<boolean> {
  if (!webhookUrl) return false;

  const payload: Record<string, string> = {
    status: transaction.status,
    order_id: transaction.orderId,
    customer_mobile: transaction.customerMobile || '',
    amount: String(transaction.amount),
    utr: transaction.utr || '',
    remark1: transaction.remark1 || '',
    remark2: transaction.remark2 || '',
    timestamp: new Date().toISOString(),
  };

  const payloadString = new URLSearchParams(payload).toString();
  const signature = webhookSecret ? generateSignature(payloadString, webhookSecret) : '';

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.post(webhookUrl, payloadString, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'WePay-Webhook/1.0',
          'X-WePay-Signature': signature,
          'X-WePay-Timestamp': payload.timestamp,
        },
        validateStatus: () => true,
      });

      const success = response.status >= 200 && response.status < 300;

      await prisma.webhookLog.create({
        data: {
          transactionId: transaction.id,
          url: webhookUrl,
          payload: JSON.stringify(payload),
          responseStatus: response.status,
          responseBody: typeof response.data === 'string'
            ? response.data.substring(0, 500)
            : JSON.stringify(response.data).substring(0, 500),
          attempt,
          success,
        },
      });

      if (success) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { webhookSent: true, webhookAttempts: attempt },
        });
        return true;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    } catch (error: unknown) {
      const err = error as Error;
      await prisma.webhookLog.create({
        data: {
          transactionId: transaction.id,
          url: webhookUrl,
          payload: JSON.stringify(payload),
          responseStatus: 0,
          responseBody: err.message,
          attempt,
          success: false,
        },
      });

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { webhookAttempts: maxAttempts },
  });

  return false;
}
