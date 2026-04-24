import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(todayStart);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Run ALL queries in parallel — single DB roundtrip batch
    const [todayTxns, allTimeAgg, recentTxns, chartTxns, merchants] = await Promise.all([
      // 1. Today's transactions
      prisma.transaction.findMany({
        where: { userId: user.id, createdAt: { gte: todayStart } },
        select: { status: true, amount: true },
      }),
      // 2. All-time aggregation
      prisma.transaction.groupBy({
        by: ['status'],
        where: { userId: user.id },
        _sum: { amount: true },
        _count: { id: true },
      }),
      // 3. Recent 10 transactions
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, orderId: true, customerMobile: true,
          amount: true, status: true, utr: true, gatewayTxn: true, createdAt: true,
          merchant: { select: { type: true } },
        },
      }),
      // 4. ALL chart transactions in one query (7 days)
      prisma.transaction.findMany({
        where: { userId: user.id, createdAt: { gte: sevenDaysAgo } },
        select: { status: true, amount: true, createdAt: true },
      }),
      // 5. Merchants count
      prisma.merchant.count({ where: { userId: user.id } }),
    ]);

    // Active merchants count — single query instead of findMany + filter
    const activeMerchants = await prisma.merchant.count({
      where: { userId: user.id, status: 'active' },
    });

    // Today stats — computed from already-fetched data
    const todayReceived = todayTxns.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0);
    const todaySuccess = todayTxns.filter(t => t.status === 'SUCCESS').length;
    const todayPending = todayTxns.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0);
    const todayFailed = todayTxns.filter(t => t.status === 'FAILED').reduce((s, t) => s + t.amount, 0);

    // All-time stats
    const allTime: Record<string, { amount: number; count: number }> = {};
    for (const row of allTimeAgg) {
      allTime[row.status] = { amount: row._sum.amount || 0, count: row._count.id };
    }

    // 7-day chart — group in JS instead of 7 separate queries
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTxns = chartTxns.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd);
      chartData.push({
        date: dayStart.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()],
        success: dayTxns.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0),
        pending: dayTxns.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0),
        failed: dayTxns.filter(t => t.status === 'FAILED').reduce((s, t) => s + t.amount, 0),
        count: dayTxns.length,
      });
    }

    return NextResponse.json({
      today: { received: todayReceived, success: todaySuccess, pending: todayPending, failed: todayFailed },
      allTime,
      recentTransactions: recentTxns.map(t => ({
        id: t.id, orderId: t.orderId, mobile: t.customerMobile,
        amount: t.amount, status: t.status, utr: t.utr,
        merchant: t.merchant?.type || 'N/A', gatewayTxn: t.gatewayTxn,
        date: t.createdAt.toISOString(),
      })),
      chartData,
      merchants: { total: merchants, active: activeMerchants },
      user: { name: user.name, role: user.role, planExpiresAt: user.planExpiresAt },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
