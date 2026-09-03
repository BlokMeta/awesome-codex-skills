# 16 — Hukuk ve Uyum

> Sürüm 2, 3 Eylül 2026. Bu doküman hukuki tavsiye değildir; ürünün nasıl **uyumlu inşa edileceğini** tanımlar. Yayın öncesi avukat (KVKK + tüketici + AI) ve mali müşavir incelemesi zorunludur. İşaretler: ✅ resmi kaynak/özet, ⚠ ikincil kaynak, ❓ doğrulanacak. Metin taslakları `legal/` altındadır ve sürümlenir; kabuller `consent_records` tablosuna yazılır; kurallar `policy_entries`'te (`legal.*`) yaşar.

## 1. Roller ve kapsam

| Konu | Rolümüz | Sonuç |
|---|---|---|
| Kullanıcı hesabı, ödeme, kullanım verileri | **Veri sorumlusu** (KVKK) / controller (GDPR) | Aydınlatma, açık rıza (yalnızca gereken yerde), VERBİS takibi, saklama/imha |
| Kullanıcının bağladığı hesaplardaki üçüncü kişi verileri (yorum/DM yazarları) | Kullanıcı adına **veri işleyen** (processor); kullanıcı veri sorumlusu | Kullanıcı ile **Veri İşleme Sözleşmesi (DPA)**; kullanıcıya takipçilerine yönelik **örnek aydınlatma metni** sağlanır |
| AI ile üretilen içerik ve yanıt botu | Kendi AI sistemimizin **sağlayıcısı** (üçüncü taraf modele dayansak da "downstream provider" ✅ Komisyon SSS) ve kullanıcı için araç | Md. 50(2) makine-okunur işaretleme bizim sorumluluğumuz; Md. 50(1) beyan seçeneği; deepfake etiketi |
| Platform API'leri | Geliştirici; Meta'da **Tech Provider** (başkaları adına işlem) | App Review + Business Verification, veri silme callback'i, Limited Use, saklama/silme kuralları |
| Satış | Satıcı (MoR üzerinden) / e-ticaret hizmet sağlayıcısı | Mesafeli satış, cayma, abonelik iptali, ETBİS, İYS, TL fiyat |

## 2. KVKK (6698) uyum planı

