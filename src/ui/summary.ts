import { go } from "./router";
import { home } from "./home";
import { rest } from "./rest";
import { roundScreen } from "./round";
import { h, wait } from "../games/common";
import { countKnown, persist, playBlock, ROUNDS_PER_SESSION, save, todayKey } from "../core/store";
import { sfx } from "../core/audio";

export interface RoundResult {
  score: number;
  stars: 1 | 2 | 3;
  accuracy: number;
  prevBest: number;
  isRecord: boolean;
  newlyKnown: number;
}

const EMOTIONS = ["😄", "🙂", "😐", "😕"];

/** Tur sonu: 1-3 yıldız, kişisel rekor çubuğu, bu hafta +N pofuduk, duygu seçimi. */
export async function summary(root: HTMLElement, r: RoundResult): Promise<void> {
  const p = save.profile!;
  const wrap = h("div", "screen summary");

  const starRow = h("div", "stars");
  const starEls = [1, 2, 3].map(() => h("span", "star", "☆"));
  starRow.append(...starEls);

  const scoreEl = h("div", "big-score", String(r.score));
  const best = Math.max(r.score, r.prevBest, 1);
  const record = h(
    "div",
    "record",
    `<div class="record-bar"><div class="record-fill" style="width:0%"></div><div class="record-mark" style="left:${Math.round((Math.max(r.prevBest, 1) / best) * 100)}%">🏆</div></div>`,
  );
  const weekly = h("div", "weekly", `🧸 +${Math.max(0, countKnown() - save.week.knownAtStart)}`);

  const emo = h("div", "emotions");
  const buttons = h("div", "summary-btns hidden");
  const homeBtn = h("button", "btn-big", "🏠");
  homeBtn.type = "button";
  homeBtn.onclick = () => go(home);
  const again = h("button", "btn-big play", "▶");
  again.type = "button";
  again.onclick = () => {
    sfx.pop();
    if (save.day.roundsInSession >= ROUNDS_PER_SESSION) go(rest);
    else go(roundScreen);
  };
  buttons.append(homeBtn);
  if (!playBlock()) buttons.append(again);

  EMOTIONS.forEach((e) => {
    const b = h("button", "emotion", e);
    b.type = "button";
    b.onclick = async () => {
      sfx.tap();
      emo.querySelectorAll(".emotion").forEach((x) => x.classList.toggle("sel", x === b));
      p.emotions.push({ date: todayKey(), emoji: e });
      if (p.emotions.length > 60) p.emotions.splice(0, p.emotions.length - 60);
      await persist();
      buttons.classList.remove("hidden");
    };
    emo.append(b);
  });

  wrap.append(starRow, scoreEl, record, weekly, emo, buttons);
  root.append(wrap);

  // Animasyonlar
  for (let i = 0; i < r.stars; i++) {
    await wait(350);
    starEls[i].textContent = "⭐";
    starEls[i].classList.add("pop");
    sfx.ok();
  }
  await wait(200);
  const fill = record.querySelector<HTMLElement>(".record-fill")!;
  fill.style.width = `${Math.round((r.score / best) * 100)}%`;
  if (r.isRecord) {
    await wait(600);
    record.classList.add("new-record");
    sfx.win();
  }
  // Duygu seçmeden de devam edilebilsin (3 sn sonra düğmeler görünür).
  await wait(3000);
  buttons.classList.remove("hidden");
}
