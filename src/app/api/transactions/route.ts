import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'All';
    const page = parseInt(url.searchParams.get('page') || '1');
    const perPage = parseInt(url.searchParams.get('perPage') || '10');

    const where: Record<string, unknown> = { userId: user.id };
    if (status !== 'All') where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
        include: { merchant: { select: { type: true, mobile: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);

    // All time stats
    const stats = await prisma.transaction.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _sum: { amount: true },
      _count: { id: true },
    });

    const allTimeStats: Record<string, { amount: number; count: number }> = {};
    for (const s of stats) {
      allTimeStats[s.status] = { amount: s._sum.amount || 0, count: s._count.id };
    }

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        orderId: t.orderId,
        gatewayTxn: t.gatewayTxn,
        mobile: t.customerMobile,
        amount: t.amount,
        status: t.status,
        utr: t.utr,
        merchant: t.merchant?.type || 'N/A',
        date: t.createdAt.toISOString(),
      })),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
      stats: allTimeStats,
    });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
