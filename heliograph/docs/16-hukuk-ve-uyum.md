# 16 — Hukuk ve Uyum

> Durum: İlk sürüm, 3 Eylül 2026. Bu doküman hukuki tavsiye değildir; ürünün nasıl **uyumlu inşa edileceğini** tanımlar. Yayın öncesi bir avukat (KVKK + tüketici hukuku) ve mali müşavir incelemesi zorunludur. ⚠ = doğrulanacak rakam/kural. Metin taslakları `legal/` altındadır ve sürümlenir; kullanıcı kabulleri `consent_records` tablosuna yazılır.

## 1. Roller ve kapsam

| Konu | Rolümüz | Sonuç |
|---|---|---|
| Kullanıcı hesabı, ödeme, kullanım verileri | **Veri sorumlusu** (KVKK) / controller (GDPR) | Aydınlatma, açık rıza, VERBİS değerlendirmesi, saklama/imha |
| Kullanıcının bağladığı hesaplardaki üçüncü kişi verileri (yorum/DM yazarları) | Kullanıcı adına **veri işleyen** (processor); kullanıcı veri sorumlusu | Kullanıcı ile **Veri İşleme Sözleşmesi (DPA)**; amaç sınırlaması; anonimleştirme |
| AI ile üretilen içerik | AI sistemi **sağlayıcısı** (kendi geliştirdiğimiz sistem) ve kullanıcı için **dağıtıcı** aracı | EU AI Act Md. 50: makine-okunur işaretleme; chatbot/yanıt botu için beyan seçeneği; deepfake etiketi |
| Platform API'leri | Geliştirici (Meta/Google/TikTok/X şartlarına tabi) | App review, veri silme callback'i, Limited Use, saklama sınırları |
| Satış | Satıcı (MoR üzerinden) / e-ticaret hizmet sağlayıcısı | Mesafeli satış, cayma, ETBİS, İYS |

## 2. KVKK (6698) uyum planı

