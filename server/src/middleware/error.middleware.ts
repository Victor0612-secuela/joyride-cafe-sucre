import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class StockConflictError extends AppError {
  constructor(
    message: string,
    conflicts: Array<{ productId: string; productName: string; requested: number; available: number }>
  ) {
    super(409, message, { conflicts });
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
    return;
  }

  console.error('[API ERROR]', err);
  res.status(500).json({
    error: 'Error interno del servidor. Intenta nuevamente.',
  });
}
