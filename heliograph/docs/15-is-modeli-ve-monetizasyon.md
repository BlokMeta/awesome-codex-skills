# 15 — İş Modeli ve Monetizasyon Raporu

> Durum: İlk sürüm, 3 Eylül 2026. Rakamların bir kısmı Haziran 2026 bilgisine dayanır ve ⚠ ile işaretlidir; `config` tablosuna girilmeden önce kaynak sayfadan doğrulanır (ADR-0011). Bu doküman canlıdır; fiyat/plan değişiklikleri buraya ve `policy_entries`'e birlikte işlenir.

## 1. Özet

Heliograph, iki müşteri tipine satılan tek bir üründür:

| Segment | Kim | Ne ister | Nasıl öder |
|---|---|---|---|
| **Yaratıcı / bireysel** | Tek kişi, 1–6 hesap; DevOps/AI içerik üreticisi veya "kendi fotoğraflarımı düzenli paylaşsın" diyen kişi | Az girdi, çok etkileşim; mobil onay | Aylık plan, kartla, web'den |
| **Ajans / çoklu hesap** | 5–50+ hesap yöneten kişi veya ekip (bizim kendi kullanımımız bu segmenttedir) | Persona başına kontrol, ekip, raporlama, marka anlaşmaları | Aylık plan + hesap başına ek ücret; yıllık indirim; fatura |

Gelir kalemleri: (1) abonelik, (2) hesap başına ek ücret, (3) AI kredi paketleri, (4) ajans/white-label, (5) kendi hesaplarımızdan sponsorluk ve platform gelir paylaşımı, (6) ileride pazar yeri komisyonu (marka ↔ yaratıcı).

Hedef marj: brüt %70+ (AI ve platform API maliyeti dahil). Bu, fiyatların **maliyet tabanlı alt sınırla** kurulmasını gerektirir (Bölüm 4).

## 2. Ödeme rayları

### 2.1 Kısıt: Türkiye'de kurulu şirket

- **Stripe** Türkiye'de kurulu işletmelere doğrudan hesap açmıyor ⚠ (Haziran 2026 bilgisi). Yaygın yol: **Stripe Atlas ile ABD (Delaware) LLC** kurup Stripe kullanmak; ek maliyet (Atlas ~500 $ ⚠ + yıllık eyalet ücretleri + ABD vergi beyanı) ve iki şirketli yapı.
- **Merchant of Record (MoR)** sağlayıcıları Türkiye'deki satıcıları kabul ediyor ve KDV/satış vergisini dünya genelinde kendileri topluyor: **Paddle** (⚠ ~%5 + 0,50 $), **Lemon Squeezy** (⚠ ~%5 + 0,50 $, 2024'te Stripe satın aldı; Türk satıcı kabulü ve gelecek durumu doğrulanmalı), FastSpring, Polar. MoR = fatura, vergi, iade, chargeback yönetimi onlarda; bize net ödeme (payout) gelir.
- **Yerli PSP'ler**: iyzico (abonelik ürünü var, TRY, 3D Secure; ⚠ ~%2,5–3,5 + sabit), PayTR, Param. Yalnızca Türkiye müşterileri ve TRY için mantıklı; yurt dışı vergi yükü bize kalır.

### 2.2 Karar (ADR-0013)

1. **Birincil: Paddle (MoR)** — global kart/PayPal/Apple Pay, KDV dahil fiyatlandırma, faturalar otomatik, bize tek payout. Türkiye'deki şirket için ihracat KDV istisnası çerçevesi (Paddle bize B2B hizmet alıcısı gibi ödeme yapar; **mali müşavirle teyit** ⚠).
2. **İkincil (faz 2): iyzico** — Türkiye pazarına TRY fiyat ve yerel kart deneyimi için; faturalar e-Arşiv ile bizden.
3. **Mobil**: uygulama içinde satın alma yalnızca mağaza kuralı gerektiriyorsa. Strateji "web'den satın al, uygulama hakları okur": Apple 3.1.1 dijital abonelikleri IAP'ye zorlar; **ancak** uygulama içinde satın alma düğmesi göstermeyip yalnızca giriş yapan kullanıcının haklarını okumak ("reader" benzeri çok platformlu hizmet) yaygın ve kabul gören bir modeldir; ABD'de Epic kararı sonrası dış link, AB'de DMA ile alternatif ödeme mümkün ⚠ (ülkeye göre `config`'te bayrak). İstenirse Apple/Google IAP **RevenueCat** ile eklenir (komisyon %15 küçük işletme programı / %30).
4. Sağlayıcı soyutlaması: `PaymentProvider` portu (`createCheckout`, `handleWebhook`, `cancel`, `changePlan`, `getInvoice`); Paddle/iyzico/RevenueCat adaptörleri.

