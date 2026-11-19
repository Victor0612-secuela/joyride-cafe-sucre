import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { MessagesSquare, Send, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api, getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { ChatMessage } from '../../types';

export function StaffOpsChat() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useQuery({
    queryKey: ['chat', 'staff'],
    queryFn: async () => {
      const res = await api.get<{ messages: ChatMessage[] }>('/chat/staff');
      return res.data.messages;
    },
    refetchInterval: open ? 3000 : 12000,
    enabled: Boolean(user && user.role !== 'CLIENTE'),
  });

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [open, messages?.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/chat/staff', { content: text.trim() });
      setText('');
      queryClient.invalidateQueries({ queryKey: ['chat', 'staff'] });
    } catch (err) {
      pushToast('Error enviando mensaje al equipo', 'error', getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!user || user.role === 'CLIENTE') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-joycyan/50 bg-surface px-4 py-3 text-xs font-bold text-ink shadow-elevated transition-transform hover:border-joycyan hover:bg-elevated active:scale-[0.96]"
      >
        <MessagesSquare className="h-4 w-4 text-joycyan" />
        <span>Chat Personal Joy Ride</span>
        {messages && messages.length > 0 && (
          <span className="rounded-full bg-joymagenta px-2 py-0.5 font-mono text-[10px] tabular-nums text-white">
            {messages.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/65 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
              className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface shadow-elevated"
            >
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                <div>
                  <h3 className="font-display text-base font-extrabold text-ink">
                    Canal Interno Joy Ride Ops
                  </h3>
                  <p className="text-xs text-muted">
                    Caja · Cocina/Bar · Reparto · Gerencia
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar chat interno"
                  className="rounded-lg border border-hairline bg-elevated p-2 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overscroll-contain flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {(messages || []).map((m) => {
                  const mine = m.senderId === user.id;
                  return (
                    <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                          mine
                            ? 'bg-joycyan text-obsidian'
                            : 'border border-hairline bg-obsidian text-ink'
                        }`}
                      >
                        <p className="text-[11px] font-bold opacity-80">
                          {m.senderName} · {m.senderRole}
                        </p>
                        <p className="mt-0.5 leading-snug">{m.content}</p>
                      </div>
                      <span className="mt-1 font-mono text-[10px] text-muted">
                        {formatDateTime(m.createdAt)}
                      </span>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 border-t border-hairline bg-obsidian px-4 py-3"
              >
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Mensaje al equipo operativo…"
                  className="flex-1 rounded-xl border border-hairline bg-surface px-3 py-2.5 text-base text-ink placeholder:text-muted focus:border-joycyan focus:outline-none sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  aria-label="Enviar"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-joymagenta text-white hover:bg-joymagenta-deep disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
