import { NextResponse } from 'next/server';

/**
 * Logout — just returns a success response.
 * The client is responsible for clearing the token from localStorage.
 */
export async function POST() {
  return NextResponse.json({ success: true, message: 'Logged out' });
}

// Also support GET for backward compatibility (sidebar link)
export async function GET() {
  return NextResponse.json({ success: true, message: 'Logged out' });
}