### 2.3 Vergi ve muhasebe (Türkiye) ⚠ mali müşavir teyidi zorunlu

- Şirket türü: başlangıçta **şahıs şirketi** (hızlı, düşük maliyet; gelir vergisi dilimleri) → gelir büyüyünce **Limited Şirket** (kurumlar vergisi %25, yatırımcı/ortak için gerekli). Genç girişimci istisnası (29 yaş altı) varsa değerlendirilir.
- KDV %20 (yurt içi dijital hizmet). Yurt dışı müşteriye hizmet ihracı KDV'den istisna (koşullu). MoR kullanımında MoR'a fatura kesilir.
- **e-Arşiv fatura** internet satışlarında zorunlu (e-Fatura mükellefi olunca e-Fatura); MoR'a kesilen faturalar aylık toplu olabilir.
- Dijital Hizmet Vergisi (%7,5) yalnızca çok yüksek hasılat eşiğinde (⚠ 20 M TL Türkiye + 750 M € global); başlangıçta ilgili değil.
- **ETBİS** kaydı (elektronik ticaret bilgi sistemi) kendi sitesinden satış yapanlara zorunlu.

## 3. Paketleme ve fiyat

### 3.1 Rakip referansı ⚠ (Haziran 2026 hafızası; lansman öncesi güncellenecek)

| Ürün | Giriş planı | Hesap dahil | Ek hesap | Not |
|---|---|---|---|---|
| Buffer | ~6 $/kanal/ay | kanal başına | – | En basit model |
| Later | ~25–80 $/ay | 1–6 sosyal set | – | Instagram odaklı |
| Metricool | ~22–55 $/ay | 5–15 marka | – | Analitik güçlü |
| Publer | ~12 $/ay 3 hesap | 3 | ~4 $/hesap | Ucuz |
| SocialBee | ~29–99 $/ay | 5–25 | – | AI copilot |
| Vista Social | ~39–79 $/ay | 8+ | – | Ajans |
| Postiz (bulut) | 29–99 $/ay | 5–100 kanal | – | Açık kaynak |
| Blotato | 29–499 $/ay | 20–100 hesap | – | AI video odaklı |
| Zernio (eski Late) | hesap başına 6 → 3 → 1 $ | – | – | Saf hesap-başı |
| Ocoya / Predis | ~15–50 $/ay + AI kredisi | – | – | AI üretim |

Pazar normu: **hesap sayısı + AI kredisi** iki eksenli paketleme; AI video üretenler kredi satıyor.

### 3.2 Heliograph planları (öneri, `config`'te yaşar)

| Plan | Fiyat (USD/ay, yıllıkta −20%) | Bağlı hesap | Persona | Günlük post/video (persona başına) | AI kredisi/ay | Ekstra |
|---|---|---|---|---|---|---|
| **Free** (deneme sonrası kalıcı) | 0 | 1 | 1 | 1 / 0 | 50 | Manuel kütüphane, insan onayı zorunlu, filigran yok, marka rozeti "Heliograph ile" (kapatılamaz) |
| **Solo** | 19 | 3 | 1 | 5 / 1 | 600 | Trend motoru, yorum yanıtı, mobil onay |
| **Creator** | 49 | 6 | 3 | 8 / 3 | 2.000 | Video hattı, kendi ses klonu, CRM, medya kiti |
| **Studio** | 149 | 20 | 10 | 10 / 5 | 8.000 | Ekip (5), roller, API erişimi, öncelikli render |
| **Agency** | 399 | 60 | 30 | 12 / 6 | 25.000 | Ekip (15), white-label rapor, müşteri workspace'leri, SLA |
| Ek hesap | 4 $/hesap/ay (Studio+ 3 $) | | | | | |
| Kredi paketi | 1.000 kredi = 12 $ (hacimde 9 $) | | | | | |
| **Internal** | 0 | sınırsız | | | | Yalnızca sahibin workspace'i; süper yönetici atar |

