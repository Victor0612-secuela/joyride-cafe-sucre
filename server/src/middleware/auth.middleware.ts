import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from './error.middleware';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: Role;
  };
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new AppError(401, 'Autenticación requerida'));
    return;
  }

  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new AppError(401, 'Sesión expirada o token inválido'));
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      // ignore invalid optional token
    }
  }
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, 'Autenticación requerida'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new AppError(403, `Acceso denegado: requiere rol ${roles.join(' o ')}`));
      return;
    }
    next();
  };
}
