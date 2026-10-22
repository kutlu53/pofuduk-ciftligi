import type { Screen } from "./router";
import { h } from "../games/common";
import { themes } from "../core/content";
import { artSvg } from "../art";

/** Geliştirici sayfası: bir temanın tüm illüstrasyonları. URL: ?sheet=theme1 */
export function sheet(themeId: string): Screen {
  return (root) => {
    const list = themeId === "all" ? themes : themes.filter((t) => t.id === themeId);
    for (const theme of list) {
      root.append(h("h2", "", `${theme.id} – ${theme.title_en}`));
      const grid = h("div", "sheet");
      for (const w of theme.words) {
        const item = h("div", "sheet-item");
        item.innerHTML = `${artSvg(w)}<b>${w.en}</b><small>${w.tr} · ${w.modes.includes("listen") ? "🖼️" : "📝"}</small>`;
        grid.append(item);
      }
      root.append(grid);
    }
  };
}