Kredi tanımı (maliyete bağlı, ADR-0011 ile güncellenir): metin post = 2 kredi, carousel = 5, yorum yanıtı = 1, kısa video (stok B-roll) = 25, kısa video (AI B-roll) = 60, görsel üretimi = 3, ses klonu eğitimi = 200.

Deneme: 14 gün Creator, kart gerekmez (spam önlemek için e-posta + telefon doğrulama; deneme boyunca günlük 1 video sınırı).

### 3.3 Birim ekonomi (hedef ölçek varsayımları)

| Kalem | Solo | Creator | Studio |
|---|---|---|---|
| Fiyat | 19 | 49 | 149 |
| LLM + TTS + görsel maliyeti (kredi kullanımı %70) | ~3 | ~9 | ~30 |
| Platform API (X PPU ortalama) | ~0,5 | ~1,5 | ~6 |
| Altyapı payı (render, depolama) | ~1 | ~3 | ~8 |
| Ödeme komisyonu (%5 + 0,5) | ~1,5 | ~3 | ~8 |
| **Brüt marj** | ~%68 | ~%66 | ~%65 |

Marjı yükselten kaldıraçlar: prompt caching (persona ön eki), Sonnet/Haiku'ya düşürme, stok B-roll varsayılan, self-host render ve WhisperX, kredi aşımında yumuşak fren. `cost` modülü bu tabloyu **gerçek verilerle** her ay yeniden üretir (panel: "birim ekonomi").

## 4. Fiyatlandırma kuralları (ürün içi)

- Fiyatlar ve haklar `plans`/`plan_entitlements` tablolarında; site fiyat sayfası da API'den okur (bayat fiyat yok).
- Para birimi: USD tabanlı; TRY ve EUR görüntüleme MoR üzerinden; Türkiye için iyzico açılınca TRY fiyat listesi ayrı (kur dalgalanması için aylık gözden geçirme, `config` alarmı).
- Yükseltme anında orantılı fark (proration), düşürme dönem sonunda; iptal tek tıkla ve dönem sonuna kadar hak devam eder (yasal zorunluluk, docs/16).
- Kredi aşımı: %80'de uyarı, %100'de yumuşak fren (üretim durur, planlı yayınlar sürer), tek tıkla kredi paketi.
- Hesap sınırı aşımı: yeni kanal bağlanamaz, mevcutlar çalışır.

## 5. Pazara giriş (GTM)

