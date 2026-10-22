# Pofuduk Çiftliği (çalışma adı) — İlkokul İngilizce Pekiştirme Oyunu

> Bu dosya Claude Code için proje hafızasıdır. Karar değişirse önce burayı güncelle.
> "AÇIK" = henüz karar verilmemiş. Karar verilmiş maddeler "KARAR" ile işaretli.

## 1. Amaç
8-9 yaş (varsayım: 3. sınıf) çocuklar için, TYMM (Türkiye Yüzyılı Maarif Modeli) İngilizce programıyla uyumlu,
**tarayıcıdan çalışan (PWA, çevrimdışı)**, öğretmensiz ve tek başına oynanan bir **pekiştirme** oyunu.
Öğretmen sınıfta öğretir; oyun sözcük/kalıp/dinleme/okuma tekrarını eğlenceli ve tekrar oynanabilir yapar.

## 2. Tasarım ilkeleri (KARAR)
1. **Yazı az, eğlence çok.** Yönergeler ikon/animasyon/pofuduk sesiyle. Türkçe metin yalnızca ebeveyn ayarlarında.
2. **Oyun kendini tekrar etmemeli.** Tur = 5-6 mikro oyunluk zincir, her biri 10-15 sn, farklı hareket (dokun, sürükle, kaydır, çiz, dinle).
3. **Lig / liderlik tablosu / hayalet / robot rakip YOK.** Çocuk yalnızca kendi ilerlemesini ve kendi rekorunu görür.
4. **Etik:** loot box yok, rastgele ödül miktarı yok, seri (streak) cezası yok, reklam/satın alma yok, "bir tur daha" kancası hafif tutulur (3 turdan sonra dinlenme ekranı, günde en çok 3 oturum).
5. **Veri cihazda kalır** (localStorage/IndexedDB). Hesap, e-posta, sunucu yok. Takma ad + hazır avatar. Ses kayıtları cihazdan çıkmaz.
6. **Konuşma puanlanmaz** (ASR 8-9 yaş için güvenilir değil). "Yankı Mağarası": dinle-tekrarla-kaydet, tamamlayınca damga.
7. **Yanlış cevap puan kaybettirmez**, yalnızca kombo sıfırlanır.

## 3. Çekirdek döngü
- Merkez: **pofuduk koleksiyonu** (sözcük = pofuduk yavrusu; "Bildim" olunca çiftliğe katılır).
- 6 ada = 6 tema. Ada, sözcüklerin ≥%70'i "Bildim" olunca açılır.
- Sözcük durumları: Yeni → Tanıdık → Bildim → Usta (Usta: 3 farklı günde doğru, en az biri farklı modda).
- Puan: doğru 10; hız bonusu en çok +5 (çocuğun **kendi ortalamasına** göre); kombo en çok x3.
- Tur sonu: 1-3 yıldız, kişisel rekor çubuğu, "bu hafta +N sözcük", emoji ile duygu seçimi.
- Aralıklı tekrar: yanlış → aynı turun sonu + ertesi gün; doğru-yavaş → 2 gün; doğru-hızlı → 4-7 gün; Usta → haftalık yenileme.
  (Küçük yaşta aralıklı tekrar kanıtı karışık — Goossens ve ark. 2014 vs 2016 — pilotta ölç.)
- Çeşitlilik katmanları: haftalık açılan mikro oyun türleri, değiştiriciler (🐇 hızlı, 🔦 karanlık, 🧊 kaygan), ada görünümü, ada patronu (tek seferlik özel mikro oyun), ~5 turda bir hikâye parçası.

Ayrıntı: `docs/OYUN_TASARIMI.md`. Kazanım eşlemesi: `docs/KAZANIM_ESLEME.md`.

