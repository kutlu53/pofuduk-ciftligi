import type { Theme, Word } from "./types";
import { getProgress } from "./store";
import { isDue, stageOf } from "./srs";

export type GameKind = "listenTap" | "readTap" | "dragMatch" | "spellTap" | "swipe" | "trace" | "echo";

export const GAME_ICONS: Record<GameKind, string> = {
  listenTap: "👂",
  readTap: "👀",
  dragMatch: "🖐️",
  spellTap: "🔤",
  swipe: "↔️",
  trace: "✍️",
  echo: "🗣️",
};

/** İlk günden açık puanlı oyunlar. */
const BASE_KINDS: GameKind[] = ["listenTap", "readTap", "dragMatch", "spellTap", "swipe"];
/** Haftalık açılan türler: ilk oyun gününden kaç gün sonra. */
export const UNLOCKS: { kind: GameKind; day: number }[] = [{ kind: "trace", day: 7 }];

/** Geliştirici anahtarı (?dev=all): tüm oyun türleri açık ve her tur hepsi oynanır. */
export const dev = { allGames: false };

export const SCORED_PER_ROUND = 5;
export const TARGETS_PER_ROUND = 6;
const MAX_NEW_PER_ROUND = 3;

export interface RoundPlan {
  targets: Word[];
  order: GameKind[];
}

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function daysSince(dayKey: string, now = Date.now()): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = new Date(y, m - 1, d).getTime();
  return Math.max(0, Math.floor((now - start) / 86_400_000));
}

/** Bugün açık olan puanlı oyun türleri. */
export function availableKinds(firstDay: string, now = Date.now()): GameKind[] {
  if (dev.allGames) return [...BASE_KINDS, ...UNLOCKS.map((u) => u.kind)];
  const days = daysSince(firstDay, now);
  return [...BASE_KINDS, ...UNLOCKS.filter((u) => days >= u.day).map((u) => u.kind)];
}

/**
 * Tur hedefleri: önce zamanı gelen tekrarlar, sonra en çok 3 yeni sözcük,
 * kalan yerler en uzun süredir görülmeyen sözcüklerle dolar.
 */
export function pickTargets(theme: Theme, now = Date.now()): Word[] {
  const due = theme.words
    .filter((w) => isDue(getProgress(w.id), now))
    .sort((a, b) => getProgress(a.id)!.due - getProgress(b.id)!.due);
  const fresh = shuffle(theme.words.filter((w) => stageOf(getProgress(w.id)) === "new"));
  const seen = theme.words
    .filter((w) => getProgress(w.id) && !isDue(getProgress(w.id), now))
    .sort((a, b) => getProgress(a.id)!.lastSeen - getProgress(b.id)!.lastSeen);

  const targets: Word[] = [];
  const add = (list: Word[], max: number) => {
    for (const w of list) {
      if (targets.length >= TARGETS_PER_ROUND || max <= 0) break;
      if (!targets.includes(w)) {
        targets.push(w);
        max--;
      }
    }
  };
  add(due, TARGETS_PER_ROUND);
  add(fresh, MAX_NEW_PER_ROUND);
  add(seen, TARGETS_PER_ROUND);
  add(fresh, TARGETS_PER_ROUND);

  // Dinleme/eşleştirme oyunları resimli sözcük ister; en az 3 resimli hedef olsun.
  const pictured = () => targets.filter((t) => t.modes.includes("listen")).length;
  if (pictured() < 3) {
    const extra = shuffle(theme.words.filter((w) => w.modes.includes("listen") && !targets.includes(w)));
    for (const w of extra) {
      if (pictured() >= 3) break;
      const idx = targets.findIndex((t) => !t.modes.includes("listen"));
      if (idx >= 0) targets[idx] = w;
      else targets.push(w);
    }
  }
  return shuffle(targets);
}

/** Tur planı: 5 puanlı oyun (açık türlerden rastgele) + Yankı Mağarası. */
export function planRound(theme: Theme, kinds: GameKind[], now = Date.now()): RoundPlan {
  const scored = dev.allGames ? shuffle(kinds) : shuffle(kinds).slice(0, SCORED_PER_ROUND);
  return { targets: pickTargets(theme, now), order: [...scored, "echo"] };
}