1. **Envanter:** `docs/11` veri modeli üzerinden kişisel veri envanteri (`legal/tr/veri-envanteri.md`, M1.8'de üretilecek): veri kategorisi, amaç, hukuki sebep, saklama süresi, aktarım.
2. **Aydınlatma:** kayıt, kanal bağlama, ödeme ve inbox ekranlarında bağlam duyarlı aydınlatma (Tebliğ'e uygun: veri sorumlusu kimliği, amaç, aktarım, yöntem/hukuki sebep, haklar). Metin: `legal/tr/kvkk-aydinlatma-metni.md`.
3. **Hukuki sebep haritası:** sözleşmenin ifası (hesap, yayın), meşru menfaat (güvenlik, ürün analitiği), açık rıza (pazarlama iletileri, ses klonu/yüz LoRA gibi biyometrik-benzeri veriler, yurt dışı aktarım için gerekirse).
4. **Yurt dışına aktarım (7499 sayılı Kanun değişikliği, 2024):** LLM/TTS/depolama sağlayıcıları yurt dışında. Yol: (a) yeterlilik kararı olan ülke/kuruluş varsa ona göre, (b) yoksa **Standart Sözleşme** (Kurul'un yayımladığı) imzalanıp **5 iş günü içinde Kurum'a bildirim** ⚠, (c) açık rıza yalnızca istisnai. Sağlayıcı DPA'ları (Anthropic, Google, ElevenLabs, fal, Cloudflare, Paddle) `legal/tr/alt-isleyiciler.md`'de listelenir.
5. **VERBİS:** yıllık çalışan < 50 ve bilanço < 100 M TL ⚠ ise ve özel nitelikli veri ana faaliyet değilse kayıt zorunlu değil; ses klonu (biyometrik sayılabilir) ana faaliyet olmadığından muafiyet değerlendirilir; **avukat teyidi**. Eşikler `config`'te izlenir.
6. **Saklama ve imha politikası:** `docs/11 §14` süreleri; periyodik imha 6 ayda bir; `privacy` modülü cron'u.
7. **İhlal bildirimi:** 72 saat içinde Kurul'a; runbook `docs/runbooks/veri-ihlali.md`.
8. **Veri sahibi hakları:** başvuru kanalı (e-posta + panel), 30 gün yanıt; `POST /privacy/erasure`, `data_exports`.
9. **Çerezler:** Kurul çerez rehberine uygun banner; zorunlu çerezler rızasız, analitik/pazarlama rıza ile; `legal/tr/cerez-politikasi.md`.
10. **Cezalar ⚠ (2026 yeniden değerleme):** aydınlatma ihlali ~ yüz binlerce TL'den, veri güvenliği ihlali milyonlarca TL'ye; `config`'te bilgi amaçlı.

## 3. GDPR (AB/UK müşterileri)

- Hukuki dayanak eşlemesi KVKK ile paralel; ek: **Md. 27 AB temsilcisi** (AB'de yerleşik değilsek ve düzenli işleme varsa; hizmet sağlayıcılar ~100–300 €/yıl ⚠), DPA + **SCC** (alt işleyicilerle), DSAR 30 gün, çerez rızası (ePrivacy), veri koruma etki değerlendirmesi (AI yanıt botu için önerilir).
- UK için UK-GDPR temsilcisi ayrıca.
- Faturalama MoR üzerinden olduğu için KDV/OSS yükümlülüğü yok.

## 4. Tüketici ve e-ticaret (Türkiye)

- **Mesafeli Sözleşmeler Yönetmeliği:** ön bilgilendirme (fiyat, süre, cayma, iptal), sözleşme metni kalıcı veri saklayıcısında; **cayma hakkı 14 gün**, dijital içerik/hizmet **kullanıcının onayıyla hemen başlarsa** istisna (onay kutusu + metin: "hizmetin hemen başlamasını ve cayma hakkımı kaybedeceğimi kabul ediyorum"); yine de ilk 14 günde "koşulsuz iade" ürün politikası olarak sunulur (güven).
- **Abonelik:** otomatik yenileme açıkça bildirilir; **iptal, aboneliğe girişten zor olamaz** (tek tık, panel + mobil); yenileme öncesi hatırlatma e-postası (yıllık planda 15 gün önce).
- **6563 E-Ticaret Kanunu:** ETBİS kaydı; sitede unvan, adres, MERSİS, iletişim; **İYS**: pazarlama e-posta/SMS için önce izin, İYS'ye kayıt, her iletide çıkış linki; işlemsel e-postalar izin gerektirmez.
- **Fiyat gösterimi:** KDV dahil; TRY fiyat gösteriliyorsa Türk Lirası zorunluluğu (Türkiye'deki tüketiciye TRY ile sözleşme) ⚠ → iyzico aşamasında TRY liste.

## 5. AB Yapay Zekâ Yasası ve AI şeffaflığı

- Md. 50(2): ürettiğimiz görsel/ses/video makine-okunur işaretli (sağlayıcı SynthID/C2PA korunur; kendi render'larımıza IPTC `DigitalSourceType=trainedAlgorithmicMedia` + mümkünse C2PA manifesti).
- Md. 50(1): AI yanıt botu kullanan kullanıcıya, yanıtların AI olduğunu belirtme seçeneği ve varsayılanı (persona bio notu veya yanıt imzası); AB hedefli hesaplarda **varsayılan açık**.
- Md. 50(4): gerçekçi sentetik insan/ses → zorunlu etiket alanı; "haber gibi" metinlerde insan editoryal onayı (onay kuyruğu = editoryal sorumluluk kaydı).
- Türkiye 1 Ağustos 2026 yönetmeliği: sanal influencer reklamlarında AI beyanı ve `#reklam` zorunlu alan (sistem zorlar).

## 6. Platform geliştirici politikaları (üçüncü taraf hesaplara hizmet)

| Platform | Zorunluluk | Üründe karşılığı |
|---|---|---|
| **Meta** (IG/Threads) | App Review + **Business Verification** (Advanced Access); Gizlilik Politikası URL; **Data Deletion Callback** veya Veri Silme Talimatları URL'si; veri saklama sınırları; Platform Terms (kullanıcı verisini yalnızca beyan edilen amaçla); yıllık **Data Protection Assessment**; mesajlaşma 24 saat penceresi | `legal/*/veri-silme-talimatlari`, `POST /webhooks/meta/data-deletion` (imzalı istek → `erasure_requests` + onay kodu sayfası), saklama cron'u, DPA anketi runbook'u |
| **Google** (YouTube) | OAuth doğrulaması: marka doğrulama, gizlilik politikası, demo video; `youtube.upload`/`force-ssl` **hassas** kapsam (CASA güvenlik değerlendirmesi kısıtlı kapsamlarda; YouTube kapsamları için ⚠ teyit); **Limited Use** politikası (veriyi yalnızca kullanıcıya görünen özellik için; reklam/satış yok; insan erişimi sınırlı) | Limited Use beyanı gizlilik politikasında; yetki kapsamı minimum; token'lar kullanıcı bağlantıyı kesince silinir |
| **TikTok** | App review + Content Posting audit; veri işleme beyanı; kullanıcı gizlilik seçimi zorunlu | Gizlilik düzeyi seçici UI; audit demo |
| **X** | Developer Agreement: X içeriğini saklama/silme kuralları (X'te silinen içerik bizde de silinir ⚠ periyodik uyum), otomasyon etiketleri, AI yanıt onayı | `EngagementSweep` silinen yorumları temizler; "Automated" kontrol listesi |
| **Telegram** | Bot ToS; spam yasağı | Kullanıcı kendi botu; hız sınırları config'te |
| **Apple / Google Play** | Gizlilik etiketleri (App Privacy / Data Safety), **uygulama içinden hesap silme**, ATT (izleme yoksa gerekmez), abonelik ise IAP kuralı (docs/15 §2.2) | Hesap silme ekranı; gizlilik formu envanterden üretilir |

## 7. Ürün içi uyum kontrolleri (kod düzeyinde)

- `consent_records`: her metin sürümü kabulü (IP, UA, zaman); metin değişince yeniden kabul akışı.
- Onboarding zorunlu kutuları: Şartlar + Gizlilik (tek kutu), KVKK aydınlatma (bilgilendirme, kutu yok), mesafeli satış ön bilgilendirme + hemen başlama onayı (ödeme adımında), pazarlama izni (ayrı, varsayılan kapalı).
- Reklam/iş birliği içerik tipi: `labels.ad` zorunlu; sentetik insan/ses: `labels.aiDisclosed` zorunlu; UI'da kapatılamaz.
- Hesap silme: panel + mobil; 30 gün bekleme; tüm token revoke; Meta callback'i aynı yolu kullanır.
- Yorum/DM metinleri 90 gün sonra anonim; DSAR dışa aktarma JSON.
- E-posta gönderimleri: işlemsel/pazarlama ayrımı `notification` modülünde; pazarlama yalnızca İYS izinli.
- Denetim izi ve DPA anketleri için raporlar `admin` panelinden dışa aktarılır.

## 8. Metin envanteri (`legal/`)

| Dosya | Dil | Amaç | Nerede gösterilir |
|---|---|---|---|
| gizlilik-politikasi / privacy-policy | tr, en | Veri sorumlusu bildirimi; Meta/Google/TikTok/mağaza için zorunlu | Site, onboarding, mağaza |
| kullanim-sartlari / terms-of-service | tr, en | Hizmet sözleşmesi, sorumluluk, platform kuralları, AI çıktıları | Site, onboarding |
| kvkk-aydinlatma-metni | tr | KVKK md. 10 | Kayıt, kanal bağlama, inbox |
| kvkk-acik-riza-metni | tr | Rıza gereken işlemler (pazarlama, ses/yüz, yurt dışı aktarım gerekirse) | İlgili ekranlar |
| cerez-politikasi / cookie-policy | tr, en | Çerez rehberi | Site banner |
| mesafeli-satis-sozlesmesi (ön bilgilendirme dahil) | tr | Tüketici satışları | Ödeme adımı |
| iptal-ve-iade-politikasi / refund-policy | tr, en | Cayma, iade, iptal | Site, ödeme |
| kabul-edilebilir-kullanim / acceptable-use-policy | tr, en | Spam/sahte etkileşim yasağı, platform ToS sorumluluğu | Site, onboarding |
| veri-silme-talimatlari / data-deletion | tr, en | Meta gereksinimi; kullanıcıya adımlar | Site (herkese açık URL) |
| veri-isleme-sozlesmesi-dpa | tr, en (M2) | B2B müşteriler ve kullanıcı adına işlenen üçüncü kişi verileri | Studio/Agency planı |
| alt-isleyiciler / sub-processors | tr, en | Sağlayıcı listesi, ülke, amaç | Site |
| ai-kullanim-beyani / ai-disclosure | tr, en | AI Act ve Türkiye reklam yönetmeliği şeffaflığı | Site, persona ayarı |

Sürümleme: dosya başında `version: 2026-09-03`, değişiklik günlüğü; `config` anahtarı `legal.<doc>.version` ile eşleşir; artırınca kullanıcıya yeniden kabul.

## 9. Yapılacaklar

- [ ] Avukat incelemesi (KVKK + tüketici + AI); mali müşavir (şirket/KDV/e-Arşiv).
- [ ] ⚠ maddelerinin doğrulanması: VERBİS eşikleri, yurt dışı aktarım bildirimi süresi, ceza tutarları, Google kapsam sınıflandırması, X saklama kuralı, GDPR temsilci gereği.
- [ ] Alt işleyici DPA/SCC'lerinin toplanması (Anthropic, Google, ElevenLabs, fal, Cloudflare, Paddle, Resend, Sentry).
- [ ] Meta Data Deletion callback, hesap silme ve consent akışlarının M0.14/M1.7'de kodlanması.
