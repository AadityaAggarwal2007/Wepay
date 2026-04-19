import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, generateOrderId } from '@/lib/auth';
import { encodePaymentData } from '@/lib/upi';

/**
 * GET — List payment links for logged-in user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [links, total, todayLinks, todaySuccess] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id, paymentMethod: 'payment_link' },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { merchant: { select: { type: true } } },
      }),
      prisma.transaction.count({ where: { userId: user.id, paymentMethod: 'payment_link' } }),
      prisma.transaction.count({
        where: { userId: user.id, paymentMethod: 'payment_link', createdAt: { gte: todayStart } },
      }),
      prisma.transaction.findMany({
        where: { userId: user.id, paymentMethod: 'payment_link', createdAt: { gte: todayStart }, status: 'SUCCESS' },
      }),
    ]);

    const todayCollection = todaySuccess.reduce((sum, t) => sum + t.amount, 0);
    const pendingCount = await prisma.transaction.count({
      where: { userId: user.id, paymentMethod: 'payment_link', status: 'PENDING' },
    });

    return NextResponse.json({
      links: links.map(l => ({
        id: l.id,
        orderId: l.orderId,
        mobile: l.customerMobile,
        amount: l.amount,
        status: l.status,
        utr: l.utr,
        merchant: l.merchant?.type || 'N/A',
        date: l.createdAt.toISOString(),
      })),
      total,
      page,
      perPage,
      stats: {
        todayCollection,
        todayLinks,
        pendingCount,
        successRate: total > 0 ? Math.round((todaySuccess.length / Math.max(todayLinks, 1)) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Payment links GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Create a new payment link
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, mobile, amount, remark } = body;

    if (!mobile || !amount) {
      return NextResponse.json({ error: 'Mobile and amount are required' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get active merchant
    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id, status: 'active', verified: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'No active merchant connected. Connect a merchant first.' }, { status: 400 });
    }

    const orderId = generateOrderId();

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        merchantId: merchant.id,
        orderId,
        customerName: name || null,
        customerMobile: String(mobile),
        amount: parsedAmount,
        status: 'PENDING',
        paymentMethod: 'payment_link',
        remark1: remark || null,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // Generate payment URL
    const paymentData = encodePaymentData({
      oid: transaction.orderId,
      uid: user.id,
      amt: parsedAmount,
    });

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const paymentUrl = `${baseUrl}/pay?data=${paymentData}`;

    return NextResponse.json({
      success: true,
      orderId: transaction.orderId,
      paymentUrl,
      amount: parsedAmount,
    });
  } catch (error) {
    console.error('Payment links POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
