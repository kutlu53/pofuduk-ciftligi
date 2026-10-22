import type { Game } from "./types";
import { gameHeader, h, pickFor, shuffle, wait } from "./common";
import { sfx, speakWord } from "../core/audio";
import { artSvg } from "../art";

function zoneAt(x: number, y: number): HTMLElement | undefined {
  return document.elementsFromPoint(x, y).find((el) => el.classList.contains("zone")) as HTMLElement | undefined;
}

/** 🖐️ Sözcük etiketini doğru resmin üstüne sürükle. 3 çift, tek ekran. */
export const dragMatch: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "match", 3);
  ctx.root.innerHTML = "";
  const wrap = h("div", "game");
  wrap.append(gameHeader("🖐️"));
  const zones = h("div", "zones");
  const zoneEls = shuffle(words).map((w) => {
    const z = h("div", "zone");
    z.dataset.id = w.id;
    z.innerHTML = `<span class="card-art">${artSvg(w)}</span>`;
    return z;
  });
  zones.append(...zoneEls);
  const chips = h("div", "chips");
  const chipEls = shuffle(words).map((w) => {
    const c = h("div", "chip", w.en);
    c.dataset.id = w.id;
    return c;
  });
  chips.append(...chipEls);
  wrap.append(zones, chips);
  ctx.root.append(wrap);

  const t0 = performance.now();
  const attempted = new Set<string>();
  let matched = 0;

  await new Promise<void>((resolve) => {
    for (const chip of chipEls) {
      let sx = 0;
      let sy = 0;
      let dragging = false;
      chip.addEventListener("pointerdown", (e) => {
        if (chip.classList.contains("done")) return;
        dragging = true;
        chip.setPointerCapture(e.pointerId);
        sx = e.clientX;
        sy = e.clientY;
        chip.classList.add("dragging");
        sfx.tap();
      });
      chip.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        chip.style.transform = `translate(${e.clientX - sx}px, ${e.clientY - sy}px) scale(1.1)`;
        const z = zoneAt(e.clientX, e.clientY);
        zoneEls.forEach((el) => el.classList.toggle("over", el === z));
      });
      const end = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        chip.classList.remove("dragging");
        zoneEls.forEach((el) => el.classList.remove("over"));
        const z = zoneAt(e.clientX, e.clientY);
        const word = words.find((w) => w.id === chip.dataset.id)!;
        if (z && !z.classList.contains("ok")) {
          const ok = z.dataset.id === chip.dataset.id;
          if (!attempted.has(word.id)) {
            attempted.add(word.id);
            ctx.answer(word, ok, performance.now() - t0, "match");
          }
          if (ok) {
            sfx.ok();
            chip.style.transform = "";
            chip.classList.add("done");
            z.classList.add("ok", "pop");
            z.append(chip);
            const said = speakWord(word);
            matched++;
            if (matched === words.length) void Promise.all([said, wait(800)]).then(() => resolve());
            return;
          }
          sfx.no();
          z.classList.add("shake");
          setTimeout(() => z.classList.remove("shake"), 500);
        }
        chip.style.transform = "";
      };
      chip.addEventListener("pointerup", end);
      chip.addEventListener("pointercancel", end);
    }
  });
};
