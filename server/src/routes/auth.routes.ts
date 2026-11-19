import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { createRateLimiter } from '../middleware/rateLimit.middleware';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { loginSchema, registerSchema } from '../validators/schemas';

const router = Router();
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'Demasiados intentos de acceso. Intenta nuevamente en unos minutos.',
});

function buildAuthPayload(user: { id: string; email: string; name: string; role: Role }) {
  const payload = { userId: user.id, email: user.email, name: user.name, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Este correo ya está registrado');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        phone: data.phone?.trim() || null,
        role: Role.CLIENTE,
      },
    });

    res.status(201).json(buildAuthPayload(user));
  } catch (err) {
    next(err);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.active) {
      throw new AppError(401, 'Credenciales incorrectas o cuenta inactiva');
    }

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) {
      throw new AppError(401, 'Credenciales incorrectas');
    }

    res.json({
      ...buildAuthPayload(user),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.body?.refreshToken;
    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'refreshToken requerido');
    }
    const decoded = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.active) {
      throw new AppError(401, 'Usuario inválido o inactivo');
    }
    res.json(buildAuthPayload(user));
  } catch {
    next(new AppError(401, 'Refresh token inválido o expirado'));
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'Usuario no encontrado');
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;