1. **VERBİS ✅ (Kurul Kararı 2025/1572, RG 01.10.2025):** yıllık çalışan < 50 **ve** bilanço < 100 M ₺ ise kayıt muafiyeti; birinin aşılması kaydı tetikler (30 gün). Özel nitelikli veri ana faaliyet ise eşik ⚠ 10 M ₺. Ses klonu/yüz modeli ana faaliyet değil; **avukat teyidi**. Yurt dışında kurulu şirket asla muaf değildir (ileride ABD LLC kurulursa temsilci ile kayıt). `config`: `legal.verbis.thresholds`.
2. **Envanter ve politika:** muaf olsak da **Kişisel Veri İşleme Envanteri** ve **Saklama-İmha Politikası** zorunlu pratik; periyodik imha **en geç 6 ayda bir** ✅, imha kayıtları 3 yıl. `privacy` modülü cron'u + `legal/tr/saklama-ve-imha-politikasi.md` (M1.8).
3. **Aydınlatma (Tebliğ ✅ + İlke Kararı 2026/347 ✅):** aydınlatma ve açık rıza metinleri **ayrı belgeler**; tek kutuyla ikisi birden alınmaz; aydınlatma "onaylatılmaz", yalnızca gösterilir (ürün: `kvkk_aydinlatma` = *acknowledged*, kutu yok); başka hukuki sebep varken rıza metni sunulmaz; kopya metin yasak. Bağlam duyarlı: kayıt, kanal bağlama, ödeme, inbox.
4. **Hukuki sebep haritası:** md. 5/2-c sözleşmenin ifası (hesap, OAuth token, içerik, yayın), md. 5/2-f meşru menfaat (güvenlik logları, toplulaştırılmış analitik), md. 5/2-ç hukuki yükümlülük (fatura), **açık rıza** yalnızca: pazarlama iletileri (İYS), ses klonu, yüz modeli, isteğe bağlı analitik/pazarlama çerezleri. Hizmet rızaya bağlanamaz (Kurul 2021/389 ✅).
5. **Yurt dışına aktarım (7499 ✅, 01.06.2024):** Kurul'un **hiç yeterlilik kararı yok** (2026); yol = **Standart Sözleşme** (Kurul şablonu, değiştirilmeden; sorumlu→işleyen modülü) her yabancı alt işleyenle (Anthropic, Google, ElevenLabs, fal, Cloudflare, Paddle, Polar, Resend, Sentry, Expo) + **son imzadan itibaren 5 iş günü içinde** Kurum'a bildirim (Standart Sözleşme Bildirim Modülü); bildirim cezası 2026: 90.308–1.806.377 ₺. ABD sağlayıcıları Kurul şablonunu imzalamayabilir → uygulama: sağlayıcının DPA'sı + Kurul şablonu talebi; imzalamayan sağlayıcı için avukatla alternatif (istisnai açık rıza yalnızca arızi aktarımda). Takipçi yorum/DM metinlerinin ABD'deki LLM'e gönderilmesi de aktarımdır → aydınlatmada açıkça yazılır. Aktarım sicili `legal/dpa/` + `config` `legal.transfers`.
6. **Veri sahibi hakları:** 30 gün; panel + e-posta başvuru formu (`legal/tr/veri-sorumlusu-basvuru-formu.md`); `POST /privacy/erasure`, `data_exports`.
7. **İhlal:** Kurul'a **72 saat** ✅ (Karar 2019/10), ilgililere makul sürede; işleyen bize derhal bildirir (DPA maddesi). Runbook `docs/runbooks/veri-ihlali.md`.
8. **Çerezler (Rehber 2022 ✅):** zorunlu dışındakiler için açık rıza, ön işaretli kutu yok, reddetmek kabul etmek kadar kolay, çerez listesi/süre/üçüncü taraf.
9. **Cezalar 2026 ✅ (yeniden değerleme %25,49):** aydınlatma 85.437–1.709.200 ₺; veri güvenliği 256.357–17.092.242 ₺; Kurul kararına uymama 427.263–17.092.242 ₺; VERBİS 341.809–17.092.242 ₺. 7499 sonrası işleyenlere de ceza kesilebilir.
10. **Veri işleyen sözleşmesi (md. 12/2 ✅):** amaç/kapsam, veri kategorileri, yalnızca talimatla işleme, gizlilik, teknik/idari tedbirler, alt işleyen onayı, denetim hakkı, ihlal bildirimi, sonunda silme/iade. `legal/tr/veri-isleme-sozlesmesi-dpa.md` (kiracıya sunulan) + alt işleyen listesi.

## 3. GDPR / UK / ABD

- **Uygulanabilirlik:** AB kullanıcılarına hizmet sunuyoruz (EN site, EUR fiyat) → GDPR md. 3(2). **Md. 27 temsilci** büyük olasılıkla **gerekli** (arızi işleme istisnası SaaS'a uymaz); maliyet ⚠ **1.500–5.000 €/yıl** (temel kademe ~1.500–2.500 €). UK için ayrıca UK temsilcisi (DUAA 2025 bunu kaldırmadı ❓).
- **Hukuki dayanaklar:** 6(1)(b) sözleşme; 6(1)(f) meşru menfaat (LIA belgesi); rıza: pazarlama + zorunlu olmayan çerezler (ePrivacy). Kiracı = controller, biz = processor → **md. 28 DPA**; AB kiracısından Türkiye'ye aktarım için **SCC Modül 2** (Türkiye'nin yeterlilik kararı yok) + aktarım etki değerlendirmesi; alt işleyenlerle SCC Modül 3. DSAR 1 ay.
- **ABD:** CCPA/CPRA eşikleri ⚠ 26,6 M $ gelir veya 100K CA tüketici → şu an kapsam dışı; EN gizlilik politikasında "Do Not Sell/Share" beyanı. COPPA: 18+ yaş kapısı; değişik kural uyum tarihi 22.04.2026 ⚠.

## 4. Tüketici ve e-ticaret (Türkiye)

