import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';
import { formatDateTime, formatDualPrice } from '../../lib/format';
import { Order } from '../../types';
import { Modal } from '../ui/Modal';
import { JoyRideHeritageLockup } from '../ui/JoyRideHeritageLockup';

export function ReceiptPrintModal({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  if (!order) return null;

  const dual = formatDualPrice(order.totalBs);

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={`Comprobante Oficial · ${order.orderCode}`}
      subtitle="Listo para imprimir o guardar como PDF"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div
          id="printable-joyride-receipt"
          className="rounded-2xl border border-slate-300 bg-white p-6 text-slate-900 shadow-card"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <img src="/logo-joyride.png" alt="Joy Ride Café" className="h-14 w-14 rounded-full object-contain" />
              <div>
                <h4 className="font-display text-base font-extrabold tracking-tight">
                  JOY RIDE CAFÉ® SUCRE
                </h4>
                <p className="text-[11px] text-slate-600">Calle Nicolás Ortiz N° 14 · Sucre</p>
                <p className="font-mono text-[10px] text-slate-500">NIT: 1029481022 · Tel. 4 6425544</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <p className="text-[10px] text-slate-500">RECIBO</p>
              <p className="text-sm font-extrabold text-sky-700">{order.orderCode}</p>
            </div>
          </div>

          <div className="my-3 space-y-1 text-xs text-slate-700">
            <p>
              <strong>Fecha:</strong> {formatDateTime(order.createdAt)}
            </p>
            <p>
              <strong>Cliente:</strong> {order.user?.name || 'Cliente Joy Ride'}
            </p>
            <p>
              <strong>Modalidad:</strong>{' '}
              {order.deliveryType === 'CONSUMO_LOCAL'
                ? 'En el Local (Mesa)'
                : order.deliveryType === 'RECOGER_LOCAL'
                ? 'Recoger en Local'
                : 'Delivery Sucre'}{' '}
              · {order.deliveryAddress || 'Calle Nicolás Ortiz N° 14'}
            </p>
            <p>
              <strong>Pago:</strong> {order.payment?.method || 'QR'} ({order.payment?.status || 'COMPLETADO'})
            </p>
          </div>

          <table className="my-4 w-full border-y border-slate-200 text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] text-slate-500">
                <th className="py-2">Cant. / Ítem</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-2 pr-2">
                    <span className="font-mono font-bold">{it.quantity}×</span> {it.productName}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    Bs. {Number(it.subtotalBs).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Pagado</p>
              <p className="font-mono text-xl font-extrabold tabular-nums text-slate-900">
                {dual.bs}
              </p>
              <p className="font-mono text-xs tabular-nums text-slate-500">{dual.usd}</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-1.5">
              <QRCodeSVG
                value={`JOYRIDE-RECEIPT:${order.orderCode}:BOB:${Number(order.totalBs).toFixed(2)}`}
                size={68}
                fgColor="#0B0D12"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2 border-t border-dashed border-slate-300 pt-3 text-center text-[10px] text-slate-500">
            <JoyRideHeritageLockup forceTone="dark" className="h-12 w-auto opacity-85" />
            <p>
              &ldquo;No solo para gringos — Probably the best bar in town&rdquo; · Gracias por su preferencia
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-joycyan py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
        >
          <Printer className="h-4 w-4" />
          <span>Imprimir / Guardar PDF</span>
        </button>
      </div>
    </Modal>
  );
}
