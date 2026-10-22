# Pofuduk Çiftliği

İlkokul 3. sınıf (TYMM İngilizce programı) için tarayıcıda çalışan, çevrimdışı oynanabilen bir İngilizce **pekiştirme** oyunu.
Sözcük = pofuduk yavrusu; çocuk doğru bildikçe pofuduklar çiftliğe katılır. Liderlik tablosu, reklam, hesap ve sunucu yoktur; tüm veri cihazda kalır.

- 6 ada = 6 tema, 258 sözcük, 54 kalıp
- 6 mikro oyun: dinle-dokun, oku-dokun, sürükle-eşleştir, harf dizme, kaydır doğru/yanlış, Yankı Mağarası (dinle-tekrarla-kaydet)
- Aralıklı tekrar, kişisel rekor, günde en çok 3 oturum, ebeveyn paneli (Türkçe, toplama kilidi)
- PWA: ana ekrana eklenip çevrimdışı çalışır

## Geliştirme

```
npm install
npm run dev        # http://localhost:5173
npm run build      # dist/
npm run validate   # içerik JSON doğrulama (Python 3)
```

Diğer araçlar ve tasarım kararları için `CLAUDE.md` dosyasına bakın.

## Kaynak

Müfredat: [TYMM İngilizce Dersi (Temel Eğitim), 3. sınıf](https://tymm.meb.gov.tr/ingilizce-dersi-temel-egitim). Bu proje resmî bir MEB ürünü değildir.
