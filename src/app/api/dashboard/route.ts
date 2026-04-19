import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's stats
    const todayTxns = await prisma.transaction.findMany({
      where: { userId: user.id, createdAt: { gte: todayStart } },
    });

    const todayReceived = todayTxns.filter(t => t.status === 'SUCCESS').reduce((sum, t) => sum + t.amount, 0);
    const todaySuccess = todayTxns.filter(t => t.status === 'SUCCESS').length;
    const todayPending = todayTxns.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
    const todayFailed = todayTxns.filter(t => t.status === 'FAILED').reduce((sum, t) => sum + t.amount, 0);

    // All time stats
    const allTimeAgg = await prisma.transaction.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _sum: { amount: true },
      _count: { id: true },
    });

    const allTime: Record<string, { amount: number; count: number }> = {};
    for (const row of allTimeAgg) {
      allTime[row.status] = {
        amount: row._sum.amount || 0,
        count: row._count.id,
      };
    }

    // Recent transactions (last 10)
    const recentTxns = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { merchant: { select: { type: true } } },
    });

    // 7-day chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTxns = await prisma.transaction.findMany({
        where: { userId: user.id, createdAt: { gte: dayStart, lt: dayEnd } },
      });

      chartData.push({
        date: dayStart.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayStart.getDay()],
        success: dayTxns.filter(t => t.status === 'SUCCESS').reduce((s, t) => s + t.amount, 0),
        pending: dayTxns.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0),
        failed: dayTxns.filter(t => t.status === 'FAILED').reduce((s, t) => s + t.amount, 0),
        count: dayTxns.length,
      });
    }

    // Merchants
    const merchants = await prisma.merchant.findMany({
      where: { userId: user.id },
      select: { id: true, type: true, status: true, verified: true },
    });

    return NextResponse.json({
      today: { received: todayReceived, success: todaySuccess, pending: todayPending, failed: todayFailed },
      allTime,
      recentTransactions: recentTxns.map(t => ({
        id: t.id,
        orderId: t.orderId,
        mobile: t.customerMobile,
        amount: t.amount,
        status: t.status,
        utr: t.utr,
        merchant: t.merchant?.type || 'N/A',
        gatewayTxn: t.gatewayTxn,
        date: t.createdAt.toISOString(),
      })),
      chartData,
      merchants: { total: merchants.length, active: merchants.filter(m => m.status === 'active').length },
      user: { name: user.name, role: user.role, planExpiresAt: user.planExpiresAt },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