- **Mesafeli Sözleşmeler Yönetmeliği ✅:** ön bilgilendirme (kimlik/MERSİS, fiyat KDV dahil, cayma koşulları ve **cayma hakkının olmadığı hâllerin beyanı**, süresiz/otomatik uzayan sözleşmenin süresi ve feshi, THH bilgisi), Türkçe, kalıcı veri saklayıcısı, tüketici okuduğunu teyit eder. Cayma 14 gün (bilgilendirilmezse 1 yıl). İstisna md. 15 (ğ) anında ifa edilen dijital hizmet ve (h) tüketici onayıyla başlayan hizmet → **açık kutu**: "Hizmetin hemen başlamasını ve cayma hakkımı kaybedeceğimi kabul ediyorum". 2025 değişikliği (01.01.2026) dijital aboneliğe özel yeni kural getirmedi.
- **Abonelik Sözleşmeleri Yönetmeliği ✅ (6502 md. 52):** süresiz abonelik her an cezasız feshedilir; fesih yöntemi üyelikten zor olamaz; sağlayıcı feshi **7 gün içinde** uygular; iade **15 gün içinde**; ön işaretli seçenek ve engelleyici iptal = haksız ticari uygulama (Reklam Kurulu, 01.03.2022'den beri). Ürün: tek tık iptal, yenileme hatırlatması, iade 15 gün SLA.
- **TL fiyat zorunluluğu ✅ (32 sayılı Karar Tebliği md. 8; Fiyat Etiketi Yönetmeliği):** Türkiye'de yerleşik taraflar arasında hizmet sözleşmesi dövizle/dövize endeksli olamaz (Türkiye'de üretilen yazılım); yurt dışı müşteriye USD/EUR serbest. **Sonuç:** Türkiye'deki müşteriye **TL fiyat ilk günden** → MoR TRY destekliyorsa MoR ile, değilse iyzico lansmanda (ADR-0013 güncellendi). Fiyatlar KDV dahil "₺" ile.
- **6563 / ETBİS ✅:** satışa başlamadan ETBİS kaydı (MERSİS, vergi no, alan adı, KEP); sitede tanıtıcı bilgiler (unvan, MERSİS, adres, KEP, vergi no) sözleşme öncesi görünür (footer bloğu).
- **İYS ✅:** pazarlama e-posta/SMS için önce onay, onaylar **3 iş günü içinde** İYS'ye yüklenir, kayıtlar 3 yıl saklanır; tacir/esnaf alıcıya onay gerekmez (ret hakkı korunur); işlemsel mesajlar muaf; her iletide gönderici kimliği + ücretsiz ret.
- **Reklam yönetmeliği (RG 01.07.2026, yürürlük 01.08.2026 ✅):** insan gibi görünen AI karakterle reklamda açık AI beyanı; gerçek kişinin AI kopyasıyla tanıklık yasak; influencer `#Reklam/#İşbirliği`. Ürün: zorunlu alanlar.

## 5. AB Yapay Zekâ Yasası (Md. 50, uygulama 02.08.2026 ✅)

| Madde | Yükümlülük | Üründe |
|---|---|---|
| 50(1) | İnsanla etkileşen AI (yanıt/DM botu): kişi AI ile konuştuğunu bilmeli | "AI destekli yanıt" beyanı seçeneği; AB hedefli hesaplarda **varsayılan açık** ve kiracı kapatamaz |
| 50(2) | Üretken sistem sağlayıcısı çıktıyı makine-okunur işaretler; üçüncü taraf modele dayansak da **biz** sorumluyuz ✅ | C2PA manifesti + IPTC `DigitalSourceType`; sağlayıcı filigranı (SynthID) korunur; 02.12.2026'ya ek süre yalnızca piyasadaki sistemler için ❓ (AI Omnibus) |
| 50(4) | Deployer: deepfake etiketi; kamu yararı konularında bilgilendirme amaçlı AI metin etiketi (insan editoryal incelemesi yoksa) | Sentetik yüz/ses zorunlu etiket; onay kuyruğu = editoryal sorumluluk kaydı (`review_tasks.decided_by`) |
| Ceza | 15 M € / %3 | – |

Komisyon Kılavuzu (20.07.2026) ve İşaretleme Uygulama Kodu yayımlandı. Türkiye'de AI kanunu yok (2026); eylem planı var.

## 6. Platform geliştirici politikaları (üçüncü taraf hesaplara hizmet)

