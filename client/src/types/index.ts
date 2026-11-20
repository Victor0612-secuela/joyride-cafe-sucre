export type Role = 'CLIENTE' | 'CAJERO' | 'EMPAQUETADOR' | 'REPARTIDOR' | 'ADMIN';

export type OrderStatus =
  | 'PENDIENTE_PAGO'
  | 'PAGO_EN_REVISION'
  | 'PAGO_CONFIRMADO'
  | 'EN_PREPARACION'
  | 'EMPACADO'
  | 'EN_CAMINO'
  | 'ENTREGADO'
  | 'CANCELADO'
  | 'RECHAZADO';

export type PaymentMethod = 'QR' | 'DEPOSITO_BANCARIO' | 'PAYPAL' | 'STRIPE';
export type PaymentStatus = 'PENDIENTE' | 'EN_REVISION' | 'COMPLETADO' | 'RECHAZADO' | 'EXPIRADO';
export type DeliveryType = 'DELIVERY' | 'RECOGER_LOCAL' | 'CONSUMO_LOCAL';
export type ReservationZone =
  | 'PATIO_COLONIAL'
  | 'MEZZANINE_TERRAZA'
  | 'PANTALLA_GIGANTE'
  | 'PISTA_SALSA_BACHATA';

export type CurrencyMode = 'BOB' | 'USD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  active?: boolean;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  _count?: { products: number };
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  description: string;
  precioBs: number;
  precioUsd: number;
  stockDisponible: number;
  stockReservado: number;
  stockMinimoAlerta: number;
  esVegano: boolean;
  esPicante: boolean;
  esDestacado: boolean;
  enHappyHour: boolean;
  tiempoPreparacionMin: number;
  imageUrl: string;
  maridajeSlug: string | null;
  active: boolean;
  category: {
    id: string;
    slug: string;
    name: string;
  };
}

export interface Promotion {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  badgeText: string;
  scheduleText: string;
  discountPercent: number;
  imageUrl: string;
  active?: boolean;
}

export interface MapSpotRecord {
  id: string;
  slug: string;
  name: string;
  category: 'JOYRIDE' | 'BARES_NOCHE' | 'CHOCOLATE_GASTRO' | 'CULTURA' | 'MIRADOR' | 'AVENTURA' | string;
  lat: number;
  lng: number;
  address: string;
  hours: string;
  walkTimeFromJoyRide: string;
  summary: string;
  tip: string;
  highlightsJson?: string[] | null;
  imageUrl: string;
  imagesJson?: string[] | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  unitPriceBs: number | string;
  quantity: number;
  subtotalBs: number | string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountBs: number | string;
  amountUsd: number | string;
  qrToken?: string | null;
  bankName?: string | null;
  referenceNumber?: string | null;
  comprobanteUrl?: string | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  paypalPayerEmail?: string | null;
  reviewNotes?: string | null;
  verificadoPor?: { id: string; name: string } | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface PackagingChecklist {
  id: string;
  orderId: string;
  empaquetadorId?: string | null;
  empaquetador?: { id?: string; name: string } | null;
  items: ChecklistItem[];
  sealCode?: string | null;
  allVerified: boolean;
  notes?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface DeliveryTracking {
  id: string;
  orderId: string;
  repartidorId?: string | null;
  repartidor?: { id?: string; name: string } | null;
  deliveryAddress: string;
  deliveryReference?: string | null;
  destLat?: number | null;
  destLng?: number | null;
  riderLat?: number | null;
  riderLng?: number | null;
  etaMinutes?: number | null;
  deliveryPin?: string;
  packageLabelCode: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  receiverName?: string | null;
  deliveryNotes?: string | null;
}

export interface ChatMessage {
  id: string;
  channelType: 'ORDER_DELIVERY' | 'STAFF_OPS';
  orderId?: string | null;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export interface EmailLog {
  id: string;
  toEmail: string;
  recipientRole: string;
  templateType: string;
  subject: string;
  htmlBody: string;
  status: string;
  relatedOrderId?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  userId?: string | null;
  authorName: string;
  authorOrigin: string;
  verifiedVia: 'GOOGLE' | 'CUENTA_JOYRIDE' | string;
  rating: number;
  comment: string;
  photoUrl?: string | null;
  createdAt: string;
}

export interface JoyRideEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  accent: 'cyan' | 'magenta' | 'amber' | 'emerald' | string;
  locationLabel: string;
  scheduleLabel: string;
  imageUrl: string;
  imagesJson?: string[] | null;
  videoUrl?: string | null;
  spotId: string;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  actorName: string;
  actorRole: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  reason: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderCode: string;
  userId: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  subtotalBs: number | string;
  discountBs: number | string;
  totalBs: number | string;
  totalUsd: number | string;
  deliveryAddress?: string | null;
  deliveryReference?: string | null;
  phoneContact: string;
  notes?: string | null;
  splitCount: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id?: string; name: string; email?: string; phone?: string | null };
  items: OrderItem[];
  payment?: Payment | null;
  packaging?: PackagingChecklist | null;
  delivery?: DeliveryTracking | null;
  history?: OrderStatusHistory[];
}

export interface Reservation {
  id: string;
  code: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  zone: ReservationZone;
  date: string;
  timeSlot: string;
  partySize: number;
  includeSalsaClass: boolean;
  specialNotes?: string | null;
  status: 'CONFIRMADA' | 'CHECK_IN' | 'CANCELADA';
  qrPassToken: string;
  createdAt: string;
}

export interface AdminAnalytics {
  summary: {
    totalRevenueBs: number;
    totalRevenueUsd: number;
    completedPaymentsCount: number;
    totalProducts: number;
    lowStockCount: number;
    activeReservations: number;
  };
  revenueByMethod: Array<{
    method: PaymentMethod;
    label: string;
    count: number;
    totalBs: number;
    totalUsd: number;
  }>;
  ordersByStatus: Array<{ status: OrderStatus; count: number }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenueBs: number;
  }>;
  lowStockAlerts: Array<{
    id: string;
    name: string;
    category: string;
    stockDisponible: number;
    stockReservado: number;
    stockMinimoAlerta: number;
    imageUrl: string;
  }>;
}
