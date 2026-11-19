import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, CheckCircle2, Music, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, getErrorMessage } from '../../lib/api';
import { ZONE_META } from '../../lib/format';
import { joySound } from '../../lib/sound';
import { Reservation, ReservationZone } from '../../types';
import { EditorialSplitModal } from '../ui/EditorialSplitModal';

interface ReservationModalProps {
  open: boolean;
  defaultSalsa?: boolean;
  onClose: () => void;
}

const ZONE_IMAGES: Record<ReservationZone, string[]> = {
  PATIO_COLONIAL: [
    '/images/joyride-official-portada.webp',
    '/images/venue-patio-night.webp',
    '/images/evento-tours.webp',
  ],
  MEZZANINE_TERRAZA: [
    '/images/sucre-rooftop-terraza.webp',
    '/images/venue-bar-cocktails.webp',
    '/images/joyride-friends-night.webp',
  ],
  PANTALLA_GIGANTE: [
    '/images/musica-vivo.webp',
    '/images/fiesta-amigos.webp',
    '/images/joyride-evento-3.webp',
  ],
  PISTA_SALSA_BACHATA: [
    '/images/salsa-bachata.webp',
    '/images/venue-lounge-lights.webp',
    '/images/joyride-evento-2.webp',
  ],
};

export function ReservationModal({ open, defaultSalsa = false, onClose }: ReservationModalProps) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('19:30');
  const [zone, setZone] = useState<ReservationZone>(
    defaultSalsa ? 'PISTA_SALSA_BACHATA' : 'MEZZANINE_TERRAZA'
  );
  const [partySize, setPartySize] = useState(4);
  const [includeSalsaClass, setIncludeSalsaClass] = useState(defaultSalsa);
  const [guestName, setGuestName] = useState(user?.name || '');
  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [guestPhone, setGuestPhone] = useState(user?.phone || '+591 71123456');
  const [specialNotes, setSpecialNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (defaultSalsa) {
      setZone('PISTA_SALSA_BACHATA');
      setIncludeSalsaClass(true);
    }
  }, [defaultSalsa, open]);

  useEffect(() => {
    if (user) {
      setGuestName((v) => v || user.name);
      setGuestEmail((v) => v || user.email);
      if (user.phone) setGuestPhone(user.phone);
    }
  }, [user]);

  const { data: availability } = useQuery({
    queryKey: ['reservation-availability', date],
    queryFn: async () => {
      const res = await api.get<{
        zones: Array<{ zone: ReservationZone; capacity: number; availableSeats: number }>;
      }>(`/reservations/availability?date=${date}`);
      return res.data.zones;
    },
    enabled: open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post<{ reservation: Reservation }>('/reservations', {
        guestName,
        guestEmail,
        guestPhone,
        zone,
        date,
        timeSlot,
        partySize,
        includeSalsaClass,
        specialNotes: specialNotes || undefined,
      });
      setCreatedReservation(res.data.reservation);
      queryClient.invalidateQueries({ queryKey: ['reservation-availability', date] });
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      joySound.success();
      pushToast('Reserva confirmada en Joy Ride Café', 'success', `Código ${res.data.reservation.code}`);
    } catch (err) {
      pushToast('No se pudo reservar', 'error', getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCreatedReservation(null);
    onClose();
  };

  return (
    <EditorialSplitModal
      open={open}
      onClose={handleClose}
      title={createdReservation ? `Pase Confirmado · ${createdReservation.code}` : 'Reservar Mesa & Clases de Salsa'}
      subtitle={`Probably the Best Table in Town® · ${ZONE_META[zone].label}`}
      badge={includeSalsaClass ? 'INCLUYE SALSA & BACHATA' : 'RESERVA EN VIVO'}
      accent={includeSalsaClass ? 'magenta' : 'cyan'}
      images={ZONE_IMAGES[zone]}
    >
      {createdReservation ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <p className="text-sm text-muted">
            Presenta este pase digital en recepción y revisa el correo de confirmación en tu bandeja.
          </p>

          <div className="mx-auto inline-block rounded-2xl bg-white p-4 shadow-card">
            <QRCodeSVG
              value={`JOYRIDE-RES:${createdReservation.code}:${createdReservation.qrPassToken}`}
              size={170}
              fgColor="#0B0D12"
            />
          </div>

          <div className="space-y-1.5 rounded-2xl border border-hairline bg-elevated p-4 text-left text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Código Reserva</span>
              <span className="font-mono font-bold text-joycyan">{createdReservation.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Ambiente</span>
              <span className="font-semibold text-ink">{ZONE_META[createdReservation.zone].label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Fecha &amp; Hora</span>
              <span className="font-mono tabular-nums text-ink">
                {createdReservation.date} · {createdReservation.timeSlot}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Personas</span>
              <span className="font-mono tabular-nums text-ink">{createdReservation.partySize}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-xl bg-joycyan py-3.5 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
          >
            Listo
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted">
              Elige tu Ambiente en la Casona
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(ZONE_META) as ReservationZone[]).map((zKey) => {
                const avail = availability?.find((a) => a.zone === zKey);
                const selected = zone === zKey;
                return (
                  <button
                    key={zKey}
                    type="button"
                    onClick={() => setZone(zKey)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-joycyan bg-joycyan/15'
                        : 'border-hairline bg-obsidian hover:border-joycyan/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-ink">{ZONE_META[zKey].label}</span>
                      {avail && (
                        <span className="font-mono text-[11px] tabular-nums text-joycyan">
                          {avail.availableSeats} cupos
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-muted">{ZONE_META[zKey].vibe}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="res-date" className="block text-xs font-semibold text-muted">
                Fecha
              </label>
              <input
                id="res-date"
                type="date"
                required
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-time" className="block text-xs font-semibold text-muted">
                Horario
              </label>
              <select
                id="res-time"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              >
                <option value="12:30">12:30 Almuerzo</option>
                <option value="18:00">18:00 Happy Hour</option>
                <option value="19:30">19:30 Salsa &amp; Cena</option>
                <option value="21:00">21:00 Música / Bar</option>
                <option value="22:30">22:30 Lounge Nocturno</option>
              </select>
            </div>
            <div>
              <label htmlFor="res-size" className="block text-xs font-semibold text-muted">
                Personas
              </label>
              <div className="relative mt-1">
                <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="res-size"
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={partySize}
                  onChange={(e) => setPartySize(Number(e.target.value))}
                  className="w-full rounded-xl border border-hairline bg-obsidian py-2.5 pl-9 pr-3 text-base text-ink sm:text-sm"
                />
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-joymagenta/40 bg-joymagenta/10 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Music className="h-4 w-4 text-joymagenta" />
              <div>
                <p className="text-xs font-bold text-ink">Incluir Clase Gratis de Salsa &amp; Bachata</p>
                <p className="text-[11px] text-muted">Martes, Jueves y Sábados · 18:00 – 21:00</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeSalsaClass}
              onChange={(e) => setIncludeSalsaClass(e.target.checked)}
              className="h-4 w-4 accent-joymagenta"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="res-name" className="block text-xs font-semibold text-muted">
                Nombre
              </label>
              <input
                id="res-name"
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Tu nombre"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-phone" className="block text-xs font-semibold text-muted">
                WhatsApp
              </label>
              <input
                id="res-phone"
                type="tel"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="+591 71123456"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="res-email" className="block text-xs font-semibold text-muted">
                Correo
              </label>
              <input
                id="res-email"
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="res-notes" className="block text-xs font-semibold text-muted">
                Nota especial (opcional)
              </label>
              <input
                id="res-notes"
                type="text"
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="Ej. Cumpleaños o mesa terraza"
                className="mt-1 w-full rounded-xl border border-hairline bg-obsidian px-3 py-2.5 text-base text-ink sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-joycyan py-3.5 text-sm font-bold text-obsidian transition-colors hover:bg-joycyan-deep active:scale-[0.96] disabled:opacity-60"
          >
            <Calendar className="h-4 w-4" />
            <span>{submitting ? 'Generando pase QR…' : 'Confirmar Reserva y Pase QR'}</span>
          </button>
        </form>
      )}
    </EditorialSplitModal>
  );
}
