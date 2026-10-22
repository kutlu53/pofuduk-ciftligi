// "Çocuk gibi oyna": ses/efekt/çizim zamanlarını kaydederek turları oynar, her adımda görüntü alır.
// Kullanım: npx vite preview --port 4173 &  → node tools/play.mjs <çıktı klasörü> [url] [tur sayısı]
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] ?? "play";
const URL_ = process.argv[3] ?? "http://localhost:4173/";
const ROUNDS = Number(process.argv[4] ?? 3);
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9777;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const HOOK = `
window.__log = [];
const __t0 = performance.now();
const __log = (type, data = {}) => window.__log.push({ t: Math.round(performance.now() - __t0), type, ...data });
window.__logEv = __log;
if (window.speechSynthesis) {
  const s = window.speechSynthesis;
  const origSpeak = s.speak.bind(s);
  s.speak = (u) => { __log("tts", { text: u.text, voice: u.voice?.name ?? null, lang: u.lang }); u.addEventListener("start", () => __log("tts-start", { text: u.text })); u.addEventListener("end", () => __log("tts-end", { text: u.text })); u.addEventListener("error", (e) => __log("tts-error", { text: u.text, err: e.error })); return origSpeak(u); };
  const origCancel = s.cancel.bind(s);
  s.cancel = () => { __log("tts-cancel"); origCancel(); };
  __log("voices", { n: s.getVoices().length });
  s.addEventListener("voiceschanged", () => __log("voices", { n: s.getVoices().length }));
}
const origOsc = AudioContext.prototype.createOscillator;
AudioContext.prototype.createOscillator = function () { __log("sfx"); return origOsc.call(this); };
const origPlay = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function () { __log("audio-play", { src: this.src.slice(0, 40) }); return origPlay.call(this); };
let lastGame = null, lastScreen = null;
new MutationObserver(() => {
  const scr = document.querySelector(".screen");
  const name = scr ? [...scr.classList].filter((c) => c !== "screen").join(".") : null;
  if (name !== lastScreen) { lastScreen = name; __log("screen", { name }); }
  const g = document.querySelector(".game");
  if (g && g !== lastGame) {
    lastGame = g;
    const cards = [...g.querySelectorAll(".grid4 .card")];
    __log("render", {
      icon: document.querySelector(".game-icon")?.textContent ?? null,
      target: g.dataset.target ?? null, truly: g.dataset.truly ?? null,
      options: cards.map((c) => c.dataset.id),
      optionArt: cards.map((c) => c.innerHTML.length + ":" + (c.innerHTML.match(/<text[^>]*>([^<]*)<\\/text>/g) || []).join("")),
      chips: [...g.querySelectorAll(".chip")].map((c) => c.textContent),
      zones: [...g.querySelectorAll(".zone")].map((z) => z.dataset.id),
      tiles: [...g.querySelectorAll(".tile")].map((t) => t.textContent).join(""),
      text: g.querySelector(".word-prompt, .chunk-text, .swipe-word")?.textContent ?? null,
      mod: [...(document.querySelector(".stage")?.classList ?? [])].find((c) => c.startsWith("mod-")) ?? null,
    });
  }
}).observe(document, { childList: true, subtree: true, attributes: false });
`;

const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "pofuduk-play-"))}`, "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250);
  try { target = (await fetch(`http://localhost:${PORT}/json`).then((r) => r.json())).find((t) => t.type === "page"); } catch { /* retry */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let nextId = 1;
