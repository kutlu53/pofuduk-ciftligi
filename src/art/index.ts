/**
 * Sözcük illüstrasyonları (SVG). Her sözcük 120×120 bir sahne:
 * kategoriye göre arka plan + emoji / birleşik emoji / çizim.
 * Çizimler platformdan bağımsız; emojiler cihazın emoji yazı tipiyle çizilir.
 */
import type { Art, Word } from "../core/types";

const CAT_BG: Record<string, string> = {
  people: "#ffe4c7",
  places: "#d8f0ff",
  birthday: "#ffd9e6",
  months: "#e6f4d7",
  verbs: "#fff1b8",
  furniture: "#efe3d2",
  objects: "#dcecff",
  devices: "#e3e0ff",
  subjects: "#ffe9c9",
  nouns: "#f1f1f1",
  colours: "#ffffff",
  weather: "#dff3ff",
  body: "#ffe3d6",
  features: "#f3e5ff",
  characters: "#fff3c4",
  clothes: "#dcf7ec",
  family: "#ffe7d1",
  routines: "#e4f0ff",
  hobbies: "#e9ffe0",
  chores: "#fff0cf",
  animals: "#e8f7d4",
  houses: "#ffe8d0",
  countryside: "#dcf5d2",
  meals: "#fff0d6",
  food: "#ffeede",
  eating_out: "#e0ecff",
};

const SKIN = "#ffd9b3";
const SKIN_STROKE = "#c48b5a";
const FONT = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-weight="700"';

function em(e: string, x: number, y: number, size: number): string {
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
}

function badge(e: string, x = 92, y = 92): string {
  return `<circle cx="${x}" cy="${y}" r="19" fill="#fff" stroke="#e6dccb" stroke-width="2"/>${em(e, x, y + 1, 24)}`;
}

/** Vurgu halkası: kırmızı-turuncu, hafif dolgu. */
function ring(shape: string): string {
  return `<g fill="rgba(255,82,82,.28)" stroke="#ff5252" stroke-width="4" stroke-linejoin="round">${shape}</g>`;
}

function wrap(cat: string, inner: string): string {
  const fill = CAT_BG[cat] ?? "#f4f1ea";
  return `<svg viewBox="0 0 120 120" class="art" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="3" width="114" height="114" rx="24" fill="${fill}"/>${inner}</svg>`;
}

/* ---------- Birleşik / grup ---------- */

function combo(main: string, b: string): string {
  return em(main, 54, 60, 60) + badge(b);
}

function group(e: string | string[], n = 2): string {
  const list = Array.isArray(e) ? e : Array.from({ length: n }, () => e);
  if (list.length <= 1) return em(list[0] ?? "❔", 60, 62, 64);
  if (list.length === 2) return em(list[0], 38, 62, 46) + em(list[1], 82, 62, 46);
  if (list.length === 3) return em(list[0], 28, 60, 36) + em(list[1], 60, 68, 40) + em(list[2], 92, 60, 36);
  return em(list[0], 38, 40, 36) + em(list[1], 82, 40, 36) + em(list[2], 38, 84, 36) + em(list[3], 82, 84, 36);
}

/* ---------- Vücut ---------- */

function figure(backView = false): string {
  const face = backView
    ? `<path d="M48 22 a12 12 0 0 1 24 0 v8 h-24z" fill="#5a3b2e"/>`
    : `<path d="M48 20 a12 12 0 0 1 24 0 v2 h-24z" fill="#5a3b2e"/><circle cx="56" cy="24" r="1.6" fill="#333"/><circle cx="64" cy="24" r="1.6" fill="#333"/><path d="M56 29 q4 3 8 0" stroke="#333" stroke-width="1.4" fill="none"/>`;
  return `
    <ellipse cx="60" cy="113" rx="34" ry="4" fill="rgba(0,0,0,.08)"/>
    <rect x="47" y="80" width="11" height="28" rx="4" fill="#5c6bc0"/><rect x="62" y="80" width="11" height="28" rx="4" fill="#5c6bc0"/>
    <ellipse cx="52" cy="110" rx="9" ry="4.5" fill="#6d4c41"/><ellipse cx="68" cy="110" rx="9" ry="4.5" fill="#6d4c41"/>
    <rect x="30" y="42" width="9" height="32" rx="4.5" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.2"/>
    <rect x="81" y="42" width="9" height="32" rx="4.5" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.2"/>
    <path d="M44 40 h32 a7 7 0 0 1 7 7 v28 a7 7 0 0 1 -7 7 h-32 a7 7 0 0 1 -7 -7 v-28 a7 7 0 0 1 7 -7z" fill="#4fc3f7"/>
    <rect x="55" y="32" width="10" height="9" rx="3" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.2"/>
    <circle cx="60" cy="22" r="12" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.5"/>
    ${face}`;
}

