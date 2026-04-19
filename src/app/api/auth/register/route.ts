import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken, generateApiToken, generateInstanceId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, mobile, password, company, location } = body;

    if (!name || !mobile || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, mobile, and password are required' },
        { status: 400 }
      );
    }

    if (String(mobile).length !== 10) {
      return NextResponse.json(
        { success: false, message: 'Mobile number must be 10 digits' },
        { status: 400 }
      );
    }

    // Check for existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: String(mobile) }, ...(email ? [{ email }] : [])] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'User with this mobile or email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const apiToken = generateApiToken();
    const instanceId = generateInstanceId();

    const user = await prisma.user.create({
      data: {
        name,
        email: email || `${mobile}@wepay.local`,
        mobile: String(mobile),
        passwordHash,
        company: company || null,
        location: location || null,
        instanceId,
        apiToken,
        role: 'partner',
        status: 'active',
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Registration successful',
      user: { id: user.id, name: user.name, mobile: user.mobile },
    });

    response.cookies.set('wepay_token', token, {
      httpOnly: true,
      secure: (process.env.NEXT_PUBLIC_URL || '').startsWith('https'),
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
