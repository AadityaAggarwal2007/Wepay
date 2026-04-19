import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobile, password } = body;

    if (!mobile || !password) {
      return NextResponse.json(
        { success: false, message: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { mobile: String(mobile) },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (user.status !== 'active') {
      return NextResponse.json(
        { success: false, message: 'Account is inactive. Contact support.' },
        { status: 403 }
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });

    // Set httpOnly cookie — the browser will store this from the fetch() response
    // and send it on subsequent page navigations.
    response.cookies.set('wepay_token', token, {
      httpOnly: true,
      secure: false, // HTTP (no SSL) — set to true when using HTTPS
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