function faceClose(): string {
  return `
    <circle cx="60" cy="64" r="40" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="2"/>
    <path d="M22 56 a38 38 0 0 1 76 0 v-6 a38 38 0 0 0 -76 0z" fill="#5a3b2e"/>
    <path d="M24 52 q10 -22 36 -22 q26 0 36 22 q-14 -10 -36 -10 q-22 0 -36 10z" fill="#5a3b2e"/>
    <path d="M36 44 q10 -6 20 -1" stroke="#4e342e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M64 43 q10 -5 20 1" stroke="#4e342e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="46" cy="54" rx="7" ry="5" fill="#fff"/><ellipse cx="74" cy="54" rx="7" ry="5" fill="#fff"/>
    <circle cx="46" cy="55" r="3" fill="#333"/><circle cx="74" cy="55" r="3" fill="#333"/>
    <path d="M40 48 l-2 -3 M44 47 l-1 -4 M48 47 l1 -4 M52 48 l2 -3" stroke="#333" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M68 48 l-2 -3 M72 47 l-1 -4 M76 47 l1 -4 M80 48 l2 -3" stroke="#333" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M60 60 q-4 8 2 10" stroke="${SKIN_STROKE}" stroke-width="1.5" fill="none"/>
    <ellipse cx="60" cy="84" rx="15" ry="9" fill="#b71c1c"/>
    <ellipse cx="60" cy="89" rx="8" ry="4.5" fill="#ef5350"/>
    <rect x="47" y="75" width="26" height="6" rx="2" fill="#fff"/>
    <path d="M53 75 v6 M59 75 v6 M65 75 v6" stroke="#cfd8dc" stroke-width="1"/>`;
}

function handClose(): string {
  const fingers = [42, 51, 60, 69]
    .map((x, i) => `<rect x="${x}" y="${i === 1 || i === 2 ? 18 : 24}" width="8.5" height="38" rx="4.2" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.4"/>`)
    .join("");
  return `
    <rect x="40" y="48" width="40" height="44" rx="12" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.5"/>
    ${fingers}
    <rect x="22" y="52" width="9" height="30" rx="4.5" transform="rotate(-35 26 67)" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.4"/>
    <rect x="44" y="88" width="32" height="14" rx="4" fill="#4fc3f7"/>`;
}

function footClose(): string {
  const toes = [26, 38, 50, 62, 73].map((x, i) => `<circle cx="${x}" cy="${40 + i * 2}" r="${7 - i * 0.8}" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.4"/>`).join("");
  return `
    <path d="M22 50 q0 -8 10 -8 h46 q14 0 16 16 v28 q0 10 -10 10 h-48 q-10 0 -12 -12z" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="1.6"/>
    ${toes}`;
}

function body(part: string): string {
  switch (part) {
    case "foot":
      return figure() + ring(`<ellipse cx="52" cy="109" rx="12" ry="7"/>`);
    case "feet":
      return figure() + ring(`<ellipse cx="52" cy="109" rx="12" ry="7"/><ellipse cx="68" cy="109" rx="12" ry="7"/>`);
    case "neck":
      return figure() + ring(`<rect x="51" y="30" width="18" height="13" rx="5"/>`);
    case "shoulders":
      return figure() + ring(`<circle cx="42" cy="45" r="8"/><circle cx="78" cy="45" r="8"/>`);
    case "knees":
      return figure() + ring(`<circle cx="52" cy="94" r="7"/><circle cx="68" cy="94" r="7"/>`);
    case "back":
      return figure(true) + ring(`<rect x="41" y="44" width="38" height="38" rx="10"/>`);
    case "tooth":
      return faceClose() + ring(`<rect x="55" y="72" width="10" height="12" rx="3"/>`);
    case "teeth":
      return faceClose() + ring(`<rect x="44" y="72" width="32" height="12" rx="4"/>`);
    case "tongue":
      return faceClose() + ring(`<ellipse cx="60" cy="89" rx="12" ry="7"/>`);
    case "chin":
      return faceClose() + ring(`<ellipse cx="60" cy="100" rx="16" ry="6"/>`);
    case "eyebrow":
      return faceClose() + ring(`<ellipse cx="46" cy="42" rx="14" ry="6"/>`);
    case "eyelash":
      return faceClose() + ring(`<ellipse cx="46" cy="46" rx="10" ry="4"/>`);
    case "fingers":
      return handClose() + ring(`<rect x="38" y="14" width="44" height="46" rx="12"/>`);
    case "toes":
      return footClose() + ring(`<rect x="16" y="28" width="68" height="26" rx="12"/>`);
    default:
      return figure();
  }
}

