import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'lightningdeals_secret_jwt_key_2026';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function generateToken(payload: { id: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function authenticateJwt(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  const token = authHeader || req.cookies?.ld_token;

  if (!token) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Authentication required.' } });
  }


  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: { type: 'authentication_error', message: 'User session is invalid or suspended.' } });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: { type: 'authentication_error', message: 'Invalid or expired session token.' } });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: { type: 'permission_error', message: 'Administrator privileges required.' } });
  }
  next();
}