const pending = new Map();
const problems = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === "Runtime.exceptionThrown") problems.push("EXCEPTION: " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") problems.push("CONSOLE: " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
};
const send = (method, params = {}) => new Promise((resolve) => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
const click = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); el.click(); return true; })()`);
const exists = (sel) => evaluate(`!!document.querySelector(${JSON.stringify(sel)})`);
let shotN = 0;
const shot = async (name) => {
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(OUT, `${String(++shotN).padStart(3, "0")}-${name}.png`), Buffer.from(r.result.data, "base64"));
};
const mark = (type, data = {}) => evaluate(`window.__logEv(${JSON.stringify(type)}, ${JSON.stringify(data)})`);
/** Son TTS bitene kadar (en çok maxMs) bekler. */
const waitTts = async (maxMs = 3500) => {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const st = await evaluate(`(() => { const l = window.__log; let last = null; for (let i = l.length - 1; i >= 0; i--) { if (l[i].type.startsWith("tts")) { last = l[i]; break; } } return last ? last.type : "none"; })()`);
    if (st === "tts-end" || st === "tts-error" || st === "none") return st;
    await sleep(120);
  }
  return "timeout";
};

await send("Page.enable");
await send("Runtime.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: HOOK });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send("Emulation.setTouchEmulationEnabled", { enabled: true });
await send("Page.navigate", { url: URL_ });
await sleep(2200);
await shot("onboarding");
await click(".avatar-pick:nth-child(3)");
await sleep(400);
await shot("onboarding-secildi");
await click(".btn-big.play");
await sleep(900);
await shot("home");

let rnd = 0;
const rand = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };

async function playRound(label) {
  await mark("round-start", { label });
  await click(".bottombar .btn-big.play");
  await sleep(1200);
  await shot(`${label}-baslangic`);
  let lastRenderT = -1;
  for (let step = 0; step < 120; step++) {
    if (await exists(".summary")) break;
    if (await exists(".rest")) break;
    const r = await evaluate(`(() => { const l = window.__log; for (let i = l.length - 1; i >= 0; i--) if (l[i].type === "render") return l[i]; return null; })()`);
    if (!r) { await sleep(400); continue; }
    if (r.t !== lastRenderT) {
      lastRenderT = r.t;
      await sleep(250);
      await shot(`${label}-${r.icon ?? "x"}-soru`);
      // Çocuk: sesi dinler (bazen sabırsız: %25 beklemeden basar)
      const impatient = rand() < 0.25;
      const ttsState = impatient ? "impatient" : await waitTts();
      await mark("child-ready", { ttsState, impatient });
      await sleep(impatient ? 150 : 400 + rand() * 600);
    }
    const wrong = rand() < 0.25;
    const state = await evaluate(`(() => {
      const wrong = ${wrong};
      const g = document.querySelector('.game'); if (!g) return 'nogame';
      if (document.querySelector('.grid4 .card')) {
        const target = g.dataset.target; const cards = [...document.querySelectorAll('.grid4 .card')];
        const right = cards.find(c => c.dataset.id === target); const other = cards.find(c => c.dataset.id !== target);
        (wrong && other ? other : right ?? cards[0]).click(); window.__logEv('tap', { kind: 'card', wrong: !!(wrong && other) }); return 'tap';
      }
      if (document.querySelector('.tile:not(.used)')) {
        const tiles = [...document.querySelectorAll('.tile:not(.used)')];
        if (wrong && tiles.length > 1) { const t = tiles[tiles.length - 1]; t.click(); window.__logEv('tap', { kind: 'tile', letter: t.textContent, used: t.classList.contains('used') }); }
        for (const t of document.querySelectorAll('.tile:not(.used)')) { t.click(); if (t.classList.contains('used')) { window.__logEv('tap', { kind: 'tile', letter: t.textContent, used: true }); break; } }
        return 'spell';
      }
      if (document.querySelector('.swipe-btns .yes-btn')) {
        const truly = g.dataset.truly === '1'; const sayYes = wrong ? !truly : truly;
        document.querySelector(sayYes ? '.swipe-btns .yes-btn' : '.swipe-btns .no-btn').click(); window.__logEv('tap', { kind: 'swipe', wrong }); return 'swipe';
      }
      if (document.querySelector('.trace-canvas') && !document.querySelector('.trace-board.ok')) {
        const c = document.querySelector('.trace-canvas'); const r = c.getBoundingClientRect();
        const o = (x,y) => ({bubbles:true, clientX:r.left+x, clientY:r.top+y, pointerId:1});
        c.dispatchEvent(new PointerEvent('pointerdown', o(2, 2)));
        for (let y = 2; y < r.height; y += 8) { c.dispatchEvent(new PointerEvent('pointermove', o(2, y))); c.dispatchEvent(new PointerEvent('pointermove', o(r.width-2, y))); }
        c.dispatchEvent(new PointerEvent('pointerup', o(r.width-2, r.height-2)));
        window.__logEv('tap', { kind: 'trace' }); return 'trace';
      }
      if (document.querySelector('.chip:not(.done)')) {
        const chip = document.querySelector('.chip:not(.done)');
        const zones = [...document.querySelectorAll('.zone:not(.ok)')];
        const zone = (wrong && zones.length > 1) ? zones.find(z => z.dataset.id !== chip.dataset.id) : document.querySelector('.zone[data-id="' + chip.dataset.id + '"]');
        const r = zone.getBoundingClientRect(); const c = chip.getBoundingClientRect();
        const o = (x,y) => ({bubbles:true, clientX:x, clientY:y, pointerId:1});
        chip.dispatchEvent(new PointerEvent('pointerdown', o(c.x+5, c.y+5)));
        chip.dispatchEvent(new PointerEvent('pointermove', o(r.x+r.width/2, r.y+r.height/2)));
        chip.dispatchEvent(new PointerEvent('pointerup', o(r.x+r.width/2, r.y+r.height/2)));
        window.__logEv('tap', { kind: 'drag', wrong: zone.dataset.id !== chip.dataset.id }); return 'drag';
      }
      if (document.querySelector('.cave')) {
        const ok = document.querySelector('.btn-round.stamp');
        if (ok && !ok.classList.contains('hidden')) { ok.click(); window.__logEv('tap', { kind: 'stamp' }); return 'stamp'; }
        const play = document.querySelector('.btn-round.play');
        if (play && !play.classList.contains('hidden')) { play.click(); window.__logEv('tap', { kind: 'play-rec' }); }
        const mic = document.querySelector('.mic');
        if (mic) { mic.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); mic.click(); window.__logEv('tap', { kind: 'mic-down' }); return 'mic'; }
      }
      return 'wait';
    })()`);
    await sleep(300);
    if (state !== "wait" && state !== "nogame") await shot(`${label}-${state}-sonra`);
    if (state === "mic") { await sleep(900); await evaluate(`document.querySelector('.mic')?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1})); window.__logEv('tap', { kind: 'mic-up' });`); await sleep(500); await shot(`${label}-mic-sonra`); }
    await sleep(state === "wait" ? 500 : 1100);
  }
  await mark("round-end", { label });
  await sleep(1500);
  await shot(`${label}-ozet-1`);
  await sleep(3200);
  await shot(`${label}-ozet-2`);
  await click(".emotion:nth-child(1)");
  await sleep(500);
  await shot(`${label}-ozet-duygu`);
}

for (let r = 1; r <= ROUNDS; r++) {
  await playRound(`tur${r}`);
  // Özetten devam: ▶ varsa bir tur daha, yoksa 🏠
  const hasAgain = await exists(".summary-btns .play");
  if (r < ROUNDS && hasAgain) {
    await click(".summary-btns .play");
  } else {
    await click(".summary-btns .btn-big:not(.play)");
  }
  await sleep(1200);
  if (await exists(".story")) {
    await shot(`tur${r}-hikaye-1`);
    for (let i = 0; i < 6 && (await exists(".story")); i++) { await waitTts(6000); await sleep(400); await click(".story .btn-big"); await sleep(500); if (i === 0) await shot(`tur${r}-hikaye-2`); }
  }
  if (await exists(".rest")) { await shot(`tur${r}-dinlenme`); await click(".rest .btn-big"); await sleep(800); }
  if (await exists(".home")) { await shot(`tur${r}-sonra-home`); if (r < ROUNDS) { /* ana ekrandan devam */ } }
}
await shot("son-home");
await click(".bottombar .icon-btn.big");
await sleep(800);
await shot("koleksiyon");
await click(".pofuduk-card");
await sleep(600);
await shot("koleksiyon-buyuk");

const log = await evaluate("JSON.stringify(window.__log)");
writeFileSync(join(OUT, "timeline.json"), log);
writeFileSync(join(OUT, "problems.txt"), problems.join("\n"));
console.log("kayıt:", JSON.parse(log).length, "olay;", shotN, "görüntü;", problems.length, "hata");
ws.close();
chrome.kill();
