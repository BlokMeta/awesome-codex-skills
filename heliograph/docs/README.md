# Heliograph — Teknik Dokümantasyon

Bu klasör projenin **kalıcı hafızası**dır. Ajan (Claude/Codex) ve insanlar her işe buradan başlar. Sohbet geçmişi değil, bu dosyalar geçerlidir.

| # | Doküman | İçerik |
|---|---|---|
| – | [`../CLAUDE.md`](../CLAUDE.md) | Değişmez kurallar, çalışma protokolü, komutlar (önce bu) |
| 01 | [Sistem mimarisi](01-mimari.md) | C4, bounded context'ler, hexagonal katmanlar, ana akışlar |
| 02 | [Teknoloji seçimleri](02-teknoloji-secimleri.md) | Sürümlü stack, gerekçeler, reddedilenler |
| 03 | [Kodlama kuralları](03-kodlama-kurallari.md) | Adlandırma, hata yönetimi, modül yapısı, yasaklar |
| 04 | [Test ve kalite](04-test-ve-kalite.md) | Piramit, mock politikası, 17 CI kapısı, Definition of Done |
| 05 | [API sözleşmesi](05-api-sozlesmesi.md) | Contract-first, cursor sayfalama, Problem Details, idempotency, uç nokta envanteri |
| 06 | [i18n](06-i18n.md) | ICU, dil paketi ekleme prosedürü, RTL, sahte dil |
| 07 | [Tasarım sistemi](07-tasarim-sistemi.md) | Kimlik, token'lar, tipografi, imza bileşenler, web ve mobil bilgi mimarisi |
| 08 | [Güvenlik](08-guvenlik.md) | ASVS L2, token şifreleme, prompt injection, KVKK/GDPR |
| 09 | [Gözlemlenebilirlik](09-gozlemlenebilirlik.md) | OTel, iş metrikleri, SLO, alarmlar, panolar |
| 10 | [CI/CD ve dağıtım](10-ci-cd-ve-dagitim.md) | Pipeline'lar, ortamlar, migration politikası, mobil yayın, rollback |
| 11 | [Veri modeli](11-veri-modeli.md) | Modül başına tablolar, indeksler, saklama süreleri |
| 12 | [Teknik yol haritası](12-teknik-yol-haritasi.md) | M0–M6 epikler, hikâyeler, kabul kriterleri (canlı) |
| 13 | [Referanslar ve skill'ler](13-referanslar-ve-skills.md) | Kullanılacak skill'ler, örnek repolar, ajan hafızası düzeni |
| 14 | [Operatör kurulum listesi](14-operator-kurulum-listesi.md) | Senin yapacakların: hesaplar, anahtarlar, başvurular, env eşlemesi (`.env.example`) |
| 15 | [İş modeli ve monetizasyon](15-is-modeli-ve-monetizasyon.md) | Fiyatlandırma, ödeme rayları, planlar/haklar, mağaza kuralları, pazarlama, reklam/sponsorluk geliri |
| 16 | [Hukuk ve uyum](16-hukuk-ve-uyum.md) | KVKK, GDPR, e-ticaret/mesafeli satış, platform geliştirici politikaları, AI Act; `legal/` metin envanteri |
| – | [`../legal/`](../legal/) | Yayınlanacak hukuki metin taslakları (tr/en), sürümlü |
| adr | [`adr/`](adr/) | Mimari karar kayıtları (MADR) |
| – | [Ürün araştırması](../../research/sosyal-medya-otomasyon-yol-haritasi.md) | Fizibilite, platform kuralları, fiyatlar, hukuk |

## Değişiklik kuralı

Bir doküman değişince: (1) ilgili ADR eklenir/güncellenir, (2) `CLAUDE.md` özetiyle çelişmediği kontrol edilir, (3) PR'da `docs:` etiketi.
