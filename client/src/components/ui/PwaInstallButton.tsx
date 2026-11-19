import React, { useEffect, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { joySound } from '../../lib/sound';
import { Modal } from './Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPromptGlobal = e as BeforeInstallPromptEvent;
  });
}

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [promptReady, setPromptReady] = useState(Boolean(deferredPromptGlobal));
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptGlobal = e as BeforeInstallPromptEvent;
      setPromptReady(true);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const handleInstallClick = async () => {
    joySound.click();
    if (deferredPromptGlobal) {
      try {
        await deferredPromptGlobal.prompt();
        const choice = await deferredPromptGlobal.userChoice;
        if (choice.outcome === 'accepted') {
          deferredPromptGlobal = null;
          setPromptReady(false);
          return;
        }
      } catch {
        // Fallback to manual instructions modal
      }
    }
    setGuideOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          compact
            ? 'inline-flex items-center gap-2 rounded-xl border border-joycyan/45 bg-joycyan/10 px-3 py-2 text-xs font-bold text-joycyan transition-colors hover:bg-joycyan/20'
            : 'inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-joycyan/50 bg-joycyan/12 px-4 py-2 text-xs font-bold text-joycyan transition-colors hover:bg-joycyan/20 sm:text-sm'
        }
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>
          {promptReady
            ? t('Instalar App Joy Ride', 'Install Joy Ride App')
            : t('Descargar en tu Celular (App)', 'Get Mobile App')}
        </span>
      </button>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title={t('Lleva Joy Ride Café® en tu celular', 'Install Joy Ride Café® on your phone')}
        subtitle={t(
          'Acceso directo sin ocupar memoria, con alertas y carta al instante',
          'Home screen access with live tracking and instant menu'
        )}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-obsidian p-4">
            <img
              src="/logo-joyride.png"
              alt="Joy Ride App"
              className="h-14 w-14 shrink-0 rounded-full object-contain"
            />
            <div>
              <p className="font-display font-bold text-ink">JOY RIDE CAFÉ® Sucre</p>
              <p className="text-xs text-muted">
                {t('Instalación directa desde tu navegador móvil', 'Direct install from mobile browser')}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-hairline bg-obsidian p-4 text-xs leading-relaxed text-muted">
            <div className="flex items-start gap-2.5">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-joycyan" />
              <div>
                <p className="font-bold text-ink">Android (Chrome / Brave / Edge)</p>
                <p className="mt-0.5">
                  Toca el menú <strong>⋮</strong> arriba a la derecha y elige{' '}
                  <strong className="text-joycyan">“Instalar aplicación”</strong> o{' '}
                  <strong>“Agregar a la pantalla principal”</strong>.
                </p>
              </div>
            </div>
            <div className="border-t border-hairline pt-3 flex items-start gap-2.5">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-joymagenta" />
              <div>
                <p className="font-bold text-ink">iPhone / iPad (Safari)</p>
                <p className="mt-0.5">
                  Pulsa el ícono <strong>Compartir</strong> abajo y selecciona{' '}
                  <strong className="text-joymagenta">“Agregar a inicio”</strong>.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGuideOpen(false)}
            className="w-full rounded-xl bg-joycyan py-3 text-sm font-bold text-obsidian hover:bg-joycyan-deep"
          >
            {t('Entendido', 'Got it')}
          </button>
        </div>
      </Modal>
    </>
  );
}
