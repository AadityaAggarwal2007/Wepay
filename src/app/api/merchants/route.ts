import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { BharatPeService } from '@/lib/bharatpe';

/**
 * GET — List all merchants for the logged-in user
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const merchants = await prisma.merchant.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        mobile: true,
        upiId: true,
        status: true,
        verified: true,
        createdAt: true,
        merchantId: true,
      },
    });

    return NextResponse.json({ merchants });
  } catch (error) {
    console.error('Merchants GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Add a new merchant
 * Requires cookie + token to be provided (from BharatPe login flow)
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, mobile, cookie, token, merchantId, upiId, mcc, sign, orgid } = body;

    if (!type || !mobile) {
      return NextResponse.json({ error: 'Merchant type and mobile number are required' }, { status: 400 });
    }

    // Check for duplicate
    const existing = await prisma.merchant.findFirst({
      where: { userId: user.id, mobile: String(mobile), type },
    });

    if (existing) {
      return NextResponse.json({ error: 'Merchant with this mobile number already connected' }, { status: 400 });
    }

    // If cookie/token provided, test connection
    let isVerified = false;
    if (cookie && token) {
      isVerified = await BharatPeService.testConnection(merchantId || '', cookie, token);
    }

    // Create merchant with encrypted credentials
    const merchant = await prisma.merchant.create({
      data: {
        userId: user.id,
        type: type.toUpperCase(),
        mobile: String(mobile),
        merchantId: merchantId || null,
        upiId: upiId || null,
        cookie: cookie ? encrypt(cookie) : null,
        token: token ? encrypt(token) : null,
        mcc: mcc || '5411',
        sign: sign || null,
        orgid: orgid || '159002',
        status: 'active',
        verified: isVerified,
        lastCookieRefresh: isVerified ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        type: merchant.type,
        mobile: merchant.mobile,
        verified: merchant.verified,
        status: merchant.status,
      },
    });
  } catch (error) {
    console.error('Merchants POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE — Remove a merchant
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();

    const merchant = await prisma.merchant.findFirst({
      where: { id: Number(id), userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await prisma.merchant.delete({ where: { id: merchant.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Merchants DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
