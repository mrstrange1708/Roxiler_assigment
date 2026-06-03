import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Role } from '../../generated/prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-store-rating-key-12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
  };
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'Access token is missing.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token.' });
      return;
    }
    req.user = decoded as { id: string; email: string; role: Role };
    next();
  });
}

export function requireRole(allowedRoles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
      return;
    }

    next();
  };
}