/* ---------- Aile ağacı ---------- */

interface Node {
  id: string;
  x: number;
  y: number;
  e: string;
}

function family(who: string): string {
  const me = who === "grandson" ? "👦" : who === "granddaughter" ? "👧" : "🧒";
  const nodes: Node[] = [
    { id: "grandpa", x: 44, y: 18, e: "👴" },
    { id: "grandma", x: 72, y: 18, e: "👵" },
    { id: "dad", x: 20, y: 60, e: "👨" },
    { id: "mum", x: 46, y: 60, e: "👩" },
    { id: "aunt", x: 76, y: 60, e: "👩‍🦱" },
    { id: "uncle", x: 102, y: 60, e: "👨‍🦲" },
    { id: "me", x: 33, y: 102, e: me },
    { id: "cousin", x: 89, y: 102, e: "🧒" },
  ];
  const hl: Record<string, string[]> = {
    parent: ["dad", "mum"],
    grandparent: ["grandpa", "grandma"],
    grandson: ["me"],
    granddaughter: ["me"],
    dad: ["dad"],
    mum: ["mum"],
    aunt: ["aunt"],
    uncle: ["uncle"],
    cousin: ["cousin"],
  };
  const on = new Set(hl[who] ?? []);
  const lines = `<g stroke="#b0a090" stroke-width="2.5" fill="none">
    <path d="M58 18 v16 M33 34 h56 M33 34 v12 M89 34 v12"/>
    <path d="M33 74 v14 M89 74 v14"/>
  </g>`;
  const circles = nodes
    .map((n) => {
      const sel = on.has(n.id);
      const r = sel ? 16 : 13;
      return `<g opacity="${sel || on.size === 0 ? 1 : 0.4}">
        <circle cx="${n.x}" cy="${n.y}" r="${r}" fill="#fff" stroke="${sel ? "#ff9800" : "#d9cbb5"}" stroke-width="${sel ? 4 : 2}"/>
        ${em(n.e, n.x, n.y + 1, sel ? 22 : 17)}
      </g>`;
    })
    .join("");
  return lines + circles;
}

/* ---------- Renk, ay, oda ---------- */

function color(hex: string, b = "🖌️"): string {
  const light = ["#fafafa", "#ffffff", "#fdd835", "#f48fb1"].includes(hex.toLowerCase());
  return `<path d="M30 40 C20 20 60 10 70 24 C90 10 110 40 96 56 C112 72 92 100 72 92 C60 112 30 104 34 84 C12 80 14 52 30 40Z" fill="${hex}" stroke="${light ? "#bdbdbd" : "rgba(0,0,0,.25)"}" stroke-width="3"/>${badge(b)}`;
}

function month(n: number, b: string): string {
  return `
    <rect x="20" y="20" width="80" height="84" rx="12" fill="#fff" stroke="#d9cbb5" stroke-width="2"/>
    <path d="M20 32 a12 12 0 0 1 12 -12 h56 a12 12 0 0 1 12 12 v10 h-80z" fill="#ef5350"/>
    <rect x="36" y="12" width="6" height="16" rx="3" fill="#78909c"/><rect x="78" y="12" width="6" height="16" rx="3" fill="#78909c"/>
    <text x="60" y="76" font-size="42" text-anchor="middle" dominant-baseline="central" fill="#37474f" ${FONT}>${n}</text>
    ${badge(b, 94, 94)}`;
}

