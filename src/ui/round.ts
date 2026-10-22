import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { summary, type RoundResult } from "./summary";
import { h, wait } from "../games/common";
import { currentTheme, ensureProgress, persist, save } from "../core/store";
import { applyAnswer, stageOf } from "../core/srs";
import { RoundScore, stars } from "../core/scoring";
import { availableKinds, dev, GAME_ICONS, planRound, SCORED_PER_ROUND, type GameKind } from "../core/round";
import { sfx, stopSpeaking } from "../core/audio";
import type { Game, GameContext } from "../games/types";
import type { Word } from "../core/types";
import { listenTap } from "../games/listenTap";
import { readTap } from "../games/readTap";
import { dragMatch } from "../games/dragMatch";
import { spellTap } from "../games/spellTap";
import { swipe } from "../games/swipe";
import { trace } from "../games/trace";
import { echo } from "../games/echo";
import { pofudukSvg } from "./pofuduk";

const GAMES: Record<GameKind, Game> = { listenTap, readTap, dragMatch, spellTap, swipe, trace, echo };

/** Değiştiriciler: 🐇 hızlı (süre içinde cevaba +5), 🔦 karanlık (el feneri), 🧊 kaygan (kartlar kıpırdar). */
type Mod = "fast" | "dark" | "ice";
const MODS: Mod[] = ["fast", "dark", "ice"];
const MOD_ICON: Record<Mod, string> = { fast: "🐇", dark: "🔦", ice: "🧊" };
const FAST_LIMIT_MS = 7000;
const FAST_BONUS = 5;
const MOD_FROM_ROUND = 2;
const MOD_CHANCE = 0.5;

/** Bir tur: 5 puanlı mikro oyun (biri değiştiricili olabilir) + yanlışların tekrarı + Yankı Mağarası. */
export const roundScreen: Screen = async (root) => {
  const theme = currentTheme();
  const profile = save.profile!;
  const plan = planRound(theme, availableKinds(profile.firstDay));
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
  const arena = h("div", "arena");
  stage.append(arena);
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

  // Değiştirici: 2. turdan itibaren %50 olasılıkla puanlı oyunlardan birine.
  let mod: Mod | null = null;
  let modIndex = -1;
  if (dev.allGames || (profile.rounds >= MOD_FROM_ROUND && Math.random() < MOD_CHANCE)) {
    mod = MODS[Math.floor(Math.random() * MODS.length)];
    modIndex = Math.floor(Math.random() * Math.min(queue.length, SCORED_PER_ROUND));
  }

  const renderDots = (activeIdx: number, total: number) => {
    dots.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = h("span", "dot" + (i < activeIdx ? " done" : i === activeIdx ? " active" : ""));
      d.textContent = i < queue.length ? GAME_ICONS[queue[i].kind] : i === total - 1 ? GAME_ICONS.echo : "🔁";
      if (i === modIndex && mod) d.classList.add("modded");
      dots.append(d);
    }
  };

  const floatText = (text: string) => {
    const f = h("div", "float", text);
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

  // ---- Değiştirici uygulama ----
  let activeMod: Mod | null = null;
  let promptStart = 0;
  let fastBar: HTMLElement | null = null;
  let darkOverlay: HTMLElement | null = null;
  const observer = new MutationObserver(() => {
    if (activeMod !== "fast" || !fastBar) return;
    promptStart = performance.now();
    fastBar.classList.remove("run");
    void fastBar.offsetWidth;
    fastBar.classList.add("run");
  });
  const onPointer = (e: PointerEvent) => {
    if (!darkOverlay) return;
    const r = stage.getBoundingClientRect();
    darkOverlay.style.setProperty("--x", `${e.clientX - r.left}px`);
    darkOverlay.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const applyMod = async (m: Mod) => {
    activeMod = m;
    stage.classList.add(`mod-${m}`);
    const badge = h("div", "mod-badge pop", MOD_ICON[m]);
    stage.append(badge);
    sfx.win();
    if (m === "fast") {
      fastBar = h("div", "fast-bar");
      fastBar.style.setProperty("--t", `${FAST_LIMIT_MS}ms`);
      stage.append(fastBar);
      observer.observe(arena, { childList: true });
      promptStart = performance.now();
      fastBar.classList.add("run");
    } else if (m === "dark") {
      darkOverlay = h("div", "flashlight");
      stage.append(darkOverlay);
      stage.addEventListener("pointermove", onPointer);
      stage.addEventListener("pointerdown", onPointer);
    }
    await wait(700);
    badge.classList.remove("pop");
    badge.classList.add("small");
  };
  const clearMod = () => {
    if (!activeMod) return;
    stage.classList.remove(`mod-${activeMod}`);
    stage.querySelectorAll(".mod-badge, .fast-bar, .flashlight").forEach((el) => el.remove());
    observer.disconnect();
    stage.removeEventListener("pointermove", onPointer);
    stage.removeEventListener("pointerdown", onPointer);
    fastBar = null;
    darkOverlay = null;
    activeMod = null;
  };

  const makeCtx = (targets: Word[]): GameContext => ({
    root: arena,
    theme,
    targets,
    answer(word, correct, rtMs, mode) {
      const p = ensureProgress(word.id);
      const before = stageOf(p);
      const avgBefore = profile.avgRt;
      applyAnswer(p, correct, rtMs, mode, avgBefore);
      const trackable = rtMs < 60_000; // çizim gibi hızsız oyunlar ortalamayı bozmasın
      if (correct && trackable) profile.avgRt = avgBefore ? Math.round(avgBefore * 0.8 + rtMs * 0.2) : Math.round(rtMs);
      if (!correct) missed.set(word.id, word);
      const { points, mult } = rs.answer(correct, rtMs, avgBefore);
      let extra = 0;
      if (correct && activeMod === "fast" && performance.now() - promptStart <= FAST_LIMIT_MS) {
        extra = FAST_BONUS;
        rs.score += extra;
      }
      scoreEl.textContent = String(rs.score);
      scoreEl.classList.remove("pop");
      void scoreEl.offsetWidth;
      if (correct) {
        scoreEl.classList.add("pop");
        floatText((mult > 1 ? `+${points} ×${mult}` : `+${points}`) + (extra ? ` 🐇+${extra}` : ""));
      }
      comboEl.textContent = rs.combo >= 3 ? `🔥×${rs.multiplier}` : "";
      const after = stageOf(p);
      if (before !== after && (after === "known" || after === "master")) {
        newlyKnown++;
        void hatch(word);
      }
    },
  });

  // ---- Puanlı oyunlar ----
  let i = 0;
  while (i < queue.length) {
    if (aborted) return;
    renderDots(i, queue.length + 1);
    const { kind, targets } = queue[i];
    if (i === modIndex && mod) await applyMod(mod);
    await GAMES[kind](makeCtx(targets));
    clearMod();
    i++;
    if (i === SCORED_PER_ROUND && missed.size > 0) {
      // Yanlış cevaplananlar aynı turun sonunda bir kez daha sorulur.
      const review = [...missed.values()].slice(0, 3);
      const kind: GameKind = review.every((w) => w.modes.includes("listen")) ? "listenTap" : "readTap";
      queue.push({ kind, targets: review });
    }
  }
  if (aborted) return;

  // ---- Yankı Mağarası (puansız) ----
  renderDots(queue.length, queue.length + 1);
  await GAMES.echo(makeCtx(plan.targets));
  if (aborted) return;

  // ---- Tur sonu ----
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
