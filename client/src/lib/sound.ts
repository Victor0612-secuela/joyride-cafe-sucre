let audioCtx: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let lastSemanticMs = 0;

export function isSoundEnabled(): boolean {
  if (typeof document === 'undefined') return true;
  const match = document.cookie.match(/(?:^|;\s*)joyride_sound=(on|off)/);
  return match?.[1] !== 'off';
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.cookie = `joyride_sound=${enabled ? 'on' : 'off'}; max-age=31536000; path=/; SameSite=Lax`;
}

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !isSoundEnabled()) return null;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctor();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function markSemantic(isGenericClick = false): void {
  if (!isGenericClick) {
    lastSemanticMs = performance.now();
  }
}

interface SoftNoteOptions {
  freq: number;
  durationSec: number;
  gainPeak?: number;
  lowpassHz?: number;
  delaySec?: number;
  attackSec?: number;
  overtoneRatio?: number;
  overtoneMix?: number;
}

/**
 * Pure sine fundamental + ultra-soft acoustic harmonic shaped through a warm lowpass filter.
 * Produces felt-piano / wooden marimba warmth instead of retro harsh oscillator beeps.
 */
function playWarmNote({
  freq,
  durationSec,
  gainPeak = 0.04,
  lowpassHz = 1550,
  delaySec = 0,
  attackSec = 0.012,
  overtoneRatio = 2.0,
  overtoneMix = 0.16,
}: SoftNoteOptions): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const start = ctx.currentTime + delaySec;
    const stop = start + durationSec + 0.03;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpassHz, start);
    filter.Q.setValueAtTime(0.7, start);
    filter.connect(ctx.destination);

    // Warm sine fundamental
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gainPeak, start + Math.min(attackSec, durationSec * 0.35));
    amp.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(amp);
    amp.connect(filter);
    osc.start(start);
    osc.stop(stop);

    // Subtle acoustic harmonic shimmer
    if (overtoneMix > 0) {
      const harm = ctx.createOscillator();
      const harmAmp = ctx.createGain();
      harm.type = 'sine';
      harm.frequency.setValueAtTime(freq * overtoneRatio, start);

      harmAmp.gain.setValueAtTime(0.0001, start);
      harmAmp.gain.linearRampToValueAtTime(
        gainPeak * overtoneMix,
        start + Math.min(attackSec, durationSec * 0.3)
      );
      harmAmp.gain.exponentialRampToValueAtTime(0.0001, start + durationSec * 0.72);

      harm.connect(harmAmp);
      harmAmp.connect(filter);
      harm.start(start);
      harm.stop(stop);
    }
  } catch {
    // Ignore autoplay restrictions safely
  }
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (cachedNoiseBuffer && cachedNoiseBuffer.sampleRate === ctx.sampleRate) {
    return cachedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.25);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    channel[i] = Math.random() * 2 - 1;
  }
  cachedNoiseBuffer = buffer;
  return buffer;
}

/**
 * Airy filtered velvet brush noise for card flips and carousel slide transitions.
 */
function playVelvetBrush(durationSec: number, centerHz: number, gainPeak = 0.024): void {
  const ctx = getContext();
  if (!ctx) return;

  try {
    const start = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = getNoiseBuffer(ctx);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(centerHz, start);
    bandpass.Q.setValueAtTime(1.4, start);

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.linearRampToValueAtTime(gainPeak, start + Math.min(0.01, durationSec * 0.25));
    amp.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    source.connect(bandpass);
    bandpass.connect(amp);
    amp.connect(ctx.destination);
    source.start(start);
    source.stop(start + durationSec + 0.02);
  } catch {
    // Ignore autoplay restrictions safely
  }
}

function playClick(): void {
  markSemantic(true);
  playWarmNote({
    freq: 420,
    durationSec: 0.038,
    gainPeak: 0.04,
    lowpassHz: 1400,
    attackSec: 0.006,
    overtoneRatio: 1.5,
    overtoneMix: 0.12,
  });
}

function playSlide(): void {
  markSemantic();
  playVelvetBrush(0.036, 900, 0.022);
  playWarmNote({
    freq: 392,
    durationSec: 0.034,
    gainPeak: 0.022,
    lowpassHz: 1400,
    attackSec: 0.008,
    overtoneMix: 0.1,
  });
}

function playFlip(): void {
  markSemantic();
  playVelvetBrush(0.048, 1050, 0.026);
  playWarmNote({
    freq: 329.63,
    durationSec: 0.055,
    gainPeak: 0.03,
    lowpassHz: 1450,
    attackSec: 0.01,
    overtoneMix: 0.14,
  });
}

function playTab(): void {
  markSemantic();
  playWarmNote({
    freq: 523.25,
    durationSec: 0.045,
    gainPeak: 0.036,
    lowpassHz: 1550,
    attackSec: 0.007,
    overtoneMix: 0.14,
  });
}

function playToggle(): void {
  markSemantic();
  playWarmNote({ freq: 440, durationSec: 0.045, gainPeak: 0.032, lowpassHz: 1500, delaySec: 0 });
  playWarmNote({ freq: 523.25, durationSec: 0.055, gainPeak: 0.034, lowpassHz: 1600, delaySec: 0.042 });
}

function playCurrency(): void {
  markSemantic();
  playWarmNote({
    freq: 587.33,
    durationSec: 0.06,
    gainPeak: 0.034,
    lowpassHz: 1700,
    attackSec: 0.008,
    overtoneRatio: 2.0,
    overtoneMix: 0.16,
  });
}

