// play.mjs zaman çizelgesini çocuk gözüyle analiz eder: ses gecikmeleri, seçenek sorunları, tekrarlar.
// Kullanım: node tools/play_report.mjs <klasör>/timeline.json
import { readFileSync } from "node:fs";

const log = JSON.parse(readFileSync(process.argv[2], "utf8"));
const out = [];
const warn = (s) => out.push("⚠ " + s);
const info = (s) => out.push("  " + s);

const voices = log.filter((e) => e.type === "voices").map((e) => e.n);
info(`TTS ses sayısı: ${voices.join(" → ") || "yok"}`);
const ttsErr = log.filter((e) => e.type === "tts-error");
if (ttsErr.length) warn(`${ttsErr.length} TTS hatası (ör. ${ttsErr[0].err})`);

const renders = log.filter((e) => e.type === "render");
info(`${renders.length} soru/ekran çizimi`);
let prevTarget = null;
let roundTargets = new Map();
let lastRoundStart = 0;
for (let i = 0; i < log.length; i++) {
  const e = log[i];
  if (e.type === "round-start") { roundTargets = new Map(); lastRoundStart = e.t; prevTarget = null; info(`--- ${e.label} ---`); continue; }
  if (e.type !== "render") continue;
  // Ses çağrısı aynı JS adımında, çizim kaydından hemen önce gelir: pencereyi 150 ms geriden başlat.
  const next = log.slice(i + 1).find((x) => x.type === "render");
  const endIdx = next ? log.indexOf(next) : log.length;
  const startIdx = log.findIndex((x, k) => k < i && x.t >= e.t - 150) ;
  const window_ = log.slice(startIdx >= 0 ? startIdx : i, endIdx).filter((x) => x.type !== "render");
  const tts = window_.find((x) => x.type === "tts");
  const ttsStart = tts && window_.find((x) => x.type === "tts-start" && x.text === tts.text);
  const ttsEnd = tts && window_.find((x) => (x.type === "tts-end" || x.type === "tts-error") && x.text === tts.text);
  const tap = window_.find((x) => x.type === "tap" && x.t >= e.t);
  const sfxN = window_.filter((x) => x.type === "sfx" && x.t >= e.t).length;
  const label = `${e.icon} ${e.target ?? e.text ?? e.chips?.join("/") ?? e.tiles ?? ""}`;
  const parts = [];
  if (tts) parts.push(`ses +${tts.t - e.t}ms "${tts.text}"${ttsStart ? ` başladı +${ttsStart.t - e.t}` : " (başlamadı)"}${ttsEnd ? ` bitti +${ttsEnd.t - e.t}` : ""}`);
  else parts.push("otomatik ses yok");
  if (tap) parts.push(`dokunma +${tap.t - e.t}ms${tap.wrong ? " (yanlış)" : ""}`);
  parts.push(`efekt ${sfxN}`);
  if (e.mod) parts.push(`değiştirici ${e.mod}`);
  info(`${label}: ${parts.join(" · ")}`);

  // Seçenek kontrolleri
  if (e.options?.length) {
    if (e.target && !e.options.includes(e.target)) warn(`${label}: hedef seçeneklerde yok!`);
    if (new Set(e.options).size !== e.options.length) warn(`${label}: aynı sözcük iki kez seçenek`);
    if (new Set(e.optionArt).size !== e.optionArt.length) warn(`${label}: iki seçenek görsel olarak aynı görünüyor`);
    if (e.options.length !== 4) warn(`${label}: ${e.options.length} seçenek (4 bekleniyor)`);
  }
  if (e.zones?.length && e.chips?.length && e.zones.length !== e.chips.length) warn(`${label}: etiket/kutu sayısı farklı`);
  if (e.target) {
    if (e.target === prevTarget) warn(`${label}: aynı hedef arka arkaya`);
    roundTargets.set(e.target, (roundTargets.get(e.target) ?? 0) + 1);
  }
  prevTarget = e.target ?? prevTarget;
  if (e.icon === "👂" && !tts) warn(`${label}: dinleme sorusunda ses çalmadı`);
  if (e.icon === "👀" && tts && tts.t - e.t < 300) warn(`${label}: okuma sorusunda cevaptan önce ses çaldı`);
  if (tts && tts.t - e.t > 800) warn(`${label}: ses ${tts.t - e.t}ms geç başladı`);
  if (tap && tts && ttsEnd && tap.t < ttsEnd.t) info(`    (çocuk ses bitmeden dokundu, kabul edildi)`);
}
const repeats = [...roundTargets].filter(([, n]) => n > 3);
if (repeats.length) warn(`Bir turda 3'ten fazla sorulan hedef: ${repeats.map(([k, n]) => `${k}×${n}`).join(", ")}`);
const screens = log.filter((e) => e.type === "screen").map((e) => `${e.name}@${(e.t / 1000).toFixed(1)}s`);
info("ekranlar: " + screens.join(" → "));
console.log(out.join("\n"));
