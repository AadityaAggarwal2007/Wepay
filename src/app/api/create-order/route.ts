import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateOrderId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse form-encoded or JSON body
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, string>;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      body = Object.fromEntries(new URLSearchParams(text));
    } else {
      body = await request.json();
    }

    const { customer_mobile, user_token, amount, order_id, redirect_url, remark1, remark2 } = body;

    // Validate required fields
    if (!customer_mobile || !user_token || !amount) {
      return NextResponse.json({
        status: false,
        message: 'Missing required fields: customer_mobile, user_token, amount',
      }, { status: 400 });
    }

    // Validate user token
    const user = await prisma.user.findUnique({
      where: { apiToken: user_token },
      include: { merchants: { where: { status: 'active', verified: true } } },
    });

    if (!user) {
      return NextResponse.json({
        status: false,
        message: 'Invalid API token',
      }, { status: 401 });
    }

    if (user.status !== 'active') {
      return NextResponse.json({
        status: false,
        message: 'Account is inactive',
      }, { status: 403 });
    }

    // Check for active merchant
    if (!user.merchants.length) {
      return NextResponse.json({
        status: false,
        message: 'No active merchant connected. Please connect a merchant first.',
      }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({
        status: false,
        message: 'Invalid amount',
      }, { status: 400 });
    }

    // Generate order
    const finalOrderId = order_id || generateOrderId();
    
    // Check for duplicate order_id
    const existing = await prisma.transaction.findUnique({
      where: { orderId: finalOrderId },
    });

    if (existing) {
      return NextResponse.json({
        status: false,
        message: 'Duplicate order_id. Please use a unique order ID.',
      }, { status: 400 });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        merchantId: user.merchants[0].id,
        orderId: finalOrderId,
        customerMobile: String(customer_mobile),
        amount: parsedAmount,
        status: 'PENDING',
        redirectUrl: redirect_url || null,
        remark1: remark1 || null,
        remark2: remark2 || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
      },
    });

    // Encode payment URL
    const paymentData = Buffer.from(JSON.stringify({
      orderId: transaction.orderId,
      amount: transaction.amount,
      userId: user.id,
    })).toString('base64');

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay?data=${paymentData}`;

    // Log API call
    await prisma.apiLog.create({
      data: {
        userId: user.id,
        endpoint: '/api/create-order',
        method: 'POST',
        requestBody: JSON.stringify(body),
        responseBody: JSON.stringify({ orderId: transaction.orderId }),
        responseStatus: 200,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

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
    return NextResponse.json({
      status: false,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
