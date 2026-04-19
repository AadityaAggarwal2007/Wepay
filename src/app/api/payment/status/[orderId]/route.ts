import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { BharatPeService } from '@/lib/bharatpe';
import { sendWebhook } from '@/lib/webhook';

/**
 * GET /api/payment/status/[orderId]
 * Payment status polling — checks BharatPe for auto-detection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
      include: {
        merchant: true,
        user: { select: { webhookUrl: true, webhookSecret: true, sandboxMode: true } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ status: 'NOT_FOUND' }, { status: 404 });
    }

    // Already processed
    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ status: 'SUCCESS', utr: transaction.utr });
    }

    if (transaction.status === 'EXPIRED' || transaction.status === 'CANCELLED') {
      return NextResponse.json({ status: transaction.status });
    }

    // Check expiry
    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED', cancelReason: 'timeout' },
      });
      return NextResponse.json({ status: 'EXPIRED' });
    }

    // Sandbox auto-complete after 5 seconds
    if ((transaction.sandbox || transaction.user?.sandboxMode) && transaction.status === 'PENDING') {
      const created = new Date(transaction.createdAt).getTime();
      if (Date.now() - created > 5000) {
        const utr = 'SANDBOX-' + Date.now();
        const updated = await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS', utr },
        });

        if (transaction.user?.webhookUrl) {
          sendWebhook(updated, transaction.user.webhookUrl, transaction.user.webhookSecret).catch(console.error);
        }

        return NextResponse.json({ status: 'SUCCESS', utr });
      }
    }

    // Live mode: Check BharatPe for payment
    if (!transaction.sandbox && transaction.status === 'PENDING' && transaction.merchant) {
      const merchant = transaction.merchant;
      if (merchant.cookie) {
        try {
          const creds = BharatPeService.getCredentials(merchant);
          if (creds.cookie) {
            const recentTxns = await BharatPeService.checkRecentTransactions(
              creds.merchantId || '',
              creds.cookie,
              creds.token,
              { amount: transaction.amount, timeRange: 15 }
            );

            if (recentTxns.length > 0) {
              const matchedTxn = recentTxns[0];
              const utr = matchedTxn.utr || matchedTxn.reference_id || 'AUTO-DETECTED';

              const updated = await prisma.transaction.update({
                where: { id: transaction.id },
                data: { status: 'SUCCESS', utr },
              });

              if (transaction.user?.webhookUrl) {
                sendWebhook(updated, transaction.user.webhookUrl, transaction.user.webhookSecret).catch(console.error);
              }

              return NextResponse.json({ status: 'SUCCESS', utr });
            }
          }
        } catch (err) {
          console.error('[PAYMENT] BharatPe check error:', (err as Error).message);
        }
      }
    }

    return NextResponse.json({
      status: transaction.status,
      utr: transaction.utr || null,
    });
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json({ status: 'ERROR' }, { status: 500 });
  }
}

/**
 * POST /api/payment/status/[orderId]
 * Manual UTR confirmation
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
    });

    if (!transaction) {
      return NextResponse.json({ status: false, message: 'Transaction not found or already processed' }, { status: 404 });
    }

    if (transaction.expiresAt && new Date(transaction.expiresAt) < new Date()) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'EXPIRED', cancelReason: 'timeout' },
      });
      return NextResponse.json({ status: false, message: 'Payment has expired' }, { status: 400 });
    }

    const sanitizedUtr = String(utr).trim().replace(/[^a-zA-Z0-9\-_]/g, '').substring(0, 50);

    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { utr: sanitizedUtr },
    });

    return NextResponse.json({ status: true, message: 'Payment confirmation received. Verifying...' });
  } catch (error) {
    console.error('UTR confirm error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
