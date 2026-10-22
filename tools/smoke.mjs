// Duman testi: başsız Chrome'u DevTools protokolüyle sürer, ekran geçişlerini ve konsol hatalarını denetler.
// Kullanım: npm run build && npx vite preview --port 4173 &  → node tools/smoke.mjs [url]
//   url'de ?dev=all varsa: tüm oyun türleri, değiştirici, hikâye ve ada patronu da denetlenir.
import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL_ = process.argv[2] ?? "http://localhost:4173/";
const DEV = URL_.includes("dev=all");
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), "pofuduk-smoke-"));

const chrome = spawn(
  CHROME,
  ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
   "--window-size=420,860", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "about:blank"],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250);
  try {
    const list = await fetch(`http://localhost:${PORT}/json`).then((r) => r.json());
    target = list.find((t) => t.type === "page");
  } catch { /* retry */ }
}
if (!target) {
  console.error("Chrome DevTools'a bağlanılamadı");
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let nextId = 1;
const pending = new Map();
const problems = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === "Runtime.exceptionThrown") {
    problems.push("EXCEPTION: " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
  } else if (msg.method === "Runtime.consoleAPICalled" && (msg.params.type === "error" || msg.params.type === "warning")) {
    problems.push(`CONSOLE ${msg.params.type}: ` + msg.params.args.map((a) => a.value ?? a.description).join(" "));
  } else if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
    problems.push("LOG error: " + msg.params.entry.text);
  }
};
const send = (method, params = {}) => new Promise((resolve) => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error("evaluate failed: " + JSON.stringify(r.result.exceptionDetails.exception?.description));
  return r.result?.result?.value;
};
const click = (selector) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.dispatchEvent(new PointerEvent("pointerdown", {bubbles:true})); el.click(); return true; })()`);
const exists = (selector) => evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "OK  " : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failed++;
};

/** Bir turu otomatik oynar; özet ekranına ulaşınca görülen oyun ikonlarını döndürür. */
async function playRound(maxSteps = 90) {
  const seen = new Set();
  for (let step = 0; step < maxSteps; step++) {
    const icon = await evaluate("document.querySelector('.game-icon')?.textContent ?? ''");
    if (icon) seen.add(icon);
    const state = await evaluate(`(() => {
      if (document.querySelector('.summary')) return 'summary';
      if (document.querySelector('.grid4 .card')) {
        const target = document.querySelector('.game')?.dataset.target;
        const card = document.querySelector('.grid4 .card[data-id="' + target + '"]') ?? document.querySelector('.grid4 .card');
        card.click(); return 'tap';
      }
      if (document.querySelector('.tile:not(.used)')) { for (const t of document.querySelectorAll('.tile:not(.used)')) { t.click(); if (t.classList.contains('used')) break; } return 'spell'; }
      if (document.querySelector('.swipe-btns .yes-btn')) {
        const truly = document.querySelector('.game')?.dataset.truly === '1';
        document.querySelector(truly ? '.swipe-btns .yes-btn' : '.swipe-btns .no-btn').click(); return 'swipe';
      }
      if (document.querySelector('.trace-canvas') && !document.querySelector('.trace-board.ok')) {
        const c = document.querySelector('.trace-canvas'); const r = c.getBoundingClientRect();
        const o = (x,y) => ({bubbles:true, clientX:r.left+x, clientY:r.top+y, pointerId:1});
        c.dispatchEvent(new PointerEvent('pointerdown', o(2, 2)));
        for (let y = 2; y < r.height; y += 8) { c.dispatchEvent(new PointerEvent('pointermove', o(2, y))); c.dispatchEvent(new PointerEvent('pointermove', o(r.width-2, y))); }
        c.dispatchEvent(new PointerEvent('pointerup', o(r.width-2, r.height-2)));
        return 'trace';
      }
      if (document.querySelector('.chip:not(.done)')) {
        const chip = document.querySelector('.chip:not(.done)');
        const zone = document.querySelector('.zone[data-id="' + chip.dataset.id + '"]');
        const r = zone.getBoundingClientRect(); const c = chip.getBoundingClientRect();
        const o = (x,y) => ({bubbles:true, clientX:x, clientY:y, pointerId:1});
        chip.dispatchEvent(new PointerEvent('pointerdown', o(c.x+5, c.y+5)));
        chip.dispatchEvent(new PointerEvent('pointermove', o(r.x+r.width/2, r.y+r.height/2)));
        chip.dispatchEvent(new PointerEvent('pointerup', o(r.x+r.width/2, r.y+r.height/2)));
        return 'drag';
      }
      if (document.querySelector('.cave')) {
        const ok = document.querySelector('.btn-round.stamp');
        if (ok && !ok.classList.contains('hidden')) { ok.click(); return 'stamp'; }
        const mic = document.querySelector('.mic');
        if (mic) { mic.click(); mic.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1})); return 'mic'; }
      }
      return 'wait';
    })()`);
    if (state === "summary") break;
    if (state === "mic") { await sleep(600); await evaluate(`document.querySelector('.mic')?.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:1}))`); }
    await sleep(state === "wait" ? 600 : 1300);
  }
  return seen;
}

/** Özet ekranından ana ekrana döner; araya hikâye girerse sayfaları geçer. */
async function summaryToHome() {
  await sleep(4500);
  check("özet düğmeleri göründü", await evaluate("!document.querySelector('.summary-btns')?.classList.contains('hidden')"));
  await click(".summary-btns .btn-big:not(.play)");
  await sleep(800);
  if (await exists(".story")) {
    check("hikâye parçası açıldı", true);
    for (let i = 0; i < 6 && (await exists(".story")); i++) {
      await sleep(1200);
      await click(".story .btn-big");
      await sleep(400);
    }
    check("hikâye bitti, ana ekran", await exists(".home"));
  } else {
    check("ana ekrana dönüş", await exists(".home"));
  }
}

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.navigate", { url: URL_ });
await sleep(2500);

check("sayfa yüklendi, başlangıç ekranı", await exists(".onboarding"), await evaluate("document.querySelector('#app').innerHTML.slice(0,120)"));
await click(".avatar-pick");
await evaluate(`document.querySelector('.name-input').value = 'Test'`);
await click(".btn-big.play");
await sleep(800);
check("ana ekran (ada haritası)", await exists(".home .map"));
check("6 ada, 1 açık", (await evaluate("document.querySelectorAll('.island').length")) === 6 && (await evaluate("document.querySelectorAll('.island.open').length")) === 1);
check("seçili ada vurgulu", await exists(".island.current"));
await click(".island.locked");
await sleep(300);
check("kilitli ada oyunu başlatmaz", !(await exists(".round")));

// Normal tur
await click(".bottombar .btn-big.play");
await sleep(1500);
check("tur ekranı açıldı", await exists(".round .stage .game"));
const seen = await playRound();
check("tur özeti ekranı", await exists(".summary"), "puan: " + (await evaluate("document.querySelector('.big-score')?.textContent")) + " · oyunlar: " + [...seen].join(" "));
if (DEV) check("çiz oyunu oynandı (dev=all)", seen.has("✍️"));
await summaryToHome();

// Ada patronu (dev=all: ilk ada patron hazır)
if (DEV) {
  check("patron rozeti görünüyor", await exists(".island.boss .boss-badge"));
  await click(".island.boss");
  await sleep(2500);
  check("patron turu açıldı", await exists(".round.boss .game"));
  const bossSeen = await playRound();
  check("patron özeti", await exists(".summary .boss-result"), "sonuç: " + (await evaluate("document.querySelector('.boss-result')?.textContent")));
  check("patron geçildi, taç", await exists(".boss-result.won"));
  await summaryToHome();
  check("2. ada açıldı", (await evaluate("document.querySelectorAll('.island.open').length")) === 2, "oyunlar: " + [...bossSeen].join(" "));
}

await click(".bottombar .icon-btn.big");
await sleep(800);
check("koleksiyon ekranı", await exists(".pofuduk-grid"), "kart sayısı " + (await evaluate("document.querySelectorAll('.pofuduk-card').length")));
check("koleksiyonda 6 ada sekmesi", (await evaluate("document.querySelectorAll('.tab').length")) === 6);
check("kalıcı kayıt var", await evaluate(`indexedDB.databases ? indexedDB.databases().then(d => d.length > 0) : true`));

// Koleksiyondan ana ekrana dön, sonra ebeveyn kilidi
await click(".topbar .icon-btn");
await sleep(600);
check("koleksiyondan ana ekrana dönüş", await exists(".home"));
await click(".home .topbar .icon-btn");
await sleep(500);
const q = await evaluate("document.querySelector('.lock-q')?.textContent");
const m = /(\d+) \+ (\d+)/.exec(q ?? "");
if (m) {
  await evaluate(`document.querySelector('.lock-input').value = ${Number(m[1]) + Number(m[2])}`);
  await click(".lock .btn:not(.ghost)");
  await sleep(500);
}
check("ebeveyn paneli açıldı", await exists(".panel"));

console.log(problems.length ? "\nSorunlar:\n" + problems.join("\n") : "\nKonsol hatası yok.");
ws.close();
chrome.kill();
process.exit(failed || problems.length ? 1 : 0);