function playAdd(): void {
  markSemantic();
  playWarmNote({ freq: 329.63, durationSec: 0.065, gainPeak: 0.042, lowpassHz: 1600, delaySec: 0 });
  playWarmNote({ freq: 392.0, durationSec: 0.07, gainPeak: 0.044, lowpassHz: 1650, delaySec: 0.048 });
  playWarmNote({ freq: 493.88, durationSec: 0.085, gainPeak: 0.045, lowpassHz: 1700, delaySec: 0.096 });
}

function playRemove(): void {
  markSemantic();
  playWarmNote({ freq: 392.0, durationSec: 0.045, gainPeak: 0.03, lowpassHz: 1400, delaySec: 0 });
  playWarmNote({ freq: 329.63, durationSec: 0.055, gainPeak: 0.032, lowpassHz: 1350, delaySec: 0.042 });
}

function playModalOpen(): void {
  markSemantic();
  playWarmNote({ freq: 261.63, durationSec: 0.08, gainPeak: 0.032, lowpassHz: 1450, delaySec: 0, attackSec: 0.016 });
  playWarmNote({ freq: 329.63, durationSec: 0.09, gainPeak: 0.035, lowpassHz: 1550, delaySec: 0.045, attackSec: 0.016 });
  playWarmNote({ freq: 493.88, durationSec: 0.11, gainPeak: 0.036, lowpassHz: 1650, delaySec: 0.09, attackSec: 0.016 });
}

function playModalClose(): void {
  markSemantic();
  playWarmNote({ freq: 329.63, durationSec: 0.055, gainPeak: 0.026, lowpassHz: 1400, delaySec: 0, attackSec: 0.01 });
  playWarmNote({ freq: 261.63, durationSec: 0.07, gainPeak: 0.028, lowpassHz: 1300, delaySec: 0.05, attackSec: 0.01 });
}

function playSuccess(): void {
  markSemantic();
  const notes = [349.23, 440.0, 523.25, 659.25];
  notes.forEach((freq, idx) => {
    playWarmNote({
      freq,
      durationSec: idx === notes.length - 1 ? 0.16 : 0.09,
      gainPeak: idx === notes.length - 1 ? 0.048 : 0.04,
      lowpassHz: 1750,
      delaySec: idx * 0.06,
      attackSec: 0.014,
      overtoneMix: 0.16,
    });
  });
}

function playError(): void {
  markSemantic();
  playWarmNote({ freq: 246.94, durationSec: 0.055, gainPeak: 0.034, lowpassHz: 1200, delaySec: 0, overtoneMix: 0.08 });
  playWarmNote({ freq: 220.0, durationSec: 0.075, gainPeak: 0.036, lowpassHz: 1150, delaySec: 0.065, overtoneMix: 0.08 });
}

function playLogin(): void {
  markSemantic();
  playWarmNote({ freq: 261.63, durationSec: 0.11, gainPeak: 0.038, lowpassHz: 1500, delaySec: 0, attackSec: 0.016 });
  playWarmNote({ freq: 392.0, durationSec: 0.11, gainPeak: 0.04, lowpassHz: 1550, delaySec: 0.015, attackSec: 0.016 });
  playWarmNote({ freq: 587.33, durationSec: 0.12, gainPeak: 0.042, lowpassHz: 1650, delaySec: 0.07, attackSec: 0.016 });
  playWarmNote({ freq: 659.25, durationSec: 0.16, gainPeak: 0.045, lowpassHz: 1700, delaySec: 0.13, attackSec: 0.016 });
}

function playLogout(): void {
  markSemantic();
  const cadence = [659.25, 493.88, 392.0, 329.63];
  cadence.forEach((freq, idx) => {
    playWarmNote({
      freq,
      durationSec: idx === cadence.length - 1 ? 0.15 : 0.085,
      gainPeak: 0.044 - idx * 0.004,
      lowpassHz: 1350,
      delaySec: idx * 0.055,
      attackSec: 0.014,
      overtoneMix: 0.12,
    });
  });
}

function playNotify(): void {
  markSemantic();
  playWarmNote({ freq: 783.99, durationSec: 0.065, gainPeak: 0.032, lowpassHz: 1700, delaySec: 0, overtoneMix: 0.14 });
  playWarmNote({ freq: 1046.5, durationSec: 0.11, gainPeak: 0.036, lowpassHz: 1700, delaySec: 0.055, overtoneMix: 0.14 });
}

export const joySound = {
  click: playClick,
  tap: playClick,
  slide: playSlide,
  flip: playFlip,
  tab: playTab,
  toggle: playToggle,
  currency: playCurrency,
  add: playAdd,
  remove: playRemove,
  modalOpen: playModalOpen,
  modalClose: playModalClose,
  success: playSuccess,
  error: playError,
  login: playLogin,
  logout: playLogout,
  transition: playLogout,
  notify: playNotify,
};

/**
 * Installs a single passive capture/bubble click listener so every interactive control across
 * the app emits a whisper-soft tactile click when no specialized semantic sound just fired.
 */
export function installGlobalUiSoundDelegate(): () => void {
  if (typeof document === 'undefined') return () => {};

  const onDocumentClick = (e: MouseEvent) => {
    if (!e.isTrusted || !isSoundEnabled()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const interactive = target.closest(
      'button, a[href], [role="button"], [role="tab"], select, summary'
    ) as HTMLElement | null;
    if (!interactive) return;
    if (interactive.hasAttribute('disabled') || interactive.dataset.noSound === 'true') return;

    const now = performance.now();
    if (now - lastSemanticMs > 95) {
      playClick();
    }
  };

  document.addEventListener('click', onDocumentClick, { passive: true });
  return () => document.removeEventListener('click', onDocumentClick);
}
