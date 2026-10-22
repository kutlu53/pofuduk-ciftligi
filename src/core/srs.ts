import type { Mode, Stage, WordProgress } from "./types";

/**
 * Yeni → Tanıdık → Bildim → Usta
 * Usta: 3 farklı günde doğru, en az iki farklı modda.
 * Bildim: en az 3 doğru ve son 2 cevap üst üste doğru.
 * Tanıdık: en az 1 doğru.
 */
export function stageOf(p?: WordProgress): Stage {
  if (!p) return "new";
  if (p.days.length >= 3 && p.modes.length >= 2) return "master";
  if (p.correct >= 3 && p.streak >= 2) return "known";
  if (p.correct >= 1) return "familiar";
  return "new";
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Ertesi günün sabahı (00:05). */
function nextMorning(now: number, daysAhead: number): number {
  const d = new Date(now);
  d.setDate(d.getDate() + daysAhead);
  d.setHours(0, 5, 0, 0);
  return d.getTime();
}

/**
 * Aralıklı tekrar:
 *  yanlış → ertesi gün (aynı turun sonunda ayrıca tekrar sorulur, bunu tur yönetir)
 *  doğru-yavaş → 2 gün
 *  doğru-hızlı → 4 gün (seri < 3) / 7 gün (seri ≥ 3)
 *  usta → 7 gün
 */
export function applyAnswer(
  p: WordProgress,
  correct: boolean,
  rtMs: number,
  mode: Mode,
  avgRt: number,
  now = Date.now(),
): void {
  p.lastSeen = now;
  if (!correct) {
    p.wrong++;
    p.streak = 0;
    p.due = nextMorning(now, 1);
    return;
  }
  p.correct++;
  p.streak++;
  const dk = dayKey(now);
  if (!p.days.includes(dk)) p.days.push(dk);
  if (!p.modes.includes(mode)) p.modes.push(mode);

  const stage = stageOf(p);
  const slow = avgRt > 0 && rtMs > avgRt * 1.15;
  let days: number;
  if (stage === "master") days = 7;
  else if (slow) days = 2;
  else days = p.streak >= 3 ? 7 : 4;
  p.due = nextMorning(now, days);
}

export function isDue(p: WordProgress | undefined, now = Date.now()): boolean {
  return !!p && p.due > 0 && p.due <= now;
}
