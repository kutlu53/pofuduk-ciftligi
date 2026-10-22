/**
 * Ses: sözcük seslendirme için tarayıcı TTS (geçici; stüdyo kaydı gelince
 * asset.audio kullanılacak), efektler için WebAudio.
 */
import type { Word } from "./types";

let ctx: AudioContext | null = null;
let voice: SpeechSynthesisVoice | null = null;

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
  pickVoice();
}

function pickVoice(): void {
  if (!("speechSynthesis" in window)) return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  const en = voices.filter((v) => /^en[-_]/i.test(v.lang));
  const prefer = (re: RegExp) => en.find((v) => re.test(v.name));
  voice =
    prefer(/natural|neural/i) ??
    prefer(/google uk english female/i) ??
    en.find((v) => /^en[-_]GB/i.test(v.lang)) ??
    en[0] ??
    null;
}
if ("speechSynthesis" in window) {
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

let speaking: Promise<void> = Promise.resolve();

/** Metni İngilizce seslendirir; bitince çözülür. TTS yoksa kısa bekleyip çözülür. */
export function speak(text: string, rate = 0.9): Promise<void> {
  if (!("speechSynthesis" in window)) return new Promise((r) => setTimeout(r, 400));
  speechSynthesis.cancel();
  if (!voice) pickVoice();
  speaking = new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? "en-GB";
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1.05;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, 1500 + text.length * 90);
    speechSynthesis.speak(u);
  });
  return speaking;
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  current?.pause();
  current = null;
}

let current: HTMLAudioElement | null = null;

/** Sözcüğü seslendirir: gerçek ses dosyası varsa (asset.audio) onu çalar, yoksa TTS. */
export function speakWord(w: Word): Promise<void> {
  const url = w.asset?.audio;
  if (!url) return speak(w.en);
  stopSpeaking();
  return new Promise((resolve) => {
    const a = new Audio(url);
    current = a;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (current === a) current = null;
      resolve();
    };
    a.onended = finish;
    a.onerror = () => {
      finish();
      void speak(w.en); // dosya çalınamazsa TTS'e düş
    };
    setTimeout(finish, 6000);
    a.play().catch(() => a.onerror?.(new Event("error")));
  });
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", gain = 0.18, delay = 0, slideTo?: number): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap(): void {
    tone(600, 0.06, "triangle", 0.12);
  },
  ok(): void {
    tone(660, 0.1, "sine");
    tone(880, 0.14, "sine", 0.18, 0.09);
  },
  no(): void {
    tone(220, 0.18, "square", 0.08, 0, 160);
  },
  pop(): void {
    tone(300, 0.08, "sine", 0.15, 0, 900);
  },
  squeak(): void {
    tone(900, 0.12, "sine", 0.14, 0, 1400);
    tone(1200, 0.1, "sine", 0.1, 0.12, 1000);
  },
  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", 0.16, i * 0.12));
  },
  stamp(): void {
    tone(150, 0.12, "square", 0.12, 0, 90);
    tone(1000, 0.08, "sine", 0.1, 0.1);
  },
};
