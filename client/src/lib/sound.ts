let audioCtx: AudioContext | null = null;

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

function playLayeredTone(
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  gainPeak = 0.13,
  type: OscillatorType = 'triangle',
  overtoneRatio = 1.5
) {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    // Warm fundamental voice
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(70, freqEnd), now + durationSec);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + durationSec + 0.02);

    // Subtle acoustic harmonic overtone (fifth / octave) for crisp clarity without harshness
    const harm = ctx.createOscillator();
    const harmGain = ctx.createGain();
    harm.type = 'sine';
    harm.frequency.setValueAtTime(freqStart * overtoneRatio, now);
    harm.frequency.exponentialRampToValueAtTime(Math.max(90, freqEnd * overtoneRatio), now + durationSec);

    harmGain.gain.setValueAtTime(0.0001, now);
    harmGain.gain.exponentialRampToValueAtTime(gainPeak * 0.28, now + 0.01);
    harmGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec * 0.85);

    harm.connect(harmGain);
    harmGain.connect(ctx.destination);
    harm.start(now);
    harm.stop(now + durationSec + 0.02);
  } catch {
    // Ignore autoplay guard restrictions cleanly
  }
}

export const joySound = {
  click: () => playLayeredTone(520, 740, 0.075, 0.12, 'triangle', 1.5),
  flip: () => playLayeredTone(390, 620, 0.125, 0.13, 'sine', 2.0),
  add: () => {
    playLayeredTone(587.33, 880, 0.13, 0.15, 'triangle', 1.5);
  },
  modalOpen: () => playLayeredTone(330, 523.25, 0.16, 0.12, 'sine', 1.5),
  success: () => {
    playLayeredTone(523.25, 659.25, 0.15, 0.15, 'triangle', 1.5);
    setTimeout(() => playLayeredTone(659.25, 783.99, 0.2, 0.16, 'triangle', 2.0), 95);
  },
  transition: () => playLayeredTone(310, 185, 0.22, 0.12, 'sine', 1.5),
  toggle: () => playLayeredTone(660, 880, 0.085, 0.13, 'sine', 1.5),
  tab: () => playLayeredTone(460, 590, 0.08, 0.11, 'triangle', 1.5),
  currency: () => playLayeredTone(784, 1046.5, 0.09, 0.13, 'sine', 1.5),
  notify: () => {
    playLayeredTone(587.33, 587.33, 0.1, 0.14, 'sine', 2.0);
    setTimeout(() => playLayeredTone(880, 880, 0.16, 0.14, 'sine', 1.5), 85);
  },
};
