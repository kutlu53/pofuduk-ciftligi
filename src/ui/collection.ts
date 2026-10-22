import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { h } from "../games/common";
import { THEME_ICONS, themes } from "../core/content";
import { currentTheme, getProgress, isUnlocked, persist, save, stageCounts } from "../core/store";
import { stageOf } from "../core/srs";
import { sfx, speak } from "../core/audio";
import { pofudukSvg } from "./pofuduk";
import type { Stage } from "../core/types";

const ORDER: Record<Stage, number> = { master: 0, known: 1, familiar: 2, new: 3 };

/** 🧺 Pofuduk koleksiyonu: ada sekmeleri, her sözcük bir pofuduk. Dokununca sözcük seslendirilir. */
export const collection: Screen = (root) => {
  const theme = currentTheme();
  const wrap = h("div", "screen collection");
  const top = h("div", "topbar");
  const back = h("button", "icon-btn", "🏠");
  back.type = "button";
  back.onclick = () => go(home);
  const c = stageCounts(theme.id);
  const counts = h(
    "div",
    "counts",
    `<span>🥚 ${c.new}</span><span>🐣 ${c.familiar}</span><span>🧸 ${c.known}</span><span>👑 ${c.master}</span>`,
  );
  top.append(back, counts);

  const tabs = h("div", "tabs");
  themes.forEach((t, i) => {
    const unlocked = isUnlocked(i);
    const b = h("button", "tab" + (t.id === theme.id ? " sel" : "") + (unlocked ? "" : " locked"), unlocked ? THEME_ICONS[i] : "🔒");
    b.type = "button";
    b.onclick = async () => {
      if (!unlocked) {
        sfx.no();
        return;
      }
      sfx.tap();
      save.currentTheme = t.id;
      await persist();
      go(collection);
    };
    tabs.append(b);
  });

  const grid = h("div", "pofuduk-grid");
  const sorted = theme.words.slice().sort((a, b) => ORDER[stageOf(getProgress(a.id))] - ORDER[stageOf(getProgress(b.id))]);
  for (const w of sorted) {
    const stage = stageOf(getProgress(w.id));
    const card = h("button", `pofuduk-card s-${stage}`);
    card.type = "button";
    card.innerHTML =
      pofudukSvg(w.id, stage, stage === "new" ? undefined : w.emoji) +
      `<span class="pofuduk-name">${stage === "new" ? "…" : w.en}</span>`;
    card.onclick = () => {
      card.classList.remove("bounce");
      void card.offsetWidth;
      card.classList.add("bounce");
      if (stage === "new") {
        sfx.tap();
        return;
      }
      sfx.squeak();
      void speak(w.en);
    };
    grid.append(card);
  }
  wrap.append(top, tabs, grid);
  root.append(wrap);
};
