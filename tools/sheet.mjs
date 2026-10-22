// İllüstrasyon sayfalarını (?sheet=themeN) tam sayfa PNG olarak yakalar.
// Kullanım: npx vite preview --port 4173 &  → node tools/sheet.mjs <çıktı klasörü> [url]
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = process.argv[2] ?? "sheets";
const URL_ = process.argv[3] ?? "http://localhost:4173/";
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9666;
mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "pofuduk-sheet-"))}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) {
  await sleep(250);
  try {
    target = (await fetch(`http://localhost:${PORT}/json`).then((r) => r.json())).find((t) => t.type === "page");
  } catch { /* retry */ }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 1;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const i = id++; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result?.result?.value;
await send("Page.enable");
await send("Runtime.enable");
for (const t of ["theme1", "theme2", "theme3", "theme4", "theme5", "theme6"]) {
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: `${URL_}?sheet=${t}` });
  await sleep(1500);
  const height = await evaluate("document.documentElement.scrollHeight");
  await send("Emulation.setDeviceMetricsOverride", { width: 1100, height, deviceScaleFactor: 1, mobile: false });
  await sleep(400);
  const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
  writeFileSync(join(OUT, `${t}.png`), Buffer.from(r.result.data, "base64"));
  console.log(t, height + "px");
}
ws.close();
chrome.kill();
