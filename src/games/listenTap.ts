import type { Game } from "./types";
import type { Word } from "../core/types";
import { distractors, emojiCard, gameHeader, h, mark, pickFor, shuffle, speakerButton, wait } from "./common";
import { sfx, speakWord } from "../core/audio";

/** 👂 Dinle, doğru resme dokun. 3 soru. */
export const listenTap: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "listen", 3);
  for (const target of words) {
    const options = shuffle([target, ...distractors(ctx.theme, target, "listen", 3)]);
    ctx.root.innerHTML = "";
    const wrap = h("div", "game");
    wrap.dataset.target = target.id;
    const top = h("div", "prompt-row");
    const spk = speakerButton(target);
    top.append(gameHeader("👂"), spk);
    const grid = h("div", "grid4");
    const cards = options.map(emojiCard);
    grid.append(...cards);
    wrap.append(top, grid);
    ctx.root.append(wrap);

    let t0 = performance.now();
    const picked = new Promise<Word>((res) => {
      cards.forEach((c, i) => (c.onclick = () => res(options[i])));
    });
    spk.classList.add("pulse");
    let answered = false;
    void speakWord(target).then(() => {
      if (!answered) t0 = performance.now();
    });
    const choice = await picked;
    answered = true;
    const rt = Math.max(0, performance.now() - t0);
    grid.classList.add("locked");
    const ok = choice.id === target.id;
    mark(cards[options.indexOf(choice)], ok);
    if (ok) sfx.ok();
    else {
      sfx.no();
      mark(cards[options.indexOf(target)], true);
    }
    ctx.answer(target, ok, rt, "listen");
    // Yanlışta doğru kart gösterilirken sözcük bir kez daha söylenir; ses bitmeden geçilmez.
    await (ok ? wait(650) : Promise.all([wait(400).then(() => speakWord(target)), wait(1100)]));
  }
};
