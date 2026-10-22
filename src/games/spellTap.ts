import type { Game } from "./types";
import { gameHeader, h, pickFor, shuffle, speakerButton } from "./common";
import { spellingOf } from "../core/content";
import { sfx, speakWord } from "../core/audio";
import { artSvg } from "../art";

/** 🔤 Resmi gör, sesi dinle, harfleri sırayla dokunarak diz. 2 sözcük. */
export const spellTap: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "spell", 2);
  for (const word of words) {
    const letters = spellingOf(word).split("");
    let tiles = shuffle(letters);
    if (letters.length > 1 && tiles.join("") === letters.join("")) tiles = [...letters.slice(1), letters[0]];

    ctx.root.innerHTML = "";
    const wrap = h("div", "game");
    const top = h("div", "prompt-row");
    top.append(gameHeader("🔤"), h("div", "big-art", artSvg(word)), speakerButton(word));
    const slots = h("div", "slots");
    const slotEls = letters.map(() => h("span", "slot"));
    slots.append(...slotEls);
    const tray = h("div", "tiles");
    const tileEls = tiles.map((l) => {
      const t = h("button", "tile", l);
      t.type = "button";
      return t;
    });
    tray.append(...tileEls);
    wrap.append(top, slots, tray);
    ctx.root.append(wrap);
    void speakWord(word);

    const t0 = performance.now();
    let idx = 0;
    let mistake = false;
    await new Promise<void>((resolve) => {
      tileEls.forEach((tile, i) => {
        tile.onclick = () => {
          if (tile.classList.contains("used")) return;
          if (tiles[i] === letters[idx]) {
            tile.classList.add("used");
            slotEls[idx].textContent = letters[idx];
            slotEls[idx].classList.add("filled", "pop");
            idx++;
            sfx.tap();
            if (idx === letters.length) {
              sfx.ok();
              slots.classList.add("ok");
              ctx.answer(word, !mistake, performance.now() - t0, "spell");
              void speakWord(word);
              setTimeout(resolve, 1000);
            }
          } else {
            mistake = true;
            sfx.no();
            tile.classList.remove("shake");
            void tile.offsetWidth;
            tile.classList.add("shake");
          }
        };
      });
    });
  }
};