| Platform | Zorunluluk (✅/⚠) | Üründe karşılığı |
|---|---|---|
| **Meta** | Advanced Access için **App Review + Business Verification** ve **Tech Provider** doğrulaması ⚠; izin başına ekran kaydı + gerekçe + 30 gün içinde başarılı test çağrısı; Privacy Policy URL, Terms URL, **Data Deletion Callback URL** (`signed_request` alır, `{url, confirmation_code}` döner); inceleme ~20 gün ⚠. Platform Terms: kullanıcı silince/uygulamayı kaldırınca/amaç bitince/Meta isteyince **gecikmesiz silme**; satış/reklam ağı/veri simsarı yasak; **Platform verisiyle genel AI modeli eğitmek yasak**; 90 gün kullanılmayan izin geri alınır; yıllık **Data Protection Assessment** (60 gün penceresi). Mesajlaşma: kullanıcının son mesajından **24 saat**; Human Agent etiketi 7 gün (yalnızca insan, destek); toplu/istenmeyen DM yasak | `POST /webhooks/meta/data-deletion` → `erasure_requests` + onay kodu sayfası; token'lar bağlantı kesilince anında silinir; 24 saat penceresi `engagement` politika motorunda zorlanır; DPA anketi runbook'u; izin kullanım takibi |
| **Google / YouTube** | `youtube.upload`, `youtube.force-ssl` **hassas** kapsam ✅ → marka + hassas kapsam doğrulaması (doğrulanmış alan adı, gizlilik politikası, demo video); **CASA gerekmez** (yalnızca kısıtlı kapsamlar) ❓ güncel sınıf teyidi; doğrulanmamış uygulama 100 kullanıcı sınırı. **Limited Use** ✅: yalnızca kullanıcıya görünen özellik, reklam yok, satış yok, insan okuması yalnızca güvenlik/rıza, **genel AI/ML modeli eğitimi yasak**; gizlilik politikasında **tam cümle**: "Heliograph's use and transfer to any other app of information received from Google APIs will adhere to Google API Services User Data Policy, including the Limited Use requirements." YouTube API ToS: saklanan API verisi 30 günde yenilenir/silinir ❓ | Cümle `legal/en/privacy-policy.md` §5'te; OAuth ekranında YouTube ToS + Google gizlilik linkleri; 30 günlük veri tazeleme cron'u (M2) |
| **TikTok** | Developer Terms ✅: yalnızca entegrasyon için işleme, `authorization.removed` webhook'unda silme, denetim hakkı; Direct Post audit UI şartları: **önizleme, gizlilik düzeyi seçimi, markalı içerik anahtarı, post başına açık onay**; denetimsiz 5 kullanıcı/özel | Yayın onay ekranı bu alanları taşır; webhook → `erasure_requests` |
| **X** | Developer Policy ✅: X'te silinen/değişen içerik bizde de yansıtılır; X veya hesap sahibi isteyince **24 saat içinde silme**; compliance stream'leri işlenir; off-X eşleştirme yalnızca açık opt-in; toplu yanıt/DM yasak; **"Automated" etiketi** ve bio'da operatör | `EngagementSweep` silinenleri temizler; compliance stream tüketici (M4); "Automated" kontrol listesi kanal bağlarken |
| **Telegram** | Bot Developer ToS ✅: gerekli veri, gizlilik yasalarına uyum, kendi gizlilik politikanı yayınla, spam yok | Bot ToS linki; kullanıcı kendi botu |
| **Apple** ✅ (doğrudan okundu) | 5.1.1(v) **uygulama içi hesap silme** (gerçek silme); 5.1.1(i) gizlilik politikası linki (SDK'lar dahil); 5.1.1(ii) kullanım verisi için rıza; **5.1.2(i): kişisel veriyi üçüncü taraf AI ile paylaşmadan önce açık izin**; ATT yalnızca izleme varsa; App Privacy etiketleri + SDK privacy manifest | Hesap silme ekranı; onboarding'de **"AI işleme bildirimi ve izni"** (`ai_processing` kabulü, `consent_records`); gizlilik etiketleri envanterden |
| **Google Play** ✅ | Uygulama içi **ve** herkese açık web linki ile hesap silme (Data safety formunda beyan); Data safety'de üçüncü taraf AI paylaşımı; hassas izin öncesi belirgin bildirim; **AI-Generated Content policy**: uygulama içinde saldırgan AI içeriği **raporlama/bayraklama** mekanizması, deepfake/aldatma yasak | Silme web sayfası (`legal/*/data-deletion`); mobilde "içeriği bildir" düğmesi (M3.6); Data safety formu envanterden |

## 7. Ürün içi uyum kontrolleri (kod düzeyinde)

- `consent_records` + `packages/domain/src/privacy/consent.ts`: kayıt için zorunlu: `terms`, `privacy`, `aup`, `ai_processing` (Apple 5.1.2(i)); gösterilen ama onaylatılmayan: `kvkk_aydinlatma`; Türkiye'de ödeme adımı: `distance_sale` (+ hemen başlama onayı); isteğe bağlı ve ön işaretsiz: pazarlama (İYS), ses klonu, yüz modeli, çerezler. Metin sürümü ilerleyince yeniden kabul.
- Aydınlatma ile açık rıza ayrı ekran bileşenleri; tek kutu asla ikisini kapsamaz (İlke Kararı 2026/347).
- Reklam/iş birliği: `labels.ad` zorunlu; sentetik insan/ses: `labels.aiDisclosed` zorunlu; AB hedefli hesaplarda AI yanıt beyanı varsayılan açık ve kilitli.
- Hesap silme: panel + mobil + herkese açık web talimatı; 30 gün bekleme; tüm token'lar revoke; Meta/TikTok/X silme istekleri aynı yol, X için 24 saat SLA.
- Yorum/DM metinleri 90 gün sonra anonim; platformda silinen içerik bizde de silinir (sweep + compliance stream).
- E-posta: işlemsel/pazarlama ayrımı; pazarlama yalnızca İYS onaylı; onaylar 3 iş günü içinde İYS'ye; kayıtlar 3 yıl.
- Fiyat: Türkiye'deki müşteriye TL, KDV dahil; MoR/iyzico seçimi ülkeye göre `config`.
- Mobil: "içeriği bildir" (Play AI policy), hesap silme, gizlilik etiketleri; üçüncü taraf AI izni onboarding'de.
- Denetim izi; DPA anket raporları `admin` panelinden; aktarım sicili ve alt işleyen değişiklik bildirimi (30 gün önce e-posta).

## 8. Metin envanteri (`legal/`)

| Dosya | Dil | Durum |
|---|---|---|
| gizlilik-politikasi / privacy-policy | tr, en | taslak var |
| kullanim-sartlari / terms-of-service | tr, en | taslak var |
| kvkk-aydinlatma-metni (+ kiracının takipçilerine yönelik **örnek aydınlatma**) | tr | taslak var / örnek M1.8 |
| kvkk-acik-riza-metni (ayrı belge) | tr | taslak var |
| cerez-politikasi / cookie-policy | tr, en | taslak var / en M1.8 |
| mesafeli-satis-sozlesmesi (ön bilgilendirme dahil) | tr | taslak var |
| iptal-ve-iade-politikasi / refund-policy | tr, en | taslak var / en M1.8 |
| kabul-edilebilir-kullanim / acceptable-use-policy | tr, en | taslak var |
| veri-silme-talimatlari / data-deletion | tr, en | taslak var |
| alt-isleyiciler / sub-processors | tr, en | taslak var |
| ai-kullanim-beyani / ai-disclosure | tr, en | taslak var |
| veri-isleme-sozlesmesi-dpa (KVKK md. 12 + GDPR md. 28 + SCC Modül 2 eki + Kurul standart sözleşme eki) | tr, en | M1.8 |
| saklama-ve-imha-politikasi | tr | M1.8 |
| veri-sorumlusu-basvuru-formu | tr | M1.8 |
| guvenlik / security | tr, en | M1.8 |
| iys-onay-metni, etbis-tanitici-bilgiler (footer), yas-politikasi | tr | M1.8 |

Sürümleme: dosya başı `version`, `config` `legal.<doc>.version`; artınca yeniden kabul.

## 9. Yapılacaklar

- [ ] Avukat incelemesi; mali müşavir; AB/UK temsilci teklifi.
- [ ] ❓ teyitleri: Meta Platform Terms madde numaraları ve Tech Provider metni; Google YouTube kapsam sınıfı ve 30 gün tazeleme kuralı; VERBİS özel nitelikli eşik; AI Omnibus ek süre; UK DUAA temsilci etkisi.
- [ ] Alt işleyen DPA/SCC'leri + Kurul standart sözleşmeleri + 5 iş günü bildirimleri; aktarım sicili.
- [ ] M0.14/M1.7: consent akışları (ai_processing dahil), hesap silme, Meta callback; M2: YouTube veri tazeleme; M3.6: mobil içerik bildirme; M4: X compliance stream.
