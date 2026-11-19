import { DeliveryType, OrderStatus, ReservationStatus, ReservationZone, Role } from '@prisma/client';
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Nombre requerido (mínimo 2 caracteres)').max(80),
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'Contraseña mínimo 6 caracteres').max(100),
  phone: z.string().min(6, 'Teléfono de contacto requerido').max(30).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export const orderItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(30),
});

export const createOrderBaseSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, 'Debes incluir al menos 1 producto'),
  deliveryType: z.nativeEnum(DeliveryType),
  deliveryAddress: z.string().max(250).optional(),
  deliveryReference: z.string().max(250).optional(),
  destLat: z.number().min(-90).max(90).optional(),
  destLng: z.number().min(-180).max(180).optional(),
  phoneContact: z.string().min(6, 'Teléfono requerido para coordinar entrega').max(30),
  notes: z.string().max(400).optional(),
  splitCount: z.number().int().min(1).max(12).optional(),
});

export const depositSubmitSchema = createOrderBaseSchema.extend({
  bankName: z.string().min(2, 'Banco de origen requerido').max(100),
  referenceNumber: z.string().min(3, 'Número de operación requerido').max(80),
  comprobanteBase64: z.string().min(10, 'Comprobante bancario requerido'),
});

export const paypalCaptureSchema = z.object({
  paypalOrderId: z.string().min(2),
  orderId: z.string().min(2),
});

export const stripeConfirmSchema = z.object({
  orderId: z.string().min(2),
  paymentIntentId: z.string().min(4),
  cardBrand: z.string().min(2).max(20).optional(),
  cardLast4: z.string().regex(/^\d{4}$/, 'Últimos 4 dígitos inválidos').optional(),
});

export const reviewDepositSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  notes: z.string().max(300).optional().default(''),
});

export const updateChecklistSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      checked: z.boolean(),
    })
  ),
  notes: z.string().max(300).optional(),
});

export const finishPackingSchema = z.object({
  notes: z.string().max(300).optional(),
});

export const deliverOrderSchema = z.object({
  pin: z.string().regex(/^\d{4}$/, 'El PIN de entrega debe tener exactamente 4 dígitos'),
  receiverName: z.string().min(2, 'Nombre del receptor requerido').max(100),
  notes: z.string().max(300).optional(),
});

export const createReservationSchema = z.object({
  guestName: z.string().min(2).max(100),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(6).max(30),
  zone: z.nativeEnum(ReservationZone),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD'),
  timeSlot: z.string().min(3).max(20),
  partySize: z.number().int().min(1).max(20),
  includeSalsaClass: z.boolean().optional().default(false),
  specialNotes: z.string().max(300).optional(),
});

export const updateReservationStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
});

export const adjustStockSchema = z.object({
  delta: z.number().int().refine((n) => n !== 0, 'El ajuste debe ser diferente de 0'),
  reason: z.string().min(4, 'Motivo requerido (mínimo 4 caracteres)').max(250),
});

export const upsertProductSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(2).max(120),
  description: z.string().min(5).max(500),
  precioBs: z.number().positive(),
  stockDisponible: z.number().int().min(0).optional(),
  stockMinimoAlerta: z.number().int().min(0).optional(),
  esVegano: z.boolean().optional(),
  esPicante: z.boolean().optional(),
  esDestacado: z.boolean().optional(),
  enHappyHour: z.boolean().optional(),
  tiempoPreparacionMin: z.number().int().min(1).max(120).optional(),
  imageUrl: z.string().min(1).optional(),
  maridajeSlug: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
  active: z.boolean().optional(),
});

export const adminOrdersFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
});

export const updateRiderLocationSchema = z.object({
  riderLat: z.number().min(-90).max(90),
  riderLng: z.number().min(-180).max(180),
  etaMinutes: z.number().int().min(1).max(120).optional(),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  name: z.string().max(100).optional(),
});

export const campaignEmailSchema = z.object({
  subject: z.string().min(3).max(150),
  headline: z.string().min(3).max(150),
  bodyText: z.string().min(5).max(1500),
  promoCode: z.string().max(40).optional(),
  testEmail: z.string().email().optional(),
});
