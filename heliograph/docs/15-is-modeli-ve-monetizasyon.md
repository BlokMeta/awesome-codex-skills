# 15 — İş Modeli ve Monetizasyon Raporu

> Sürüm 2, 3 Eylül 2026. Rakamlar araştırma raporundan (resmi sayfa ✅, güvenilir ikincil kaynak ⚠, çelişkili/doğrulanmamış ❓). Bu doküman canlıdır; fiyat/plan değişiklikleri buraya ve `policy_entries`'e birlikte işlenir (ADR-0011). Rakip fiyatları lansman öncesi resmi sayfalardan tekrar okunur.

## 1. Özet

Heliograph, iki müşteri tipine satılan tek bir üründür:

| Segment | Kim | Ne ister | Nasıl öder |
|---|---|---|---|
| **Yaratıcı / bireysel** | Tek kişi, 1–6 hesap; DevOps/AI içerik üreticisi veya "kendi fotoğraflarımı düzenli paylaşsın" diyen kişi | Az girdi, çok etkileşim; mobil onay | Aylık plan, kartla, web'den (mobilde IAP) |
| **Ajans / çoklu hesap** | 5–50+ hesap yöneten kişi veya ekip (kendi kullanımımız bu segmenttedir) | Persona başına kontrol, ekip, raporlama, marka anlaşmaları | Aylık/yıllık plan + hesap başına ek ücret; fatura |

Gelir kalemleri: (1) abonelik, (2) hesap başına ek ücret, (3) AI kredi paketleri (yalnızca medya üretimi için; metin sınırsız), (4) ajans/white-label, (5) kendi hesaplarımızdan sponsorluk ve platform gelir paylaşımı, (6) ileride marka ↔ yaratıcı pazar yeri komisyonu.

Hedef brüt marj %65+ (AI, platform API ve ödeme komisyonu dahil).

## 2. Ödeme rayları

### 2.1 Kısıt: Türkiye'de kurulu şirket

