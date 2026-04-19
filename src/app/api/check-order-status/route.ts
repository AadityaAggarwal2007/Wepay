import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await request.json();
    }

    const { user_token, order_id } = body;

    if (!user_token || !order_id) {
      return NextResponse.json({
        status: false,
        message: 'Missing required fields: user_token, order_id',
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { apiToken: user_token },
    });

    if (!user) {
      return NextResponse.json({
        status: false,
        message: 'Invalid API token',
      }, { status: 401 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        orderId: order_id,
        userId: user.id,
      },
    });

    if (!transaction) {
      return NextResponse.json({
        status: false,
        message: 'Order not found',
      }, { status: 404 });
    }

    // Log API call
    await prisma.apiLog.create({
      data: {
        userId: user.id,
        endpoint: '/api/check-order-status',
        method: 'POST',
        requestBody: JSON.stringify(body),
        responseBody: JSON.stringify({ orderId: transaction.orderId, status: transaction.status }),
        responseStatus: 200,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({
        status: true,
        message: 'Transaction Successfully',
        result: {
          txnStatus: 'SUCCESS',
          orderId: transaction.orderId,
          amount: String(transaction.amount),
          date: transaction.updatedAt.toISOString().replace('T', ' ').substring(0, 19),
          utr: transaction.utr || '',
        },
      });
    }

    return NextResponse.json({
      status: true,
      message: transaction.status === 'PENDING' ? 'Transaction Pending' : 'Transaction Failed',
      result: {
        txnStatus: transaction.status,
        orderId: transaction.orderId,
        amount: String(transaction.amount),
        date: transaction.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        utr: transaction.utr || '',
      },
    });
  } catch (error) {
    console.error('Check order status error:', error);
    return NextResponse.json({
      status: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
