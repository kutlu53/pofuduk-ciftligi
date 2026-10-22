export type Mode = "listen" | "read" | "match" | "spell" | "say";

/** Sözcük görseli tarifi; src/art çizer. Yoksa `emoji` tek başına kullanılır. */
export type Art =
  | { kind: "emoji"; e?: string }
  | { kind: "combo"; main: string; badge: string }
  | { kind: "group"; e: string | string[]; n?: number }
  | { kind: "body"; part: string }
  | { kind: "family"; who: string }
  | { kind: "color"; hex: string; badge?: string }
  | { kind: "month"; n: number; badge: string }
  | { kind: "room"; items: string[] }
  | { kind: "draw"; name: string; badge?: string };

export interface Word {
  id: string;
  en: string;
  tr: string;
  cat: string;
  modes: Mode[];
  /** Basit görsel; `art` yoksa tek başına çizilir. Koleksiyonda pofuduğun elindeki nesne olarak da kullanılır. */
  emoji?: string;
  art?: Art;
  asset: { img: string | null; audio: string | null };
}

export interface Chunk {
  id: string;
  en: string;
  tr: string;
  skills: string[];
}

export interface Theme {
  id: string;
  grade: number;
  title_en: string;
  title_tr: string;
  program_url: string;
  subthemes: string[];
  words: Word[];
  chunks: Chunk[];
  social: { en: string; tr: string }[];
  phonics: string[];
  performance: { title_tr: string; steps_tr: string[] };
  outcome_tags: string[];
}

/** Yeni → Tanıdık → Bildim → Usta */
export type Stage = "new" | "familiar" | "known" | "master";

export interface WordProgress {
  id: string;
  correct: number;
  wrong: number;
  streak: number;
  /** Doğru cevap verilen farklı günler (YYYY-MM-DD). */
  days: string[];
  /** Doğru cevap verilen farklı modlar. */
  modes: Mode[];
  /** Bir sonraki tekrar zamanı (ms). */
  due: number;
  lastSeen: number;
}

export interface Profile {
  name: string;
  avatar: string;
  /** İlk oyun günü (YYYY-MM-DD); haftalık açılan oyun türleri buna göre. */
  firstDay: string;
  /** Çocuğun kendi ortalama tepki süresi (ms, üstel ortalama). 0 = henüz yok. */
  avgRt: number;
  bestScore: number;
  rounds: number;
  emotions: { date: string; emoji: string }[];
}

export interface DayStats {
  date: string;
  sessions: number;
  roundsInSession: number;
  playedMs: number;
}

export interface Settings {
  /** 0 = sınırsız */
  dailyMinutes: number;
}

export interface SaveData {
  version: 1;
  profile: Profile | null;
  words: Record<string, WordProgress>;
  day: DayStats;
  settings: Settings;
  week: { key: string; knownAtStart: number };
  echoStamps: string[];
  /** Seçili ada / tema kimliği. */
  currentTheme: string;
  /** Açılışı kutlanmış oyun türleri. */
  unlockedShown: string[];
}
