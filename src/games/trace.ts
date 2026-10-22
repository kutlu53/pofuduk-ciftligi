import type { Game } from "./types";
import { gameHeader, h, pickFor, speakerButton, wait } from "./common";
import { spellingOf } from "../core/content";
import { sfx, speak } from "../core/audio";
import { artSvg } from "../art";

/** Harflerin bu oranı boyanınca sözcük tamamlanmış sayılır. */
const NEED = 0.7;

/**
 * ✍️ Çiz: sözcüğü parmakla izleyerek yaz (W2 kopyalama). 2 kısa sözcük.
 * Hız bonusu yok (yavaş ve dikkatli yazmak istenir), yanlış cevap yok; tamamlayınca puan.
 */
export const trace: Game = async (ctx) => {
  const words = pickFor(ctx.theme, ctx.targets, "spell", 6)
    .sort((a, b) => spellingOf(a).length - spellingOf(b).length)
    .slice(0, 2);

  for (const word of words) {
    const text = spellingOf(word);
    ctx.root.innerHTML = "";
    const wrap = h("div", "game trace");
    const top = h("div", "prompt-row");
    top.append(gameHeader("✍️"), h("div", "big-art", artSvg(word)), speakerButton(word.en));
    const board = h("div", "trace-board");
    const canvas = h("canvas", "trace-canvas");
    board.append(canvas);
    const ringEl = h("div", "trace-ring");
    ringEl.style.setProperty("--p", "0%");
    const clear = h("button", "btn-round small-round", "↺");
    clear.type = "button";
    const ctrls = h("div", "trace-ctrls");
    ctrls.append(clear, ringEl);
    wrap.append(top, board, ctrls);
    ctx.root.append(wrap);
    void speak(word.en);
    await new Promise((r) => requestAnimationFrame(r));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = board.clientWidth;
    const H = board.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const g = canvas.getContext("2d")!;
    g.scale(dpr, dpr);

    let fs = Math.min(H * 0.72, 150);
    const font = () => `800 ${fs}px "Segoe UI Rounded", "Nunito", system-ui, sans-serif`;
    g.font = font();
    while (g.measureText(text).width > W - 28 && fs > 22) {
      fs -= 4;
      g.font = font();
    }
    const drawGuide = () => {
      g.clearRect(0, 0, W, H);
      g.font = font();
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = "#efe6d6";
      g.fillText(text, W / 2, H / 2);
      g.strokeStyle = "#c9b99a";
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.strokeText(text, W / 2, H / 2);
      g.setLineDash([]);
    };
    drawGuide();

    // Harf maskesi: örnek noktalar
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const og = off.getContext("2d")!;
    og.font = font();
    og.textAlign = "center";
    og.textBaseline = "middle";
    og.fillStyle = "#000";
    og.fillText(text, W / 2, H / 2);
    const px = og.getImageData(0, 0, W, H).data;
    const samples: [number, number][] = [];
    for (let y = 0; y < H; y += 5) for (let x = 0; x < W; x += 5) if (px[(y * W + x) * 4 + 3] > 100) samples.push([x, y]);
    const hit = new Uint8Array(samples.length);
    const strokeR = Math.max(9, fs * 0.11);

    let drawing = false;
    let last: [number, number] | null = null;
    let done = false;
    const pos = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const paint = (p: [number, number]) => {
      const from = last ?? p;
      g.strokeStyle = "rgba(255,159,67,.9)";
      g.lineWidth = strokeR * 2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.beginPath();
      g.moveTo(from[0], from[1]);
      g.lineTo(p[0], p[1]);
      g.stroke();
      const steps = Math.max(1, Math.ceil(Math.hypot(p[0] - from[0], p[1] - from[1]) / 4));
      const r2 = (strokeR + 3) ** 2;
      for (let s = 0; s <= steps; s++) {
        const x = from[0] + ((p[0] - from[0]) * s) / steps;
        const y = from[1] + ((p[1] - from[1]) * s) / steps;
        for (let i = 0; i < samples.length; i++) {
          if (hit[i]) continue;
          const dx = samples[i][0] - x;
          const dy = samples[i][1] - y;
          if (dx * dx + dy * dy <= r2) hit[i] = 1;
        }
      }
      last = p;
    };
    const coverage = () => {
      let n = 0;
      for (let i = 0; i < hit.length; i++) n += hit[i];
      return samples.length ? n / samples.length : 1;
    };

    await new Promise<void>((resolve) => {
      const finishCheck = () => {
        const cov = coverage();
        ringEl.style.setProperty("--p", `${Math.round(Math.min(1, cov / NEED) * 100)}%`);
        if (cov >= NEED && !done) {
          done = true;
          sfx.ok();
          board.classList.add("ok", "pop");
          ctx.answer(word, true, Number.MAX_SAFE_INTEGER, "spell");
          void speak(word.en);
          setTimeout(resolve, 1000);
        }
      };
      canvas.addEventListener("pointerdown", (e) => {
        if (done) return;
        drawing = true;
        last = null;
        canvas.setPointerCapture(e.pointerId);
        paint(pos(e));
        sfx.tap();
      });
      canvas.addEventListener("pointermove", (e) => {
        if (!drawing || done) return;
        paint(pos(e));
      });
      const up = () => {
        if (!drawing) return;
        drawing = false;
        last = null;
        finishCheck();
      };
      canvas.addEventListener("pointerup", up);
      canvas.addEventListener("pointercancel", up);
      clear.onclick = () => {
        if (done) return;
        sfx.pop();
        drawGuide();
        hit.fill(0);
        ringEl.style.setProperty("--p", "0%");
      };
    });
    await wait(200);
  }
};