### 5.1 Sıra
1. **Kendi hesaplarımız** (0–3. ay): 20 persona canlı; ürünün en iyi vitrini kendi büyüme grafiğidir. Her persona bio'sunda "Heliograph ile" (Free plandaki rozetin aynısı).
2. **Davetli beta** (3–5. ay): 30–50 yaratıcı/ajans, ücretsiz Creator, karşılığında geri bildirim + vaka çalışması izni.
3. **Halka açık lansman** (5–6. ay): Product Hunt, Hacker News "Show HN" (DevOps nişi HN'de güçlü), X/Threads/LinkedIn lansman dizisi, 3 vaka çalışması.

### 5.2 Kanallar (ölçülebilir, düşük bütçe)
- **İçerik ve SEO**: "AI social media scheduler for developers", "faceless DevOps shorts", karşılaştırma sayfaları (vs Buffer/Postiz), ücretsiz araçlar (hashtag/kanca üretici, "post zamanı" hesaplayıcı) → lead.
- **Kendi personalarımız**: ürünün ürettiği içeriğin altında doğal CTA; haftalık "nasıl yaptık" videosu.
- **Affiliate**: %25 yinelenen 12 ay (Rewardful/Tolt ⚠ ~49–99 $/ay); yaratıcılar ve DevOps eğitmenleri.
- **Topluluk**: Discord/Telegram; DevOps ve AI Discord'larında sponsorlu değil, faydalı katılım.
- **AppSumo**: lansmanda düşünülmez (ömür boyu anlaşma marjı ve destek yükü); ancak nakit gerekirse sınırlı LTD.
- **Ücretli reklam**: yalnızca retargeting ve marka aramaları; CAC hedefi < 3 aylık ARPU.

### 5.3 Metrik hedefleri (ilk 12 ay)
| Metrik | Hedef |
|---|---|
| Deneme → ücretli | %8–12 |
| Aylık brüt churn | < %6 |
| ARPU | 45 $ |
| Ödeme başarısızlığı kurtarma (dunning) | %50 |
| 12. ay MRR | 15–25K $ (300–500 ödeyen) |

## 6. Kendi hesaplarımızdan gelir

| Kaynak | Mekanizma | Beklenti ⚠ |
|---|---|---|
| Sponsorluk / iş birliği | CRM (docs/07 §7.3); DevOps/AI araç şirketleri (gözlemlenebilirlik, CI/CD, bulut, AI altyapı) B2B teknik izleyici için yüksek CPM öder | 10K takipçi teknik hesap: 300–1.500 $/entegre post; 50K+: 1.500–5.000 $ |
| Platform gelir paylaşımı | YouTube Partner Program (Shorts havuzu %45), X Creator Revenue Sharing (Premium + eşikler), TikTok Creator Rewards (1 dk+ videolar), Instagram bonus programları | Küçük ama otomatik; video hattı YouTube'da 1 dk+ varyant üretebilir |
| Pazar yerleri | Collabstr, Passionfroot, Impact.com; bülten için Paved/Beehiiv | Medya kiti otomatik üretilir |
| Affiliate (araçların) | İçerikte kullanılan araçların affiliate linkleri (etiketli, `#reklam`) | Pasif |
| Ürünün kendisi | Persona büyüdükçe "bu hesabı Heliograph yönetiyor" | Dönüşüm |

Hukuki zorunluluklar (etiketleme, AI beyanı) docs/16 ve `research` §2'de; sistem bunları alan olarak zorlar.

## 7. Riskler (iş)

| Risk | Azaltma |
|---|---|
| Platform API fiyat/politika şoku (X gibi) | Adaptör soyutlaması; plan haklarında "platform ek ücreti" satırı; config alarmı |
| Ödeme sağlayıcısının Türk satıcıyı kapatması | İki sağlayıcı (Paddle + iyzico), soyutlama |
| App review reddi (Meta/Google/TikTok) | Erken başvuru, uyumlu ürün (docs/16 §D), aracı servis yedeği (Zernio/Ayrshare) |
| AI maliyet artışı | Kredi tanımı `config`'te; aylık birim ekonomi raporu; model düşürme kuralları |
| Kötüye kullanım (spam ağları bizim uygulamamızı kullanır) | Kabul edilebilir kullanım politikası, hacim kademesi, abuse tespiti, hesap kapatma; platform politikası ihlalinde sorumluluk kullanıcıda |
| Mağaza reddi (IAP) | Web-öncelikli satın alma; RevenueCat yedeği |

## 8. Yapılacaklar (bu doküman için)

- [ ] ⚠ ile işaretli rakamları kaynak sayfalardan doğrula ve `policy_entries`'e gir (Paddle/iyzico ücretleri, rakip fiyatları, mağaza kuralları, vergi eşikleri).
- [ ] Mali müşavir görüşmesi: şirket türü, MoR faturalama, KDV istisnası, e-Arşiv.
- [ ] Paddle başvurusu (web sitesi + hukuki sayfalar hazır olmalı, docs/14).
- [ ] ADR-0013'ü yaz.
