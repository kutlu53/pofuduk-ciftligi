# Kazanım Eşlemesi — TYMM İngilizce 3. sınıf

Kaynak: tymm.meb.gov.tr ünite sayfaları (765, 773, 779, 780, 781, 782) ve program kılavuzu.
Her temada aynı çıktı şablonu vardır: L1-L4 (dinleme), R1-R4 (okuma), S1-S6 (konuşma), W1-W6 (yazma), P1 (fonetik), V1 (sözcük), G1 (dilbilgisi).

> **Doğrulama notu:** Aşağıdaki eşleme kod ailesi düzeyindedir. Her kodun tam ifadesi ünite sayfasından okunup
> pilot öncesi bu tabloya işlenmelidir (AÇIK). Kalıpların beceri etiketleri (L/R/S/W/G) `content/grade3/themeN.json`
> içindeki `chunks[].skills` alanındadır; okunabilir özeti `ICERIK_TABLOSU.md`.

## 1. Oyun → kazanım ailesi

| Mikro oyun | Birincil | İkincil | Gerekçe |
|---|---|---|---|
| 👂 Dinle-dokun | L1-L2 (sözcük/kalıp tanıma) | V1 | Sesi duyup resmi seçme = dinlediğini anlama, sözcük düzeyi |
| 👀 Oku-dokun | R1-R2 (sözcük okuma) | V1 | Yazılı sözcüğü tanıma |
| 🖐️ Sürükle-eşleştir | R1, V1 | — | Sözcük-resim eşleme |
| 🔤 Harf dizme | W1-W2 (harf/sözcük kopyalama), P1 | V1 | Harf sırası, ses-harf ilişkisi |
| ↔️ Kaydır | R2 (doğru/yanlış kararı) | L | Basit okuma kararı |
| ✍️ Çiz | W1-W2 (kopyalayarak yazma) | P1 | Parmakla izleme, harf biçimi |
| 🗣️ Yankı Mağarası | S1-S3 (model taklidi, kalıp söyleme) | L3-L4 | Dinle-tekrarla; değerlendirme yok |
| 📖 Hikâye parçası | L3-L4 (kısa kalıp/diyalog dinleme), R3 | — | Kalıplar bağlamda |
| 👑 Ada patronu | L1-L2, R1-R2 (hızlı tanıma) | — | Akıcılık |

Dilbilgisi (G1) açıkça öğretilmez; kalıplar (chunk) bütün olarak dinlenir/okunur (program yaklaşımı).

## 2. İçerik → kazanım

| İçerik türü | Kullanıldığı yer | Kazanım |
|---|---|---|
| `words[]` (258 sözcük) | tüm puanlı oyunlar, koleksiyon | V1, L1, R1, W1-W2, P1 |
| `chunks[]` (54 kalıp) | Yankı Mağarası, hikâye parçası | L3-L4, S1-S3, R3 (etiketlere göre) |
| `social[]` (66 ifade) | henüz oyunda değil (AÇIK: hikâye sayfalarına eklenebilir) | S4-S6 |
| `phonics[]` | harf dizme/çiz sözcük seçiminde öncelik verilebilir (AÇIK) | P1 |
| `performance` | ebeveyn panelinde görev tarifi; oyunda "ada patronu" olarak yansıtılır | tema sonu performans görevi |

## 3. Tema bazında kalıp beceri dağılımı

Aşağıdaki sayılar `chunks[].skills` etiketlerinden türetilmiştir (`python tools/kazanim.py` ile yeniden üretilir).

<!-- kazanim:start -->
| Tema | Kalıp | L | R | S | W | G |
|---|---|---|---|---|---|---|
| theme1 School Life | 14 | 9 | 9 | 7 | 2 | 3 |
| theme2 Classroom Life | 12 | 10 | 9 | 6 | 3 | 1 |
| theme3 Personal Life | 10 | 8 | 8 | 3 | 4 | 2 |
| theme4 Family Life | 8 | 6 | 6 | 3 | 4 | 3 |
| theme5 Homes & Houses & The Neighbourhood | 4 | 4 | 4 | 1 | 1 | 2 |
| theme6 Life in the City & the World | 6 | 5 | 4 | 4 | 2 | 1 |
<!-- kazanim:end -->

## 4. Kapsanmayan / zayıf kapsanan kazanımlar
- **W3-W6** (serbest/yönlendirilmiş yazma): oyun kapsamı dışında; sınıf/ev performans görevinde.
- **S4-S6** (sosyal ifadelerle etkileşim): sosyal ifadeler henüz oyunda kullanılmıyor.
- **Konuşma değerlendirmesi**: bilinçli olarak yok (ASR bu yaşta güvenilir değil).
