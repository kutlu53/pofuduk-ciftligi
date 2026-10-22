import type { Mode, Theme, Word } from "../core/types";

export interface GameContext {
  /** Oyunun çizileceği alan; oyun bunu temizleyip kendi içeriğini koyar. */
  root: HTMLElement;
  theme: Theme;
  /** Bu turun hedef sözcükleri. */
  targets: Word[];
  /** Her cevapta çağrılır (puan, ilerleme, HUD). */
  answer(word: Word, correct: boolean, rtMs: number, mode: Mode): void;
}

export type Game = (ctx: GameContext) => Promise<void>;
