import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'wepay-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

export interface JWTPayload {
  userId: number;
  name: string;
  email: string;
  mobile: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extract the Bearer token from the Authorization header and return the user.
 * Used in ALL API routes. No cookies involved.
 */
export async function getUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7); // Remove 'Bearer '
    const payload = verifyToken(token);
    if (!payload) return null;

    return prisma.user.findUnique({ where: { id: payload.userId }, include: { plan: true } });
  } catch {
    return null;
  }
}

/**
 * Verify a raw token string and return the payload.
 * Used for server-side token verification (e.g., in layouts).
 */
export function verifyTokenPayload(token: string): JWTPayload | null {
  return verifyToken(token);
}

export function generateApiToken(): string {
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function generateInstanceId(): string {
  const timestamp = Date.now().toString();
  return `INST${timestamp}${Math.random().toString(36).substring(2, 10)}`;
}

export function generateOrderId(): string {
  return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
}
