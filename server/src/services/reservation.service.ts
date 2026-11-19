import { ReservationStatus, ReservationZone } from '@prisma/client';
import crypto from 'node:crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/error.middleware';
import { sendManagerReservationAlertEmail, sendReservationEmail } from './email.service';

const ZONE_CAPACITY: Record<ReservationZone, number> = {
  PATIO_COLONIAL: 36,
  MEZZANINE_TERRAZA: 28,
  PANTALLA_GIGANTE: 32,
  PISTA_SALSA_BACHATA: 44,
};

export async function getAvailability(date: string) {
  const activeReservations = await prisma.reservation.findMany({
    where: {
      date,
      status: { not: ReservationStatus.CANCELADA },
    },
  });

  return (Object.keys(ZONE_CAPACITY) as ReservationZone[]).map((zone) => {
    const usedSeats = activeReservations
      .filter((r) => r.zone === zone)
      .reduce((acc, r) => acc + r.partySize, 0);
    const total = ZONE_CAPACITY[zone];
    return {
      zone,
      capacity: total,
      reservedSeats: usedSeats,
      availableSeats: Math.max(0, total - usedSeats),
    };
  });
}

export async function createReservation(input: {
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  zone: ReservationZone;
  date: string;
  timeSlot: string;
  partySize: number;
  includeSalsaClass: boolean;
  specialNotes?: string;
}) {
  const availability = await getAvailability(input.date);
  const zoneInfo = availability.find((a) => a.zone === input.zone);
  if (!zoneInfo || zoneInfo.availableSeats < input.partySize) {
    throw new AppError(
      409,
      `No hay suficientes cupos en ${input.zone} para esa fecha (disponibles: ${zoneInfo?.availableSeats ?? 0})`
    );
  }

  const code = `RES-${crypto.randomInt(1000, 9999)}`;
  const qrPassToken = `JR-PASS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

  const created = await prisma.reservation.create({
    data: {
      code,
      userId: input.userId || null,
      guestName: input.guestName,
      guestEmail: input.guestEmail,
      guestPhone: input.guestPhone,
      zone: input.zone,
      date: input.date,
      timeSlot: input.timeSlot,
      partySize: input.partySize,
      includeSalsaClass: input.includeSalsaClass,
      specialNotes: input.specialNotes,
      status: ReservationStatus.CONFIRMADA,
      qrPassToken,
    },
  });

  sendReservationEmail({
    toEmail: created.guestEmail,
    guestName: created.guestName,
    code: created.code,
    zone: created.zone,
    date: created.date,
    timeSlot: created.timeSlot,
    partySize: created.partySize,
    includeSalsaClass: created.includeSalsaClass,
    qrPassToken: created.qrPassToken,
  }).catch((err) => console.warn('[EMAIL] reservation email failed:', err));

  sendManagerReservationAlertEmail({
    code: created.code,
    guestName: created.guestName,
    guestPhone: created.guestPhone,
    zone: created.zone,
    date: created.date,
    timeSlot: created.timeSlot,
    partySize: created.partySize,
    includeSalsaClass: created.includeSalsaClass,
  }).catch((err) => console.warn('[EMAIL] manager reservation alert failed:', err));

  return created;
}

export async function listReservations(userId?: string, includeAll = false) {
  return prisma.reservation.findMany({
    where: includeAll ? {} : { userId },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function updateReservationStatus(id: string, status: ReservationStatus, userId?: string, isAdmin = false) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, 'Reserva no encontrada');
  if (!isAdmin && existing.userId !== userId) {
    throw new AppError(403, 'No tienes permiso para modificar esta reserva');
  }
  return prisma.reservation.update({
    where: { id },
    data: { status },
  });
}
