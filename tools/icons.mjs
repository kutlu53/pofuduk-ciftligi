// public/icons/icon.svg → icon-192.png, icon-512.png (başsız Chrome ile).
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const svg = readFileSync("public/icons/icon.svg", "utf8");
const html = `<!doctype html><html><body style="margin:0;background:#ff9f43">${svg.replace("<svg ", '<svg style="display:block;width:100vw;height:100vh" ')}</body></html>`;
const url = "data:text/html;charset=utf-8," + encodeURIComponent(html);
const PORT = 9555;
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", "--no-sandbox", `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "pofuduk-icons-"))}`, "about:blank"], { stdio: "ignore" });
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
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(800);
for (const size of [192, 512]) {
  await send("Emulation.setDeviceMetricsOverride", { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  await sleep(300);
  const r = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`public/icons/icon-${size}.png`, Buffer.from(r.result.data, "base64"));
  console.log(`icon-${size}.png yazıldı`);
}
ws.close();
chrome.kill();
