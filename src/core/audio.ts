import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function playTone(kind: 'correct' | 'wrong' | 'flip' | 'success', enabled: boolean): void {
  if (!enabled) return;
  const ac = ctx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes: Record<string, number[]> = {
    correct: [523.25, 783.99],
    wrong: [220, 174.61],
    flip: [440],
    success: [523.25, 659.25, 783.99, 1046.5],
  };
  notes[kind].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = kind === 'wrong' ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.09;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(kind === 'flip' ? 0.05 : 0.12, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  });
}

let nativeLangs: string[] | null = null;

async function nativeSpeak(text: string, rate: number, onMissing?: () => void): Promise<boolean> {
  try {
    if (!nativeLangs) {
      const res = await TextToSpeech.getSupportedLanguages();
      nativeLangs = res.languages ?? [];
    }
    const hasGerman = nativeLangs.some((l) => l.toLowerCase().startsWith('de'));
    if (!hasGerman) {
      onMissing?.();
      return false;
    }
    await TextToSpeech.speak({ text, lang: 'de-DE', rate, pitch: 1, volume: 1, category: 'ambient' });
    return true;
  } catch {
    onMissing?.();
    return false;
  }
}

let webVoices: SpeechSynthesisVoice[] = [];
function refreshVoices() {
  if ('speechSynthesis' in window) webVoices = window.speechSynthesis.getVoices();
}

export function speakGerman(text: string, rate: number, onMissing?: () => void): boolean {
  if (Capacitor.isNativePlatform()) {
    void nativeSpeak(text, rate, onMissing);
    return true;
  }
  if (!('speechSynthesis' in window)) {
    onMissing?.();
    return false;
  }
  refreshVoices();
  const voice =
    webVoices.find((v) => v.lang === 'de-DE' && v.localService) ??
    webVoices.find((v) => v.lang === 'de-DE') ??
    webVoices.find((v) => v.lang.startsWith('de')) ??
    null;
  if (!voice) {
    // voices may still be loading; retry once they arrive, else report missing
    let settled = false;
    const finish = (v2: SpeechSynthesisVoice | null) => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener('voiceschanged', retry);
      clearTimeout(timer);
      if (v2) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'de-DE';
        u.voice = v2;
        u.rate = rate;
        window.speechSynthesis.speak(u);
      } else {
        onMissing?.();
      }
    };
    const retry = () => {
      refreshVoices();
      const v2 = webVoices.find((v) => v.lang.startsWith('de')) ?? null;
      if (v2) finish(v2);
    };
    const timer = setTimeout(() => finish(null), 2500);
    window.speechSynthesis.addEventListener('voiceschanged', retry);
    return true;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  if (voice) u.voice = voice;
  u.rate = rate;
  window.speechSynthesis.speak(u);
  return true;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}