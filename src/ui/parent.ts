import type { Screen } from "./router";
import { go } from "./router";
import { home } from "./home";
import { escapeHtml } from "./home";
import { h } from "../games/common";
import { themes } from "../core/content";
import {
  bossReady,
  currentTheme,
  exportSave,
  getProgress,
  getRecording,
  importSave,
  isUnlocked,
  persist,
  resetAll,
  save,
  stageCounts,
  todayKey,
  MAX_SESSIONS_PER_DAY,
} from "../core/store";
import { stageOf } from "../core/srs";
import { onboarding } from "./onboarding";
import type { Stage } from "../core/types";

const STAGE_TR: Record<Stage, string> = { new: "Yeni", familiar: "Tanıdık", known: "Bildim", master: "Usta" };

/** Ebeveyn alanı (Türkçe): toplama kilidi, süre sınırı, ilerleme raporu, sözcük listesi, kayıtlar, yedek, sıfırlama. */
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
  const row = h("div", "row", "");
  row.append(back, ok);
  lock.append(input, row);
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

function fmtDue(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const today = todayKey();
  const key = todayKey(d);
  if (key <= today) return "bugün";
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

function weekSummary(): string {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceKey = todayKey(since);
  const rows = save.log.filter((l) => l.d >= sinceKey);
  if (!rows.length) return "Bu hafta henüz tur oynanmadı.";
  const days = new Set(rows.map((r) => r.d)).size;
  const mins = Math.round(rows.reduce((s, r) => s + r.sec, 0) / 60);
  const acc = Math.round((rows.reduce((s, r) => s + r.acc, 0) / rows.length) * 100);
  const starsAvg = (rows.reduce((s, r) => s + r.stars, 0) / rows.length).toFixed(1);
  const bosses = rows.filter((r) => r.boss).length;
  return `Son 7 gün: ${rows.length} tur, ${days} gün, ${mins} dk, ortalama doğruluk %${acc}, ortalama ${starsAvg} yıldız${bosses ? `, ${bosses} patron turu` : ""}.`;
}

function renderPanel(wrap: HTMLElement): void {
  const p = save.profile!;
  const theme = currentTheme();
  const mins = Math.round(save.day.playedMs / 60000);
  const lastEmotions = p.emotions.slice(-7).map((e) => e.emoji).join(" ") || "—";

  const rows = themes
    .map((t, i) => {
      const c = stageCounts(t.id);
      const stamps = t.chunks.filter((ch) => save.echoStamps.includes(ch.id)).length;
      const base = isUnlocked(i) ? (t.id === theme.id ? "seçili" : "açık") : "kilitli";
      const state = save.bosses.includes(t.id) ? base + " · patron geçildi 👑" : bossReady(t.id) ? base + " · patron bekliyor" : base;
      return `<tr><td>${i + 1}. ${escapeHtml(t.title_tr)}</td><td>${state}</td><td>${c.new}</td><td>${c.familiar}</td><td>${c.known}</td><td>${c.master}</td><td>${stamps}/${t.chunks.length}</td></tr>`;
    })
    .join("");

  const panel = h("div", "panel");
  panel.innerHTML = `
    <h2>Ebeveyn Paneli</h2>
    <p class="muted">Veriler yalnızca bu cihazda saklanır. Hesap, sunucu veya reklam yoktur.</p>

    <h3>Çocuk</h3>
    <p>${p.avatar} ${escapeHtml(p.name) || "(takma ad yok)"} · ${p.rounds} tur oynandı · en iyi puan ${p.bestScore} · ilk gün ${p.firstDay}</p>

    <h3>Bugün</h3>
    <p>${mins} dk oyun · ${save.day.sessions}/${MAX_SESSIONS_PER_DAY} oturum</p>

    <h3>Bu hafta</h3>
    <p>${weekSummary()}</p>

    <h3>Adalar (temalar)</h3>
    <table class="report themes">
      <tr><th>Tema</th><th>Durum</th><th>Yeni</th><th>Tanıdık</th><th>Bildim</th><th>Usta</th><th>Yankı</th></tr>
      ${rows}
    </table>
    <p class="muted">Ada açılma koşulu: bir önceki adanın sözcüklerinin %70'i "Bildim" veya üstü ve ada patronunun geçilmesi (👑 hızlı tur, doğruluk ≥ %75). "Yankı": Yankı Mağarası damgası alınan kalıp sayısı.</p>

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

  // Sözcük listesi (seçili tema)
  const words = h("details", "");
  const wordRows = theme.words
    .map((w) => {
      const pr = getProgress(w.id);
      const st = stageOf(pr);
      return `<tr><td>${escapeHtml(w.en)}</td><td class="muted">${escapeHtml(w.tr)}</td><td>${STAGE_TR[st]}</td><td>${pr ? `${pr.correct}/${pr.correct + pr.wrong}` : "—"}</td><td>${pr ? fmtDue(pr.due) : "—"}</td></tr>`;
    })
    .join("");
  words.innerHTML = `<summary>Sözcük listesi – ${escapeHtml(theme.title_tr)} (${theme.words.length})</summary>
    <table class="report words"><tr><th>Sözcük</th><th>Türkçe</th><th>Durum</th><th>Doğru/Toplam</th><th>Tekrar</th></tr>${wordRows}</table>`;
  panel.append(h("h3", "", "Sözcükler"), words);

  // Yankı Mağarası kayıtları
  const recs = h("details", "");
  recs.innerHTML = `<summary>Yankı Mağarası kayıtları (${save.echoStamps.length})</summary>`;
  const list = h("div", "rec-list");
  const stamped = theme.chunks.filter((c) => save.echoStamps.includes(c.id));
  if (!stamped.length) list.append(h("p", "muted", "Bu temada henüz kayıt yok."));
  for (const c of stamped) {
    const rowEl = h("div", "rec-row");
    const play = h("button", "btn ghost mini", "▶");
    play.type = "button";
    play.onclick = async () => {
      const blob = await getRecording(c.id);
      if (!blob) {
        play.textContent = "kayıt yok";
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      void audio.play();
    };
    rowEl.append(play, h("span", "", `${escapeHtml(c.en)} <span class="muted">— ${escapeHtml(c.tr)}</span>`));
    list.append(rowEl);
  }
  recs.append(list);
  panel.append(h("h3", "", "Kayıtlar"), recs);

  // Performans görevi
  const perf = h("div", "");
  perf.innerHTML = `<h3>Seçili tema (${escapeHtml(theme.title_tr)}) – performans görevi (sınıf/ev)</h3>
    <p><b>${escapeHtml(theme.performance.title_tr)}</b></p>
    <ul>${theme.performance.steps_tr.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
    <p class="muted"><a href="${theme.program_url}" target="_blank" rel="noopener">TYMM ünite sayfası</a></p>`;
  panel.append(perf);

  // Yedek
  const backup = h("div", "");
  backup.append(h("h3", "", "Yedek"));
  const exp = h("button", "btn ghost", "Yedek indir (JSON)");
  exp.type = "button";
  exp.onclick = () => {
    const blob = new Blob([exportSave()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const aEl = document.createElement("a");
    aEl.href = url;
    aEl.download = `pofuduk-yedek-${todayKey()}.json`;
    aEl.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const impInput = h("input", "");
  impInput.type = "file";
  impInput.accept = "application/json,.json";
  impInput.hidden = true;
  const imp = h("button", "btn ghost", "Yedekten geri yükle");
  imp.type = "button";
  imp.onclick = () => impInput.click();
  const impMsg = h("p", "muted", "");
  impInput.onchange = async () => {
    const f = impInput.files?.[0];
    if (!f) return;
    try {
      await importSave(await f.text());
      impMsg.textContent = "Yedek yüklendi.";
      go(home);
    } catch (e) {
      impMsg.textContent = "Yüklenemedi: " + (e instanceof Error ? e.message : String(e));
    }
  };
  const brow = h("div", "row", "");
  brow.append(exp, imp);
  backup.append(brow, impInput, impMsg, h("p", "muted", "Ses kayıtları yedeğe dahil değildir."));
  panel.append(backup);

  // Sıfırlama
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

  const backBtn = h("button", "btn", "Oyuna dön");
  backBtn.type = "button";
  backBtn.onclick = () => go(home);
  panel.append(backBtn);
  wrap.append(panel);
}
