// Ekran görüntüleri: telefon / tablet (dikey, yatay) / PC boyutlarında her ekranı yakalar, taşmayı ölçer.
// Kullanım: npm run build && npx vite preview --port 4173 &  → node tools/shots.mjs <çıktı klasörü> [url]
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] ?? "shots";
const URL_ = process.argv[3] ?? "http://localhost:4173/";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const VIEWPORTS = [
  { name: "phone", w: 390, h: 844, mobile: true },
  { name: "phone-landscape", w: 844, h: 390, mobile: true },
  { name: "tablet-portrait", w: 820, h: 1180, mobile: true },
  { name: "tablet-landscape", w: 1180, h: 820, mobile: true },
  { name: "pc", w: 1366, h: 768, mobile: false },
];
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = [];

for (const vp of VIEWPORTS) {
  const port = 9400 + VIEWPORTS.indexOf(vp);
  const profile = mkdtempSync(join(tmpdir(), "pofuduk-shots-"));
  const chrome = spawn(
    CHROME,
    ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
     "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--hide-scrollbars", "about:blank"],
    { stdio: "ignore" },
  );
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    await sleep(250);
    try {
      const list = await fetch(`http://localhost:${port}/json`).then((r) => r.json());
      target = list.find((t) => t.type === "page");
    } catch { /* retry */ }
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let nextId = 1;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  };
  const send = (method, params = {}) => new Promise((resolve) => { const id = nextId++; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const click = (sel) => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return false; el.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true})); el.click(); return true; })()`);
  const shot = async (name) => {
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(OUT, `${vp.name}--${name}.png`), Buffer.from(r.result.data, "base64"));
    const m = await evaluate(`({ sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth })`);
    const over = m.sh > m.ih + 2 ? `DİKEY TAŞMA ${m.sh - m.ih}px` : m.sw > m.iw + 2 ? `YATAY TAŞMA ${m.sw - m.iw}px` : "ok";
    report.push(`${vp.name.padEnd(17)} ${name.padEnd(16)} ${over}`);
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.mobile });
  await send("Emulation.setTouchEmulationEnabled", { enabled: vp.mobile });
  await send("Page.navigate", { url: URL_ });
  await sleep(2000);
  await shot("onboarding");
  await click(".avatar-pick");
  await click(".btn-big.play");
  await sleep(700);
  await shot("home");
  await click(".bottombar .btn-big.play");
  await sleep(1400);

  const seen = new Set();
  for (let step = 0; step < 70; step++) {
    const icon = await evaluate("document.querySelector('.game-icon')?.textContent ?? ''");
    if (icon && !seen.has(icon)) {
      seen.add(icon);
      await sleep(500);
      await shot("game-" + icon.codePointAt(0).toString(16));
    }
    const state = await evaluate(`(() => {
      if (document.querySelector('.summary')) return 'summary';
      if (document.querySelector('.grid4 .card')) { document.querySelector('.grid4 .card').click(); return 'tap'; }
      if (document.querySelector('.tile:not(.used)')) { for (const t of document.querySelectorAll('.tile:not(.used)')) { t.click(); if (t.classList.contains('used')) break; } return 'spell'; }
      if (document.querySelector('.swipe-btns .yes-btn')) { document.querySelector('.swipe-btns .yes-btn').click(); return 'swipe'; }
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
  await sleep(4500);
  await shot("summary");
  await click(".summary-btns .btn-big:not(.play)");
  await sleep(600);
  await click(".bottombar .icon-btn.big");
  await sleep(600);
  await shot("collection");
  await click(".topbar .icon-btn");
  await sleep(500);
  await click(".home .topbar .icon-btn");
  await sleep(400);
  await shot("parent-lock");
  const q = await evaluate("document.querySelector('.lock-q')?.textContent");
  const m = /(\d+) \+ (\d+)/.exec(q ?? "");
  if (m) {
    await evaluate(`document.querySelector('.lock-input').value = ${Number(m[1]) + Number(m[2])}`);
    await click(".lock .btn:not(.ghost)");
    await sleep(400);
  }
  await shot("parent-panel");
  ws.close();
  chrome.kill();
}
console.log(report.join("\n"));
