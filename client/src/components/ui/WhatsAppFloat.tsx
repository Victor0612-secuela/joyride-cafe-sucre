import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { JOYRIDE_LOCATION } from '../../lib/constants';

const CONCIERGE_PROMPTS = [
  '¿Quieres agendar una reserva o clase de Salsa?',
  '¿Armamos tu pedido 2x1 de Happy Hour hoy?',
  '¿Necesitas ayuda con tu entrega o pago QR?',
  '¿Buscas qué visitar hoy en Sucre?',
  '¿Celebras cumple o grupo en Nicolás Ortiz 14?',
];

const QUICK_TOPICS = [
  {
    label: 'Reservar mesa / Pista Salsa',
    prefill: 'Hola Joy Ride Café! Quiero agendar una mesa o reservar la clase gratis de Salsa & Bachata.',
  },
  {
    label: 'Happy Hour 2x1 & Cócteles',
    prefill: 'Hola Joy Ride Café! ¿Qué cócteles y postres están hoy en Happy Hour 2x1?',
  },
  {
    label: 'Estado de mi pedido / PIN',
    prefill: 'Hola Joy Ride Café! Quisiera consultar el estado o ruta de mi pedido actual.',
  },
  {
    label: 'Tours Maragua & Sucre',
    prefill: 'Hola Joy Ride Café! Busco info de desayunos, tours Mountain Bike a Maragua o recomendaciones en Sucre.',
  },
];

function buildWaLink(text: string): string {
  return `https://wa.me/${JOYRIDE_LOCATION.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function WhatsAppFloat() {
  const [promptIdx, setPromptIdx] = useState(0);
  const [bubbleDismissed, setBubbleDismissed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  useEffect(() => {
    if (chatOpen || bubbleDismissed) return;
    const id = setInterval(() => {
      setPromptIdx((i) => (i + 1) % CONCIERGE_PROMPTS.length);
    }, 4500);
    return () => clearInterval(id);
  }, [chatOpen, bubbleDismissed]);

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customMsg.trim() || 'Hola Joy Ride Café Sucre! Necesito ayuda con mi pedido.';
    window.open(buildWaLink(clean), '_blank', 'noopener,noreferrer');
    setCustomMsg('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Expandable Mini Chat Widget */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.34, bounce: 0 }}
            className="w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl border border-emerald-400/35 bg-surface/95 shadow-elevated backdrop-blur-xl"
            role="dialog"
            aria-label="Asistente WhatsApp Joy Ride"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline bg-gradient-to-r from-emerald-500/20 via-joycyan/10 to-surface px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src="/logo-joyride.png"
                    alt="Joy Ride Café"
                    className="h-12 w-12 rounded-full object-contain ring-2 ring-emerald-400/50"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface bg-emerald-400" />
                </div>
                <div>
                  <p className="font-display text-sm font-extrabold text-ink">
                    Concierge Joy Ride®
                  </p>
                  <p className="font-mono text-[11px] text-emerald-300">
                    En línea · {JOYRIDE_LOCATION.whatsappDisplay}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                aria-label="Cerrar asistente WhatsApp"
                className="rounded-lg border border-hairline bg-obsidian/70 p-1.5 text-muted hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-3 p-4">
              <div className="rounded-2xl rounded-tl-sm border border-hairline bg-obsidian/90 p-3.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                ¡Hola desde Calle Nicolás Ortiz N° 14! ¿En qué te ayudamos hoy en Sucre?
              </div>

              <div className="space-y-1.5">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <Sparkles className="h-3 w-3 text-joycyan" />
                  <span>Consultas frecuentes (abre WhatsApp directo)</span>
                </p>
                {QUICK_TOPICS.map((topic) => (
                  <a
                    key={topic.label}
                    href={buildWaLink(topic.prefill)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 rounded-xl border border-hairline bg-elevated/80 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/10 hover:text-emerald-200"
                  >
                    <span>{topic.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  </a>
                ))}
              </div>

              <form onSubmit={handleSendCustom} className="flex items-center gap-2 border-t border-hairline pt-3">
                <input
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Escribe tu duda para WhatsApp…"
                  aria-label="Mensaje personalizado para WhatsApp"
                  className="min-w-0 flex-1 rounded-xl border border-hairline bg-obsidian px-3 py-2 text-base text-ink placeholder:text-muted focus:border-emerald-400 focus:outline-none sm:text-sm"
                />
                <button
                  type="submit"
                  aria-label="Enviar por WhatsApp"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-obsidian transition-colors hover:bg-emerald-400 active:scale-[0.96]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rotating Conversational Teaser Bubble (vanishes cleanly when chat opens) */}
      {!chatOpen && !bubbleDismissed && (
        <AnimatePresence mode="wait">
          <motion.div
            key={promptIdx}
            initial={{ opacity: 0, y: 10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex max-w-[270px] items-start gap-2 rounded-2xl rounded-br-sm border border-emerald-400/45 bg-surface/95 px-3.5 py-2.5 shadow-elevated backdrop-blur-xl sm:max-w-[300px]"
          >
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="flex-1 text-left text-xs font-semibold leading-snug text-ink hover:text-emerald-300 sm:text-sm"
            >
              <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Joy Ride Chat · En vivo
              </span>
              {CONCIERGE_PROMPTS[promptIdx]}
            </button>
            <button
              type="button"
              onClick={() => setBubbleDismissed(true)}
              aria-label="Ocultar sugerencia"
              className="rounded-md p-0.5 text-muted hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Floating Animated Concierge Trigger */}
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.85, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0 }}
        onClick={() => setChatOpen((v) => !v)}
        aria-label="Abrir asistente WhatsApp de Joy Ride Café (+591 76116875)"
        className="group relative flex items-center gap-2.5 rounded-full border border-emerald-300/60 bg-emerald-500 px-4 py-3.5 text-obsidian shadow-[0_12px_34px_rgba(16,185,129,0.45)] transition-transform hover:scale-[1.04] hover:bg-emerald-400 active:scale-[0.96]"
      >
        <span className="pointer-events-none absolute -inset-1 rounded-full bg-emerald-400/30 animate-ping motion-reduce:hidden" />
        <MessageCircle className="relative h-5 w-5 fill-obsidian/15 stroke-[2.2]" />
        <span className="relative hidden text-xs font-extrabold tracking-tight sm:inline sm:text-sm">
          {chatOpen ? 'Cerrar WhatsApp' : 'WhatsApp · 76116875'}
        </span>
      </motion.button>
    </div>
  );
}