| Seçenek | Durum | Ücret | Not |
|---|---|---|---|
| **Stripe (doğrudan)** | ✅ **Türkiye desteklenmiyor** (stripe.com/global) | – | – |
| Stripe Atlas (ABD Delaware LLC) | ⚠ Mümkün | 500 $ tek seferlik + ~100 $/yıl registered agent + ~300 $/yıl Delaware vergisi + ABD vergi beyanı (5472/1120) muhasebe ücreti | İki şirketli yapı; TR'de KEYK/transfer fiyatlaması soruları; yalnızca Stripe'a özel özellik veya ABD yatırımcı yapısı gerekirse |
| **Paddle (MoR)** | ✅ Türk satıcıları kabul ediyor; payout USD/EUR/GBP (**TRY payout yok**) | ⚠ %5 + 0,50 $ | Onboarding 1–2 hafta; canlı site + şartlar + gizlilik + iade politikası şart; Türk SaaS'larında yaygın |
| **Polar.sh (MoR)** | ✅ 195 ülke, Türkiye dahil (Stripe Connect Express payout) | ⚠ Starter ücretsiz %5 + 0,50 $; Pro 20 $/ay %3,8 + 0,40 $; Growth 100 $/ay %3,6; Scale 400 $/ay %3,4; +%1,5 uluslararası kart; 2 $/ay payout | Açık kaynak, geliştirici odaklı, **kullanım/kredi faturalama primitifleri** var (AI kredisi ölçümüne uygun); daha genç |
| Lemon Squeezy (Stripe'ın) | ✅ Türkiye listede, TRY satış para birimi var | %5 + 0,50 $ | ⚠ Doğrulama 1–6 hafta, destek zayıf; stratejik gelecek Stripe Managed Payments; **yeni entegrasyon için riskli** |
| FastSpring | Kabul ediyor | ⚠ ~%5,9 + 0,95 $ | Satış odaklı, eski UX; gereksiz |
| Stripe Managed Payments | Türkiye desteklenmiyor | +%3,5 | Yalnızca ABD LLC ile |

### 2.2 Yerli PSP'ler (TRY, Türkiye müşterileri)

| PSP | Yurt içi oran ⚠ | Yabancı kart | Abonelik | Not |
|---|---|---|---|---|
| **iyzico** | ~%2,49 + 0,25 ₺ | ~%4,5 | **Abonelik ürünü** (ürün → fiyat planı → abonelik, yenileme webhook'ları); kart saklama tek seferlik 99 ₺ | En SaaS-dostu TR API; yalnızca TRY payout |
| PayTR | ~%1,49–1,99 | Pazarlıklı | Tokenizasyon + tekrarlayan | En ucuz başlık oranı; API daha az cilalı |
| Param | ~%1,85–2,29 | Pazarlıklı | PCI kart saklama + zamanlı tahsilat | – |

### 2.3 Karar (ADR-0013)

1. **Birincil: MoR.** Paddle (olgunluk, yaygın kullanım) veya Polar (daha düşük ücret kademeleri, yerleşik kredi/kullanım faturalama). **Karar:** M1.6'da iki sağlayıcı da `PaymentProvider` portu arkasında; **Paddle ile canlıya çıkılır**, Polar ikinci sağlayıcı olarak entegre edilir ve 6 ay sonra ücret/işlevsellik verisiyle birincil yeniden değerlendirilir. Lemon Squeezy kullanılmaz.
2. **Türkiye'deki müşteriye TL zorunlu ✅ (32 sayılı Karar Tebliği md. 8; docs/16 §4).** MoR TRY ile satış yapabiliyorsa (Paddle/Polar para birimi desteği ❓ teyit) lansmanda MoR üzerinden TL; yapamıyorsa **iyzico Abonelik lansmanda** devreye girer (faturalar e-Arşiv ile bizden). Ülke tespiti fatura adresi + IP ile; TR müşterisine USD fiyat gösterilmez.
3. **Mobil (Apple 3.1.3(b) ✅):** "Web'de satın al, uygulama hakları okur" yalnızca **aynı planlar uygulama içi satın alma olarak da sunuluyorsa** serbest. Bu yüzden iOS/Android'de aynı planlar **IAP** olarak da satılır (Apple Small Business Program %15; ABD vitrininde komisyonsuz web link-out ✅ mayıs 2025 kararı, Yargıtay Haziran 2026'da temyize aldı ⚠; AB'de 1 Ekim 2026 yeni şartlar ⚠). Google Play: 30 Haziran 2026'dan itibaren ABD/AEA/İngiltere'de %10 hizmet ücreti + **web link-out %10** ⚠; Türkiye vitrini standart %15/30 + User Choice Billing. IAP entegrasyonu **RevenueCat** ile (ücretsiz 2,5K $ MTR'ye kadar, sonra %1 ⚠); haklar tek kaynaktan (`subscriptions` + `entitlements`), sağlayıcı fark etmez.
4. Sağlayıcı soyutlaması: `PaymentProvider` portu (`createCheckout`, `handleWebhook`, `cancel`, `changePlan`, `getInvoice`); Paddle/Polar/iyzico/RevenueCat adaptörleri.

### 2.4 Vergi ve şirket (Türkiye) — mali müşavir teyidi zorunlu

| Konu | Bulgu | Durum |
|---|---|---|
| Şirket türü | Şahıs: artan oranlı gelir vergisi (%15–40), hızlı, sınırsız sorumluluk. **Limited: %25 kurumlar vergisi**, sınırlı sorumluluk, MoR KYC ve yatırımcı için uygun. Genç girişimci (29 yaş altı, ilk işletme): 2026'da 400.000 ₺ kazanç istisnası; Bağ-Kur prim desteği 1 Ocak 2026'da kaldırıldı | ⚠ |
| **Karar** | Limited Şirket (MoR onayı, sorumluluk, ölçek) | – |
| KDV | Türkiye'deki müşteriye dijital hizmette %20 | ✅ |
| Hizmet ihracı KDV istisnası | Müşteri yurt dışında yerleşik **ve** hizmet yurt dışında kullanılıyorsa istisna; MoR üzerinden satışta müşteri MoR tüzel kişisi (İngiltere/ABD/AB) → istisna genelde uygulanabilir; para bankadan gelmeli | ⚠ SMMM teyidi |
| Yazılım ihracatı kazanç istisnası (GVK 89/13, KVK 10/1-ğ) | %80 indirim; 30 Nisan 2026 tarihli 11257 sayılı Cumhurbaşkanı Kararı ile **%100'e çıkarıldığı** raporlanıyor | ❓ karar metni doğrulanacak |
| Dijital Hizmet Vergisi | Oran 2026 için %5, 2027 için %2,5 (10767 sayılı Karar); eşik 20 M ₺ Türkiye **ve** 750 M € küresel — ikisi birden | ⚠; başlangıçta ilgisiz |
| e-Fatura / e-Arşiv | İnternet satışı ≥ 500.000 ₺ (önceki yıl) → e-Fatura (2025 cirosu için 1 Tem 2026); e-Fatura mükellefi olmayanlar için 2026'da tüketiciye tüm faturalar e-Arşiv; MoR'a aylık toplu fatura | ⚠ |
| ETBİS | Kendi sitesinden/uygulamasından satış yapan herkes için zorunlu, ücretsiz (e-Devlet) | ⚠ |
| **Hizmet İhracatı Destekleri (10962 sayılı Karar, Şub 2026)** | Bilişim/mobil uygulama ihracatçılarına hosting, platform komisyonları, onaylı SaaS araçları, pazarlama ve yurt dışı ofis giderlerinin **%50'si** (yılda 5 M ₺'ye kadar) geri ödeniyor; RevenueCat onaylı yazılım listesinde | ⚠ **başvurulacak** (docs/14 G16) |

