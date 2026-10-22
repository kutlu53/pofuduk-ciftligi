import type { Screen } from "./router";
import { go } from "./router";
import { h, shuffle, speakerButton } from "../games/common";
import { currentTheme, persist, save } from "../core/store";
import { sfx, speak } from "../core/audio";
import { spellingOf } from "../core/content";
import { artSvg } from "../art";
import { pofudukSvg } from "./pofuduk";
import type { Word } from "../core/types";

const PAGES = 3;

/** Kalıp metninde geçen resimli sözcük (en uzun eşleşme); yoksa undefined → el sallayan pofuduk sahnesi. */
function relatedWord(words: Word[], text: string): Word | undefined {
  const t = text.toLowerCase();
  const pictured = words.filter((w) => w.modes.includes("listen"));
  const hits = pictured.filter((w) => t.includes(spellingOf(w)));
  hits.sort((a, b) => spellingOf(b).length - spellingOf(a).length);
  return hits[0];
}

const GREETING_ART = ["👋", "💬", "🌟", "🎈"];

/**
 * Hikâye parçası: pofuduk, temanın kalıplarını sırayla söyler (3 sayfa).
 * Puan yok; dinleme + okuma. Her ~5 turda bir, özetten sonra.
 */
export function story(next: Screen): Screen {
  return async (root) => {
    const theme = currentTheme();
    const p = save.profile!;
    const start = save.story[theme.id] ?? 0;
    const wrap = h("div", "screen story");
    root.append(wrap);

    for (let i = 0; i < PAGES; i++) {
      const chunk = theme.chunks[(start + i) % theme.chunks.length];
      const word = relatedWord(theme.words, chunk.en);
      wrap.innerHTML = "";
      const dots = h("div", "story-dots");
      for (let d = 0; d < PAGES; d++) dots.append(h("span", "dot" + (d === i ? " active" : d < i ? " done" : ""), "📖"));
      const page = h("div", "story-page");
      page.append(
        h("div", "story-art" + (word ? "" : " story-emoji"), word ? artSvg(word) : shuffle(GREETING_ART)[0]),
        h("div", "story-row", `<div class="story-mascot">${pofudukSvg(p.avatar + p.name, "known")}</div><div class="bubble">${chunk.en}</div>`),
      );
      const ctrls = h("div", "story-ctrls");
      const nextBtn = h("button", "btn-big play", i === PAGES - 1 ? "🏁" : "▶");
      nextBtn.type = "button";
      ctrls.append(speakerButton(chunk.en), nextBtn);
      wrap.append(dots, page, ctrls);
      sfx.pop();
      await speak(chunk.en);
      await new Promise<void>((res) => (nextBtn.onclick = () => res()));
      sfx.tap();
    }
    save.story[theme.id] = (start + PAGES) % theme.chunks.length;
    await persist();
    go(next);
  };
}
