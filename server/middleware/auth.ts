import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function getUserId(req: Request) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return req.body?.studentId || req.query?.studentId?.toString() || 'anonymous-student';
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { sub?: string };
    return payload.sub || 'anonymous-student';
  } catch {
    return req.body?.studentId || 'anonymous-student';
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as { sub?: string };
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}
