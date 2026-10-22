import type { Game } from "./types";
import { distractors, gameHeader, h, pickFor, wait } from "./common";
import { sfx, speakWord } from "../core/audio";
import { artSvg } from "../art";

/** ↔️ Resim ile sözcük uyuyor mu? Sağa kaydır ✅, sola kaydır ❌. 4 kart. */
export const swipe: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "listen", 4);
  for (const word of words) {
    const wantTrue = Math.random() < 0.5;
    const shown = wantTrue ? word : (distractors(ctx.theme, word, "listen", 1)[0] ?? word);
    const truly = shown.id === word.id;

    ctx.root.innerHTML = "";
    const wrap = h("div", "game");
    wrap.dataset.truly = truly ? "1" : "0";
    wrap.append(gameHeader("↔️"));
    const area = h("div", "swipe-area");
    const card = h("div", "swipe-card");
    card.innerHTML = `<span class="card-art">${artSvg(shown)}</span><span class="swipe-word">${word.en}</span>`;
    const left = h("div", "swipe-side left", "❌");
    const right = h("div", "swipe-side right", "✅");
    area.append(left, card, right);
    const btns = h("div", "swipe-btns");
    const bNo = h("button", "btn-round no-btn", "❌");
    const bYes = h("button", "btn-round yes-btn", "✅");
    bNo.type = bYes.type = "button";
    btns.append(bNo, bYes);
    wrap.append(area, btns);
    ctx.root.append(wrap);

    const t0 = performance.now();
    const choice = await new Promise<boolean>((resolve) => {
      bYes.onclick = () => resolve(true);
      bNo.onclick = () => resolve(false);
      let sx = 0;
      let dx = 0;
      let dragging = false;
      card.addEventListener("pointerdown", (e) => {
        dragging = true;
        sx = e.clientX;
        dx = 0;
        card.setPointerCapture(e.pointerId);
        card.classList.add("dragging");
      });
      card.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        dx = e.clientX - sx;
        card.style.transform = `translateX(${dx}px) rotate(${dx / 12}deg)`;
        left.classList.toggle("lit", dx < -40);
        right.classList.toggle("lit", dx > 40);
      });
      const end = () => {
        if (!dragging) return;
        dragging = false;
        card.classList.remove("dragging");
        if (dx > 70) resolve(true);
        else if (dx < -70) resolve(false);
        else {
          card.style.transform = "";
          left.classList.remove("lit");
          right.classList.remove("lit");
        }
      };
      card.addEventListener("pointerup", end);
      card.addEventListener("pointercancel", end);
    });

    const rt = performance.now() - t0;
    const ok = choice === truly;
    btns.classList.add("locked");
    card.style.transform = "";
    card.classList.add(choice ? "fly-right" : "fly-left");
    (choice ? right : left).classList.add("lit", ok ? "ok" : "no");
    if (ok) sfx.ok();
    else sfx.no();
    ctx.answer(word, ok, rt, "read");

    if (ok) {
      void speakWord(word);
      await wait(700);
    } else {
      await wait(450);
      card.className = "swipe-card ok pop";
      card.innerHTML = `<span class="card-art">${artSvg(word)}</span><span class="swipe-word">${word.en}</span>`;
      void speakWord(word);
      await wait(1100);
    }
  }
};
