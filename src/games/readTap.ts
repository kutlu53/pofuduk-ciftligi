import type { Game } from "./types";
import type { Word } from "../core/types";
import { distractors, emojiCard, gameHeader, h, mark, pickFor, shuffle, wait } from "./common";
import { sfx, speak } from "../core/audio";

/** 👀 Sözcüğü oku, doğru resme dokun. 3 soru. Ses yok; cevaptan sonra sözcük seslendirilir. */
export const readTap: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "read", 3).filter((w) => w.modes.includes("listen"));
  const list = words.length >= 3 ? words : pickFor(ctx.theme, ctx.targets, "listen", 3);
  for (const target of list) {
    const options = shuffle([target, ...distractors(ctx.theme, target, "listen", 3)]);
    ctx.root.innerHTML = "";
    const wrap = h("div", "game");
    const top = h("div", "prompt-row");
    top.append(gameHeader("👀"), h("div", "word-prompt", target.en));
    const grid = h("div", "grid4");
    const cards = options.map(emojiCard);
    grid.append(...cards);
    wrap.append(top, grid);
    ctx.root.append(wrap);

    const t0 = performance.now();
    const choice = await new Promise<Word>((res) => {
      cards.forEach((c, i) => (c.onclick = () => res(options[i])));
    });
    const rt = performance.now() - t0;
    grid.classList.add("locked");
    const ok = choice.id === target.id;
    mark(cards[options.indexOf(choice)], ok);
    if (ok) sfx.ok();
    else {
      sfx.no();
      mark(cards[options.indexOf(target)], true);
    }
    ctx.answer(target, ok, rt, "read");
    void speak(target.en);
    await wait(ok ? 800 : 1200);
  }
};
