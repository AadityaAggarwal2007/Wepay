import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOrderId } from '@/lib/auth';
import { encodePaymentData } from '@/lib/upi';

/**
 * POST /api/create-order
 * 
 * Public API — NiyopPe-compatible format.
 * Accepts: application/x-www-form-urlencoded OR application/json
 * 
 * Required: customer_mobile, user_token, amount
 * Optional: order_id, redirect_url, remark1, remark2
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ── Parse body (form-encoded or JSON) ──
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await request.json();
    }

    const { customer_mobile, user_token, amount, order_id, redirect_url, remark1, remark2 } = body;

    // ── Validate required fields ──
    if (!customer_mobile || !user_token || !amount) {
      return NextResponse.json({
        status: false,
        message: 'Missing required fields: customer_mobile, user_token, amount',
      }, { status: 400 });
    }

    // ── Authenticate via API token — single optimized query ──
    const user = await prisma.user.findUnique({
      where: { apiToken: user_token },
      include: {
        merchants: {
          where: { status: 'active', verified: true },
          take: 1,
          select: { id: true, upiId: true, type: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ status: false, message: 'Invalid API token' }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({ status: false, message: 'Account is inactive' }, { status: 403 });
    }

    // ── Check subscription ──
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) {
      return NextResponse.json({ status: false, message: 'Subscription expired. Please renew your plan.' }, { status: 403 });
    }

    // ── Check for active merchant ──
    if (!user.merchants.length) {
      return NextResponse.json({
        status: false,
        message: 'No active merchant connected. Please connect a merchant first.',
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ status: false, message: 'Invalid amount' }, { status: 400 });
    }

    // ── Generate unique order ID ──
    const finalOrderId = order_id || generateOrderId();

    // Check for duplicate (fast unique constraint check)
    const existing = await prisma.transaction.findUnique({
      where: { orderId: finalOrderId },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({
        status: false,
        message: 'Duplicate order_id. Please use a unique order ID.',
      }, { status: 400 });
    }

    // ── Create transaction ──
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        merchantId: user.merchants[0].id,
        orderId: finalOrderId,
        customerMobile: String(customer_mobile),
        amount: parsedAmount,
        status: 'PENDING',
        paymentMethod: 'api',
        redirectUrl: redirect_url || null,
        remark1: remark1 || null,
        remark2: remark2 || null,
        sandbox: user.sandboxMode || false,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // ── Generate HMAC-signed payment URL ──
    const paymentData = encodePaymentData({
      oid: transaction.orderId,
      uid: user.id,
      amt: parsedAmount,
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay?data=${paymentData}`;

    // ── Log API call (async — don't block response) ──
    prisma.apiLog.create({
      data: {
        userId: user.id,
        endpoint: '/api/create-order',
        method: 'POST',
        requestBody: JSON.stringify({ customer_mobile, amount, order_id }),
        responseBody: JSON.stringify({ orderId: transaction.orderId }),
        responseStatus: 200,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    }).catch(console.error);

    const elapsed = Date.now() - startTime;
    console.log(`[API] ✅ Order created: ${transaction.orderId} | ₹${parsedAmount} | ${elapsed}ms`);

    return NextResponse.json({
      status: true,
      message: 'Order Created Successfully',
      result: {
        orderId: transaction.orderId,
        payment_url: paymentUrl,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ status: false, message: 'Internal server error' }, { status: 500 });
  }
}
