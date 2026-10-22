import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { summary, type RoundResult } from "./summary";
import { h, wait } from "../games/common";
import { currentTheme, ensureProgress, persist, save } from "../core/store";
import { applyAnswer, stageOf } from "../core/srs";
import { RoundScore, stars } from "../core/scoring";
import { planRound, type GameKind } from "../core/round";
import { sfx, stopSpeaking } from "../core/audio";
import type { Game, GameContext } from "../games/types";
import type { Word } from "../core/types";
import { listenTap } from "../games/listenTap";
import { readTap } from "../games/readTap";
import { dragMatch } from "../games/dragMatch";
import { spellTap } from "../games/spellTap";
import { swipe } from "../games/swipe";
import { echo } from "../games/echo";
import { pofudukSvg } from "./pofuduk";

const GAMES: Record<GameKind, Game> = { listenTap, readTap, dragMatch, spellTap, swipe, echo };
const ICONS: Record<GameKind, string> = { listenTap: "👂", readTap: "👀", dragMatch: "🖐️", spellTap: "🔤", swipe: "↔️", echo: "🗣️" };

/** Bir tur: 5 puanlı mikro oyun + (varsa) yanlışların tekrarı + Yankı Mağarası. */
export const roundScreen: Screen = async (root) => {
  const theme = currentTheme();
  const profile = save.profile!;
  const plan = planRound(theme);
  const rs = new RoundScore();
  const missed = new Map<string, Word>();
  let newlyKnown = 0;
  const startMs = Date.now();
  let aborted = false;

  const wrap = h("div", "screen round");
  const hud = h("div", "hud");
  const exit = h("button", "icon-btn small", "✖");
  exit.type = "button";
  const dots = h("div", "dots");
  const scoreEl = h("div", "score", "0");
  const comboEl = h("div", "combo", "");
  hud.append(exit, dots, scoreEl, comboEl);
  const stage = h("div", "stage");
  wrap.append(hud, stage);
  root.append(wrap);

  exit.onclick = async () => {
    aborted = true;
    stopSpeaking();
    save.day.playedMs += Date.now() - startMs;
    await persist();
    go(home);
  };

  const queue: { kind: GameKind; targets: Word[] }[] = plan.order
    .filter((k) => k !== "echo")
    .map((kind) => ({ kind, targets: plan.targets }));

  const renderDots = (activeIdx: number, total: number) => {
    dots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = h("span", "dot" + (i < activeIdx ? " done" : i === activeIdx ? " active" : ""));
      d.textContent = i < queue.length ? ICONS[queue[i].kind] : i === total - 1 ? ICONS.echo : "🔁";
      dots.append(d);
    }
  };

  const floatPoints = (points: number, mult: number) => {
    const f = h("div", "float", mult > 1 ? `+${points} ×${mult}` : `+${points}`);
    hud.append(f);
    setTimeout(() => f.remove(), 900);
  };

  const hatch = async (w: Word) => {
    const t = h("div", "toast", pofudukSvg(w.id, "known", w.emoji));
    stage.append(t);
    sfx.squeak();
    await wait(900);
    t.classList.add("fade");
    await wait(300);
    t.remove();
  };

  const makeCtx = (targets: Word[]): GameContext => ({
    root: stage,
    theme,
    targets,
    answer(word, correct, rtMs, mode) {
      const p = ensureProgress(word.id);
      const before = stageOf(p);
      const avgBefore = profile.avgRt;
      applyAnswer(p, correct, rtMs, mode, avgBefore);
      if (correct) profile.avgRt = avgBefore ? Math.round(avgBefore * 0.8 + rtMs * 0.2) : Math.round(rtMs);
      else missed.set(word.id, word);
      const { points, mult } = rs.answer(correct, rtMs, avgBefore);
      scoreEl.textContent = String(rs.score);
      scoreEl.classList.remove("pop");
      void scoreEl.offsetWidth;
      if (correct) {
        scoreEl.classList.add("pop");
        floatPoints(points, mult);
      }
      comboEl.textContent = rs.combo >= 3 ? `🔥×${rs.multiplier}` : "";
      const after = stageOf(p);
      if (before !== after && (after === "known" || after === "master")) {
        newlyKnown++;
        void hatch(word);
      }
    },
  });

  // Puanlı oyunlar
  let i = 0;
  while (i < queue.length) {
    if (aborted) return;
    renderDots(i, queue.length + 1);
    const { kind, targets } = queue[i];
    await GAMES[kind](makeCtx(targets));
    i++;
    if (i === 5 && missed.size > 0) {
      // Yanlış cevaplananlar aynı turun sonunda bir kez daha sorulur.
      const review = [...missed.values()].slice(0, 3);
      const kind: GameKind = review.every((w) => w.modes.includes("listen")) ? "listenTap" : "readTap";
      queue.push({ kind, targets: review });
    }
  }
  if (aborted) return;

  // Yankı Mağarası (puansız)
  renderDots(queue.length, queue.length + 1);
  await GAMES.echo(makeCtx(plan.targets));
  if (aborted) return;

  // Tur sonu
  save.day.playedMs += Date.now() - startMs;
  save.day.roundsInSession++;
  profile.rounds++;
  const prevBest = profile.bestScore;
  const isRecord = rs.score > prevBest;
  if (isRecord) profile.bestScore = rs.score;
  await persist();

  const result: RoundResult = {
    score: rs.score,
    stars: stars(rs.accuracy),
    accuracy: rs.accuracy,
    prevBest,
    isRecord,
    newlyKnown,
  };
  go((r) => summary(r, result));
};
