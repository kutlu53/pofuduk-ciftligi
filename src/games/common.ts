import type { Mode, Stage, Theme, Word } from "../core/types";
import { getProgress } from "../core/store";
import { stageOf } from "../core/srs";
import { sfx, speak } from "../core/audio";
import { artSvg } from "../art";

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", html = ""): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const RANK: Record<Stage, number> = { new: 0, familiar: 1, known: 2, master: 3 };

/** `mode` destekleyen n sözcük: önce tur hedefleri, sonra temadan en az bilinenler. */
export function pickFor(theme: Theme, targets: Word[], mode: Mode, n: number): Word[] {
  const out = targets.filter((w) => w.modes.includes(mode)).slice(0, n);
  if (out.length < n) {
    const rest = shuffle(theme.words.filter((w) => w.modes.includes(mode) && !out.includes(w)));
    rest.sort((a, b) => RANK[stageOf(getProgress(a.id))] - RANK[stageOf(getProgress(b.id))]);
    out.push(...rest.slice(0, n - out.length));
  }
  return out;
}

/** Çeldiriciler: önce aynı kategori. */
export function distractors(theme: Theme, target: Word, mode: Mode, n: number, exclude: Word[] = []): Word[] {
  const ok = (w: Word) => w.id !== target.id && w.modes.includes(mode) && !exclude.includes(w);
  const same = shuffle(theme.words.filter((w) => ok(w) && w.cat === target.cat));
  const other = shuffle(theme.words.filter((w) => ok(w) && w.cat !== target.cat));
  return [...same, ...other].slice(0, n);
}

export function emojiCard(w: Word): HTMLButtonElement {
  const b = h("button", "card");
  b.type = "button";
  b.dataset.id = w.id;
  b.innerHTML = `<span class="card-art">${artSvg(w)}</span>`;
  return b;
}

export function speakerButton(text: string): HTMLButtonElement {
  const b = h("button", "speaker", "🔊");
  b.type = "button";
  b.onclick = () => {
    sfx.tap();
    b.classList.remove("pulse");
    void b.offsetWidth;
    b.classList.add("pulse");
    void speak(text);
  };
  return b;
}

export function mark(el: HTMLElement, ok: boolean): void {
  el.classList.add(ok ? "ok" : "no");
  el.classList.add(ok ? "pop" : "shake");
}

/** Oyun başlığı: sadece ikon, yazı yok. */
export function gameHeader(icon: string): HTMLElement {
  return h("div", "game-icon", icon);
}

/** Sadece-ikon yönerge kabarcığı (kısa süre görünür). */
export async function showHint(root: HTMLElement, icon: string): Promise<void> {
  const hint = h("div", "hint", icon);
  root.append(hint);
  await wait(700);
  hint.classList.add("fade");
  await wait(300);
  hint.remove();
}
