# legal/ — Hukuki metin taslakları

Bu klasördeki metinler **taslaktır**; yayın öncesi avukat incelemesi zorunludur (docs/16). Sürümleme: her dosyanın başındaki `version` alanı, `config` tablosundaki `legal.<doc>.version` anahtarı ile eşleşir; sürüm artınca kullanıcılar yeniden kabul eder (`consent_records`).

Yer tutucular (yayın öncesi doldurulur):

| Yer tutucu | Anlam |
|---|---|
| `{{SIRKET_UNVANI}}` | Ticari unvan (ör. "X Yazılım Ltd. Şti." veya şahıs adı) |
| `{{ADRES}}` | Kayıtlı adres |
| `{{MERSIS}}`, `{{VERGI_NO}}` | Kimlik numaraları |
| `{{EPOSTA_DESTEK}}`, `{{EPOSTA_KVKK}}` | İletişim adresleri |
| `{{ALAN_ADI}}` | Ürün alan adı |
| `{{MOR_SAGLAYICI}}` | Ödeme MoR (Paddle) |
| `{{TARIH}}` | Yürürlük tarihi |

Dosyalar:

```
tr/  gizlilik-politikasi.md · kullanim-sartlari.md · kvkk-aydinlatma-metni.md · kvkk-acik-riza-metni.md
     cerez-politikasi.md · mesafeli-satis-sozlesmesi.md · iptal-ve-iade-politikasi.md
     kabul-edilebilir-kullanim.md · veri-silme-talimatlari.md · alt-isleyiciler.md · ai-kullanim-beyani.md
en/  privacy-policy.md · terms-of-service.md · acceptable-use-policy.md · data-deletion.md · sub-processors.md · ai-disclosure.md
```

İngilizce metinler platform inceleyicileri (Meta, Google, TikTok, Apple) ve yurt dışı müşteriler içindir; Türkçe metinler Türkiye hukuku (KVKK, mesafeli satış) için birincildir. Çelişkide, Türkiye'deki tüketici için Türkçe metin geçerlidir.

## Eksik metinler (M1.8'de yazılacak; docs/16 §8)
`tr/veri-isleme-sozlesmesi-dpa.md` (+ SCC Modül 2 ve Kurul standart sözleşme ekleri), `tr/saklama-ve-imha-politikasi.md`, `tr/veri-sorumlusu-basvuru-formu.md`, `tr/takipci-aydinlatma-ornegi.md` (kiracının takipçilerine yönelik örnek), `tr/iys-onay-metni.md`, `tr/etbis-tanitici-bilgiler.md`, `tr/yas-politikasi.md`, `en/cookie-policy.md`, `en/refund-policy.md`, `en/security.md`, `en/dpa.md`.