## 3. Paketleme ve fiyat

### 3.1 Rakip referansı (2026, ⚠ üçüncü taraf fiyat takipçileri; lansman öncesi resmi sayfadan doğrula)

| Ürün | Giriş | Hesap | AI modeli | Ek hesap | Deneme |
|---|---|---|---|---|---|
| Buffer | 6 $/kanal (yıllık 5 $); 11+ kanalda 4 $, 26+ 3 $, 51+ 1 $ | Kanal başına | Metin AI sınırsız, ücretsiz planda bile | Doğrusal | Ücretsiz 3 kanal |
| Later | 25 / 50 / 110 $ | 1 / 2 / 6 sosyal set (8 profil) | 5 / 50 / 100 kredi/ay | +15 $/set | 14 gün |
| Hootsuite | 99 / 199 / 399 $ kullanıcı başına, yıllık | 10 / sınırsız | OwlyWriter dahil | – | 30 gün |
| Metricool | Ücretsiz; 22 $ (5 marka) … 159 $ (50) | Marka başına | 20 / 35 kredi/marka/ay | Kademe | Ücretsiz plan |
| Publer | 12 $ (3 hesap, ~4 $/ek); 21 $ (~7 $/ek) | 3 | BYO OpenAI anahtarı / GPT-4 dahil | ~4–7 $ | Ücretsiz plan |
| SocialBee | 29 / 49 / 99 $ (5/10/25); Pro50 179 $, Pro100 329 $ | 5–100 | AI Copilot dahil | +15 $/5 profil | 14 gün |
| Vista Social | 79 / 149 / 349 $ (15/30/70 profil) | 15–70 | ❓ 1.000–3.500 kredi | Kademe | 14 gün |
| ContentStudio | 19 / 49 / 99 $ (5/10/50) | 5–50 | 10–25K AI kelime + görsel | Kademe | 14 gün |
| Ocoya | ❓ 15 / 39 / 79 / 159 $ (5/20/50/150 profil) | 5–150 | Üretim başına kredi; üst kademe sınırsız | Kademe | 7 gün |
| Predis.ai | Ücretsiz (15 AI post); 29–32 / 59 / 139 $ | Marka başına | AI post/ay | Kademe | Ücretsiz plan |
| Postiz (bulut) | 29 / 39 / 49 / 99 $ (5/10/30/100 kanal) | 5–100 | AI görsel/video sayısı; metin sınırsız | Kademe | 7 gün; self-host |
| Blotato | 29 / 97 / 499 $ (20/40/100 hesap) | 20–100 | 1.250 / 5.000 / 28.000 kredi (görsel/video/ses); metin sınırsız | Kademe | 7 gün |
| Zernio (eski Late) | **Hesap başına kademeli:** 1–2 ücretsiz; 3–10: 6 $; 11–100: 3 $; 101+: 1 $ (20 hesap = 78 $) | Hesap başına | Kredi yok, her şey dahil | Aynı | 2 hesap ücretsiz |
| Typefully | Ücretsiz; 8 / 19 / 39 $ | 1 / 5 / sınırsız | Creator'dan itibaren AI | – | Ücretsiz plan |
| Hypefury | 29 / 65 / 97 / 199 $ | 6 / 30 / 60 / 90 | Dahil | Kademe | 7 gün |
| Opus Clip / Submagic (video) | 15–29 $ / 19–69 $ | – | İşleme dakikası / video adedi | – | Ücretsiz plan |

