import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { load, save } from "./core/store";
import { unlockAudio } from "./core/audio";
import { dev } from "./core/round";
import { go } from "./ui/router";
import { home } from "./ui/home";
import { onboarding } from "./ui/onboarding";

registerSW({ immediate: true });

document.addEventListener("pointerdown", unlockAudio, { passive: true });
document.addEventListener("keydown", unlockAudio, { passive: true });

// Çift dokunmayla yakınlaştırmayı engelle (dokunmatik cihazlar)
let lastTouch = 0;
document.addEventListener(
  "touchend",
  (e) => {
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
  },
  { passive: false },
);

void (async () => {
  const params = new URLSearchParams(location.search);
  if (params.get("dev") === "all") dev.allGames = true;
  const sheetId = params.get("sheet");
  if (sheetId) {
    const { sheet } = await import("./ui/sheet");
    go(sheet(sheetId));
    return;
  }
  await load();
  go(save.profile ? home : onboarding);
})();
