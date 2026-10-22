import { get, set, del, keys } from "idb-keyval";
import type { SaveData, WordProgress, Stage, Theme } from "./types";
import { stageOf } from "./srs";
import { themes, UNLOCK_RATIO } from "./content";

const KEY = "pofuduk.save.v1";
const REC_PREFIX = "pofuduk.rec.";

export const MAX_SESSIONS_PER_DAY = 3;
export const ROUNDS_PER_SESSION = 3;

export function todayKey(d = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Haftanın pazartesi tarihi. */
export function weekKey(d = new Date()): string {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return todayKey(x);
}

function defaultSave(): SaveData {
  return {
    version: 1,
    profile: null,
    words: {},
    day: { date: todayKey(), sessions: 0, roundsInSession: 0, playedMs: 0 },
    settings: { dailyMinutes: 0 },
    week: { key: weekKey(), knownAtStart: 0 },
    echoStamps: [],
    currentTheme: "theme1",
  };
}

/** Seçili tema; kayıt bozuksa ilk temaya düşer. */
export function currentTheme(): Theme {
  return themes.find((t) => t.id === save.currentTheme) ?? themes[0];
}

export function knownRatio(themeId: string): number {
  const t = themes.find((x) => x.id === themeId);
  if (!t || t.words.length === 0) return 0;
  const c = stageCounts(themeId);
  return (c.known + c.master) / t.words.length;
}

/** Ada i açık mı? İlk ada her zaman açık; diğerleri bir önceki ada %70'e ulaşınca. */
export function isUnlocked(index: number): boolean {
  for (let i = 0; i < index; i++) {
    if (knownRatio(themes[i].id) < UNLOCK_RATIO) return false;
  }
  return index < themes.length;
}

export const save: SaveData = defaultSave();

export async function load(): Promise<void> {
  try {
    const data = await get<SaveData>(KEY);
    if (data && data.version === 1) Object.assign(save, defaultSave(), data);
  } catch (e) {
    console.warn("load failed", e);
  }
  rollDay();
  rollWeek();
}

export async function persist(): Promise<void> {
  try {
    await set(KEY, JSON.parse(JSON.stringify(save)));
  } catch (e) {
    console.warn("persist failed", e);
  }
}

export async function resetAll(): Promise<void> {
  Object.assign(save, defaultSave());
  try {
    for (const k of await keys()) {
      if (typeof k === "string" && k.startsWith(REC_PREFIX)) await del(k);
    }
  } catch {
    /* ignore */
  }
  await persist();
}

export function rollDay(): void {
  const t = todayKey();
  if (save.day.date !== t) save.day = { date: t, sessions: 0, roundsInSession: 0, playedMs: 0 };
}

export function rollWeek(): void {
  const k = weekKey();
  if (save.week.key !== k) save.week = { key: k, knownAtStart: countKnown() };
}

export function getProgress(id: string): WordProgress | undefined {
  return save.words[id];
}

export function ensureProgress(id: string): WordProgress {
  let p = save.words[id];
  if (!p) {
    p = { id, correct: 0, wrong: 0, streak: 0, days: [], modes: [], due: 0, lastSeen: 0 };
    save.words[id] = p;
  }
  return p;
}

export function stageCounts(themeId: string): Record<Stage, number> {
  const t = themes.find((x) => x.id === themeId);
  const c: Record<Stage, number> = { new: 0, familiar: 0, known: 0, master: 0 };
  if (!t) return c;
  for (const w of t.words) c[stageOf(getProgress(w.id))]++;
  return c;
}

export function countKnown(): number {
  let n = 0;
  for (const t of themes) {
    const c = stageCounts(t.id);
    n += c.known + c.master;
  }
  return n;
}

export type PlayBlock = "sessions" | "time" | null;

/** Günlük oturum ve süre sınırı kontrolü. */
export function playBlock(): PlayBlock {
  rollDay();
  if (save.day.sessions >= MAX_SESSIONS_PER_DAY) return "sessions";
  const lim = save.settings.dailyMinutes;
  if (lim > 0 && save.day.playedMs >= lim * 60_000) return "time";
  return null;
}

export async function saveRecording(id: string, blob: Blob): Promise<void> {
  try {
    await set(REC_PREFIX + id, blob);
  } catch (e) {
    console.warn("recording not saved", e);
  }
}

export async function getRecording(id: string): Promise<Blob | undefined> {
  try {
    return await get<Blob>(REC_PREFIX + id);
  } catch {
    return undefined;
  }
}
