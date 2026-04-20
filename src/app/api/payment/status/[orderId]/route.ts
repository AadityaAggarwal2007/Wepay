import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BharatPeService } from '@/lib/bharatpe';
import { sendWebhook } from '@/lib/webhook';

// ═══ In-memory credential cache ═══
// Avoids decrypting AES on every 2-second poll — massive speed boost
const credentialCache = new Map<number, { cookie: string; token: string | null; merchantId: string; expiresAt: number }>();

function getCachedCredentials(merchant: { id: number; cookie: string | null; token: string | null; merchantId: string | null }) {
  const cached = credentialCache.get(merchant.id);
  if (cached && cached.expiresAt > Date.now()) return cached;

  // Decrypt and cache for 5 minutes
  const creds = BharatPeService.getCredentials(merchant);
  if (creds.cookie) {
    const entry = {
      cookie: creds.cookie,
      token: creds.token,
      merchantId: creds.merchantId || '',
      expiresAt: Date.now() + 5 * 60 * 1000,
    };
    credentialCache.set(merchant.id, entry);
    return entry;
  }
  return null;
}

/**
 * GET /api/payment/status/[orderId]
 * 
 * CRITICAL HOT PATH — Called every 2 seconds by the payment page.
 * Optimized for minimum latency:
 *   1. Single DB query with joins (no N+1)
 *   2. Cached credential decryption (avoids AES overhead)
 *   3. Parallel BharatPe API check
 *   4. Minimal response payload
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const startTime = Date.now();

  try {
    const { orderId } = await params;

    // Single optimized query — get everything in one shot
    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      include: {
        merchant: {
          select: { id: true, cookie: true, token: true, merchantId: true, status: true },
        },
        user: {
          select: { webhookUrl: true, webhookSecret: true, sandboxMode: true, name: true },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json({ status: 'NOT_FOUND' }, { status: 404 });
    }

    // ── Fast path: Already completed ──
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ status: 'SUCCESS', utr: transaction.utr });
    }

    if (transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED' || transaction.status === 'FAILED') {
      return NextResponse.json({ status: transaction.status });
    }

    // ── Expiry check ──
    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED', cancelReason: 'timeout' },
      });
      return NextResponse.json({ status: 'EXPIRED' });
    }

    // ── Sandbox mode: Auto-complete after 5 seconds ──
    if ((transaction.sandbox || transaction.user?.sandboxMode) && transaction.status === 'PENDING') {
      const created = new Date(transaction.createdAt).getTime();
      if (Date.now() - created > 5000) {
        const utr = 'SANDBOX-' + Date.now();
        const updated = await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS', utr },
        });

        // Fire webhook async — don't block the response
        if (transaction.user?.webhookUrl) {
          sendWebhook(updated, transaction.user.webhookUrl, transaction.user.webhookSecret).catch(console.error);
        }

        console.log(`[PAYMENT] ✅ Sandbox auto-complete: ${orderId} in ${Date.now() - startTime}ms`);
        return NextResponse.json({ status: 'SUCCESS', utr });
      }
    }

    // ── Live mode: Check BharatPe for real payment detection ──
    if (!transaction.sandbox && transaction.status === 'PENDING' && transaction.merchant) {
      const merchant = transaction.merchant;
      console.log(`[PAYMENT] Checking BharatPe: merchant=${merchant.id}, status=${merchant.status}, hasCookie=${!!merchant.cookie}`);

      if (merchant.cookie && merchant.status === 'active') {
        try {
          // Use cached credentials — avoids AES decryption on every poll
          const creds = getCachedCredentials(merchant);
          console.log(`[PAYMENT] Credentials: ${creds ? 'OK' : 'NULL'}, merchantId=${creds?.merchantId}`);

          if (creds) {
            // Check BharatPe for matching transaction
            const recentTxns = await BharatPeService.checkRecentTransactions(
              creds.merchantId,
              creds.cookie,
              creds.token,
              { amount: transaction.amount, timeRange: 15 }
            );

            console.log(`[PAYMENT] BharatPe returned ${recentTxns.length} transactions, authFailed=${(recentTxns as unknown as { authFailed?: boolean }).authFailed}`);

            // Check if auth failed — mark merchant as expired
            if ((recentTxns as unknown as { authFailed?: boolean }).authFailed) {
              console.log(`[PAYMENT] ⚠️ BharatPe auth expired for merchant ${merchant.id}`);
              await prisma.merchant.update({
                where: { id: merchant.id },
                data: { status: 'expired' },
              });
              credentialCache.delete(merchant.id);
            }

            if (recentTxns.length > 0) {
              const matchedTxn = recentTxns[0];
              const utr = matchedTxn.utr || matchedTxn.reference_id || 'AUTO-' + Date.now();

              // Mark as SUCCESS
              const updated = await prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                  status: 'SUCCESS',
                  utr,
                  gatewayTxn: String(matchedTxn.reference_id || matchedTxn.utr || ''),
                },
              });

              // Fire webhook async
              if (transaction.user?.webhookUrl) {
                sendWebhook(updated, transaction.user.webhookUrl, transaction.user.webhookSecret).catch(console.error);
              }

              const elapsed = Date.now() - startTime;
              console.log(`[PAYMENT] ✅ Payment detected: ${orderId} | UTR: ${utr} | ${elapsed}ms`);
              return NextResponse.json({ status: 'SUCCESS', utr });
            }
          }
        } catch (err) {
          // Silent fail — polling will retry in 2 seconds
          console.error('[PAYMENT] BharatPe check error:', (err as Error).message, (err as Error).stack);
        }
      } else {
        console.log(`[PAYMENT] Skipping BharatPe check: cookie=${!!merchant.cookie}, status=${merchant.status}`);
      }
    } else {
      console.log(`[PAYMENT] Skipping BharatPe: sandbox=${transaction.sandbox}, status=${transaction.status}, hasMerchant=${!!transaction.merchant}`);
    }

    // ── Still pending ──
    return NextResponse.json({
      status: 'PENDING',
      elapsed: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/payment/status/[orderId]
 * Manual UTR confirmation from customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { utr } = body;

    if (!utr || String(utr).trim().length < 4) {
      return NextResponse.json({ status: false, message: 'Valid UTR/reference number is required' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { orderId, status: 'PENDING' },
      include: { user: { select: { webhookUrl: true, webhookSecret: true } } },
    });

    if (!transaction) {
      return NextResponse.json({ status: false, message: 'Transaction not found or already processed' }, { status: 404 });
    }

    // Check expiry
    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED', cancelReason: 'timeout' },
      });
      return NextResponse.json({ status: false, message: 'Payment has expired' }, { status: 400 });
    }

    const sanitizedUtr = String(utr).trim().replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50);

    // Mark as SUCCESS with UTR
    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { utr: sanitizedUtr, status: 'SUCCESS' },
    });

    // Fire webhook
    if (transaction.user?.webhookUrl) {
      sendWebhook(updated, transaction.user.webhookUrl, transaction.user.webhookSecret).catch(console.error);
    }

    return NextResponse.json({ status: true, message: 'Payment confirmed!' });
  } catch (error) {
    console.error('UTR confirm error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