**Pazar normları:** (a) iki eksen: hesap başına doğrusal (Buffer, Zernio, Publer) veya 5/10/25–30 hesaplı kademeler; (b) **metin AI giderek sınırsız**, kredi yalnızca görsel/video/ses için; giriş kademesinde 100–1.250 kredi; aşım paketleri plan içi fiyatın %40–80 üstünde; (c) AI ağırlıklı ürünlerde 7 gün kart-zorunlu deneme (dönüşüm ~%44–49 ⚠), zamanlayıcılarda 14 gün veya cömert ücretsiz plan (opt-in deneme ~%14–18, freemium %2–5 ⚠); (d) SMB/yaratıcı SaaS aylık logo churn %4,5–6 ⚠.

### 3.2 Heliograph planları (öneri; `plans`/`plan_entitlements` tablolarında yaşar — ilk katalog `tooling/seed/plans.ts`, `pnpm db:seed`; okuma `GET /v1/billing/entitlements`)

| Plan | Fiyat (USD/ay, yıllıkta −20%) | Bağlı hesap | Persona | Günlük post/video (persona başına) | Medya kredisi/ay | Ekstra |
|---|---|---|---|---|---|---|
| **Free** (deneme sonrası kalıcı) | 0 | 2 | 1 | 1 / 0 | 30 | Manuel kütüphane, insan onayı zorunlu, "Heliograph ile" rozeti (kapatılamaz), metin AI sınırlı (20/gün) |
| **Solo** | 19 | 3 | 1 | 5 / 1 | 300 | Trend motoru, yorum yanıtı, mobil onay, **metin AI sınırsız** |
| **Creator** | 49 | 6 | 3 | 8 / 3 | 1.200 | Video hattı, kendi ses klonu, CRM, medya kiti |
| **Studio** | 149 | 20 | 10 | 10 / 5 | 5.000 | Ekip (5), roller, API erişimi, öncelikli render |
| **Agency** | 399 | 60 | 30 | 12 / 6 | 15.000 | Ekip (15), white-label rapor, müşteri workspace'leri, SLA |
| Ek hesap | 3–10 hesap: 5 $; 11–50: 3 $; 51+: 1,5 $ (Zernio/Buffer düzeni) | | | | | |
| Kredi paketi | 1.000 kredi = 12 $ (hacimde 9 $) | | | | | |
| **Internal** | 0 | sınırsız | | | | Sahibin workspace'i |

Kredi = yalnızca medya (görsel, video, ses). Tanım `config`'te (`billing.credit_costs`): görsel 3, carousel kareleri 1/kare, kısa video (stok B-roll) 25, kısa video (AI B-roll) 60, ses klonu eğitimi 200. Metin post ve yorum yanıtı kredi harcamaz (Solo+), günlük hak sınırına tabidir.

Deneme: **7 gün Creator, kart gerekli** (AI-ağırlıklı ürün normu; yüksek dönüşüm) **veya** kartsız Free plana düşüş; ikisi A/B ile test edilir. Deneme boyunca günlük 1 video.

### 3.3 Birim ekonomi (varsayım; `cost` modülü gerçek verilerle her ay yeniden üretir)

