import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { encrypt } from '@/lib/encryption';

/**
 * POST /api/admin/update-merchant
 * Quick admin endpoint to update merchant credentials
 * Protected by CRON_SECRET as a simple auth mechanism
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, action, merchantId, cookie, token, upiId, mobile, transactionOrderId, utr } = body;

    // Simple auth using CRON_SECRET
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Action: update-credentials
    if (action === 'update-credentials') {
      if (!merchantId) {
        return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = { status: 'active', lastCookieRefresh: new Date() };
      if (cookie) updateData.cookie = encrypt(cookie);
      if (token) updateData.token = encrypt(token);
      if (upiId) updateData.upiId = upiId;
      if (mobile) updateData.mobile = mobile;

      const merchant = await prisma.merchant.update({
        where: { id: Number(merchantId) },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        merchant: { id: merchant.id, status: merchant.status, verified: merchant.verified },
      });
    }

    // Action: mark-success
    if (action === 'mark-success') {
      if (!transactionOrderId || !utr) {
        return NextResponse.json({ error: 'transactionOrderId and utr required' }, { status: 400 });
      }

      const transaction = await prisma.transaction.updateMany({
        where: { orderId: transactionOrderId, status: 'PENDING' },
        data: { status: 'SUCCESS', utr },
      });

      return NextResponse.json({ success: true, updated: transaction.count });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
