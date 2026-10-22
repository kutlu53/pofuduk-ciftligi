import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { summary, type RoundResult } from "./summary";
import { h, shuffle, wait } from "../games/common";
import { addLog, currentTheme, ensureProgress, getProgress, persist, save, todayKey } from "../core/store";
import { applyAnswer, stageOf } from "../core/srs";
import { RoundScore, stars } from "../core/scoring";
import { availableKinds, dev, GAME_ICONS, pickTargets, planRound, SCORED_PER_ROUND, type GameKind } from "../core/round";
import { THEME_ICONS, themes } from "../core/content";
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

/** Ada patronu: bilinen sözcüklerle 5 hızlı oyun; doğruluk ≥ %75 ise geçilir. */
const BOSS_ORDER: GameKind[] = ["listenTap", "readTap", "swipe", "listenTap", "readTap"];
const BOSS_PASS = 0.75;

function bossTargets(theme: ReturnType<typeof currentTheme>): Word[] {
  const known = shuffle(
    theme.words.filter((w) => w.modes.includes("listen") && ["known", "master"].includes(stageOf(getProgress(w.id)))),
  );
  const t = known.slice(0, 6);
  for (const w of pickTargets(theme)) {
    if (t.length >= 6) break;
    if (!t.includes(w)) t.push(w);
  }
  return t;
}

/** Normal tur veya ada patronu turu. */
function makeRound(boss: boolean): Screen {
  return async (root) => {
    const theme = currentTheme();
    const profile = save.profile!;
    const plan = boss
      ? { targets: bossTargets(theme), order: [...BOSS_ORDER] }
      : planRound(theme, availableKinds(profile.firstDay));
    const rs = new RoundScore();
    const missed = new Map<string, Word>();
    let newlyKnown = 0;
    const startMs = Date.now();
    let aborted = false;

    const wrap = h("div", "screen round" + (boss ? " boss" : ""));
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

    // Değiştirici: 2. turdan itibaren %50 olasılıkla puanlı oyunlardan birine. Patronda hepsi 🐇.
    let mod: Mod | null = null;
    let modIndex = -1;
    if (!boss && (dev.allGames || (profile.rounds >= MOD_FROM_ROUND && Math.random() < MOD_CHANCE))) {
      mod = MODS[Math.floor(Math.random() * MODS.length)];
      modIndex = Math.floor(Math.random() * Math.min(queue.length, SCORED_PER_ROUND));
    }

    const renderDots = (activeIdx: number, total: number) => {
      dots.innerHTML = "";
      dots.classList.toggle("many", total > 6);
      for (let i = 0; i < total; i++) {
        const d = h("span", "dot" + (i < activeIdx ? " done" : i === activeIdx ? " active" : ""));
        d.textContent = i < queue.length ? GAME_ICONS[queue[i].kind] : i === total - 1 && !boss ? GAME_ICONS.echo : "🔁";
        if ((i === modIndex && mod) || boss) d.classList.add("modded");
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
    const applyMod = async (m: Mod, quiet = false) => {
      activeMod = m;
      stage.classList.add(`mod-${m}`);
      const badge = h("div", "mod-badge" + (quiet ? " small" : " pop"), MOD_ICON[m]);
      stage.append(badge);
      if (!quiet) sfx.win();
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
      if (!quiet) {
        await wait(700);
        badge.classList.remove("pop");
        badge.classList.add("small");
      }
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

    // ---- Patron girişi ----
    if (boss) {
      const idx = Math.max(0, themes.indexOf(theme));
      const intro = h("div", "boss-intro", `<span class="boss-crown">👑</span><span class="boss-island">${THEME_ICONS[idx]}</span>`);
      stage.append(intro);
      sfx.win();
      await wait(1400);
      intro.classList.add("fade");
      await wait(300);
      intro.remove();
    }

    // ---- Puanlı oyunlar ----
    let i = 0;
    while (i < queue.length) {
      if (aborted) return;
      renderDots(i, queue.length + (boss ? 0 : 1));
      const { kind, targets } = queue[i];
      if (boss) await applyMod("fast", i > 0);
      else if (i === modIndex && mod) await applyMod(mod);
      await GAMES[kind](makeCtx(targets));
      clearMod();
      i++;
      if (!boss && i === SCORED_PER_ROUND && missed.size > 0) {
        // Yanlış cevaplananlar aynı turun sonunda bir kez daha sorulur; en son görülen en sona.
        const review = [...missed.values()]
          .sort((a, b) => (getProgress(a.id)?.lastSeen ?? 0) - (getProgress(b.id)?.lastSeen ?? 0))
          .slice(0, 3);
        const kind: GameKind = review.every((w) => w.modes.includes("listen")) ? "listenTap" : "readTap";
        queue.push({ kind, targets: review });
      }
    }
    if (aborted) return;

    // ---- Yankı Mağarası (puansız; patronda yok) ----
    if (!boss) {
      renderDots(queue.length, queue.length + 1);
      await GAMES.echo(makeCtx(plan.targets));
      if (aborted) return;
    }

    // ---- Tur sonu ----
    save.day.playedMs += Date.now() - startMs;
    save.day.roundsInSession++;
    profile.rounds++;
    const prevBest = profile.bestScore;
    const isRecord = rs.score > prevBest;
    if (isRecord) profile.bestScore = rs.score;
    let bossWon: boolean | undefined;
    if (boss) {
      bossWon = rs.accuracy >= BOSS_PASS;
      if (bossWon && !save.bosses.includes(theme.id)) save.bosses.push(theme.id);
    }
    addLog({
      d: todayKey(),
      theme: theme.id,
      score: rs.score,
      stars: stars(rs.accuracy),
      acc: Math.round(rs.accuracy * 100) / 100,
      sec: Math.round((Date.now() - startMs) / 1000),
      ...(boss ? { boss: true } : {}),
    });
    await persist();

    const result: RoundResult = {
      score: rs.score,
      stars: stars(rs.accuracy),
      accuracy: rs.accuracy,
      prevBest,
      isRecord,
      newlyKnown,
      boss,
      bossWon,
    };
    go((r) => summary(r, result));
  };
}

export const roundScreen: Screen = makeRound(false);
export const bossScreen: Screen = makeRound(true);
