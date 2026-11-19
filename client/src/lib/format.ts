import { CurrencyMode, OrderStatus, ReservationZone, Role } from '../types';

export const EXCHANGE_RATE = 6.96;

export function formatPrice(
  precioBs: number | string,
  currency: CurrencyMode = 'BOB',
  precioUsd?: number | string
): string {
  const bs = Number(precioBs);
  if (currency === 'USD') {
    const usd = precioUsd !== undefined ? Number(precioUsd) : bs / EXCHANGE_RATE;
    return `$ ${usd.toFixed(2)}`;
  }
  return `Bs. ${bs.toFixed(2)}`;
}

export function formatDualPrice(precioBs: number | string): { bs: string; usd: string } {
  const bs = Number(precioBs);
  return {
    bs: `Bs. ${bs.toFixed(2)}`,
    usd: `$ ${(bs / EXCHANGE_RATE).toFixed(2)} USD`,
  };
}

export function formatDateTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: 'neutral' | 'cyan' | 'magenta' | 'amber' | 'emerald' | 'danger' }
> = {
  PENDIENTE_PAGO: { label: 'Pendiente de Pago', tone: 'amber' },
  PAGO_EN_REVISION: { label: 'Depósito en Revisión', tone: 'amber' },
  PAGO_CONFIRMADO: { label: 'Pago Confirmado', tone: 'cyan' },
  EN_PREPARACION: { label: 'En Preparación', tone: 'cyan' },
  EMPACADO: { label: 'Empacado Listo', tone: 'magenta' },
  EN_CAMINO: { label: 'En Camino', tone: 'cyan' },
  ENTREGADO: { label: 'Entregado', tone: 'emerald' },
  CANCELADO: { label: 'Cancelado', tone: 'neutral' },
  RECHAZADO: { label: 'Pago Rechazado', tone: 'danger' },
};

export const ROLE_META: Record<Role, { label: string; route: string }> = {
  CLIENTE: { label: 'Cliente', route: '/mis-pedidos' },
  CAJERO: { label: 'Cajero', route: '/panel/cajero' },
  EMPAQUETADOR: { label: 'Cocina & Empaque', route: '/panel/empaque' },
  REPARTIDOR: { label: 'Repartidor', route: '/panel/repartidor' },
  ADMIN: { label: 'Administrador', route: '/panel/admin' },
};

export const ZONE_META: Record<ReservationZone, { label: string; vibe: string }> = {
  PATIO_COLONIAL: { label: 'Patio Colonial', vibe: 'Casona abierta, chimenea y mesas grupales' },
  MEZZANINE_TERRAZA: { label: 'Mezzanine & Terraza', vibe: 'Vista al centro histórico y coctelería' },
  PANTALLA_GIGANTE: { label: 'Zona Pantalla Gigante', vibe: 'Deportes en vivo, rock y nachos' },
  PISTA_SALSA_BACHATA: { label: 'Pista Salsa & Bachata', vibe: 'Frente a la cabina DJ y bola de espejos' },
};

export function getSucreStatusInfo(): {
  sucreTimeStr: string;
  isOpen: boolean;
  isHappyHour: boolean;
  happyHourCountdownSeconds: number;
} {
  const now = new Date();
  const boliviaParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/La_Paz',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hour = Number(boliviaParts.find((p) => p.type === 'hour')?.value ?? '19');
  const minute = Number(boliviaParts.find((p) => p.type === 'minute')?.value ?? '0');
  const second = Number(boliviaParts.find((p) => p.type === 'second')?.value ?? '0');

  const pad = (n: number) => String(n).padStart(2, '0');
  const sucreTimeStr = `${pad(hour)}:${pad(minute)}`;
  const totalSec = hour * 3600 + minute * 60 + second;

  // Open 07:00 - 02:30
  const isOpen = hour >= 7 || hour < 2 || (hour === 2 && minute <= 30);
  // Happy Hour 18:00 - 21:00
  const hhStart = 18 * 3600;
  const hhEnd = 21 * 3600;
  const isHappyHour = totalSec >= hhStart && totalSec < hhEnd;

  let happyHourCountdownSeconds = 0;
  if (isHappyHour) {
    happyHourCountdownSeconds = hhEnd - totalSec;
  } else if (totalSec < hhStart) {
    happyHourCountdownSeconds = hhStart - totalSec;
  } else {
    happyHourCountdownSeconds = 24 * 3600 - totalSec + hhStart;
  }

  return { sucreTimeStr, isOpen, isHappyHour, happyHourCountdownSeconds };
}
