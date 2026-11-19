import crypto from 'node:crypto';
import { env } from '../config/env';

export function signQrToken(qrToken: string, orderId: string, amountBs: string): string {
  return crypto
    .createHmac('sha256', env.HMAC_SECRET)
    .update(`${qrToken}:${orderId}:${amountBs}`)
    .digest('hex');
}

export function verifyQrSignature(qrToken: string, orderId: string, amountBs: string, signature: string): boolean {
  const expected = signQrToken(qrToken, orderId, amountBs);
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function roundUsd(bs: number): number {
  return Number((bs / env.USD_EXCHANGE_RATE).toFixed(2));
}

export function generateOrderCode(): string {
  const num = crypto.randomInt(1000, 9999);
  const suffix = crypto.randomBytes(1).toString('hex').toUpperCase();
  return `JR-${num}${suffix}`;
}

export function generateFourDigitPin(): string {
  return String(crypto.randomInt(1000, 9999));
}
