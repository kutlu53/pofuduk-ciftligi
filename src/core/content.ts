import theme1 from "../../content/grade3/theme1.json";
import theme2 from "../../content/grade3/theme2.json";
import theme3 from "../../content/grade3/theme3.json";
import theme4 from "../../content/grade3/theme4.json";
import theme5 from "../../content/grade3/theme5.json";
import theme6 from "../../content/grade3/theme6.json";
import type { Theme, Word } from "./types";

export const themes: Theme[] = [theme1, theme2, theme3, theme4, theme5, theme6] as unknown as Theme[];

/** Ada ikonları (tema sırasıyla). */
export const THEME_ICONS = ["🏫", "✏️", "🧒", "👨‍👩‍👧", "🏡", "🌍"];

/** Bir sonraki adanın açılması için "Bildim" veya üstü oranı. */
export const UNLOCK_RATIO = 0.7;

export function getTheme(id: string): Theme {
  const t = themes.find((x) => x.id === id);
  if (!t) throw new Error("theme not found: " + id);
  return t;
}

/** Heceleme oyunu için hedef: "a cake" → "cake", "to run" → "run". */
export function spellingOf(w: Word): string {
  return w.en.replace(/^(an?|to)\s+/i, "").toLowerCase();
}

/** Resmi olan (dinleme/eşleştirme için uygun) sözcük mü? */
export function hasPicture(w: Word): boolean {
  return w.modes.includes("listen");
}