| Kalem | Solo 19 $ | Creator 49 $ | Studio 149 $ |
|---|---|---|---|
| LLM (metin sınırsız ama günlük hak sınırlı; prompt caching) | ~2,5 | ~6 | ~20 |
| Medya kredisi kullanımı (%70) TTS + görsel + video | ~1 | ~5 | ~18 |
| Platform API (X PPU ortalama) | ~0,5 | ~1,5 | ~6 |
| Altyapı payı (render, depolama, izleme) | ~1 | ~3 | ~8 |
| Ödeme (MoR %5 + 0,50) | ~1,5 | ~3 | ~8 |
| Mağaza satışlarında ek komisyon (%15) | (yalnızca IAP payı) | | |
| **Brüt marj (web satışı)** | ~%66 | ~%62 | ~%60 |

Marj kaldıraçları: prompt caching, Sonnet/Haiku'ya düşürme, stok B-roll varsayılan, self-host render ve WhisperX, Polar'ın düşük kademeleri, IAP yerine web satışına yönlendirme (yasal sınırlar içinde).

## 4. Fiyatlandırma kuralları (ürün içi)

- Fiyatlar ve haklar DB'de; site fiyat sayfası API'den okur. IAP ürün kimlikleri planlarla eşlenir (`plans.store_product_ids`).
- USD tabanlı; MoR yerel para birimi gösterir; Türkiye'deki tüketiciye **TRY** fiyat (iyzico aşaması; kur gözden geçirme aylık, `config` alarmı).
- Yükseltme anında orantılı, düşürme dönem sonunda; iptal tek tık; yıllık planda yenilemeden 15 gün önce e-posta.
- Kredi aşımı: %80 uyarı, %100 yumuşak fren (medya üretimi durur, metin ve yayınlar sürer), tek tıkla paket.
- Hesap sınırı aşımı: yeni kanal bağlanamaz, mevcutlar çalışır.

## 5. Pazara giriş (GTM)

### 5.1 Sıra
1. **Kendi hesaplarımız** (0–3. ay): 20 persona canlı; büyüme grafiği vitrin; bio'da "Heliograph ile".
2. **Davetli beta** (3–5. ay): 30–50 yaratıcı/ajans, ücretsiz Creator ↔ geri bildirim + vaka çalışması.
3. **Halka açık lansman** (5–6. ay): Product Hunt (iyi B2B lansmanı ⚠ 50–300 kayıt, 5–50K ziyaret, 2 haftada normale döner; önceden kitle şart), Hacker News "Show HN", X/Threads/LinkedIn dizisi, 3 vaka çalışması.

### 5.2 Kanallar
- **İçerik/SEO:** karşılaştırma ve "X pricing" sayfaları (Blotato, Zernio bunu yapıyor), ücretsiz araçlar (kanca/hashtag üretici, en iyi saat) → lead.
- **Kendi personalarımız:** doğal CTA; haftalık "nasıl yaptık" videosu.
- **Affiliate %25 yinelenen (12 ay):** araç: Tolt (29/49/99 $/ay) veya Rewardful (49/99/149 $/ay); ikisi de Paddle'ı destekliyor ⚠ (Polar için teyit). PartnerStack/Impact.com lansman aşaması için pahalı.
- **Yaratıcı sponsorlukları:** B2B SaaS/dev-tool YouTube CPM 40–80 $ ⚠; nano yaratıcı (1–10K) 50–500 $/entegrasyon.
- **Topluluk:** Discord/Telegram; DevOps ve AI topluluklarında faydalı katılım.
- **AppSumo:** **yapılmaz** — platform payı %50–70 ⚠, ömür boyu destek ve hesap başına API/AI maliyeti; ancak nakit şartsa 3 hesap ve kredisiz sıkı kapaklı LTD.
- **Referans programı:** iki taraflı (performans +%30–50 ⚠), ödül 1 ay ücretsiz veya 100 kredi (10–20 $ değer aralığı en verimli), katılım %10–15, dönüşüm %3–5.
- **Ücretli reklam:** yalnızca retargeting ve marka aramaları; CAC < 3 aylık ARPU.

### 5.3 Metrik hedefleri (ilk 12 ay)
| Metrik | Hedef |
|---|---|
| Deneme → ücretli (kartlı 7 gün) | %35–45 |
| Freemium → ücretli | %3–5 |
| Aylık brüt churn | < %5 |
| ARPU | 45 $ |
| Dunning kurtarma | %50 |
| 12. ay MRR | 15–25K $ |