function room(items: string[]): string {
  const base = `<rect x="12" y="14" width="96" height="66" rx="6" fill="#fff8ea" stroke="#d9cbb5" stroke-width="2"/>
    <path d="M12 80 h96 v20 a6 6 0 0 1 -6 6 h-84 a6 6 0 0 1 -6 -6z" fill="#d7b98e"/>
    <rect x="78" y="24" width="22" height="18" rx="3" fill="#bbdefb" stroke="#90a4ae" stroke-width="1.5"/>`;
  if (items.length === 1) return base + em(items[0], 60, 60, 48);
  if (items.length === 2) return base + em(items[0], 40, 62, 38) + em(items[1], 80, 64, 36);
  return base + em(items[0], 30, 58, 30) + em(items[1], 60, 68, 34) + em(items[2], 90, 60, 30);
}

/* ---------- Çizimler ---------- */

const DRAW: Record<string, string> = {
  whiteboard: `<rect x="14" y="24" width="92" height="62" rx="4" fill="#fff" stroke="#90a4ae" stroke-width="3"/>
    <path d="M26 40 q10 -8 20 0 t20 0 t20 0" stroke="#1e88e5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M26 58 h40 M26 70 h26" stroke="#e53935" stroke-width="3" stroke-linecap="round"/>
    <rect x="30" y="88" width="60" height="6" rx="3" fill="#90a4ae"/><rect x="70" y="90" width="14" height="4" rx="2" fill="#1e88e5"/>`,
  blackboard: `<rect x="14" y="22" width="92" height="64" rx="4" fill="#2e7d32" stroke="#6d4c41" stroke-width="5"/>
    <text x="60" y="56" font-size="22" text-anchor="middle" dominant-baseline="central" fill="#fff" ${FONT}>a b c</text>
    <rect x="30" y="90" width="60" height="6" rx="3" fill="#8d6e63"/><rect x="36" y="86" width="12" height="4" rx="2" fill="#fff"/>`,
  duster: `<rect x="28" y="44" width="64" height="24" rx="8" fill="#ffb74d" stroke="#ef6c00" stroke-width="2"/>
    <rect x="28" y="66" width="64" height="14" rx="4" fill="#90a4ae"/>
    <circle cx="36" cy="92" r="2" fill="#cfd8dc"/><circle cx="48" cy="96" r="2.5" fill="#cfd8dc"/><circle cx="70" cy="94" r="2" fill="#cfd8dc"/><circle cx="84" cy="90" r="1.8" fill="#cfd8dc"/>`,
  flashcard: `<rect x="26" y="18" width="68" height="84" rx="8" fill="#fff" stroke="#ffb74d" stroke-width="3"/>
    ${em("🍎", 60, 52, 36)}<rect x="40" y="80" width="40" height="6" rx="3" fill="#ffe0b2"/>`,
  card: `<rect x="34" y="16" width="52" height="88" rx="8" fill="#fff" stroke="#7e57c2" stroke-width="3"/>
    <path d="M60 36 l6 12 13 2 -9 9 2 13 -12 -6 -12 6 2 -13 -9 -9 13 -2z" fill="#7e57c2"/>
    <circle cx="44" cy="26" r="3" fill="#7e57c2"/><circle cx="76" cy="94" r="3" fill="#7e57c2"/>`,
  desk: `<rect x="16" y="58" width="88" height="12" rx="4" fill="#a1887f" stroke="#6d4c41" stroke-width="1.5"/>
    <rect x="22" y="70" width="8" height="34" rx="3" fill="#8d6e63"/><rect x="90" y="70" width="8" height="34" rx="3" fill="#8d6e63"/>
    ${em("📚", 44, 46, 22)}${em("🍎", 72, 48, 16)}`,
  chair: `<rect x="40" y="20" width="40" height="42" rx="8" fill="#8d6e63" stroke="#5d4037" stroke-width="1.5"/>
    <rect x="34" y="60" width="52" height="12" rx="4" fill="#a1887f" stroke="#5d4037" stroke-width="1.5"/>
    <rect x="38" y="72" width="6" height="32" rx="3" fill="#6d4c41"/><rect x="76" y="72" width="6" height="32" rx="3" fill="#6d4c41"/>`,
  corridor: `<polygon points="10,110 110,110 82,54 38,54" fill="#e0d3bf"/>
    <polygon points="10,10 38,54 38,110 10,110" fill="#cfd8dc"/><polygon points="110,10 82,54 82,110 110,110" fill="#cfd8dc"/>
    <rect x="38" y="54" width="44" height="56" fill="#b0bec5"/><rect x="52" y="60" width="16" height="14" rx="2" fill="#bbdefb"/>
    <polygon points="14,38 28,52 28,100 14,100" fill="#8d6e63"/><polygon points="106,38 92,52 92,100 106,100" fill="#8d6e63"/>
    <circle cx="25" cy="78" r="1.6" fill="#ffd54f"/><circle cx="95" cy="78" r="1.6" fill="#ffd54f"/>`,
  sportsfield: `<rect x="8" y="26" width="104" height="72" rx="8" fill="#66bb6a"/>
    <rect x="14" y="32" width="92" height="60" rx="4" fill="none" stroke="#fff" stroke-width="2"/>
    <path d="M60 32 v60" stroke="#fff" stroke-width="2"/><circle cx="60" cy="62" r="12" fill="none" stroke="#fff" stroke-width="2"/>
    <rect x="14" y="50" width="10" height="24" fill="none" stroke="#fff" stroke-width="2"/><rect x="96" y="50" width="10" height="24" fill="none" stroke="#fff" stroke-width="2"/>
    ${em("⚽", 60, 62, 18)}`,
  field: `<rect x="8" y="30" width="104" height="70" rx="10" fill="#9ccc65"/>
    <path d="M16 50 q44 -8 88 0 M16 66 q44 -8 88 0 M16 82 q44 -8 88 0" stroke="#795548" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${em("🌱", 30, 44, 16)}${em("🌱", 60, 60, 16)}${em("🌱", 90, 76, 16)}${em("☀️", 100, 20, 18)}`,
  toast: `<path d="M22 44 q0 -16 16 -14 q10 -8 20 0 q16 -2 16 14 v46 a6 6 0 0 1 -6 6 h-40 a6 6 0 0 1 -6 -6z" fill="#d7a86e" stroke="#8d5a2b" stroke-width="2.5"/>
    <path d="M30 56 h40 M30 70 h40 M30 84 h40" stroke="#8d5a2b" stroke-width="3" stroke-linecap="round" opacity=".7"/>
    <rect x="52" y="60" width="18" height="14" rx="3" fill="#fff176" stroke="#f9a825" stroke-width="1.5"/>
    <path d="M60 96 q22 0 30 -10" stroke="#8d5a2b" stroke-width="2" fill="none" opacity=".5"/>`,
  iron: `<rect x="10" y="84" width="100" height="10" rx="5" fill="#ef9a9a" stroke="#c62828" stroke-width="1.5"/>
    <rect x="22" y="94" width="6" height="14" fill="#90a4ae"/><rect x="92" y="94" width="6" height="14" fill="#90a4ae"/>
    <path d="M28 82 q0 -22 26 -22 h30 a8 8 0 0 1 8 8 v8 a6 6 0 0 1 -6 6z" fill="#90a4ae" stroke="#455a64" stroke-width="2"/>
    <path d="M50 60 q-2 -14 14 -14 h16 q8 0 8 8 v6" fill="none" stroke="#455a64" stroke-width="6" stroke-linecap="round"/>
    <circle cx="80" cy="70" r="3" fill="#ef5350"/>
    <path d="M36 50 q4 -6 0 -12 M44 48 q4 -6 0 -12" stroke="#b0bec5" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  bed: `<rect x="16" y="26" width="88" height="24" rx="8" fill="#8d6e63" stroke="#5d4037" stroke-width="1.5"/>
    <rect x="16" y="48" width="88" height="40" rx="6" fill="#fff" stroke="#b0bec5" stroke-width="2"/>
    <rect x="22" y="52" width="30" height="16" rx="6" fill="#e3f2fd" stroke="#90caf9" stroke-width="1.5"/>
    <path d="M16 68 h88 v14 a6 6 0 0 1 -6 6 h-76 a6 6 0 0 1 -6 -6z" fill="#ef5350"/>
    <rect x="20" y="88" width="8" height="16" rx="3" fill="#6d4c41"/><rect x="92" y="88" width="8" height="16" rx="3" fill="#6d4c41"/>`,
  jumper: `<path d="M40 30 l-18 10 -6 22 14 4 2 -8 v42 a4 4 0 0 0 4 4 h48 a4 4 0 0 0 4 -4 v-42 l2 8 14 -4 -6 -22 -18 -10 q-20 10 -40 0z" fill="#ef6c00" stroke="#bf360c" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M42 30 q18 12 36 0" fill="none" stroke="#ffe0b2" stroke-width="3"/>
    <path d="M36 96 h48 M36 92 h48" stroke="#bf360c" stroke-width="1.5"/>
    <path d="M24 60 h10 M86 60 h10" stroke="#bf360c" stroke-width="1.5"/>`,
  skirt: `<path d="M38 34 h44 l16 62 a6 6 0 0 1 -6 6 h-64 a6 6 0 0 1 -6 -6z" fill="#ec407a" stroke="#ad1457" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 34 l-10 68 M60 34 v68 M70 34 l10 68" stroke="#ad1457" stroke-width="1.5" opacity=".6"/>
    <rect x="36" y="28" width="48" height="10" rx="4" fill="#ad1457"/>`,
  coat: `<path d="M44 20 l-16 8 -6 26 12 2 v50 a4 4 0 0 0 4 4 h44 a4 4 0 0 0 4 -4 v-50 l12 -2 -6 -26 -16 -8 -8 10 h-16z" fill="#5d4037" stroke="#3e2723" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M52 30 l8 12 8 -12" fill="#3e2723"/>
    <circle cx="60" cy="56" r="2.6" fill="#d7ccc8"/><circle cx="60" cy="70" r="2.6" fill="#d7ccc8"/><circle cx="60" cy="84" r="2.6" fill="#d7ccc8"/>
    <path d="M60 46 v62" stroke="#3e2723" stroke-width="1.5"/>`,
  hoodie: `<path d="M42 34 l-18 8 -6 22 14 4 2 -8 v40 a4 4 0 0 0 4 4 h44 a4 4 0 0 0 4 -4 v-40 l2 8 14 -4 -6 -22 -18 -8z" fill="#42a5f5" stroke="#1565c0" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M42 34 q-2 -20 18 -20 q20 0 18 20 q-18 8 -36 0z" fill="#1e88e5" stroke="#1565c0" stroke-width="2.5"/>
    <path d="M54 40 v14 M66 40 v14" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="42" y="74" width="36" height="18" rx="5" fill="none" stroke="#1565c0" stroke-width="2.5"/>`,
  restaurant: `<rect x="14" y="44" width="92" height="56" rx="4" fill="#ffe0b2" stroke="#8d6e63" stroke-width="2.5"/>
    <path d="M10 44 h100 v-10 q0 -6 -6 -6 h-88 q-6 0 -6 6z" fill="#e53935"/>
    <path d="M22 28 v16 M38 28 v16 M54 28 v16 M70 28 v16 M86 28 v16" stroke="#fff" stroke-width="6"/>
    <rect x="50" y="68" width="20" height="32" rx="2" fill="#8d6e63"/><circle cx="66" cy="84" r="1.8" fill="#ffd54f"/>
    <rect x="22" y="56" width="20" height="18" rx="2" fill="#bbdefb" stroke="#90a4ae" stroke-width="1.5"/><rect x="78" y="56" width="20" height="18" rx="2" fill="#bbdefb" stroke="#90a4ae" stroke-width="1.5"/>
    ${em("🍽️", 60, 14, 16)}`,
  hair_blond: `<circle cx="60" cy="66" r="32" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="2"/>
    <path d="M28 62 q0 -34 32 -34 q32 0 32 34 q-6 -16 -22 -14 q-8 -8 -16 0 q-12 -4 -26 14z" fill="#fdd835" stroke="#f9a825" stroke-width="2"/>
    <circle cx="48" cy="66" r="3" fill="#333"/><circle cx="72" cy="66" r="3" fill="#333"/><path d="M50 80 q10 8 20 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  hair_curly: `<circle cx="60" cy="68" r="30" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="2"/>
    <g fill="#4e342e" stroke="#3e2723" stroke-width="1.5">
      <circle cx="32" cy="56" r="9"/><circle cx="40" cy="42" r="9"/><circle cx="52" cy="34" r="9"/><circle cx="66" cy="33" r="9"/><circle cx="79" cy="40" r="9"/><circle cx="88" cy="54" r="9"/><circle cx="28" cy="70" r="8"/><circle cx="92" cy="70" r="8"/>
    </g>
    <circle cx="49" cy="68" r="3" fill="#333"/><circle cx="71" cy="68" r="3" fill="#333"/><path d="M50 82 q10 8 20 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  hair_straight: `<path d="M30 60 q0 -32 30 -32 q30 0 30 32 v44 h-12 v-30 q-18 -10 -36 0 v30 h-12z" fill="#6d4c41" stroke="#4e342e" stroke-width="2"/>
    <circle cx="60" cy="68" r="27" fill="${SKIN}" stroke="${SKIN_STROKE}" stroke-width="2"/>
    <path d="M34 60 q6 -20 26 -20 q20 0 26 20 q-10 -10 -26 -8 q-16 -2 -26 8z" fill="#6d4c41"/>
    <circle cx="50" cy="68" r="3" fill="#333"/><circle cx="70" cy="68" r="3" fill="#333"/><path d="M50 82 q10 8 20 0" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  little: `${em("🐻", 42, 58, 66)}${em("🐻", 94, 90, 24)}<circle cx="94" cy="90" r="19" fill="none" stroke="#ff9800" stroke-width="4"/>`,
  letter: `<rect x="28" y="28" width="64" height="64" rx="14" fill="#fff" stroke="#42a5f5" stroke-width="4"/>
    <text x="60" y="62" font-size="46" text-anchor="middle" dominant-baseline="central" fill="#1565c0" ${FONT}>A</text>`,
  word: `<g>${["c", "a", "t"].map((l, i) => `<rect x="${22 + i * 28}" y="42" width="24" height="34" rx="6" fill="#fff" stroke="#42a5f5" stroke-width="3"/><text x="${34 + i * 28}" y="60" font-size="22" text-anchor="middle" dominant-baseline="central" fill="#1565c0" ${FONT}>${l}</text>`).join("")}</g>
    ${em("🐱", 60, 96, 20)}`,
  point: `<path d="M60 18 l12 24 26 4 -19 18 5 26 -24 -13 -24 13 5 -26 -19 -18 26 -4z" fill="#fdd835" stroke="#f9a825" stroke-width="3" stroke-linejoin="round"/>
    <text x="60" y="64" font-size="26" text-anchor="middle" dominant-baseline="central" fill="#e65100" ${FONT}>+1</text>`,
  village: `<path d="M10 100 h100" stroke="#8bc34a" stroke-width="8" stroke-linecap="round"/>
    <path d="M18 70 l16 -16 16 16 v28 h-32z" fill="#ffcc80" stroke="#8d6e63" stroke-width="2"/><rect x="29" y="82" width="10" height="16" fill="#8d6e63"/>
    <path d="M54 62 l14 -14 14 14 v36 h-28z" fill="#fff3e0" stroke="#8d6e63" stroke-width="2"/><rect x="63" y="82" width="10" height="16" fill="#8d6e63"/><rect x="60" y="68" width="8" height="8" fill="#bbdefb"/>
    <path d="M84 72 l12 -12 12 12 v26 h-24z" fill="#ffe0b2" stroke="#8d6e63" stroke-width="2"/><rect x="92" y="84" width="8" height="14" fill="#8d6e63"/>
    ${em("🌳", 14, 86, 16)}${em("☀️", 100, 22, 20)}`,
};

/* ---------- Giriş noktası ---------- */

function render(art: Art, fallback: string): string {
  switch (art.kind) {
    case "emoji":
      return em(art.e ?? fallback, 60, 62, 64);
    case "combo":
      return combo(art.main, art.badge);
    case "group":
      return group(art.e, art.n);
    case "body":
      return body(art.part);
    case "family":
      return family(art.who);
    case "color":
      return color(art.hex, art.badge);
    case "month":
      return month(art.n, art.badge);
    case "room":
      return room(art.items);
    case "draw":
      return (DRAW[art.name] ?? em(fallback, 60, 62, 64)) + (art.badge ? badge(art.badge) : "");
  }
}

/** Sözcüğün illüstrasyonu (inline SVG). */
export function artSvg(w: Word): string {
  const fallback = w.emoji ?? "❔";
  const art: Art = w.art ?? { kind: "emoji", e: fallback };
  return wrap(w.cat, render(art, fallback));
}
