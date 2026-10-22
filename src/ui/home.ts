import type { Screen } from "./router";
import { go } from "./router";
import { h } from "../games/common";
import { THEME_ICONS, themes } from "../core/content";
import { isUnlocked, knownRatio, persist, playBlock, ROUNDS_PER_SESSION, save } from "../core/store";
import { sfx } from "../core/audio";
import { collection } from "./collection";
import { roundScreen } from "./round";
import { rest } from "./rest";
import { parent } from "./parent";
import { pofudukSvg } from "./pofuduk";

/** Ada haritası: 6 ada, açık olanlardan biri seçilir. Çocuk sadece kendi ilerlemesini görür. */
export const home: Screen = (root) => {
  const p = save.profile!;
  // Seçili ada kilitliyse ilk adaya dön.
  const curIdx = Math.max(0, themes.findIndex((t) => t.id === save.currentTheme));
  if (!isUnlocked(curIdx)) save.currentTheme = themes[0].id;

  const wrap = h("div", "screen home");

  const top = h("div", "topbar");
  const who = h("div", "who", `<span class="avatar">${p.avatar}</span><span class="nick">${escapeHtml(p.name)}</span>`);
  const gear = h("button", "icon-btn", "⚙️");
  gear.type = "button";
  gear.onclick = () => go(parent);
  top.append(who, gear);

  const map = h("div", "map");
  const islands: HTMLElement[] = [];
  themes.forEach((theme, i) => {
    const isl = h("div", "island");
    const unlocked = isUnlocked(i);
    if (unlocked) {
      const ratio = knownRatio(theme.id);
      isl.classList.add("open");
      if (theme.id === save.currentTheme) isl.classList.add("current");
      isl.style.setProperty("--p", `${Math.round(ratio * 100)}%`);
      isl.innerHTML = `<div class="ring"><span class="island-icon">${THEME_ICONS[i]}</span></div>`;
      isl.onclick = async () => {
        sfx.pop();
        if (save.currentTheme !== theme.id) {
          save.currentTheme = theme.id;
          islands.forEach((el) => el.classList.toggle("current", el === isl));
          await persist();
          return;
        }
        startRound();
      };
    } else {
      isl.classList.add("locked");
      isl.innerHTML = `<div class="ring"><span class="island-icon">🔒</span></div>`;
      isl.onclick = () => sfx.no();
    }
    islands.push(isl);
    map.append(isl);
  });

  const bar = h("div", "bottombar");
  const basket = h("button", "icon-btn big", "🧺");
  basket.type = "button";
  basket.onclick = () => go(collection);
  const block = playBlock();
  const play = h("button", "btn-big play", block ? "🌙" : "▶");
  play.type = "button";
  if (block) {
    play.classList.add("sleep");
    play.onclick = () => sfx.squeak();
  } else play.onclick = startRound;
  const mascot = h("div", "mascot", pofudukSvg(p.avatar + p.name, block ? "familiar" : "known"));
  bar.append(basket, play, mascot);

  wrap.append(top, map, bar);
  root.append(wrap);

  function startRound(): void {
    if (playBlock()) {
      sfx.squeak();
      return;
    }
    sfx.pop();
    if (save.day.roundsInSession >= ROUNDS_PER_SESSION) go(rest);
    else go(roundScreen);
  }
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
