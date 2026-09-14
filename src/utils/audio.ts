// Web Audio API Synthesizer - 100% self-contained, no network downloads needed
import { AmbientSoundType } from '../types';

let audioCtx: AudioContext | null = null;
let ambientNodes: {
  source?: AudioNode;
  gainNode?: GainNode;
  cleanup?: () => void;
} | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'warning' | 'success' = 'light') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(25);
      else if (type === 'heavy') navigator.vibrate(45);
      else if (type === 'warning') navigator.vibrate([40, 60, 40]);
      else if (type === 'success') navigator.vibrate([30, 40, 30, 40, 70]);
    } catch {
      // Vibration may be restricted or unsupported on some devices
    }
  }
}

export function playClick() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
    triggerHaptic('light');
  } catch {
    // AudioContext might be blocked until user gesture
  }
}

export function playChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Soothing Zen bell harmonics (E5, B5, G#6)
    const freqs = [659.25, 987.77, 1318.51];
    
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 2.5);
    });

    triggerHaptic('success');
  } catch {
    // Ignore audio error
  }
}

export function playWarning() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.setValueAtTime(240, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    triggerHaptic('warning');
  } catch {
    // Ignore audio error
  }
}

export function stopAmbient() {
  if (ambientNodes) {
    try {
      if (ambientNodes.gainNode && audioCtx) {
        ambientNodes.gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      }
      setTimeout(() => {
        if (ambientNodes?.cleanup) {
          ambientNodes.cleanup();
        }
        ambientNodes = null;
      }, 500);
    } catch {
      ambientNodes = null;
    }
  }
}

export function startAmbient(type: AmbientSoundType) {
  stopAmbient();
  if (type === 'off') return;

  try {
    const ctx = getAudioContext();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);

    if (type === 'whitenoise') {
      // Generate looped buffer with noise
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

      ambientNodes = {
        source: whiteNoise,
        gainNode: masterGain,
        cleanup: () => {
          whiteNoise.stop();
          whiteNoise.disconnect();
          filter.disconnect();
          masterGain.disconnect();
        }
      };
    } else if (type === 'rain') {
      // Soft gentle rain simulation using filtered pink noise and random modulating drops
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.3;
      }

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = buffer;
      rainSource.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1200, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.7, ctx.currentTime);

      rainSource.connect(bandpass);
      bandpass.connect(masterGain);
      rainSource.start();

      ambientNodes = {
        source: rainSource,
        gainNode: masterGain,
        cleanup: () => {
          rainSource.stop();
          rainSource.disconnect();
          bandpass.disconnect();
          masterGain.disconnect();
        }
      };
    } else if (type === 'binaural') {
      // 40 Hz Gamma/Alpha study beat (180 Hz base and 220 Hz beat)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(200, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(240, ctx.currentTime); // 40Hz delta

      const merger = ctx.createChannelMerger(2);
      osc1.connect(merger, 0, 0);
      osc2.connect(merger, 0, 1);

      merger.connect(masterGain);
      osc1.start();
      osc2.start();

      ambientNodes = {
        gainNode: masterGain,
        cleanup: () => {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          merger.disconnect();
          masterGain.disconnect();
        }
      };
    }
  } catch {
    // Ignore audio error
  }
}
