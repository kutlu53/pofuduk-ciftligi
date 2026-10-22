import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { h } from "../games/common";
import { persist, save } from "../core/store";
import { sfx } from "../core/audio";
import { pofudukSvg } from "./pofuduk";

/** 3 turdan sonra dinlenme ekranı: oturum kapanır, "bir tur daha" kancası yok. */
export const rest: Screen = async (root) => {
  save.day.sessions++;
  save.day.roundsInSession = 0;
  await persist();
  const p = save.profile!;
  const wrap = h("div", "screen rest");
  wrap.append(
    h("div", "mascot big sleepy", pofudukSvg(p.avatar + p.name, "known")),
    h("div", "rest-icons", "😴 🧘 🥤 🌳"),
  );
  const homeBtn = h("button", "btn-big", "🏠");
  homeBtn.type = "button";
  homeBtn.onclick = () => {
    sfx.tap();
    go(home);
  };
  wrap.append(homeBtn);
  root.append(wrap);
};
