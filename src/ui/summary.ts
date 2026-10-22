import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { rest } from "./rest";
import { bossScreen, roundScreen } from "./round";
import { story } from "./story";
import { h, wait } from "../games/common";
import { countKnown, persist, playBlock, ROUNDS_PER_SESSION, save, todayKey } from "../core/store";
import { dev } from "../core/dev";
import { sfx } from "../core/audio";

export interface RoundResult {
  score: number;
  stars: 1 | 2 | 3;
  accuracy: number;
  prevBest: number;
  isRecord: boolean;
  newlyKnown: number;
  boss: boolean;
  bossWon?: boolean;
}

const EMOTIONS = ["😄", "🙂", "😐", "😕"];
const STORY_EVERY = 5;

/** Tur sonu: 1-3 yıldız, kişisel rekor çubuğu, bu hafta +N pofuduk, duygu seçimi. Patron sonucu varsa taç. */
export async function summary(root: HTMLElement, r: RoundResult): Promise<void> {
  const p = save.profile!;
  const wrap = h("div", "screen summary");

  // Her 5 turda bir (normal turlarda) hikâye parçası araya girer.
  const storyDue = !r.boss && (dev.allGames || (p.rounds > 0 && p.rounds % STORY_EVERY === 0));
  const via = (dest: Screen): Screen => (storyDue ? story(dest) : dest);

  if (r.boss) {
    wrap.append(h("div", "boss-result " + (r.bossWon ? "won" : "lost"), r.bossWon ? "👑" : "💪"));
  }
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
  homeBtn.onclick = () => go(via(home));
  const again = h("button", "btn-big play", r.boss && !r.bossWon ? "👑" : "▶");
  again.type = "button";
  again.onclick = () => {
    sfx.pop();
    if (save.day.roundsInSession >= ROUNDS_PER_SESSION) go(rest);
    else if (r.boss && !r.bossWon) go(bossScreen);
    else go(via(roundScreen));
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
  if (r.boss && r.bossWon) sfx.win();
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