## 6. Kendi hesaplarımızdan gelir

| Kaynak | Mekanizma | Bulgu ⚠ |
|---|---|---|
| Sponsorluk / iş birliği | CRM (docs/07 §7.3); DevOps/AI araç şirketleri teknik izleyici için yüksek CPM öder | B2B/dev-tool CPM 40–80 $; 10K takipçi teknik hesap 300–1.500 $/entegre post; 50K+: 1.500–5.000 $ |
| YouTube Partner Program | Şu an 1.000 abone + 4.000 saat **veya** 10 M Shorts/90 gün; **1 Şubat 2027'den itibaren 8.000 saat veya 20 M Shorts** ve Shorts havuzu için 10 M/90 gün sürdürme; Shorts %45, uzun video %55 | Video hattı 1 dk+ varyant üretebilmeli |
| TikTok Creator Rewards | 10K takipçi, 100K görüntülenme/30 gün, ≥60 sn; ülkeler ABD/İngiltere/DE/FR/JP/KR/BR (+MX) — **Türkiye yok** | Persona ülkesi ABD ise mümkün |
| X | Creator Revenue Sharing **7 Eylül 2026'da kapandı**; yerine **Original Content Rewards**: Premium + 500 doğrulanmış takipçi + 90 günde 500K doğrulanmış-kullanıcı gösterimi; 2 haftada bir ödeme, 30 $ minimum; Türkiye uygunluğu teyit edilecek | – |
| Instagram | Reels/Breakthrough bonusları davetle; planlanabilir gelir değil | – |
| Pazar yerleri | Passionfroot (yaratıcıya ücretsiz, %5–15), Collabstr (~%25 toplam), Paved (bülten CPM 15–30 $), beehiiv ad network | Medya kiti otomatik |
| Affiliate (araçların) | İçerikte kullanılan araçların linkleri, `#reklam` etiketli | Pasif |

## 7. Ajans / white-label kıyas

Cloud Campaign 49–299 $/ay, Sendible white-label 299–750 $/ay, SocialBee Pro50 179 $, Hypefury Agency 199 $ ⚠. Ajanslar müşteri başına 500–3.000 $/ay tahsil edip %40–60 marj koyuyor. Sonuç: **Agency 399 $** üst sınırda; 60 hesap + white-label rapor + müşteri workspace'leri ile gerekçelendirilir; 25+ hesapta hesap başı 1–3 $ (bkz. §3.2).

## 8. Riskler (iş)

| Risk | Azaltma |
|---|---|
| Platform API fiyat/politika şoku (X PPU, program kapanışları) | Adaptör soyutlaması; "platform ek ücreti" satırı; config alarmı |
| MoR'un Türk satıcıyı kapatması | İki MoR (Paddle + Polar) aynı port arkasında; iyzico yerel |
| Apple/Google kural değişikliği | IAP + web ikisi de; haklar tek kaynakta; RevenueCat soyutlaması |
| App review reddi | Erken başvuru, uyumlu ürün (docs/16), aracı servis yedeği |
| AI maliyet artışı | Kredi tanımı `config`'te; aylık birim ekonomi; model düşürme |
| Kötüye kullanım | AUP, hacim kademesi, abuse tespiti; sorumluluk kullanıcıda |
| Vergi yorumu (KDV istisnası, %100 kazanç istisnası) | SMMM görüşü yazılı; ❓ maddeler doğrulanmadan modele girmez |

## 9. Yapılacaklar

- [ ] ❓ maddeleri doğrula: 11257 sayılı Karar (%100 istisna), Vista Social/Ocoya/Typefully kademeleri, AppSumo payı, X yeni program ülke listesi; `policy_entries`'e işle.
- [ ] Mali müşavir: Ltd kuruluşu, MoR faturalama, KDV istisnası, e-Arşiv, 10962 desteği başvurusu.
- [ ] Paddle + Polar başvuruları (site ve hukuki sayfalar canlı olunca); RevenueCat hesabı; Apple Small Business Program başvurusu.
- [x] ADR-0013 yazıldı.