## 4. Müfredat dayanağı
- Kaynak: tymm.meb.gov.tr → İngilizce Dersi (Temel Eğitim) → 3. sınıf, ünite sayfaları 765, 773, 779, 780, 781, 782.
- Program kılavuzu: tymm.meb.gov.tr/upload/kilavuz/ingilizce-ogretim-programi-kilavuzu.pdf
- Her temada aynı çıktı şablonu: L1-L4 (dinleme), R1-R4 (okuma), S1-S6 (konuşma), W1-W6 (yazma), P1 (fonetik), V1 (sözcük), G1 (dilbilgisi).
- Dilbilgisi çözümlenmeden **kalıp (chunk)** olarak öğretilir; okuma çok kısa metin; yazma kopyalamayla başlar (W2); konuşma model taklidi.
- Her tema bir performans göreviyle biter (oyunda "tema sonu ödülü / patron" olarak yansıtılır, gerçek ürün sınıfta/evde yapılır).
- Program yapay zekâ destekli öğrenmeyi öğretmen gözetiminde öngörür → bu ürün **ev kullanımı** olarak konumlanır. (AÇIK: bu çelişki ürün metninde nasıl ifade edilecek)

## 5. İçerik
`content/grade3/theme1.json … theme6.json` + `content/ICERIK_TABLOSU.md` (okunabilir özet).
Şema (her tema dosyası):
```
id, grade, title_en, title_tr, program_url, subthemes[],
words[{id, en, tr, cat, modes[], asset{img, audio}}],
chunks[{id, en, tr, skills[]}], social[{en, tr}],
phonics[], performance{title_tr, steps_tr[]}, outcome_tags[]
```
- `modes`: o sözcüğün hangi mikro oyunlarda kullanılabileceği (listen, read, match, spell, say).
  Aylar resimlenemediği için `listen`/`match` almaz (read, spell, say). Çok kelimeli sözcükler `spell` almaz.
