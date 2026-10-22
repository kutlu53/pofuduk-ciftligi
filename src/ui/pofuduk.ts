import type { Stage } from "../core/types";

function hash(s: string): number {
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) {
    x ^= s.charCodeAt(i);
    x = Math.imul(x, 16777619);
  }
  return Math.abs(x);
}

/** Sözcük kimliğinden deterministik renkli pofuduk (SVG). Aşamaya göre yumurta → yavru → pofuduk → taçlı. */
export function pofudukSvg(seed: string, stage: Stage, emoji?: string): string {
  const hue = hash(seed) % 360;
  const body = `hsl(${hue} 75% 72%)`;
  const dark = `hsl(${hue} 55% 45%)`;
  const cheek = `hsl(${(hue + 330) % 360} 80% 75%)`;

  if (stage === "new") {
    return `<svg viewBox="0 0 100 100" class="pofuduk stage-new">
      <path d="M50 12 C72 12 84 40 84 60 C84 80 70 92 50 92 C30 92 16 80 16 60 C16 40 28 12 50 12Z" fill="#e9e4da" stroke="#c9c1b3" stroke-width="3" stroke-dasharray="6 5"/>
      <text x="50" y="64" text-anchor="middle" font-size="30" fill="#b7ae9e">?</text>
    </svg>`;
  }
  if (stage === "familiar") {
    return `<svg viewBox="0 0 100 100" class="pofuduk stage-familiar">
      <path d="M50 12 C72 12 84 40 84 60 C84 80 70 92 50 92 C30 92 16 80 16 60 C16 40 28 12 50 12Z" fill="${body}" stroke="${dark}" stroke-width="3"/>
      <path d="M22 58 L34 50 L42 60 L54 48 L64 60 L76 52" fill="none" stroke="${dark}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="42" cy="70" r="5" fill="#fff"/><circle cx="58" cy="70" r="5" fill="#fff"/>
      <circle cx="43" cy="71" r="2.5" fill="#222"/><circle cx="59" cy="71" r="2.5" fill="#222"/>
    </svg>`;
  }
  const crown =
    stage === "master"
      ? `<path d="M32 22 L40 8 L50 20 L60 8 L68 22 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2.5" stroke-linejoin="round"/>
         <circle cx="40" cy="9" r="2.5" fill="#ff6b6b"/><circle cx="60" cy="9" r="2.5" fill="#ff6b6b"/>`
      : "";
  const item = emoji ? `<text x="78" y="88" text-anchor="middle" font-size="22">${emoji}</text>` : "";
  return `<svg viewBox="0 0 100 100" class="pofuduk stage-${stage}">
    ${crown}
    <g fill="${body}" stroke="${dark}" stroke-width="2.5">
      <circle cx="28" cy="48" r="14"/><circle cx="72" cy="48" r="14"/>
      <circle cx="34" cy="78" r="14"/><circle cx="66" cy="78" r="14"/>
      <circle cx="50" cy="34" r="15"/>
      <ellipse cx="50" cy="60" rx="30" ry="28" stroke="none"/>
    </g>
    <circle cx="40" cy="56" r="7" fill="#fff"/><circle cx="60" cy="56" r="7" fill="#fff"/>
    <circle cx="41" cy="57" r="3.5" fill="#222"/><circle cx="61" cy="57" r="3.5" fill="#222"/>
    <circle cx="30" cy="66" r="5" fill="${cheek}" opacity=".8"/><circle cx="70" cy="66" r="5" fill="${cheek}" opacity=".8"/>
    <path d="M42 70 q8 7 16 0" stroke="#222" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    ${item}
  </svg>`;
}
