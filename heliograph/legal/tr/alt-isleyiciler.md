---
version: 2026-09-03
status: taslak — sağlayıcı DPA/SCC'leri toplanacak
---

# Alt İşleyiciler

Bu liste `config` tablosundaki `legal.subprocessors` anahtarından üretilir ve değişince kullanıcılara e-posta ile bildirilir (30 gün önceden).

| Sağlayıcı | Amaç | Ülke | Aktarım aracı | Veri |
|---|---|---|---|---|
| Anthropic | Metin üretimi, sınıflandırma, kalite yargıcı | ABD | Standart sözleşme / SCC; eğitimde kullanmama | İçerik metinleri, yorum/mesaj metinleri (anonimleştirilmiş kimlik) |
| Google Cloud / Gemini (isteğe bağlı) | Görsel/ses üretimi yedeği | ABD/AB | SCC | İstemler |
| ElevenLabs | Seslendirme, ses klonu (rızayla) | ABD | SCC | Script metni, ses kayıtları |
| fal.ai | Görsel/video üretimi, LoRA eğitimi (rızayla) | ABD | SCC | İstemler, fotoğraflar |
| Cloudflare (R2, DNS) | Medya depolama, ağ | Küresel | SCC | Medya dosyaları |
| Hetzner | Sunucu barındırma | Almanya (AB) | AB içi | Tüm uygulama verileri |
| Paddle | Ödeme, fatura, vergi (MoR) | İngiltere | SCC / UK IDTA | Ad, e-posta, fatura adresi, ödeme durumu |
| iyzico (faz 2) | Türkiye ödemeleri | Türkiye | – | Ödeme verileri |
| Resend | İşlemsel e-posta, gelen e-posta | ABD | SCC | E-posta adresi, e-posta içeriği |
| Sentry | Hata izleme | ABD/AB (AB bölgesi seçilir) | SCC | Teknik loglar (maskeli) |
| Expo (EAS) | Mobil derleme ve push bildirimi | ABD | SCC | Push token'ı |
| Telegram | Alarm bildirimleri (operatörün kendi botu) | – | Kullanıcı tercihi | Alarm metni |

Sosyal medya platformları (Meta, Google/YouTube, TikTok, X, Telegram) alt işleyen değil, kullanıcının yetkilendirdiği **bağımsız veri sorumlularıdır**.
