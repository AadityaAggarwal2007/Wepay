import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser, generateApiToken } from '@/lib/auth';

/**
 * GET — Get user profile settings
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({
      id: user.id,
      instanceId: user.instanceId,
      mobile: user.mobile,
      email: user.email,
      name: user.name,
      company: user.company,
      panNumber: user.panNumber,
      aadhaarNumber: user.aadhaarNumber,
      location: user.location,
      role: user.role,
      apiToken: user.apiToken,
      webhookUrl: user.webhookUrl,
      sandboxMode: user.sandboxMode,
      otpRequired: user.otpRequired,
      whatsappAlert: user.whatsappAlert,
      emailAlert: user.emailAlert,
      status: user.status,
      planExpiresAt: user.planExpiresAt,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT — Update user profile settings
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      name, email, company, panNumber, aadhaarNumber, location,
      otpRequired, whatsappAlert, emailAlert, webhookUrl, sandboxMode,
    } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(company !== undefined && { company }),
        ...(panNumber !== undefined && { panNumber }),
        ...(aadhaarNumber !== undefined && { aadhaarNumber }),
        ...(location !== undefined && { location }),
        ...(otpRequired !== undefined && { otpRequired: otpRequired === true || otpRequired === 'YES' }),
        ...(whatsappAlert !== undefined && { whatsappAlert: whatsappAlert === true || whatsappAlert === 'YES' }),
        ...(emailAlert !== undefined && { emailAlert: emailAlert === true || emailAlert === 'YES' }),
        ...(webhookUrl !== undefined && { webhookUrl }),
        ...(sandboxMode !== undefined && { sandboxMode }),
      },
    });

    return NextResponse.json({ success: true, user: { name: updated.name, email: updated.email } });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST — Generate new API token
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    if (body.action === 'generate_token') {
      const newToken = generateApiToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { apiToken: newToken },
      });
      return NextResponse.json({ success: true, apiToken: newToken });
    }

    if (body.action === 'update_webhook') {
      const { webhookUrl } = body;
      if (webhookUrl && !webhookUrl.match(/^https?:\/\//)) {
        return NextResponse.json({ error: 'URL must start with http or https' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { webhookUrl: webhookUrl || null },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
