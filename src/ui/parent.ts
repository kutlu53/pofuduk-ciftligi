import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { escapeHtml } from "./home";
import { h } from "../games/common";
import { themes } from "../core/content";
import { currentTheme, isUnlocked, persist, resetAll, save, stageCounts, MAX_SESSIONS_PER_DAY } from "../core/store";
import { onboarding } from "./onboarding";

/** Ebeveyn alanı (Türkçe): toplama kilidi, süre sınırı, ilerleme raporu, sıfırlama. */
export const parent: Screen = (root) => {
  const wrap = h("div", "screen parent");
  const a = 3 + Math.floor(Math.random() * 7);
  const b = 2 + Math.floor(Math.random() * 8);
  const lock = h("div", "lock");
  lock.append(h("p", "", "Ebeveyn alanı. Lütfen çözün:"), h("div", "lock-q", `${a} + ${b} = ?`));
  const input = h("input", "lock-input");
  input.type = "number";
  input.inputMode = "numeric";
  const ok = h("button", "btn", "Giriş");
  ok.type = "button";
  const back = h("button", "btn ghost", "Geri");
  back.type = "button";
  back.onclick = () => go(home);
  lock.append(input, h("div", "row", ""));
  lock.lastElementChild!.append(back, ok);
  wrap.append(lock);
  root.append(wrap);
  input.focus();

  const tryUnlock = () => {
    if (Number(input.value) === a + b) {
      lock.remove();
      renderPanel(wrap);
    } else {
      input.value = "";
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 500);
    }
  };
  ok.onclick = tryUnlock;
  input.onkeydown = (e) => {
    if (e.key === "Enter") tryUnlock();
  };
};

function renderPanel(wrap: HTMLElement): void {
  const p = save.profile!;
  const theme = currentTheme();
  const mins = Math.round(save.day.playedMs / 60000);
  const lastEmotions = p.emotions.slice(-7).map((e) => e.emoji).join(" ") || "—";

  const rows = themes
    .map((t, i) => {
      const c = stageCounts(t.id);
      const stamps = t.chunks.filter((ch) => save.echoStamps.includes(ch.id)).length;
      const state = isUnlocked(i) ? (t.id === theme.id ? "seçili" : "açık") : "kilitli";
      return `<tr><td>${i + 1}. ${escapeHtml(t.title_tr)}</td><td>${state}</td><td>${c.new}</td><td>${c.familiar}</td><td>${c.known}</td><td>${c.master}</td><td>${stamps}/${t.chunks.length}</td></tr>`;
    })
    .join("");

  const panel = h("div", "panel");
  panel.innerHTML = `
    <h2>Ebeveyn Paneli</h2>
    <p class="muted">Veriler yalnızca bu cihazda saklanır. Hesap, sunucu veya reklam yoktur.</p>

    <h3>Çocuk</h3>
    <p>${p.avatar} ${escapeHtml(p.name) || "(takma ad yok)"} · ${p.rounds} tur oynandı · en iyi puan ${p.bestScore}</p>

    <h3>Bugün</h3>
    <p>${mins} dk oyun · ${save.day.sessions}/${MAX_SESSIONS_PER_DAY} oturum</p>

    <h3>Adalar (temalar)</h3>
    <table class="report themes">
      <tr><th>Tema</th><th>Durum</th><th>Yeni</th><th>Tanıdık</th><th>Bildim</th><th>Usta</th><th>Yankı</th></tr>
      ${rows}
    </table>
    <p class="muted">Ada açılma koşulu: bir önceki adanın sözcüklerinin %70'i "Bildim" veya üstü. "Yankı": Yankı Mağarası damgası alınan kalıp sayısı.</p>

    <h3>Son duygular</h3>
    <p>${lastEmotions}</p>

    <h3>Günlük süre sınırı</h3>
  `;
  const sel = h("select", "select");
  for (const m of [0, 10, 15, 20, 30]) {
    const o = h("option", "", m === 0 ? "Sınırsız" : `${m} dakika`);
    o.value = String(m);
    if (m === save.settings.dailyMinutes) o.selected = true;
    sel.append(o);
  }
  sel.onchange = async () => {
    save.settings.dailyMinutes = Number(sel.value);
    await persist();
  };
  panel.append(sel);

  const perf = h("div", "");
  perf.innerHTML = `<h3>Seçili tema (${escapeHtml(theme.title_tr)}) – performans görevi (sınıf/ev)</h3>
    <p><b>${escapeHtml(theme.performance.title_tr)}</b></p>
    <ul>${theme.performance.steps_tr.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    <p class="muted"><a href="${theme.program_url}" target="_blank" rel="noopener">TYMM ünite sayfası</a></p>`;
  panel.append(perf);

  const danger = h("div", "danger");
  danger.append(h("h3", "", "Sıfırlama"));
  const resetBtn = h("button", "btn warn", "Tüm ilerlemeyi sil");
  resetBtn.type = "button";
  let armed = false;
  resetBtn.onclick = async () => {
    if (!armed) {
      armed = true;
      resetBtn.textContent = "Emin misiniz? Tekrar dokunun";
      setTimeout(() => {
        armed = false;
        resetBtn.textContent = "Tüm ilerlemeyi sil";
      }, 4000);
      return;
    }
    await resetAll();
    go(onboarding);
  };
  danger.append(resetBtn);
  panel.append(danger);

  const back = h("button", "btn", "Oyuna dön");
  back.type = "button";
  back.onclick = () => go(home);
  panel.append(back);
  wrap.append(panel);
}
