import React from 'react';
import {
  Ban,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock,
  PackageCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { ORDER_STATUS_META } from '../../lib/format';
import { OrderStatus } from '../../types';

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  PENDIENTE_PAGO: <Clock className="h-3.5 w-3.5" />,
  PAGO_EN_REVISION: <ShieldAlert className="h-3.5 w-3.5" />,
  PAGO_CONFIRMADO: <Sparkles className="h-3.5 w-3.5" />,
  EN_PREPARACION: <ChefHat className="h-3.5 w-3.5" />,
  EMPACADO: <PackageCheck className="h-3.5 w-3.5" />,
  EN_CAMINO: <Bike className="h-3.5 w-3.5" />,
  ENTREGADO: <CheckCircle2 className="h-3.5 w-3.5" />,
  CANCELADO: <Ban className="h-3.5 w-3.5" />,
  RECHAZADO: <Ban className="h-3.5 w-3.5" />,
};

const TONE_CLASSES: Record<string, string> = {
  neutral: 'border-hairline bg-elevated text-muted',
  cyan: 'border-joycyan/40 bg-joycyan/15 text-sky-300',
  magenta: 'border-joymagenta/50 bg-joymagenta/15 text-pink-300',
  amber: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
  emerald: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  danger: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status] || { label: status, tone: 'neutral' };
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[meta.tone]}`}
    >
      {STATUS_ICONS[status]}
      <span>{meta.label}</span>
    </span>
  );
}
