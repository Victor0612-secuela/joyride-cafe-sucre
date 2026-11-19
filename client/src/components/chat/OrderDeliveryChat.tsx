import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { ChatMessage } from '../../types';

const QUICK_REPLIES_CLIENT = [
  'Ya estoy en la puerta',
  'Por favor tocar timbre',
  '¿Por dónde vienes?',
];

const QUICK_REPLIES_RIDER = [
  'Llegando en 3 minutos',
  'Estoy afuera con tu pedido',
  'Por favor ten tu PIN a mano',
];

export function OrderDeliveryChat({ orderId }: { orderId: string }) {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ['chat', 'order', orderId],
    queryFn: async () => {
      const res = await api.get<{ messages: ChatMessage[] }>(`/chat/order/${orderId}`);
      return res.data.messages;
    },
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages?.length]);

  const sendMessage = async (content: string) => {
    const clean = content.trim();
    if (!clean) return;
    setSending(true);
    try {
      await api.post(`/chat/order/${orderId}`, { content: clean });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['chat', 'order', orderId] });
    } catch (err) {
      pushToast('No se pudo enviar mensaje', 'error', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const quickReplies = user?.role === 'REPARTIDOR' ? QUICK_REPLIES_RIDER : QUICK_REPLIES_CLIENT;
  const isParticipant = user?.role === 'CLIENTE' || user?.role === 'REPARTIDOR';

  return (
    <div className="rounded-2xl border border-hairline bg-obsidian p-4">
      <div className="mb-3 flex items-center justify-between border-b border-hairline pb-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-joycyan" />
          <h4 className="font-display text-sm font-bold text-ink">
            Chat Directo Cliente ↔ Repartidor
          </h4>
        </div>
        {isParticipant ? (
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            En vivo
          </span>
        ) : (
          <span className="rounded-full border border-joycyan/40 bg-joycyan/10 px-2.5 py-0.5 text-[11px] font-semibold text-joycyan">
            Solo lectura · Auditoría
          </span>
        )}
      </div>

      <div className="overscroll-contain max-h-48 space-y-2 overflow-y-auto pr-1">
        {!messages || messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted">
            Sin mensajes aún. Coordina puntos de referencia o llegada en tiempo real.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${
                    mine
                      ? 'bg-joycyan text-obsidian'
                      : 'border border-hairline bg-surface text-ink'
                  }`}
                >
                  <p className="text-[10px] font-bold opacity-75">
                    {m.senderName} ({m.senderRole})
                  </p>
                  <p className="mt-0.5 leading-snug">{m.content}</p>
                </div>
                <span className="mt-0.5 font-mono text-[10px] text-muted">
                  {formatDateTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {isParticipant ? (
        <>
          {/* Quick chips */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] font-medium text-muted transition-colors hover:border-joycyan/50 hover:text-ink"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(text);
            }}
            className="mt-3 flex items-center gap-2"
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe un mensaje directo…"
              className="flex-1 rounded-xl border border-hairline bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none sm:text-sm"
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              aria-label="Enviar mensaje"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-joymagenta text-white transition-colors hover:bg-joymagenta-deep disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      ) : (
        <p className="mt-3 rounded-xl border border-hairline bg-surface px-3 py-2 text-xs text-muted">
          Vista de supervisión en solo lectura: únicamente el cliente y el repartidor envían mensajes en
          este canal. Usa el chat flotante del equipo para coordinar operaciones.
        </p>
      )}
    </div>
  );
}