- `asset.img` / `asset.audio` şimdilik `null`; üretildikçe doldur. Dosya adı kuralı: `assets/img/<theme>/<id>.webp`, `assets/audio/<theme>/<id>.mp3`.
- `emoji`: geçici görsel (KARAR, MVP). Gerçek görsel gelince `asset.img` öncelikli olacak; `emoji` yedek kalır.
- Ses: gerçek kayıt gelene kadar tarayıcı TTS (`speechSynthesis`, İngilizce ses). Çevrimdışı TTS cihaza bağlıdır; pilotta kontrol et.
- Türkçe karşılıklar (`tr`) geliştirici/ebeveyn içindir, çocuk arayüzünde gösterilmez.
- Doğrulama: `python tools/validate.py` (Windows'ta `python3` yok). Tema 1-6 girildi ve doğrulandı (258 sözcük, 54 kalıp, 66 sosyal ifade).
- Aynı sözcük birden çok temada geçiyorsa (sunny, cake, help, milk…) aynı `id` kullanılır → ilerleme paylaşılır (bilinçli).
  Aynı tema içinde isim/fiil çakışırsa `_v` eki: `plant` / `plant_v`, `water` / `water_v`.
- Emoji'si belirsiz veya başka sözcükle çakışan sözcükler `listen`/`match` almaz (ör. aile üyeleri, vücut parçalarının çoğu, "coat"/"jacket").
  Gerçek görseller gelince bu modlar eklenebilir.

## 6. Teknik yön
- KARAR (2026-10-22): **Vite + TypeScript + DOM/CSS**, canvas motoru yok. Gerekçe: mikro oyunlar dokun/sürükle/kaydır
  türünde arayüz etkileşimleri; DOM dokunmatiği (Pointer Events) doğal destekler, paket ~40 KB, çevrimdışı önbellek basit,
  emoji + TTS ile varlıksız oynanabilir. Parçacık/efekt gerekirse tek bir sahne için PixiJS eklenebilir.
- Çevrimdışı: vite-plugin-pwa (Workbox, autoUpdate) + manifest; ses/görsel dosyaları glob ile önbelleğe girer.
- Depolama: IndexedDB (idb-keyval). Tek kayıt anahtarı `pofuduk.save.v1` (profil, sözcük durumları, gün/hafta sayaçları, ayarlar),
  ses kayıtları `pofuduk.rec.<chunkId>` (Blob). localStorage kullanılmıyor.
- Ebeveyn kilidi: basit toplama sorusu; süre sınırı ve sıfırlama ayarı orada.
- KARAR (2026-10-22): Ses üretimi **tarayıcı TTS** ile devam (`speechSynthesis`, İngilizce ses; "natural/neural" > Google UK > en-GB > herhangi en).
  Stüdyo kaydı ileride istenirse `asset.audio` dolduğunda `speak()` önce dosyayı çalacak şekilde genişletilir.
  Pilotta kontrol: hedef cihazlarda çevrimdışı İngilizce ses paketi var mı (Android: Google TTS, iOS: Siri sesleri).
- Ekran boyutları (2026-10-22): `tools/shots.mjs` telefon dikey/yatay, tablet dikey/yatay ve PC'de her ekranın görüntüsünü alır, taşmayı ölçer.
  Geniş ekranda sütun 640px'e çıkar ve ögeler büyür; telefon yatayda 4 sütunlu kart ızgarası ve küçük ögeler kullanılır.
- KARAR (2026-10-22): Görseller dışarıdan sağlanamıyor → **kod içi SVG illüstrasyon sistemi** (`src/art/index.ts`).
  Her sözcük 120×120 sahne: kategori rengi arka plan + `art` tarifi. Türler: `emoji`, `combo` (ana + rozet),
  `group` (çoğul), `body` (çizilmiş figür/yüz/el/ayak üzerinde vurgu), `family` (aile ağacı, hedef vurgulu),
  `color` (boya lekesi), `month` (takvim yaprağı + mevsim rozeti), `room` (oda sahnesi), `draw` (elle çizilmiş SVG: tahta, masa, kıyafet, tost…).
  Tarifler `tools/apply_art.py` içindeki ART sözlüğünden JSON'lara yazılır (tekrar çalıştırılabilir); resimlenebilir hale gelen
  sözcüklere listen/match açılır (PICTURE kümesi). Görsel kontrol: `?sheet=theme1` (veya `all`) sayfası + `node tools/sheet.mjs <klasör>`.
  Emoji'ler cihazın yazı tipiyle çizilir; Windows'ta bayrak emojileri "TR/GB" harfi olarak görünür (Android/iOS'ta bayrak).
  Koleksiyondaki pofuduk elinde hâlâ tek `emoji` tutar.
- Sunucu eklenirse KVKK ve veli onayı devreye girer (hukuki danışmanlık gerekir; bu dosya hukuki görüş değildir).

## 7. Yapılacaklar (sıra)
1. Hedef sınıfı doğrula (2/3/4) — AÇIK.
2. ~~Tema 1 için dikey dilim: 6 mikro oyun (MVP), 1 ada, pofuduk koleksiyonu, ilerleme kaydı.~~ YAPILDI (2026-10-22, bkz. §10).
   Eksik kalanlar: hikâye parçaları, değiştiriciler (🐇🔦🧊), ada patronu, haftalık açılan oyun türleri, çiz (trace) mikro oyunu.
3. ~~Ses/görsel varlık hattı.~~ Ses: TTS (KARAR). Görsel: SVG illüstrasyon sistemi (KARAR, 2026-10-22). PNG ikonlar: `node tools/icons.mjs`.
4. ~~Tema 2-6 içerik girişi.~~ YAPILDI (2026-10-22). Uygulama çok temalı: ada seçimi `save.currentTheme`, kilit `isUnlocked()`.
   Varlıklar (görsel/ses) hâlâ eksik; emoji + TTS ile oynanıyor.
5. Pilot: 8-10 çocukla gözlem; ölçümler: tur tamamlama, tekrar oynama, sözcük durumu geçişleri, aralıklı tekrar etkisi.
6. Ebeveyn paneli (okunur ilerleme raporu, Türkçe).

## 8. Açık sorular
- Hedef sınıf (2, 3 veya 4)? Varsayım: 3. sınıf.
- 3. sınıfın CEFR düzeyi sayfalardan okunmadı (kılavuzda A1.1-A1.3 / A2.x aralıkları var).
- Yaratık adı KARAR: "pofuduk" ("canavar" sert bulundu). Yedekler: tombik, kıpır, yumoş, minik dost. Oyun adı çalışma adı: Pofuduk Çiftliği. Sanat stili AÇIK.
- Konuşma modu: sadece kayıt-dinle mi, ASR denenecek mi?
- El yazısı/yazma becerisi oyun dışında kalıyor; "harf/sözcük kopyalama" mikro oyunu ile kısmen kapsanır.
- Etki ölçümü: ön-son test tasarımı.

## 9. Kaynaklar
- TYMM İngilizce 3. sınıf ünite sayfaları (yukarıda), program kılavuzu PDF.
- Çalışma örneği (yapı şablonu): Signal projesi CLAUDE.md (lise 9-12) — ayrı proje, bu dosyayla karışmasın.

## 10. Kod yapısı ve çalıştırma (MVP, Tema 1)
```
npm run dev        # geliştirme sunucusu
npm run build      # tsc --noEmit + vite build → dist/ (PWA, sw.js dahil)
npm run preview    # dist/ önizleme (http://localhost:4173)
npm run validate   # içerik JSON doğrulama
npm run art        # tools/apply_art.py: art tariflerini JSON'lara yaz
npm run smoke      # başsız Chrome ile uçtan uca duman testi (önce build + preview)
npm run shots -- <klasör>   # 5 ekran boyutunda görüntü + taşma raporu
npm run sheet -- <klasör>   # 6 temanın illüstrasyon sayfaları (PNG)
```
```
src/art/index.ts       artSvg(word): sözcük illüstrasyonu (SVG); DRAW kayıt defteri elle çizimler
src/ui/sheet.ts        geliştirici illüstrasyon sayfası (?sheet=themeN)
```
src/main.ts            giriş: SW kaydı, ses kilidi açma, kayıt yükleme, yönlendirme
src/core/types.ts      veri tipleri (Word, Theme, WordProgress, SaveData…)
src/core/content.ts    6 tema JSON yükleme, THEME_ICONS, UNLOCK_RATIO, spellingOf()
src/core/store.ts      IndexedDB kayıt, gün/hafta sayaçları, oturum/süre sınırı (playBlock), currentTheme(), isUnlocked()
src/core/srs.ts        sözcük aşaması (stageOf) ve aralıklı tekrar (applyAnswer)
src/core/scoring.ts    RoundScore: 10 puan + hız bonusu (kendi ortalamasına göre) × kombo, yıldız
src/core/round.ts      planRound: hedef seçimi (tekrarı gelen → yeni (≤3) → en eski) ve oyun sırası
src/core/audio.ts      speak() (TTS), sfx (WebAudio)
src/games/*.ts         6 mikro oyun: listenTap 👂, readTap 👀, dragMatch 🖐️, spellTap 🔤, swipe ↔️, echo 🗣️
src/ui/*.ts            ekranlar: onboarding, home (ada haritası), collection, round (HUD + zincir), summary, rest, parent
src/ui/pofuduk.ts      sözcük kimliğinden deterministik SVG pofuduk (yumurta → yavru → pofuduk → taçlı)
```
- Tur akışı: 5 puanlı oyun (karışık sıra) → yanlışlar varsa 1 tekrar oyunu → Yankı Mağarası (puansız) → özet.
- Çocuk arayüzünde yazı yok; yalnızca ikon, İngilizce sözcük ve ses. Türkçe yalnızca ebeveyn panelinde (⚙️ → toplama kilidi).
- Oturum: 3 tur → dinlenme ekranı; günde 3 oturum; ebeveyn günlük dakika sınırı koyabilir.
- Test: `tools/smoke.mjs` tüm akışı gerçek Chrome'da oynar; değişiklikten sonra çalıştır.
