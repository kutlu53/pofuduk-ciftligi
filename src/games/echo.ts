import type { Game } from "./types";
import { gameHeader, h, shuffle, speakerButton, wait } from "./common";
import { sfx, speak, stopSpeaking } from "../core/audio";
import { save, saveRecording } from "../core/store";

async function getMic(): Promise<MediaStream | null> {
  try {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") return null;
    return await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    return null;
  }
}

/**
 * 🗣️ Yankı Mağarası: kalıbı dinle, basılı tutup tekrarla, kendini dinle, damga al.
 * Puanlanmaz. Kayıt cihazda kalır. Mikrofon yoksa "söyledim" düğmesiyle geçilir.
 */
export const echo: Game = async (ctx) => {
  const unstamped = ctx.theme.chunks.filter((c) => !save.echoStamps.includes(c.id));
  const pool = unstamped.length >= 2 ? unstamped : ctx.theme.chunks;
  const chunks = shuffle(pool).slice(0, 2);
  const mic = await getMic();

  for (const chunk of chunks) {
    ctx.root.innerHTML = "";
    const wrap = h("div", "game cave");
    wrap.append(gameHeader("🗣️"));
    const text = h("div", "chunk-text", chunk.en);
    const row = h("div", "prompt-row");
    row.append(speakerButton(chunk.en));
    const micBtn = h("button", "mic idle", mic ? "🎤" : "🗣️");
    micBtn.type = "button";
    micBtn.oncontextmenu = (e) => e.preventDefault();
    // İlk dokunuşa kadar "bas" ipucu: nefes alan mikrofon + zıplayan parmak
    const hint = h("div", "mic-hint", "👆");
    micBtn.addEventListener("pointerdown", () => {
      micBtn.classList.remove("idle");
      hint.remove();
    }, { once: true });
    const playBtn = h("button", "btn-round play hidden", "▶️");
    const okBtn = h("button", "btn-round stamp hidden", "✔️");
    playBtn.type = okBtn.type = "button";
    const ctrls = h("div", "cave-ctrls");
    ctrls.append(playBtn, micBtn, okBtn, hint);
    wrap.append(text, row, ctrls);
    ctx.root.append(wrap);
    await speak(chunk.en);

    let blob: Blob | null = null;
    let url: string | null = null;

    if (mic) {
      let rec: MediaRecorder | null = null;
      let parts: Blob[] = [];
      const start = (e: PointerEvent) => {
        e.preventDefault();
        if (rec) return;
        stopSpeaking();
        parts = [];
        rec = new MediaRecorder(mic);
        rec.ondataavailable = (ev) => parts.push(ev.data);
        rec.onstop = () => {
          blob = new Blob(parts, { type: rec?.mimeType || "audio/webm" });
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(blob);
          playBtn.classList.remove("hidden");
          okBtn.classList.remove("hidden");
          rec = null;
        };
        rec.start();
        micBtn.classList.add("rec");
        sfx.pop();
      };
      const stop = () => {
        if (!rec || rec.state !== "recording") return;
        micBtn.classList.remove("rec");
        rec.stop();
      };
      micBtn.addEventListener("pointerdown", start);
      micBtn.addEventListener("pointerup", stop);
      micBtn.addEventListener("pointercancel", stop);
      micBtn.addEventListener("pointerleave", stop);
    } else {
      micBtn.onclick = () => {
        sfx.tap();
        void speak(chunk.en);
        okBtn.classList.remove("hidden");
      };
    }

    playBtn.onclick = () => {
      if (!url) return;
      sfx.tap();
      void new Audio(url).play().catch(() => undefined);
    };

    await new Promise<void>((resolve) => (okBtn.onclick = () => resolve()));
    sfx.stamp();
    okBtn.classList.add("pop", "stamped");
    if (blob) await saveRecording(chunk.id, blob);
    if (!save.echoStamps.includes(chunk.id)) save.echoStamps.push(chunk.id);
    if (url) URL.revokeObjectURL(url);
    await wait(600);
  }
  mic?.getTracks().forEach((t) => t.stop());
};
