import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { h } from "../games/common";
import { persist, save, todayKey } from "../core/store";
import { sfx } from "../core/audio";

const AVATARS = ["🦊", "🐼", "🐸", "🦄", "🐧", "🐯", "🐨", "🐙"];

/** İlk açılış: hazır avatar seç, istersen takma ad yaz. */
export const onboarding: Screen = (root) => {
  const wrap = h("div", "screen onboarding");
  wrap.append(h("div", "logo", "🌾"), h("h1", "title", "Pofuduk"));
  const grid = h("div", "avatar-grid");
  let chosen = "";
  const play = h("button", "btn-big play disabled", "▶");
  play.type = "button";
  const buttons = AVATARS.map((a) => {
    const b = h("button", "avatar-pick", a);
    b.type = "button";
    b.onclick = () => {
      sfx.pop();
      chosen = a;
      buttons.forEach((x) => x.classList.toggle("sel", x === b));
      play.classList.remove("disabled");
    };
    return b;
  });
  grid.append(...buttons);
  const name = h("input", "name-input");
  name.type = "text";
  name.maxLength = 12;
  name.placeholder = "✏️";
  name.autocomplete = "off";
  play.onclick = async () => {
    if (!chosen) return;
    sfx.win();
    save.profile = { name: name.value.trim(), avatar: chosen, firstDay: todayKey(), avgRt: 0, bestScore: 0, rounds: 0, emotions: [] };
    await persist();
    go(home);
  };
  wrap.append(grid, name, play);
  root.append(wrap);
};
