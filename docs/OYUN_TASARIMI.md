# Pofuduk Çiftliği — Oyun Tasarımı

Bu belge, kodda **uygulanmış** mekanikleri anlatır. Karar gerekçeleri ve açık sorular için `CLAUDE.md`.

## 1. Çekirdek fantezi
Çocuk, bir çiftlikte pofuduk yavruları toplar. Her İngilizce sözcük bir pofuduktur:
yumurta (Yeni) → çatlayan yumurta (Tanıdık) → pofuduk (Bildim) → taçlı pofuduk (Usta).
Altı ada altı temadır; adalar sırayla açılır.

## 2. Ekranlar
| Ekran | Amaç |
|---|---|
| Başlangıç | Hazır avatar seç, istersen takma ad yaz. Hesap yok. |
| Ada haritası | 6 ada; açık olanlardan birini seç, ▶ ile tur başlat. İlerleme halkası = Bildim oranı. 👑 rozeti = patron hazır. |
| Tur | HUD (oyun noktaları, puan, kombo) + mikro oyun zinciri. ✖ ile çıkılabilir, cevaplar kaydedilmiş olur. |
| Özet | 1-3 yıldız, kişisel rekor çubuğu, "bu hafta +N pofuduk", duygu seçimi (😄🙂😐😕), 🏠 / ▶. |
| Hikâye parçası | Her 5 turda bir, 3 sayfa: pofuduk temanın kalıplarını söyler. |
| Dinlenme | 3 turdan sonra; oturumu kapatır. |
| Koleksiyon | Ada sekmeleri, pofuduk ızgarası; dokununca sözcük seslendirilir ve büyük görsel açılır. |
| Ebeveyn | Türkçe. Toplama kilidi. Rapor, süre sınırı, sözcük listesi, kayıt dinleme, yedek, sıfırlama. |

Çocuk arayüzünde Türkçe yazı yoktur; yönergeler ikon + ses + animasyondur.

## 3. Tur yapısı
1. **5 puanlı mikro oyun**, açık türlerden rastgele sırayla (aynı tür tekrar etmez).
2. Yanlış cevaplanan sözcükler varsa **1 tekrar oyunu** (en çok 3 sözcük).
3. **Yankı Mağarası** (puansız): bir kalıbı dinle, basılı tutup söyle, kendini dinle, damga al.
4. Özet.

Hedef sözcükler (6): önce tekrar zamanı gelenler, sonra en çok 3 yeni, kalanı en uzun süredir görülmeyenler.
En az 3 hedef resimli olur (dinleme/eşleştirme için).

## 4. Mikro oyunlar
| İkon | Ad | Hareket | Beceri | Not |
|---|---|---|---|---|
| 👂 | Dinle-dokun | dokun | L | Ses → 4 resimden doğrusu. 3 soru. |
| 👀 | Oku-dokun | dokun | R | Yazılı sözcük → 4 resim. Cevaptan sonra ses. 3 soru. |
| 🖐️ | Sürükle-eşleştir | sürükle | R | 3 etiketi 3 resme taşı. İlk deneme puanlanır. |
| 🔤 | Harf dizme | dokun | W/P | Resim + ses → karışık harfleri sırayla diz. Yanlış harf sadece titrer. 2 sözcük. |
| ↔️ | Kaydır | kaydır | R | Resim-sözcük uyuyor mu? Sağ ✅ / sol ❌ (düğmeler de var). 4 kart. |
| ✍️ | Çiz | çiz | W | Sözcüğü parmakla izle; harflerin %70'i boyanınca tamam. Hız bonusu yok. 7. günde açılır. |
| 🗣️ | Yankı Mağarası | bas-tut | S | Kalıp dinle-tekrarla-kaydet. Puanlanmaz (ASR yok). Mikrofon yoksa "söyledim" düğmesi. |

Her oyun ~10-20 sn. Resimler: `src/art` SVG illüstrasyon sistemi (emoji + çizim).

## 5. Puan ve geri bildirim
- Doğru: **10** + hız bonusu (0-5, çocuğun **kendi** ortalama tepki süresine göre) × kombo (1, ×2 ≥3 seri, ×3 ≥6 seri).
- Yanlış: puan düşmez, kombo sıfırlanır, doğru cevap gösterilir.
- Yıldız: doğruluk ≥%90 → 3, ≥%70 → 2, altı → 1.
- Kişisel rekor çubuğu: yalnızca kendi en iyi puanıyla karşılaştırır. Lig/rakip yoktur.
- Pofuduk "Bildim" olunca turun ortasında kısa bir çatlama animasyonu ve cıvıltı.

## 6. Sözcük durumları ve aralıklı tekrar
| Durum | Koşul |
|---|---|
| Yeni | hiç doğru yok |
| Tanıdık | ≥1 doğru |
| Bildim | ≥3 doğru ve son 2 cevap doğru |
| Usta | 3 farklı günde doğru ve ≥2 farklı modda doğru |

Tekrar zamanı: yanlış → ertesi gün (+ aynı turun sonunda); doğru-yavaş → 2 gün; doğru-hızlı → 4 gün (seri <3) / 7 gün; Usta → 7 gün.
"Yavaş" = kendi ortalamasının %115'inden uzun.

## 7. Çeşitlilik katmanları
- **Haftalık açılan oyun türleri**: ✍️ çiz 7. günde. Açılış ana ekranda bir kez kutlanır. (`UNLOCKS`)
- **Değiştiriciler**: 2. turdan itibaren %50 olasılıkla tek bir oyuna:
  🐇 hızlı (7 sn içinde doğru → +5), 🔦 karanlık (parmağın çevresi aydınlık), 🧊 kaygan (kartlar kıpırdar).
- **Ada patronu**: ada %70 Bildim'e ulaşınca 👑. 5 hızlı oyun, Yankı yok, doğruluk ≥%75 → geçildi.
  Sonraki ada ancak patron geçilince açılır. Kaybedince ceza yok, tekrar denenebilir.
- **Hikâye parçası**: her 5 turda bir; temanın kalıpları sırayla, ilgili sözcük illüstrasyonuyla.

## 8. Sağlıklı kullanım
- 3 tur → dinlenme ekranı (oturum biter). Günde en çok 3 oturum.
- Ebeveyn günlük dakika sınırı koyabilir (0 = sınırsız). Sınır dolunca ▶ yerine 🌙.
- Loot box, rastgele ödül, seri cezası, reklam, satın alma yoktur.
- Veri yalnızca cihazda (IndexedDB). Ses kayıtları cihazdan çıkmaz. Ebeveyn JSON yedek alıp geri yükleyebilir.

## 9. Bilinen sınırlar
- Konuşma değerlendirilmez.
- El yazısı yalnızca parmakla izleme kadar kapsanır.
- Emoji görünümü cihaza göre değişir (Windows'ta bayraklar harf olarak görünür).
- TTS sesi cihazın İngilizce ses paketine bağlıdır.
