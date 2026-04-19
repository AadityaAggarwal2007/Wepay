import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BharatPeService } from '@/lib/bharatpe';
import { decrypt } from '@/lib/encryption';

/**
 * Cron endpoint — called periodically to:
 * 1. Keep BharatPe sessions alive
 * 2. Expire stale PENDING transactions
 * 3. Retry failed webhooks
 * 
 * Protected by a secret key in the Authorization header.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'wepay-cron-secret';

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  // 1. Keep BharatPe sessions alive
  try {
    const merchants = await prisma.merchant.findMany({
      where: { status: 'active', cookie: { not: null } },
    });

    let alive = 0;
    let expired = 0;

    for (const merchant of merchants) {
      try {
        const cookie = merchant.cookie ? decrypt(merchant.cookie) : null;
        const token = merchant.token ? decrypt(merchant.token) : null;

        if (!cookie) continue;

        const isAlive = await BharatPeService.keepAlive(cookie, token);
        if (isAlive) {
          alive++;
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { lastCookieRefresh: new Date() },
          });
        } else {
          expired++;
          await prisma.merchant.update({
            where: { id: merchant.id },
            data: { status: 'expired' },
          });
        }
      } catch (err) {
        console.error(`[CRON] Keep-alive error for merchant ${merchant.id}:`, (err as Error).message);
      }
    }

    results.keepAlive = { total: merchants.length, alive, expired };
  } catch (err) {
    results.keepAlive = { error: (err as Error).message };
  }

  // 2. Expire stale PENDING transactions (older than 15 minutes)
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);
    const expired = await prisma.transaction.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: cutoff },
      },
      data: {
        status: 'EXPIRED',
        cancelReason: 'timeout_cron',
      },
    });

    results.expiredTransactions = expired.count;
  } catch (err) {
    results.expiredTransactions = { error: (err as Error).message };
  }

  // 3. Retry failed webhooks (up to 3 total attempts)
  try {
    const failedWebhooks = await prisma.transaction.findMany({
      where: {
        status: 'SUCCESS',
        webhookSent: false,
        webhookAttempts: { lt: 3 },
      },
      include: {
        user: { select: { webhookUrl: true, webhookSecret: true } },
      },
      take: 10,
    });

    let retried = 0;
    for (const txn of failedWebhooks) {
      if (txn.user?.webhookUrl) {
        const { sendWebhook } = await import('@/lib/webhook');
        await sendWebhook(txn, txn.user.webhookUrl, txn.user.webhookSecret);
        retried++;
      }
    }

    results.webhookRetries = retried;
  } catch (err) {
    results.webhookRetries = { error: (err as Error).message };
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
