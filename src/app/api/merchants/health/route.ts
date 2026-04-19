import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { BharatPeService } from '@/lib/bharatpe';
import { decrypt } from '@/lib/encryption';

/**
 * GET — Check if BharatPe cookie is still valid
 * Returns the health status of all connected merchants
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const merchants = await prisma.merchant.findMany({
      where: { userId: user.id, status: 'active' },
    });

    const results = [];

    for (const merchant of merchants) {
      const cookie = merchant.cookie ? decrypt(merchant.cookie) : null;
      const token = merchant.token ? decrypt(merchant.token) : null;

      if (!cookie || !token) {
        results.push({
          id: merchant.id,
          mobile: merchant.mobile,
          upiId: merchant.upiId,
          status: 'NO_CREDENTIALS',
          message: 'Cookie or token missing — re-connect this merchant',
          healthy: false,
        });
        continue;
      }

      // Test the connection to BharatPe
      const isAlive = await BharatPeService.testConnection(
        merchant.merchantId || '',
        cookie,
        token
      );

      if (isAlive) {
        // Update last refresh timestamp
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: { lastCookieRefresh: new Date() },
        });
      }

      const lastRefresh = merchant.lastCookieRefresh;
      const hoursSinceRefresh = lastRefresh
        ? Math.round((Date.now() - lastRefresh.getTime()) / 3600000)
        : null;

      results.push({
        id: merchant.id,
        mobile: merchant.mobile,
        upiId: merchant.upiId,
        merchantId: merchant.merchantId,
        status: isAlive ? 'HEALTHY' : 'EXPIRED',
        message: isAlive
          ? `Cookie is valid (last checked: ${hoursSinceRefresh}h ago)`
          : 'Cookie has expired — login to enterprise.bharatpe.in and re-extract',
        healthy: isAlive,
        lastCookieRefresh: lastRefresh?.toISOString() || null,
        hoursSinceRefresh,
      });
    }

    const allHealthy = results.length > 0 && results.every(r => r.healthy);
    const anyExpired = results.some(r => !r.healthy);

    return NextResponse.json({
      success: true,
      overall: allHealthy ? 'HEALTHY' : anyExpired ? 'EXPIRED' : 'NO_MERCHANTS',
      merchants: results,
    });
  } catch (error) {
    console.error('Cookie check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
