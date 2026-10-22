import type { Theme, Word } from "./types";
import { getProgress } from "./store";
import { isDue, stageOf } from "./srs";

export type GameKind = "listenTap" | "readTap" | "dragMatch" | "spellTap" | "swipe" | "echo";

export interface RoundPlan {
  targets: Word[];
  order: GameKind[];
}

export const TARGETS_PER_ROUND = 6;
const MAX_NEW_PER_ROUND = 3;

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/**
 * Tur hedefleri: önce zamanı gelen tekrarlar, sonra en çok 3 yeni sözcük,
 * kalan yerler en uzun süredir görülmeyen sözcüklerle dolar.
 */
export function planRound(theme: Theme, now = Date.now()): RoundPlan {
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
  add(fresh, TARGETS_PER_ROUND); // yeterli görülmüş sözcük yoksa yeni ile doldur

  // Dinleme/eşleştirme oyunları resimli sözcük ister; en az 3 resimli hedef olsun.
  const pictured = targets.filter((w) => w.modes.includes("listen")).length;
  if (pictured < 3) {
    const extra = shuffle(theme.words.filter((w) => w.modes.includes("listen") && !targets.includes(w)));
    for (const w of extra) {
      if (targets.filter((t) => t.modes.includes("listen")).length >= 3) break;
      const idx = targets.findIndex((t) => !t.modes.includes("listen"));
      if (idx >= 0) targets[idx] = w;
      else targets.push(w);
    }
  }

  const scored: GameKind[] = shuffle(["listenTap", "readTap", "dragMatch", "spellTap", "swipe"]);
  return { targets: shuffle(targets), order: [...scored, "echo"] };
}
