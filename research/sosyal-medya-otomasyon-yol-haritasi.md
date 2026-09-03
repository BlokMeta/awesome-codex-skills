# Tam Otomatik Sosyal Medya Sistemi: Fizibilite Araştırması ve Teknik Yol Haritası

*DevOps ve AI nişinde, 20 persona × 6 platform, günde 5 post + 2 video, admin panelli, etkileşim ve iş birliği yönetimli bir sistem için. Tarih: 3 Eylül 2026.*

## 1. Kısa Cevap

**Evet, mümkün; ama tarif ettiğiniz hâliyle değil, üç düzeltmeyle.** Sistemin %90'ı (trend yakalama, günde 5 post + 2 video üretimi, çoklu persona, admin panel, yorum/DM/e-posta yanıtı, iş birliği CRM'i, para eşiğinde alarm, telifsiz medya, kalite kapısı, kendi fotoğraflarınızla gün aşırı plan) bugünkü araçlarla inşa edilebilir ve bu doküman bunun nasıl yapılacağını adım adım anlatıyor. Üç nokta ise olduğu gibi yapılamaz ve yapılmaya çalışılmamalıdır:

| İstek | Durum | Ne yapılacak |
|---|---|---|
| "Sıfırdan hesapları tüm bilgileriyle kendisi oluşturacak" | **Yapılmamalı.** Otomatik hesap açma 6 platformun tamamında kullanım şartlarını ihlal eder; telefon doğrulaması, cihaz parmak izi ve davranış analiziyle tespit edilir; sonuç toplu ban ve geliştirici hesabının kapanmasıdır. | Hesaplar **elle** açılır (20 persona × 6 platform = 120 hesap, persona başına ~1 saat). Sistem, profil metni, biyografi, avatar, kapak görseli, link-in-bio sayfası ve ilk içerik paketini **hazırlar**; siz yapıştırıp doğrularsınız. Persona sihirbazı bunu 15 dakikalık bir işe indirir. |
| "AI olduğu anlaşılmayacak, insan gibi davranacak" | **Kısmen.** Amaç "kötü AI içeriği gibi görünmemek" ise tamamen meşru ve ulaşılabilir; bu dokümanın 6. bölümü buna ayrılmıştır. Amaç "platformdan ve yasadan gizlemek" ise: X otomatik hesaplara "Automated" etiketi zorunlu kılıyor ve AI yanıt botlarına yazılı ön onay istiyor; YouTube/TikTok/Meta gerçekçi sentetik insan/ses için etiket istiyor; AB Yapay Zekâ Yasası Madde 50 (2 Ağustos 2026'dan beri yürürlükte) sentetik içerik için makine-okunur işaretleme ve deepfake beyanı zorunlu tutuyor. | Format seçimiyle çözülür: metin postlar, terminal demoları, motion-graphics videolar, stok görseller için **etiket zorunluluğu yoktur**. Sentetik yüz/ses kullanılırsa sistem etiketi otomatik ekler. Kalite hedefi "iyi bir insan yaratıcıdan ayırt edilemez" olarak konur. |
| "Yorumlara ve DM'lere her yerde otomatik cevap" | **Platforma göre.** Threads/Instagram/YouTube/Telegram'da yorum yanıtı tam otomatik olabilir. X'te AI üretimi otomatik yanıt ön onay gerektirir (onaya kadar insan tıklamalı taslak). TikTok yorum yanıtı yalnızca Business API onayıyla. DM: Instagram (gelen mesaja, 24 saat), Telegram (bota yazana); Threads/TikTok/YouTube'da DM API'si yok. | Etkileşim motoru bu kabiliyet matrisine göre çalışır; yapılamayan yerde panelde "insan gerekli" kuyruğuna düşer. |

Bunların dışında kalan her şey, aşağıdaki yol haritasıyla ~4–5 ayda kademeli olarak canlıya alınabilir; ilk persona ~5. haftada yayında olur. Hedef ölçekte aylık işletme maliyeti **≈ 1.800–4.400 $** (Bölüm 12), küçük başlangıçta 200–450 $.

### 1.1 Bu doküman nasıl okunmalı

- **Bölüm 2**: Hukuki ve platform politikası çerçevesi (neyin risk olduğu, neyin olmadığı).
- **Bölüm 3**: Platform API'lerinin Eylül 2026 gerçekleri ve üretken AI araçları/fiyatları.
- **Bölüm 4–10**: Mimari, veri modeli, içerik hatları, kalite kapısı, etkileşim motoru, admin panel, bireysel influencer modu, öğrenme döngüsü.
- **Bölüm 11–14**: Fazlı yol haritası, maliyet, riskler, ilk adımlar.

Kaynaklar: Platform geliştirici dokümanları (developers.facebook.com, developers.tiktok.com, developers.google.com/youtube, docs.x.com, core.telegram.org), Anthropic/Google/OpenAI/ElevenLabs/fal.ai fiyat sayfaları, EU AI Act metni, Ticaret Bakanlığı influencer reklam kılavuzu. Doğrulanamayan maddeler ⚠ ile işaretlidir.
## 2. Hukuki ve Politika Çerçevesi: Neresi Kırmızı Çizgi

Bu bölüm sizi korkutmak için değil, sistemi **doğru yere** kurmak için var. Kurallar netleştiğinde tasarım kararları kendiliğinden çıkıyor.

### 2.1 Platform kullanım şartları (ban riski)

| Platform | Yasak olan | Serbest olan |
|---|---|---|
| Meta (IG/Threads) | Otomatik/toplu hesap açma, sahte hesap, birden çok kişisel hesap, etkileşim manipülasyonu, **koordineli sahte davranış** (birlikte çalışan hesap ağları → tüm ağ silinir, reklam hesabı dahil) | Resmi API ile Business/Creator hesaplarınızdan yayın, yorum yönetimi, gelen DM'lere yanıt |
| TikTok | Sahte etkileşim, bot, "like pod", toplu/otomatik hesaplar; yaptırım: sahte metrik silme → erişim kısıtı → geçici → kalıcı ban + para kazanma kaybı | Content Posting API (audit sonrası) ile yayın; birden çok hesap, aldatma amaçlı değilse |
| X | Toplu kayıt, hesaplar arası koordineli amplifikasyon, aynı içeriği çok hesaptan paylaşma, otomatik takip/etkileşim; otomatik hesaplar **"Automated" etiketi** taşımalı; AI yanıt botu için yazılı ön onay | Resmi API + etiketli otomasyon; insan onaylı taslak yanıtlar |
| YouTube | Spam, "inauthentic content" (otomatik/sentetik seri üretim benzer videolar → YPP dışı), etiketlenmemiş gerçekçi sentetik içerik | Data API ile yükleme; özgün, değer katan içerik; `containsSyntheticMedia` beyanı |
| Telegram | Userbot ile spam/flood, sahte sayaç; sahte numara/proxy ile ban aşma | Bot API ile kanal yayını, tartışma grubunda yanıt, bota yazanlara DM |

**Mimariye yansıması:** Hesaplar elle açılır; tek uygulama, tek geliştirici hesabı, tüm hesaplar aynı uygulama altında **şeffaf** biçimde bağlanır; her persona farklı içerik üretir; sistem hiçbir yerde "insan taklidi" yapmaz, sadece iyi içerik üretir.

### 2.2 AB Yapay Zekâ Yasası Madde 50 (2 Ağustos 2026'dan beri uygulamada)

Türkiye'de olsanız da içerik AB kullanıcılarına ulaşıyorsa ve/veya AB'de iş ortağı/reklamveren varsa ilgilidir. Digital Omnibus yüksek riskli yükümlülükleri erteledi ama Madde 50'yi ertelemedi; ulusal otoriteler bu tarihten itibaren uygulayabilir.

| Madde | Yükümlülük | Sizin sisteminizde |
|---|---|---|
| 50(1) | İnsanlarla doğrudan etkileşen AI sistemleri (chatbot, **birinin adına hareket eden AI ajanları**) kişiye AI ile konuştuğunu bildirmeli | Yorum/DM'ye AI yanıt veren persona bu kapsama girebilir. Çözüm: biyografide/otomatik yanıtlarda şeffaflık notu; para/hukuk konularında zaten insan devralıyor |
| 50(2) | Üretken sistem sağlayıcıları çıktıyı makine-okunur işaretlemeli (C2PA/metadata, filigran). Piyasadaki sistemler için ek süre 2 Aralık 2026 | Kullandığınız modeller (Google SynthID, C2PA) bunu zaten yapıyor; siz metadata'yı **silmemelisiniz** |
| 50(4) | **Deployer** (yani siz) deepfake'leri görünür etiketlemeli; kamu yararı konularında bilgilendirme amaçlı AI üretimi **metin** de etiketlenmeli, **gerçek insan editoryal incelemesi** yoksa | "AI haber" tarzı metinler için ya insan editoryal onayı (panelde onay = editoryal sorumluluk) ya da etiket. Sentetik yüz/ses videoları etiketli |

Ceza üst sınırı: 15 M € veya küresel cironun %3'ü. Uygulama kılavuzu (20 Temmuz 2026) ve İşaretleme/Etiketleme Uygulama Kodu (10 Haziran 2026) yayımlandı.

### 2.3 Türkiye

- **Bağımsız bir yapay zekâ kanunu henüz yok** (TBMM'de 3 teklif; 2026–2030 Yapay Zekâ Eylem Planı Cumhurbaşkanlığı Genelgesi ile bağlayıcı).
- **Sosyal Medya Etkileyicileri Reklam Kılavuzu (Reklam Kurulu, 2021):** her ücretli/hediyeli tanıtımda `#Reklam`, `#Sponsor`, `#İşbirliği` gibi açık ibare; video içinde görünür, story'de görünür, podcast'te sözlü. Reklamveren ve influencer birlikte sorumlu.
- **Ticari Reklam ve Haksız Ticari Uygulamalar Yönetmeliği değişikliği (RG 1 Temmuz 2026, yürürlük 1 Ağustos 2026):** (a) insan gibi görünen **AI dijital karakterle (sanal influencer) yapılan reklamlarda bunun açıkça belirtilmesi zorunlu**; (b) gerçek kişinin AI kopyasıyla ürün önerisi yasak; (c) her türlü kazanç (ücretsiz ürün dahil) için "reklam"/"tanıtım" ibaresi; (d) çocuklara profil tabanlı reklam yasak. Yaptırım: 6502 sayılı Kanun md. 77 idari para cezası + reklamın durdurulması.

**Sonuç:** Reklam/iş birliği içeriklerinde etiket **sistem tarafından zorunlu alan**dır, atlanamaz. Sanal influencer (sentetik yüz) ile reklam alınacaksa AI beyanı da otomatik eklenir. Bu, "AI olduğu anlaşılmasın" isteğiyle **reklam içeriğinde** çelişir; organik içerikte çelişmez.

### 2.4 ABD FTC (uluslararası marka anlaşmaları için)

- **16 CFR 465 (Ekim 2024):** sahte/AI üretimi yorum ve testimonial yasak; **sahte sosyal medya etki göstergeleri** (bot takipçi/izlenme/beğeni/yorum) satmak ve satın almak yasak; ihlal başına ~52 bin $. Aralık 2025 uyarı mektupları, Ocak 2026 sıkılaştırma açıklaması.
- **Endorsement Guides:** #ad ilk satırlarda; videoda sözlü + yazılı; **sanal/AI influencer'lar da kapsamda**: izleyici gerçek bir insanın deneyimi sanabilecekse AI olduğunu gizlemek aldatıcıdır.

### 2.5 Telif ve lisans

- Stok: Pexels (atıf gerekmez), Pixabay (atıf gerekmez), Unsplash (atıf zorunlu) ticari kullanım; lisans notu `asset.provenance`'a yazılır.
- AI üretimi: ücretli API çıktıları ticari kullanılabilir (Google/OpenAI çıktı üzerinde hak iddia etmez; Vertex AI'da IP tazminatı). FLUX.1-dev ağırlıkları ticari değil; yalnızca lisanslı sağlayıcı (fal/BFL) üzerinden.
- Müzik: Suno/Udio'nun resmi API'si yok; aracı "Suno API"ler ToS ihlali. Pixabay Music + YouTube Audio Library'den önceden temizlenmiş yerel kütüphane.
- Ekran kayıtları / üçüncü taraf blog görüntüleri: kısa, atıflı, dönüştürücü kullanım; logolar tespit edilip reddedilir.
- Kendi fotoğraf/ses/yüzünüz: yazılı izin kaydı sistemde saklanır (LoRA ve ses klonu için).
## 3. Platform Gerçekleri (Eylül 2026)

Bu bölüm, mimarinin dayandığı zemin. Her platformun resmi API'si ne yapmanıza izin veriyor, ne kadar, hangi onay süreciyle. Kaynaklar resmi geliştirici dokümanlarıdır; doğrulanamayan maddeler ⚠ ile işaretlidir.

### 3.1 Yetenek matrisi

| Yetenek | Instagram | Threads | TikTok | YouTube | X | Telegram |
|---|---|---|---|---|---|---|
| Metin post | – (görsel gerekli) | ✅ | – | – | ✅ | ✅ |
| Görsel / carousel | ✅ | ✅ | ✅ (foto post) | – | ✅ | ✅ |
| Kısa video | ✅ Reels | ✅ | ✅ | ✅ Shorts | ✅ | ✅ |
| Story | ✅ | – | – | – | – | – |
| Yorum okuma/yanıt | ✅ | ✅ | ⚠ yalnızca Business API (allowlist) | ✅ | ✅ (reply = yeni post) | ✅ (tartışma grubu üzerinden) |
| DM okuma/yanıt | ✅ (kullanıcı önce yazmalı, 24 saat pencere) | ❌ API yok | ❌ API yok | ❌ API yok | ✅ (user-context, kısıtlı) | ✅ (bot'a yazanlar) |
| Analitik/insights | ✅ | ✅ | ✅ (Display API, kendi videoların) | ✅ Analytics API | ✅ (ücretli okuma) | Kısıtlı (görüntülenme sayısı) |
| App review / audit | Kendi hesaplarınız için gerekmez (Standard Access) | Kendi hesaplarınız "Threads Tester" olarak eklenir | **Zorunlu**; denetimsiz: max 5 kullanıcı, hesap özel, yalnızca SELF_ONLY | Doğrulanmamış projede yüklemeler **özel kilitli**; uyumluluk denetimi gerekir | Geliştirici hesabı + kredi | Yok |
| Ücret | Ücretsiz | Ücretsiz | Ücretsiz | Ücretsiz (kota) | **Kullanım başına ödeme** (PPU) | Ücretsiz |
| AI içerik etiketi | Gerçekçi video/ses için zorunlu; C2PA/IPTC metadata okunur | Instagram ile aynı | Gerçekçi AIGC zorunlu; C2PA otomatik | `status.containsSyntheticMedia` alanı API'de var | Genel zorunluluk yok; manipüle medya politikası | Yok |
| Otomasyon etiketi | – | – | – | – | **"Automated" profil etiketi zorunlu** + yöneten insan hesabı | Bot zaten bot |

### 3.2 Platform başına ayrıntı ve tasarım sonuçları

**Instagram** (Instagram API with Instagram Login)
- Business/Creator hesap gerekir. Reels, carousel, Story yayınlama; yorum yönetimi; mesajlaşma. Kendi hesaplarınız için Standard Access yeterli (App Review yok); başkalarının hesabı için Advanced Access + Business Verification.
- Limit: hesap başına 24 saatte **100 API yayını** (carousel = 1). Yorumlara özel yanıt: 750 çağrı/saat.
- DM: işletme sohbet başlatamaz; kullanıcı yazınca 24 saat yanıt penceresi. Yani "DM'den yazanlara cevap" mümkün, "DM ile ulaşma" mümkün değil.
- Meta topluluk standartları: otomatik hesap oluşturma, yüksek frekanslı otomatik etkileşim, çok hesaplı koordineli sahte davranış yasak. Meta "AI info" etiketi: fotogerçekçi video/ses için kendi beyanınız zorunlu; metadata (IPTC `DigitalSourceType`) üzerinden okunur. ⚠ Etiketi doğrudan ayarlayan bir Graph API parametresi bulunamadı; aracı servisler metadata gömerek çözüyor.
- **Tasarım sonucu:** Reels + carousel ana format; DM yanıtı yalnızca gelen mesajlara; her Reels dosyasına gerekiyorsa C2PA/IPTC metadata gömülür.

**Threads** (Threads API)
- Metin, görsel, video, carousel; yanıt yönetimi; insights. Kendi hesaplarınızı "Threads Tester" olarak ekleyerek review olmadan kullanabilirsiniz.
- Limit: profil başına 24 saatte **250 post, 1.000 yanıt**.
- DM API'si yok.
- **Tasarım sonucu:** En cömert metin platformu; "hot take" ve sohbet formatı için birincil kanal. Yorum yanıtı tamamen otomatikleştirilebilir.

**TikTok** (Content Posting API + Display API)
- Her türlü API erişimi için app review (demo video, web sitesi, gizlilik politikası; "birkaç gün–2 hafta"). Content Posting için ayrıca **audit**: denetim geçilmeden 24 saatte en fazla 5 kullanıcı paylaşabilir, hesap **özel** olmalı, görünürlük **SELF_ONLY**.
- Rate: video init 6 istek/dk/kullanıcı. Gizlilik düzeyi kullanıcı seçimi olmalı (varsayılan yok); markalı içerik anahtarı; yorum kapatma seçeneği.
- Yorum okuma/yanıt: developers.tiktok.com'da yok; **TikTok API for Business** (allowlist + işletme kimliği) ile mümkün ⚠. DM API yok.
- Gerçekçi AIGC etiketi zorunlu; C2PA ile otomatik. Toplu hesap otomasyonu ve etkileşim manipülasyonu yasak.
- **Tasarım sonucu:** TikTok, audit tamamlanana kadar "hazırlık" kanalı olarak kalır (özel paylaşım ile pipeline test edilir). Yorum yanıtı fazlar sonrası, Business API onayıyla. Alternatif: audit'i geçmiş bir aracı (Ayrshare/Zernio) üzerinden yayın.

**YouTube** (Data API v3)
- `videos.insert` ile yükleme; dikey/kare ve ≤ 3 dk ise Shorts olur. `status.containsSyntheticMedia` alanı ile AI beyanı API'den yapılabilir.
- Kota: 10.000 birim/gün genel + **ayrı havuzda günde 100 `videos.insert`** ve 100 `search.list` (resmi dokümanlarda mevcut; ⚠ yürürlük tarihi üçüncü taraflarda Haz 2026 olarak geçiyor). Yorum ekleme 50 birim. Bu, günde 40 videoyu tek projede karşılar.
- **Kritik:** Doğrulanmamış (compliance audit geçmemiş) API projelerinden yüklenen tüm videolar **özel kilitli** kalır. Audit + gerektiğinde kota artırım formu Faz 0'da başlatılmalıdır.
- Temmuz 2025 "inauthentic content" para kazanma politikası: "otomatik veya sentetik seri üretim" benzer videolar YPP'den çıkarılma nedeni. Bu, 20 persona için **birbirinden gerçekten farklı** içerik zorunluluğunu bir kez daha vurgular.
- **Tasarım sonucu:** Shorts ana video kanalı; her persona'nın kendi kanalı; audit öncesi test yüklemeleri özel kalır (sorun değil, pipeline testi için).

**X** (API v2)
- **Şubat 2026'dan itibaren yeni geliştiriciler için varsayılan model kullanım başına ödeme (PPU)**; ücretsiz katman yalnızca "kamu yararı" uygulamaları için. Eski Basic ($200/ay) planları PPU'ya taşınıyor (⚠ tarih). Faturalama döneminde 3 milyon okuma üst sınırı. ⚠ Yaygın raporlanan ancak resmi sayfada doğrulanamayan birim fiyatlar: post başına ~$0,015, link içeren post ~$0,20, okuma ~$0,005. Sahip olunan içerik okuması $0,001 (Nis 2026, resmi).
- Medya yüklemesi v2 (`POST /2/media/upload`, chunked); v1.1 kaldırıldı.
- Yanıt = `reply.in_reply_to_tweet_id` ile yeni post. DM: user-context, platform genelinde ~500 DM/gün, Basic'te tutarsızlık raporları.
- **Otomasyon kuralları:** Otomatik hesaplar "Automated" profil etiketini açmalı ve yöneten insan hesabını göstermeli; hesaplar arası benzer içerik yasak; otomatik yanıt/DM yalnızca kullanıcı başlatmalı ve opt-out'lu. **AI ile üretilmiş otomatik yanıtlar X'ten yazılı ön onay gerektirir**; insan tarafından incelenip tıklanarak gönderilen taslaklar gerektirmez.
- **Tasarım sonucu:** X'te (a) her persona "Automated" etiketi ile çalışır, (b) yorum yanıtları varsayılan olarak **insan onaylı taslak** modunda kalır (ön onay alınana dek), (c) linkli post maliyeti yüksek olduğundan linkler "yanıt"a veya bio'ya taşınır, (d) maliyet paneli X'i ayrı izler.

**Telegram** (Bot API)
- Kanal yayını: bot kanala yönetici eklenir; metin, foto, video, medya grubu. Review yok, ücretsiz. Yükleme 50 MB (self-host Bot API sunucusu ile 2 GB). Yaklaşık 30 mesaj/sn genel, grup/kanal başına ~20 mesaj/dk.
- Yorumlar: kanala bağlı tartışma grubunda otomatik iletilen gönderi başlığı altında; bot gruba eklenince yanıt verebilir.
- DM: bot sohbet başlatamaz, kullanıcı `/start` demeli. Kişisel hesap otomasyonu (MTProto userbot) resmi olarak "gözlem altına alınır", spam benzeri kullanım kalıcı ban. **Önerilmez.**
- **Tasarım sonucu:** Persona başına kanal + tartışma grubu + bot. En kolay ve tam otomatik kanal; ilk uçtan uca testin yeri.

### 3.3 Aracı servis seçeneği

Kendi adaptörlerinizi yazmak yerine (veya yanında) hazır bir katman kullanabilirsiniz. Karşılaştırma:

| Servis | Model | 6 platform | Yorum/DM API | Not |
|---|---|---|---|---|
| **Postiz** (açık kaynak, AGPL, ~35K yıldız) | Self-host ücretsiz; bulut $29–99/ay | ✅ (Telegram bot ile) | ⚠ Yayın odaklı | Kod tabanı adaptör referansı olarak değerli; self-host ile ücretsiz |
| **Zernio** (eski adı Late) | Hesap başına: ilk 2 ücretsiz, $6 → $3 → $1 kademeli | ✅ | Yorum + DM her hesapta | 120 hesap için ≈ $360/ay; audit/review yükünü üstlenir |
| **Ayrshare** | $149–599/ay | ✅ | Yorum: IG/Threads/TikTok/YT/X; DM: yalnızca IG/X/FB | Kurumsal, olgun |
| **Blotato** | $29–499/ay | ❌ Telegram yok | Yok | – |
| **Mixpost** | Tek seferlik $299–1.199 | ❌ Telegram yok | Yok | – |

**Öneri:** Adaptör katmanını kendiniz yazın (kontrol, maliyet, gizlilik) ama TikTok ve gerekirse X için **Zernio veya Ayrshare'i yedek sürücü** olarak aynı arayüzün arkasına koyun. Bu, audit süreçlerinde beklerken pipeline'ı canlı tutar. Aracı kullanılsa bile platform kotaları hesap başına aynen geçerlidir.
### 3.4 Üretken AI ve medya araçları (Eylül 2026 fiyatları)

Aşağıdaki fiyatlar resmi sayfalardan veya arama özetlerinden alınmıştır; ⚠ olanlar üçüncü taraf kaynaklıdır. Sipariş öncesi bağlantıdan doğrulayın.

**Metin / akıl yürütme (LLM)** — kaynak: platform.claude.com/docs/en/about-claude/pricing

| Model | Girdi $/1M | Çıktı $/1M | Cache okuma | Batch | Kullanım |
|---|---|---|---|---|---|
| Claude Opus 5 (`claude-opus-5`) | 5 | 25 | 0,50 | %50 indirim | Script, post, kalite yargıcı, yorum yanıtı |
| Claude Sonnet 5 (`claude-sonnet-5`) | 2 | 10 | 0,20 | %50 | Sınıflandırma, özet, yüksek hacim |
| Claude Haiku 4.5 (`claude-haiku-4-5`) | 1 | 5 | 0,10 | %50 | Trend sinyali filtreleme |
| GPT-5.6 Terra ⚠ | ~2 | ~12 | – | %50 | Yedek sağlayıcı |
| Gemini 3.7 Flash ⚠ | ~0,75 (tanıtım) | ~3,75 | – | – | Yedek / ucuz sınıflandırma |

Çoklu sağlayıcı soyutlaması (tek arayüz, sağlayıcı değiştirilebilir) mimaride zorunlu; kesinti ve fiyat değişikliklerine karşı.

**Ses (TTS)**

| Servis | Fiyat | Not |
|---|---|---|
| ElevenLabs | Creator $22/ay (100K kredi) … Scale $299/ay (2M); API aşımı ⚠ ~$0,10/1K karakter (v2/v3), ~$0,05 (Flash) | En doğal ses; ses klonlama (yalnızca kendi sesiniz); tüm ücretli planlarda ticari lisans |
| OpenAI gpt-4o-mini-tts ⚠ | ≈ $0,015/dk | Ucuz yedek |
| Google Chirp 3 HD ⚠ | $30/1M karakter; 1M/ay ücretsiz | İyi Türkçe desteği; ücretsiz kota ile başlangıç |
| Azure Neural HD ⚠ | $22/1M karakter | Kurumsal alternatif |

**Görsel üretimi**

| Model | Fiyat/görsel | Not |
|---|---|---|
| Nano Banana 2 (`gemini-3.1-flash-image`) ⚠ | $0,045–0,134 | Hızlı, 9:16 destekli; Nano Banana Pro referans görselle tutarlı persona |
| FLUX.2 [pro] (BFL API) | $0,03 ilk MP + $0,015/ek MP | Yüksek kalite; FLUX.1-dev ağırlıkları ticari değil, fal/BFL üzerinden kullanın |
| Ideogram 3/4 ⚠ | $0,03–0,10 | **Metin doğru render eder** → kapak/thumbnail/başlık kartı |
| Imagen 4 (Gemini API) | $0,02–0,06 | Ucuz, SynthID filigranlı |
| Recraft V4 ⚠ | $0,04 raster / $0,08 vektör | SVG çıktı → logo, ikon, diyagram |
| fal.ai FLUX LoRA eğitimi | ~$2/eğitim (~10 dk) | Kendi yüzünüz için tutarlı persona (bireysel mod) |

Tüm bu servislerde ücretli kullanımda çıktı ticari olarak kullanılabilir; Google ve OpenAI çıktı üzerinde hak iddia etmez, Vertex AI'da IP tazminatı vardır. Her üretimin prompt'u, modeli ve zamanı `asset.provenance` alanına yazılır.

**AI video (B-roll, isteğe bağlı)**

| Model | Fiyat | Not |
|---|---|---|
| Kling 3.0 (resmi API / fal.ai) | $0,084/sn 720p, $0,112/sn 1080p; Turbo (sesli) $0,112–0,14/sn | Fiyat/kalite dengesi en iyi; 9:16 destekli |
| Veo 3.1 Fast (Gemini API) | ⚠ $0,10–0,12/sn | Sesli; SynthID filigranı |
| Veo 3.1 | $0,20/sn (sessiz), $0,40/sn (sesli) | En yüksek kalite; pahalı |
| Runway Gen-4 Turbo | $0,05/sn | Ucuz, hızlı |
| Hailuo 2.3 / H3 ⚠ | ~$0,05–0,08/sn | Ucuz alternatif |
| Luma Ray 3.2 | $0,30/5 sn 720p | – |
| **Sora 2 / Sora 2 Pro** | – | **Kullanmayın:** OpenAI, Videos API'sini 24 Eylül 2026'da kaldırıyor |

**Avatar / talking-head (varsayılan dışı)**

| Servis | Fiyat |
|---|---|
| HeyGen API | Avatar IV ≈ $3–4/dk; ön ödemeli cüzdan |
| Hedra Character-3 | $0,05/sn 720p |
| Synthesia | Creator $89/ay, API 75 kredi/dk ⚠ |
| Tavus | Starter $59/ay, Growth $397/ay ⚠ |

**Montaj, altyazı, terminal**

| Araç | Lisans / fiyat | Not |
|---|---|---|
| Remotion | ≤ 3 çalışanlı şirketlerde **ücretsiz** (ticari dahil); üstü "Automators" $0,01/render, min $100/ay | Lambda render ≈ $0,02 / 1 dk 1080p video |
| FFmpeg 8.x | Ücretsiz | Normalizasyon, birleştirme, Whisper filtresi |
| Charm VHS | MIT | `.tape` ile deterministik terminal demosu; `Width 1080 / Height 1920` ile doğrudan 9:16 |
| WhisperX (self-host) | BSD | Forced alignment ile en doğru kelime zamanı; < 8 GB VRAM |
| faster-whisper | MIT | GPU'da 4× hızlı Whisper |
| OpenAI whisper-1 | $0,006/dk | `timestamp_granularities=word` yalnızca whisper-1'de |
| Deepgram Nova-3 ⚠ | $0,0043/dk | Bulut alternatifi |

Script sizde olduğu için en ucuz yol ASR değil, bilinen metnin sese **forced alignment** ile hizalanmasıdır (WhisperX).

**Telifsiz stok ve müzik**

| Kaynak | Limit | Lisans |
|---|---|---|
| Pexels API | 200 istek/saat, 20K/ay; istekle sınırsız | Ticari, atıf gerekmez (foto + video) |
| Unsplash API | Demo 50/saat; üretim 5.000/saat (inceleme sonrası) | Fotoğraf; fotoğrafçı + Unsplash atfı zorunlu |
| Pixabay API | 100 istek/dk | Görsel + video; ticari; müzik API'de yok ⚠ |
| Müzik | Suno/Udio'nun **açık API'si yok**; Epidemic Sound API yalnızca ortaklık anlaşmasıyla | Pratik çözüm: Pixabay Music + YouTube Audio Library'den etiketlenmiş, önceden temizlenmiş yerel kütüphane |

**AI metin dedektörleri (yalnızca sinyal)**

| Araç | Fiyat | Bağımsız ölçümler |
|---|---|---|
| GPTZero | $24,99/ay, 500K kelime | %52–99 arası çelişkili sonuçlar |
| Originality.ai | ≈ $0,01 / 100 kelime | En agresif; yanlış pozitif %2–28 |
| Sapling | $0,025 / 1K karakter | ⚠ %17 yanlış pozitif |
| Copyleaks | < $0,01 / tarama (hacimde) | %12 yanlış pozitif |

Hakemli çalışmalar: hafifçe düzeltilmiş insan metni %10–75 oranında "AI" işaretleniyor; ana dili İngilizce olmayanlar 2–3× daha sık; karma metinde tespit ≈ %0. **Sonuç:** dedektör, "bu paragrafı insanlaştır" sinyali olarak kullanılır; asla tek başına karar mekanizması değildir.

**Bir kısa videonun birim maliyeti (45 sn, 9:16)**

| Kalem | Maliyet |
|---|---|
| Script (Opus 5, cache'li) | ~$0,05 |
| Ses (ElevenLabs Flash, ~700 karakter) | ~$0,035 |
| Kapak + başlık kartı (2 görsel) | ~$0,10 |
| Terminal demosu (VHS) | $0 |
| B-roll 1–2 klip × 5 sn (Kling 3.0) | $0,40–0,85 (stok kullanılırsa $0) |
| Altyazı (WhisperX) | $0 |
| Render (Remotion, self-host) | ~$0,01 |
| Kalite kapısı (yargıç çağrıları) | ~$0,05 |
| **Toplam** | **≈ $0,25 (stok) – $1,20 (AI B-roll)**; avatarlı ≈ $2–3 |
### 3.5 Trend ve haber kaynakları (API durumu 2026)

| Kaynak | Erişim | Limit / maliyet | Değer |
|---|---|---|---|
| Hacker News (Firebase + Algolia) | Auth yok | Belgelenmiş limit yok; Algolia `search_by_date` ile anahtar kelime + zaman penceresi | En hızlı "şu an ne konuşuluyor" sinyali |
| Hugging Face Hub | `GET /api/models?sort=trending`, günlük makaleler | Ücretsiz hesap 1.000 istek/5 dk | AI trendleri için en iyi ücretsiz kaynak |
| arXiv | API + kategori RSS | 3 saniyede 1 istek | Yavaş ama derin sinyal |
| GitHub | REST search (`created:>` + yıldız), OSS Insight trending API (beta), release feed'leri | Ücretsiz | DevOps araç sürümleri (Kubernetes, Terraform, ArgoCD…) |
| Product Hunt API v2 | GraphQL | 6.250 puan/15 dk | AI araç lansmanları |
| RSS (60+ feed) | feedparser | Ücretsiz | Kubernetes, CNCF, AWS What's New, Azure Updates, Google Cloud, HashiCorp, OpenAI, DeepMind, Meta AI, Hugging Face, The New Stack, InfoQ, TLDR; Anthropic'in resmi RSS'i yok (topluluk aynaları) |
| YouTube `mostPopular` (kategori 28) | Data API | 1 birim/çağrı | Video trendleri |
| Tavily | 1.000 kredi/ay ücretsiz; $30/ay 4.000 | Anahtar kelime izleme, anlık arama |
| Exa | $7/1K arama | Semantik arama, "benzer içerik bul" |
| Perplexity Sonar / Search API ⚠ | ~$5/1K istek | Yedek |
| Reddit | **Kasım 2025'ten beri yeni uygulamalar manuel onay** (haftalar sürebilir, yanıt gelmeyebilir); ücretsiz 100 istek/dk | **Bağımlılık olarak riskli**; RSS (`/r/devops/.rss`) ile sınırlı kullanım |
| X trends | PPU: ⚠ ~$0,01/kaynak | Pahalı; öncelikli değil |
| Google Trends | Resmi API kapalı alfa; pytrends arşivlendi | Kullanılmaz; SerpApi gibi aracılarla isteğe bağlı |
| TikTok Creative Center | API yok, Research API yalnızca akademik | Scraping ToS riski; kullanılmaz |
| Bluesky / Mastodon | Ücretsiz açık akış (firehose, public timelines, trends/tags) | 2026'da gerçek zamanlı açık akışı olan tek büyük ağlar; ek sinyal |
| Brave Search API | Ücretsiz katman Şubat 2026'da kaldırıldı; ~$5/1K | Yedek |

Tavsiye edilen çekirdek: **HN + HF Hub + GitHub + arXiv + RSS + Tavily**. Hepsi ücretsiz veya çok ucuz, hepsi API'li, hiçbiri ToS riski taşımıyor.

### 3.6 Açık kaynak referanslar (GitHub, 3 Eylül 2026)

| Proje | Yıldız | Lisans | Kullanım |
|---|---|---|---|
| gitroomhq/postiz-app | 35K | AGPL-3.0 | Adaptör kodları için referans; self-host yedek yayınlayıcı (AGPL: barındırılan fork kaynak yayımlamalı) |
| harry0703/MoneyPrinterTurbo | 120K | MIT | Faceless video pipeline referansı (konu → script → TTS → stok → altyazı → render) |
| remotion-dev/remotion | 58K | Özel (≤3 çalışan ücretsiz) | Ana video motoru; hazır TikTok altyazı şablonları |
| temporalio/temporal | 23K | MIT | İş akışı motoru |
| n8n-io/n8n | 203K | Fair-code | Hızlı prototip; 600+ sosyal medya şablonu (insan onaylı akış dahil); ürün olarak sunmak lisans kısıtlı |
| anthropics/claude-agent-sdk | 8K | MIT | Araştırma/operasyon ajanları için |
| mastra-ai/mastra | 28K | Apache-2.0 ⚠ | TypeScript ajan/iş akışı çerçevesi; NestJS/Remotion ile aynı dil |
| RayVentura/ShortGPT | 8K | MIT | **Bakımsız** (son commit Şubat 2025); yalnızca fikir |
| GeneralMills/pytrends | – | – | Arşivlendi; kullanmayın |
## 4. Hedef Mimari

### 4.1 Tasarım ilkeleri

1. **Sadece resmi API'ler.** Her platforma yalnızca resmi geliştirici API'si üzerinden bağlanılır. Tarayıcı otomasyonu, mobil uygulama emülasyonu, proxy havuzu, "insan gibi tıklama" taklidi yok. Bu ilke hem hesaplarınızı hem projeyi korur (bkz. Bölüm 2).
2. **Persona başına bağımsız pipeline.** 20 persona = 20 bağımsız içerik hattı. Ortak konu, ortak kaynak havuzu olabilir ama her personanın kendi "ses kitabı", kendi takvimi, kendi ölçümleri vardır. İki persona aynı metni asla paylaşmaz (koordineli sahte davranış tespitinin bir numaralı sinyali kopya içerik).
3. **Dayanıklı iş akışları.** Bir video üretimi 6–8 adımlık, dakikalar süren, yarı yolda başarısız olabilen bir süreçtir. Bu yüzden "cron + kuyruk" yerine **durable workflow** motoru (Temporal) kullanılır: her adım tekrar denenebilir, kaldığı yerden devam eder, durumu izlenebilir.
4. **Kalite kapısı olmadan yayın yok.** Üretilen hiçbir içerik kalite kapısını (Bölüm 6) geçmeden yayına gitmez. Kapı ilk haftalarda insan onaylı, güven skoru yükseldikçe otomatik moda alınır.
5. **Para ve hukuk eşiğinde dur.** Ücret, sözleşme, ödeme, fatura, kişisel veri, hukuki tehdit içeren her etkileşim otomatik yanıt almaz; yalnızca alarm üretir.
6. **Her şey ölçülür ve geri beslenir.** Her paylaşımın 1 saat / 24 saat / 7 gün performansı çekilir; kanca, format, saat ve konu seçimleri bu veriyle güncellenir (Bölüm 7).

### 4.2 Bileşen görünümü

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ADMIN PANEL (Next.js 15 + shadcn/ui)                                    │
│  Persona yönetimi · Takvim · Onay kuyruğu · Inbox · CRM · Alarmlar       │
└───────────────┬──────────────────────────────────────────────────────────┘
                │ REST/tRPC + WebSocket (canlı durum)
┌───────────────▼──────────────────────────────────────────────────────────┐
│  CORE API (NestJS, TypeScript)                                            │
│  Auth · Persona/Channel CRUD · Policy engine · Scheduler · Webhooks       │
└──────┬─────────────────────┬──────────────────────┬──────────────────────┘
       │                     │                      │
┌──────▼───────┐   ┌─────────▼──────────┐   ┌───────▼────────────────────┐
│ TREND ENGINE │   │ CONTENT WORKFLOWS  │   │ ENGAGEMENT ENGINE          │
│ (Python)     │   │ (Temporal workers) │   │ (Temporal workers)         │
│ RSS/HN/      │   │ brief → script →   │   │ yorum/DM/e-posta çekme     │
│ Reddit/arXiv │   │ medya → montaj →   │   │ sınıflandırma → yanıt →    │
│ /HF/GitHub   │   │ QA → yayın         │   │ kalite kapısı → gönder     │
│ skorlama +   │   │                    │   │ para/hukuk → ALARM         │
│ dedup        │   │                    │   │                            │
└──────┬───────┘   └─────────┬──────────┘   └───────┬────────────────────┘
       │                     │                      │
┌──────▼─────────────────────▼──────────────────────▼──────────────────────┐
│ PLATFORM ADAPTER KATMANI (tek arayüz, 6 sürücü)                          │
│ Instagram · Threads · TikTok · YouTube · X · Telegram                    │
│ publish() · getMetrics() · listComments() · reply() · listDMs() · sendDM()│
│ + rate-limit bütçeleyici + token yenileme + hata sınıflandırma            │
└──────┬─────────────────────────────────────────────────────────────────┬─┘
       │                                                                 │
┌──────▼───────────────────────────────┐   ┌─────────────────────────────▼──┐
│ MEDYA ÜRETİM SERVİSİ                 │   │ VERİ KATMANI                    │
│ Remotion render (Docker/Lambda)      │   │ PostgreSQL 16 + pgvector        │
│ FFmpeg · TTS · görsel/video AI       │   │ Redis (kısa ömürlü durum)       │
│ Whisper altyazı · thumbnail          │   │ S3/R2 (medya) · ClickHouse (ops)│
└──────────────────────────────────────┘   └────────────────────────────────┘
```

### 4.3 Teknoloji seçimleri ve gerekçeleri

| Katman | Seçim | Neden | Alternatif |
|---|---|---|---|
| Admin panel | Next.js 15, React 19, shadcn/ui, TanStack Query | Hızlı geliştirme, olgun bileşen seti, SSR gerekmez ama kolay | Remix, SvelteKit |
| API | NestJS (TypeScript) | Modüler, DI, kuyruk/cron/WS entegrasyonları hazır; Remotion ile aynı dil | FastAPI (Python) |
| İş akışı motoru | **Temporal** (self-host veya Temporal Cloud) | Uzun süren, tekrar denenebilir, gözlemlenebilir workflow; "video pipeline yarıda kaldı" sorununu kökten çözer | BullMQ (daha basit, daha az güvence), Inngest, Trigger.dev |
| Trend motoru | Python 3.12 (httpx, feedparser, praw, arxiv) | Veri toplama ve NLP ekosistemi | TypeScript |
| Veritabanı | PostgreSQL 16 + pgvector | Tek DB'de ilişkisel veri + gömme vektörleri (dedup, hafıza, benzerlik) | Postgres + Qdrant |
| Önbellek / kilit | Redis 7 | Rate-limit sayaçları, dağıtık kilit, kısa ömürlü state | Valkey |
| Nesne depolama | Cloudflare R2 (egress ücretsiz) | Video/medya yoğun; S3 uyumlu | S3, Backblaze B2 |
| Video montaj | **Remotion** (React ile video) + FFmpeg | Kod ile tekrarlanabilir, şablonlanabilir, marka tutarlı video; altyazı, geçiş, kod bloğu animasyonu | MoviePy, Creatomate, Shotstack |
| Terminal demoları | Charm **VHS** (`.tape` dosyası → GIF/MP4) + asciinema | DevOps içeriği için gerçek terminal demoları en yüksek güven veren format | Playwright screen recording |
| LLM | Claude Opus 5 (üretim, kalite yargıcı), Claude Sonnet 5 (sınıflandırma, yüksek hacim) | Uzun bağlam, tool use, structured output, prompt caching | GPT, Gemini (çoklu-sağlayıcı soyutlaması öneriliyor) |
| TTS | ElevenLabs (ana), OpenAI TTS (yedek) | Doğal ses, klonlama (kendi sesiniz için), çok dilli | Cartesia, Google Chirp |
| Altyazı | faster-whisper (self-host, GPU) veya Deepgram | Kelime düzeyi zaman damgası | AssemblyAI |
| Görsel üretim | FLUX (fal.ai/Replicate), Ideogram (metin içeren görseller), gpt-image | Ticari lisans, kalite, LoRA ile yüz tutarlılığı | Imagen, Recraft |
| AI video (B-roll) | Kling / Veo / Runway (fal.ai üzerinden tek API) | Kısa 5–10 sn B-roll klipler; ana format Remotion olduğu için isteğe bağlı | Luma, Hailuo |
| Gözlemlenebilirlik | OpenTelemetry → Grafana + Loki + Tempo; Sentry | Her workflow adımının izi; maliyet takibi | Datadog |
| Gizli bilgi | Doppler veya HashiCorp Vault | 120+ token ve 10+ API anahtarı için env dosyası yetmez | SOPS + age |
| Dağıtım | Docker Compose (tek VPS ile başla) → Kubernetes (k3s) | Sizin DevOps geçmişinizle uyumlu; GPU worker ayrı node | Fly.io, Railway |

### 4.4 Veri modeli (çekirdek tablolar)

```sql
-- Bir "marka/kişilik". 20 hesap = 20 persona.
persona (
  id, name, slug, niche ENUM('devops','ai','both','personal'),
  language, timezone,
  voice_bible JSONB,        -- ton, kelime dağarcığı, yasak ifadeler, örnek yazılar, mizah düzeyi
  visual_kit JSONB,         -- renk paleti, font, logo, video şablon ID'leri, avatar
  posting_policy JSONB,     -- günlük post/video min-max, saat pencereleri, jitter, hafta sonu davranışı
  engagement_policy JSONB,  -- yorum yanıt oranı, DM yanıt kuralları, eskalasyon eşikleri
  quality_policy JSONB,     -- kapı eşikleri, insan onayı gerekli mi, otomatik mod
  status ENUM('draft','warming','active','paused'),
  created_at, updated_at
)

-- Persona'nın bir platformdaki hesabı.
channel (
  id, persona_id, platform ENUM('instagram','threads','tiktok','youtube','x','telegram'),
  external_account_id, handle, display_name,
  oauth_tokens ENCRYPTED,   -- KMS/Vault ile şifreli
  token_expires_at, scopes[],
  capabilities JSONB,       -- bu hesapta ne yapılabilir (publish, comments, dm) — app review durumuna göre
  quota_state JSONB,        -- kalan günlük/aylık kota
  health ENUM('ok','token_expired','rate_limited','restricted','banned'),
  last_sync_at
)

-- Trend motorundan gelen ham sinyal.
signal (
  id, source, source_url, title, summary, raw JSONB,
  published_at, discovered_at,
  embedding VECTOR(1024),
  score NUMERIC,            -- hız × otorite × nişe uygunluk × tazelik
  cluster_id               -- aynı haberin farklı kaynakları tek kümede
)

-- Bir persona için üretilecek içeriğin özeti (brief).
content_brief (
  id, persona_id, cluster_id, topic, angle,     -- "açı": aynı haberi 20 persona farklı açıdan işler
  format ENUM('short_video','carousel','single_image','text','thread','poll','story'),
  target_channels[], scheduled_for, status
)

-- Üretilen varlık (script, video, görsel, metin).
asset (
  id, brief_id, kind, storage_url, metadata JSONB,   -- süre, çözünürlük, kullanılan model, prompt hash
  provenance JSONB,         -- hangi kaynaklardan, hangi stok/AI klipler, lisans notu
  qa_report JSONB,          -- kalite kapısı sonucu (Bölüm 6)
  version INT
)

-- Yayınlanan gönderi.
post (
  id, brief_id, channel_id, asset_ids[], caption, hashtags[],
  external_post_id, permalink, published_at,
  status ENUM('scheduled','publishing','published','failed','removed'),
  error JSONB
)

-- Performans zaman serisi (1s/24s/7g anlık görüntüler).
post_metric (post_id, captured_at, views, likes, comments, shares, saves, watch_time, ctr)

-- Etkileşim gelen kutusu: yorum, DM, e-posta, mention.
interaction (
  id, channel_id, kind ENUM('comment','dm','email','mention'),
  external_id, author_handle, text, received_at,
  classification JSONB,     -- {intent, sentiment, is_business, is_legal, is_spam, language}
  reply_asset_id, replied_at,
  status ENUM('new','auto_replied','needs_human','escalated','ignored')
)

-- İş birliği / reklam fırsatları (CRM).
deal (
  id, persona_id, interaction_id, brand, contact, stage ENUM('lead','qualified','negotiating','won','lost'),
  estimated_value, currency, notes, media_kit_sent_at, owner='human'
)

-- Kullanıcının kendi yüklediği fotoğraf/video havuzu (bireysel influencer modu).
media_library (id, persona_id, storage_url, tags[], embedding, used_count, last_used_at, do_not_use_before)

-- Alarmlar
alert (id, persona_id, severity, kind, payload JSONB, delivered_via[], acknowledged_at)
```

### 4.5 Platform adaptör arayüzü

Tüm sürücüler aynı arayüzü uygular; işlem yapılamayan yetenek `capabilities` üzerinden panelde gri gösterilir.

```ts
interface PlatformAdapter {
  platform: Platform;
  capabilities(channel: Channel): Promise<Capabilities>;  // publish.video, publish.image, comments.read, comments.reply, dm.read, dm.send, insights
  publish(channel: Channel, payload: PublishPayload): Promise<PublishResult>;
  getMetrics(channel: Channel, externalPostId: string): Promise<Metrics>;
  listComments(channel: Channel, since: Date): Promise<Comment[]>;
  replyToComment(channel: Channel, commentId: string, text: string): Promise<void>;
  listConversations?(channel: Channel, since: Date): Promise<DM[]>;
  sendMessage?(channel: Channel, conversationId: string, text: string): Promise<void>;
  refreshToken(channel: Channel): Promise<Channel>;
  classifyError(err: unknown): 'retryable' | 'quota' | 'auth' | 'policy' | 'fatal';
}
```

Her sürücünün önünde bir **bütçeleyici** oturur: platformun günlük/aylık kotasını persona sayısına göre paylaştırır, kota bitmeden "kotanın %80'i doldu" alarmı verir ve gerekirse yayını bir sonraki pencereye kaydırır.
## 5. İçerik Üretim Hatları

### 5.1 Trend motoru: "en hızlı yakalayan"

Hız üç şeyden gelir: **çok kaynak**, **sık tarama**, **iyi skorlama**. Yapı:

```
Kaynak toplayıcılar (her 5–15 dk)          Normalizasyon           Skorlama & kümeleme
──────────────────────────────────         ─────────────           ───────────────────
RSS (60+ resmi blog/haber feed'i)  ─┐
Hacker News (Algolia API)           ├─►  başlık+özet+URL   ─►  embedding (pgvector)
Reddit RSS (r/devops, r/kubernetes  │    dil tespiti            ↓
  …; API onayı gelene dek RSS)      │    kanonik URL          aynı haber → tek küme
GitHub (yeni release'ler, star hızı)│    dedup hash             ↓
arXiv (cs.AI, cs.LG, cs.DC)         │                        skor = hız(1s'de kaç kaynak)
Hugging Face (trending models)      │                               × otorite (kaynak ağırlığı)
Product Hunt, YouTube trending      │                               × niş uygunluğu (LLM sınıflandırma)
Bluesky/Mastodon açık akışları     │                               × tazelik (üstel sönüm)
Tavily/Exa haber arama (anahtar     │                               × "daha önce işlendi mi" cezası
  kelime izleme: "Kubernetes 1.3x",  │
  "Claude", "OpenAI", "Terraform"…) ─┘
```

**Hız hedefi:** Bir haberin ilk kaynakta çıkmasından personanın ilk paylaşımına kadar **< 45 dakika** (metin post için), **< 3 saat** (video için). Bu, çoğu insan yaratıcıdan hızlıdır ve "trendi ilk paylaşanlar" arasında olmayı sağlar.

**"Konu değiştirme" özelliği:** Her persona için panelden düzenlenebilen bir `topic_profile` vardır: dahil anahtar kelimeler, hariç anahtar kelimeler, ağırlıklar, örnek "istediğim içerik" / "istemediğim içerik" listesi. Konu değiştiğinde motor yeni profile göre skorlar; eski kuyruktaki brief'ler iptal edilir.

**Editoryal sınırlar:** Trend motoru şunları otomatik eler: dedikodu, söylenti kaynaklı iddialar (tek kaynaklı, doğrulanmamış), politik içerik, rakip karalama, hukuki süreçler. Her brief'e "kaynak kanıtı" iliştirilir; script bu kaynağı gösterir (güvenilirlik = etkileşim).

### 5.2 Metin/görsel post hattı (günde 5 post × persona)

```
brief → [Claude Opus 5] 3 farklı açı + 3 kanca üret
      → [Persona ses kitabı ile] kanal başına yeniden yaz (X: 1–2 cümle; Threads: sohbet tonu; IG: caption + carousel metni; Telegram: uzun, link'li)
      → görsel gerek mi? → carousel (Remotion still-frame şablonu) / tek görsel (FLUX/Ideogram) / kod ekran görüntüsü (Carbon-benzeri kendi renderer)
      → Kalite kapısı (Bölüm 6)
      → Zamanlayıcı: persona saat penceresi + ±22 dk jitter + kanal başına farklı dakika
      → Yayın (adaptör) → 1s/24s/7g metrik toplama
```

Format karışımı (varsayılan, panelden değiştirilebilir):

| Günlük 5 post | Format | Amaç |
|---|---|---|
| 1 | "Bugün ne oldu" hızlı haber (metin + görsel) | Hız, güncellik |
| 1 | Carousel / thread: "X nasıl çalışır" (eğitici) | Kaydetme, paylaşım |
| 1 | Görüş / hot take (kısa, kişisel) | Yorum, tartışma |
| 1 | Pratik ipucu / komut / snippet | Kaydetme |
| 1 | Soru / anket / topluluk | Yorum, algoritma sinyali |

### 5.3 Kısa video hattı (günde 2 video × persona)

Ana format **"faceless + terminal + motion graphics"**: DevOps/AI nişinde en yüksek güven veren ve AI olduğu anlaşılmayan format budur, çünkü gerçek ekran/terminal kayıtları ve gerçek kod içerir; sentetik yüz yoktur.

```
1. Script (Claude Opus 5)
   - 30–60 sn, 90–150 kelime
   - Yapı: 0–2 sn kanca → 3–10 sn bağlam → 10–45 sn gövde (1 ana fikir, en fazla 3 nokta) → CTA
   - Persona ses kitabı + "AI kokusu" yasak listesi (Bölüm 6.2)
   - Çıktı: JSON (sahneler, ekranda görünecek metin, terminal komutları, B-roll ihtiyaçları)

2. Ses (ElevenLabs; persona başına ayrı klonlanmış/seçilmiş ses)
   - Sahne başına ayrı üretim → zamanlama kontrolü
   - Kendi sesiniz: 30 dk kayıtla profesyonel ses klonu (yalnızca kendi sesiniz için)

3. Görsel malzeme (paralel)
   a. Terminal demo: VHS .tape dosyası LLM tarafından yazılır → sandbox'ta (Docker) gerçekten çalıştırılır → MP4
   b. Kod bloğu animasyonu: Remotion bileşeni (yazma efekti, vurgu)
   c. Diyagram: Mermaid/Excalidraw benzeri otomatik çizim → Remotion'da animasyon
   d. B-roll (isteğe bağlı): Pexels stok (ücretsiz, ticari) veya Kling/Veo 5 sn klip
   e. Ekran görüntüsü: Playwright ile ilgili blog/GitHub sayfası kaydı (fair use sınırında; küçük, kısa, atıflı)

4. Altyazı: WhisperX forced alignment (script bilindiği için) → kelime zaman damgası → Remotion'da "kelime kelime" vurgu (kısa video standardı)

5. Montaj: Remotion kompozisyonu (persona görsel kiti: renk, font, alt bant, logo) → 1080×1920, 30 fps, H.264
   - Aynı kompozisyon YouTube Shorts / Reels / TikTok / X / Telegram için tek render
   - YouTube için ayrıca 16:9 varyant (isteğe bağlı)

6. Thumbnail / kapak: Ideogram (metin doğru render eder) veya Remotion still-frame

7. Kalite kapısı (Bölüm 6): teknik doğruluk + "AI kokusu" + tempo + telif
8. Yayın: platform başına başlık/açıklama/hashtag varyantı; YouTube için Shorts uyumlu (dikey, ≤ 3 dk)
```

**Neden avatar/talking-head varsayılan değil:** HeyGen/Synthesia gibi sentetik sunucular teknik olarak mümkündür ve pipeline'a eklenebilir, ancak (a) izleyiciler tarafından giderek daha kolay tanınmakta, (b) platformların "gerçekçi sentetik insan" etiketleme kurallarını tetiklemekte, (c) niş için gereksizdir. Bireysel influencer modunda kullanıcının kendi yüzü ve sesi varsa (kendi kayıtlarından) bu kısıt kalkar.

### 5.4 Uzun içerik (isteğe bağlı, faz 4)

Haftada 1 adet 5–8 dk YouTube videosu (16:9) aynı hattın uzun varyantıyla üretilebilir; Shorts'lardan gelen trafiği kanala bağlamak için değerlidir.
## 6. Kalite Kapısı: "AI kokmayacak"

Bu bölüm sizin en kritik isteğinizi karşılar. Önce dürüst bir çerçeve: hedef, **"kötü AI içeriği gibi görünmemek"** olmalıdır; **"AI kullanıldığını platformdan gizlemek"** değil. İlki tamamen meşru bir kalite hedefidir ve ulaşılabilir. İkincisi bazı durumlarda (gerçekçi sentetik insan/ses, deepfake) platform kuralı ve yasa ihlalidir (Bölüm 2). Metin postlar, terminal demoları, motion-graphics videolar ve stok görseller için ise zorunlu bir "AI etiketi" yoktur; yani doğru formatı seçtiğinizde bu ikilem büyük ölçüde ortadan kalkar.

### 6.1 Neden AI içeriği "kokar"

Okuyucuların yakaladığı sinyaller ölçülebilir ve dolayısıyla engellenebilir:

| Sinyal | Örnek | Karşı önlem |
|---|---|---|
| Klişe kalıplar | "In today's fast-paced world", "game-changer", "delve", "Let's dive in", "unlock the power" | Yasak ifade sözlüğü (200+ kalıp), regex + LLM kontrolü |
| Aşırı düzgün yapı | Her post 3 madde + özet; her cümle aynı uzunlukta | Cümle uzunluğu varyansı (burstiness) eşiği; yapı şablonlarını rastgele değiştirme |
| Genel geçerlik | Somut detay yok, herkesin bildiği şeyler | "Somutluk skoru": versiyon numarası, komut, hata mesajı, sayı içermeyen script reddedilir |
| Emoji / hashtag aşırılığı | Her satırda emoji, 20 hashtag | Persona başına kota (ör. 0–2 emoji, 3–5 hashtag) |
| Tıkır tıkır noktalama | Uzun tire (—) bolluğu, üçlü gruplamalar | Noktalama profili persona ses kitabına göre normalize edilir |
| Kişisel iz yok | Hiç "ben", hiç anı, hiç görüş | Persona "deneyim havuzu": inandırıcı, tutarlı, tekrar eden ama gerçek olaylara dayanan anekdotlar (sizin gerçek DevOps deneyimlerinizden beslenir) |
| Hatasızlık | Hiç düzeltme, hiç fikir değiştirme | Bilinçli "editing" izi: "düzeltme: ...", "dün yanlış yazmışım", takip yorumları |
| Ses/video | Düz TTS tonu, mükemmel diksiyon, sessiz oda | ElevenLabs v3 duygu etiketleri, hafif oda sesi/ambiyans katmanı, kesme/tempo değişimi, "hmm" gibi doğal duraklar (persona ayarı) |

### 6.2 Kapının katmanları

```
Aday üretimi (n=3–5, farklı sıcaklık/açı)
   │
   ├─ K1  Kural tabanlı (ms)     : yasak ifadeler, uzunluk, emoji/hashtag kotası, link politikası, platform limitleri
   ├─ K2  Doğruluk (LLM+araç)     : iddialar kaynak brief'e karşı doğrulanır; versiyon/komut/isim kontrolü; bilinmeyen iddia → red
   ├─ K3  Stil yargıcı (LLM)      : persona ses kitabına uyum 1–10; "bu metin bir insan tarafından mı yazıldı?" rubriği; 3 farklı yargıç promptu, medyan alınır
   ├─ K4  Özgünlük                : pgvector ile son 90 gündeki tüm paylaşımlara benzerlik < 0.85; diğer personaların paylaşımlarına < 0.80
   ├─ K5  AI-dedektör sinyali     : GPTZero/Sapling API (yalnızca sinyal; tek başına karar vermez; yanlış pozitif oranı yüksektir)
   ├─ K6  Video-özel              : kanca 2 sn içinde mi, altyazı senkron mu, sessizlik > 1.5 sn var mı, ses seviyesi normalize mi, ekranda yazım hatası (OCR) var mı
   ├─ K7  Telif/lisans            : kullanılan her varlığın provenance kaydı var mı (stok lisansı, AI üretim logu, kendi medya); marka/logo tespiti (üçüncü taraf logo → red)
   └─ K8  Risk                    : hukuki, politik, nefret, sağlık/finans tavsiyesi, kişisel veri → otomatik red + alarm
   │
   ▼
Skorlama: en yüksek toplam skorlu aday seçilir. Eşik altındaysa (persona quality_policy) → yeniden üretim (maks. 2 tur) → hâlâ eşik altı → insan onay kuyruğu.
```

**Güven modu:** Her persona `human_review: always | first_30_days | score_below_threshold | never` ile başlar. Öneri: ilk 30 gün `always`, sonra eşik altı. Panelde tek tuşla değiştirilebilir.

### 6.3 Persona ses kitabı (voice bible)

Her persona için LLM'e verilen ve panelden düzenlenen yapı:

```yaml
name: "Deniz | Platform Engineer"
one_liner: "10 yıl SRE. Kubernetes'i sever, YAML'dan nefret eder. Kısa yazar."
tone: [direkt, hafif alaycı, yardımsever, teknik ama snob değil]
sentence_length: "kısa-orta, ara sıra tek kelimelik cümle"
first_person: true
humor: "kuru, self-deprecating; asla emoji ile gülmez"
signature_moves:
  - "post'un sonunda tek satırlık 'gerçek hayat' notu"
  - "komut satırını her zaman ``` içinde verir"
never_say: ["game-changer", "delve", "unlock", "🚀", "In today's", "Let's dive"]
opinions:            # tutarlılık için sabit görüşler
  - "Helm > Kustomize (çoğu ekip için)"
  - "Terraform state'i S3'te kilitle, tartışma bitti"
experience_pool:     # gerçek olaylardan türetilen, kimlik bilgisi içermeyen anekdotlar
  - "2019'da bir prod cluster'ı yanlış context ile silmeye yaklaştım"
samples:             # 10–20 örnek gerçek yazı (sizin yazdıklarınız en iyisidir)
comment_style: "kısa, esprili, soruya somut cevap; asla 'Great question!' demez"
```

### 6.4 Model seçimi ve maliyet-kalite dengesi

| Görev | Model | Neden |
|---|---|---|
| Script, post, yargıç | `claude-opus-5` | En yüksek yazım kalitesi; uzun bağlam ile ses kitabı + örnekler + kaynaklar tek istemde; prompt caching ile persona bağlamı ucuzlar |
| Sınıflandırma (yorum/DM niyeti, spam, dil), özetleme | `claude-sonnet-5` | Yüksek hacim, düşük maliyet |
| Yorum yanıtı (kısa) | `claude-opus-5`, `effort: low` | Kısa ama "insan gibi" olması gereken yerde kalite kritik |
| Trend uygunluğu (binlerce sinyal/gün) | `claude-haiku-4-5` veya Sonnet 5 batch | Batch API ile %50 indirim |

Prompt caching ile persona ses kitabı + örnekler (≈ 6–10K token) her istemde ön ek olarak sabitlenir; 5 dakika içindeki tekrar isteklerde girdi maliyeti %90 düşer.
## 7. Etkileşim Motoru: yorum, DM, e-posta, iş birliği

### 7.1 Akış

```
Her 10–20 dk (kanal başına jitter'lı)
  → yeni yorum / DM / mention / e-posta çek
  → Sonnet 5 ile sınıflandır:
      intent: {soru, övgü, eleştiri, troll, spam, iş teklifi, reklam teklifi, hukuki, kişisel veri, destek}
      sentiment, language, urgency, is_money (para/ücret/sözleşme/fatura/ödeme geçiyor mu)
  → Politika motoru (persona engagement_policy):
      spam/troll        → yoksay (veya gizle)
      soru/övgü/eleştiri → yanıt üret (Opus 5, persona comment_style) → kalite kapısı (K1,K3,K8) → gönder
      iş/reklam teklifi → CRM'e "lead" aç + medya kiti ile nazik ilk yanıt (şablon, LLM ile kişiselleştirilmiş) + ALARM
      is_money=true     → HİÇ yanıt verme + KIRMIZI ALARM (Telegram bot + e-posta + panel)
      hukuki/kişisel    → yanıt verme + alarm
```

**İnsan gibi davranış kuralları (meşru olanlar):**
- Yanıt oranı %100 değil: persona ayarı ile yorumların %30–60'ına yanıt (insanlar hepsine cevap vermez).
- Yanıt gecikmesi: 4 dk–6 saat arasında, persona "aktif saatleri"ne göre dağıtılmış.
- Aynı yorumcuya 24 saat içinde en fazla 2 yanıt; sohbet uzarsa "DM'den devam edelim" (veya kapat).
- Yanıt uzunluğu dağılımı: %50 tek cümle, %35 iki cümle, %15 uzun.
- Mizah dozu persona ayarı; asla platform kurallarını ihlal eden hakaret/argo yok.

**Yanıt verilebilen ve verilemeyen yerler (Bölüm 3 matrisi):** Yorumlara Instagram/Threads/YouTube/Telegram'da API ile tam otomatik yanıt mümkündür. X'te AI üretimi otomatik yanıtlar X'in yazılı ön onayını gerektirdiğinden, onay alınana kadar X yanıtları panelde **insan onaylı taslak** olarak kalır (siz tıklarsınız). TikTok yorum yanıtı yalnızca Business API onayıyla. DM: Instagram (gelen mesajlara, 24 saat penceresi), Telegram (bota yazanlara), X (kısıtlı); Threads/TikTok/YouTube'da DM API'si yoktur.

### 7.2 E-posta

Her persona için `persona@sizin-domain.com` (Google Workspace veya Resend/Postmark inbound). Gelen e-posta aynı sınıflandırmadan geçer. Otomatik yanıt yalnızca "bilgi isteme, medya kiti isteme, basit sorular" için; teklif, fiyat, sözleşme içeren her şey alarma düşer ve taslak yanıt panelde onayınızı bekler.

### 7.3 CRM ve para eşiği

- Panelde "Fırsatlar" sekmesi: marka, kanal, tahmini değer, aşama, son iletişim, iliştirilmiş e-posta/DM.
- Otomatik **medya kiti**: persona istatistiklerinden (takipçi, ortalama izlenme, etkileşim oranı, izleyici ülke/yaş dağılımı) haftalık PDF/ web sayfası üretimi.
- **Fiyat listesi** (rate card) sizin girdiğiniz aralıklar; sistem asla fiyat söylemez, "aralık ve medya kitini paylaşıyorum, detayları ekibimiz iletecek" der.
- Alarm kanalları: Telegram bot (anlık), e-posta (özet), panel (rozet), isteğe bağlı SMS/Push.
- Reklam/iş birliği paylaşımlarında zorunlu etiketleme (`#reklam`, `#işbirliği`, platform "paid partnership" bayrağı) sistem tarafından **otomatik ve atlanamaz** şekilde eklenir (Bölüm 2).

## 8. Admin Paneli

### 8.1 Ekranlar

| Ekran | İçerik |
|---|---|
| **Genel bakış** | 20 persona × 6 kanal sağlık ızgarası (yeşil/sarı/kırmızı), bugünün kuyruğu, alarm sayısı, günlük maliyet |
| **Persona sihirbazı** | Ad → niş → ses kitabı (AI ile taslak, siz düzenlersiniz) → görsel kit (renk/font/logo/avatar üretimi) → kanallar (OAuth bağla) → politika (günlük post/video sayısı, saat pencereleri, yanıt oranı, onay modu) → **Başlat** |
| **Takvim** | Haftalık/aylık; sürükle-bırak; kanal filtresi; "yeniden üret", "atla", "şimdi yayınla" |
| **Onay kuyruğu** | Kalite kapısını geçen/geçemeyen içerikler; önizleme (video player, carousel görünümü, X kart görünümü); tek tuş onay/red/düzenle; toplu onay |
| **Konu yönetimi** | Persona başına topic_profile; "şu anda neler trend" canlı listesi; manuel brief ekleme ("bu haberi 5 persona işlesin") |
| **Inbox** | Tüm kanallardan yorum/DM/e-posta; sınıflandırma etiketi; otomatik yanıt logu; "insan gerekli" filtresi |
| **Fırsatlar (CRM)** | Bölüm 7.3 |
| **Medya kütüphanesi** | Kendi fotoğraf/videolarınız; etiketleme; "gün aşırı paylaş" planı; kullanılmış/kullanılmamış |
| **Şablonlar** | Remotion kompozisyonları ve post şablonları; canlı önizleme; A/B varyantları |
| **Analitik** | Persona/kanal/format/konu/saat kırılımında izlenme, etkileşim, takipçi artışı; en iyi kancalar; maliyet/etkileşim oranı |
| **Ayarlar** | API anahtarları (Vault'a yazılır, panelde maskelenir), model seçimi, bütçe limitleri (günlük $ üst sınırı → aşınca dur), bildirim kanalları |
| **Denetim izi** | Her yayın/yanıt/kararın kim (insan/otomatik), ne zaman, hangi model/prompt sürümü ile yapıldığı |

### 8.2 "Başlat" tuşunun arkasında ne olur

1. Persona `warming` durumuna geçer: ilk 7 gün düşük hacim (günde 1–2 post), yorum yanıtı kapalı, insan onayı açık. Yeni hesapların ilk günden yüksek hacimle başlaması hem algoritmada hem spam filtrelerinde kötü sinyaldir.
2. 7. günden sonra hacim politikadaki hedefe kademeli çıkar (günde +1).
3. 30. günde kalite kapısı otomatik moda alınabilir (eşik altı hariç).
4. Her aşama panelde görünür ve elle hızlandırılabilir/durdurulabilir.

## 9. Bireysel Influencer Modu (kendi fotoğraflarınız)

- Medya kütüphanesine toplu yükleme; sistem her görseli etiketler (mekân, kıyafet, ruh hali, yatay/dikey), yüz kırpma ve kalite skoru verir.
- **Gün aşırı plan**: "her 2 günde 1, 19:30 ± 20 dk, Instagram + Threads" gibi kurallar; sistem havuzdan en az kullanılanı ve son paylaşımlara en az benzeyeni seçer.
- Caption'lar persona ses kitabı ile üretilir; fotoğrafın içeriği görüntü anlayan model ile (Claude vision) okunarak yazılır, genel geçer caption yazılmaz.
- İsteğe bağlı: kendi fotoğraflarınızdan **LoRA eğitimi** (kendi yüzünüz, kendi izninizle) → yeni sahnelerde tutarlı görsel üretimi. Bu, gerçekçi sentetik görsel olduğu için platformlarda "AI ile üretildi" etiketi gerektirebilir; panelde bu içerikler otomatik etiketlenir. Kararı size bırakan bir anahtar vardır.
- Kendi sesinizden ses klonu ile video anlatımı: yalnızca kendi sesiniz, yazılı izin kaydı sistemde saklanır.

## 10. Geri Besleme Döngüsü: minimum girdi, maksimum etkileşim

1. **Ölçüm**: Her post 1s/24s/7g metrikleri; video için izlenme süresi eğrisi (nerede terk ediliyor).
2. **Atıf**: Her post `hook_type`, `format`, `topic_cluster`, `hour_bucket`, `template_id`, `cta_type` etiketleri taşır.
3. **Öğrenme**: Persona × kanal düzeyinde **Thompson sampling** (çok kollu haydut): iyi performans gösteren kanca tipleri/saatler/formatlar daha sık seçilir, %10–15 keşif payı bırakılır.
4. **Haftalık rapor**: Panelde ve Telegram'da: "Bu hafta en iyi 5 içerik, neden; en kötü 5, neden; önerilen politika değişiklikleri (tek tuşla uygula)".
5. **Yorum madenciliği**: Yorumlardaki sorular bir sonraki haftanın brief'lerine dönüşür (izleyici ne istiyorsa o).
## 11. Uygulama Yol Haritası

Tahminler tek kişilik güçlü bir full-stack + DevOps geliştirici (siz) ve AI kodlama asistanı desteği içindir. Paralel ekip varsa süreler kısalır.

### Faz 0 — Hazırlık (1–2 hafta)
- [ ] Domain, marka e-postaları, Google Workspace veya inbound e-posta servisi
- [ ] Geliştirici hesapları: Meta (Instagram + Threads), TikTok for Developers, Google Cloud (YouTube Data API), X Developer (PPU kredisi), Telegram BotFather
- [ ] Her platform için **gizlilik politikası + kullanım şartları sayfası** (app review'ların ön koşulu)
- [ ] **Hemen başvur:** TikTok app review + Content Posting audit; YouTube API compliance audit (aksi hâlde videolar özel kalır); X "AI ile üretilmiş yanıt" ön onayı (istenirse)
- [ ] İlk 2–3 persona için hesapların **elle** açılması (telefon doğrulaması, profil bilgileri, Instagram'ın Business/Creator'a çevrilmesi, Threads bağlantısı, YouTube kanalı)
- [ ] Altyapı: 1 VPS (8 vCPU/32 GB) + 1 GPU makinesi (isteğe bağlı; Whisper/LoRA için) veya fal.ai/Replicate ile tamamen serverless; R2 bucket; Doppler/Vault
- [ ] Repo iskeleti: monorepo (pnpm workspaces): `apps/admin`, `apps/api`, `packages/adapters`, `packages/remotion`, `services/trend-engine`, `services/media`

### Faz 1 — Omurga (3–4 hafta)
- [ ] Postgres şeması (Bölüm 4.4), NestJS API, auth (tek kullanıcı + 2FA)
- [ ] Temporal kurulumu, ilk workflow: `PublishTextPost`
- [ ] Adaptörler: **Telegram** (en kolay, tam otomasyon), **Threads**, **X** (Basic)
- [ ] Trend motoru v1: RSS + HN + Reddit + GitHub releases; pgvector kümeleme; skor
- [ ] Persona ses kitabı + Claude ile post üretimi + K1/K3/K4 kalite katmanları
- [ ] Admin panel v1: persona CRUD, takvim, onay kuyruğu, alarm
- **Çıktı:** 1 persona, 3 kanal, günde 5 metin post, insan onaylı.

### Faz 2 — Video (4–5 hafta)
- [ ] Remotion şablonları (3 adet: haber, eğitici, hot take) + persona görsel kiti
- [ ] VHS terminal demo sandbox'ı (Docker, ağ kapalı, zaman sınırlı)
- [ ] ElevenLabs entegrasyonu, faster-whisper altyazı, FFmpeg normalizasyon
- [ ] `ProduceShortVideo` workflow'u (Bölüm 5.3) + K6/K7 kalite katmanları
- [ ] Adaptörler: **YouTube** (Shorts) ve **Instagram** (Reels); TikTok başvurusu (audit) başlatılır
- [ ] Thumbnail üretimi
- **Çıktı:** günde 2 video, 5 kanal, insan onaylı.

### Faz 3 — Etkileşim ve çoklu hesap (3–4 hafta)
- [ ] Yorum/DM/e-posta toplayıcılar, sınıflandırma, politika motoru, yanıt üretimi
- [ ] CRM + medya kiti + alarm kanalları
- [ ] Persona sihirbazı, warming aşaması, kota bütçeleyici
- [ ] 5 persona'ya çıkış; YouTube kota artırımı başvurusu; TikTok audit tamamlanması
- **Çıktı:** 5 persona × 5–6 kanal, yorum yanıtı açık, alarm sistemi canlı.

### Faz 4 — Ölçek ve öğrenme (4+ hafta, sürekli)
- [ ] Thompson sampling seçici, haftalık rapor, yorum madenciliği
- [ ] Bireysel influencer modu (medya kütüphanesi, gün aşırı plan, LoRA isteğe bağlı)
- [ ] 20 persona'ya kademeli çıkış (haftada 3–4 yeni persona; her biri warming'den geçer)
- [ ] Maliyet paneli, bütçe kesicileri, çoklu LLM sağlayıcı yedekliliği
- [ ] Uzun video hattı (isteğe bağlı)
- **Çıktı:** hedef ölçek.

**Toplam:** ~4–5 ay kademeli; ilk canlı persona ~5. haftada.

## 12. Maliyet Tahmini (hedef ölçek: 20 persona, günde 100 post + 40 video)

Aşağıdaki rakamlar Eylül 2026 liste fiyatlarına dayanan **tahmindir**; gerçek kullanım prompt uzunluğu, aday sayısı ve format karışımına göre değişir. Sipariş vermeden önce Bölüm 3'teki kaynak bağlantılarından güncel fiyatı doğrulayın.

| Kalem | Varsayım | Aylık tahmin (USD) |
|---|---|---|
| LLM (Claude Opus 5 + Sonnet 5) | Post başına ~25K girdi (cache'li) / 3K çıktı, video başına ~60K/8K, yargıç çağrıları, yorum yanıtları (~2.000/gün), trend sınıflandırma (batch) | 1.200 – 2.500 |
| TTS (ElevenLabs) | 40 video × 45 sn × 30 gün ≈ 15 saat ses | 100 – 330 (Creator/Pro/Scale planına göre) |
| Altyazı | Self-host faster-whisper (GPU) veya Deepgram ≈ 15 saat | 0 – 10 |
| Görsel üretim | ~120 görsel/gün (carousel kareleri şablon; AI görsel ~40/gün) × 0,03–0,08 $ | 40 – 100 |
| AI B-roll video (isteğe bağlı) | 40 video × 2 klip × 5 sn; Kling/Veo hızlı katman | 150 – 600 (0 ise stok kullanılır) |
| Remotion render | Self-host (CPU) — Remotion şirket lisansı: ≤3 kişi ücretsiz, üstü ücretli | 0 – 100 |
| X API (PPU) | 20 persona × 5 post × 30 gün = 3.000 post; ⚠ raporlanan birim ~$0,015 (linksiz), ~$0,20 (linkli); + okuma (yorum çekme) | 50 – 700 (linkli post oranına göre) |
| Diğer platform API'leri | Instagram/Threads/YouTube/TikTok/Telegram | 0 |
| Haber/arama API'leri | Tavily/Exa + Reddit (ücretsiz katmanlar ağırlıklı) | 0 – 100 |
| Altyapı | VPS 8 vCPU/32 GB + R2 depolama/egress + Temporal (self-host) + izleme | 80 – 200 |
| GPU (isteğe bağlı) | Whisper + LoRA için spot/on-demand veya fal.ai | 0 – 150 |
| E-posta / domain / 2FA telefon numaraları | Workspace 20 kullanıcı veya alias | 20 – 150 |
| **Toplam** | | **≈ 1.800 – 4.400 $/ay** |

Küçük başlangıç (1–3 persona): **≈ 200–450 $/ay**, büyük kısmı LLM ve TTS.

## 13. Riskler ve Azaltma

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| Platform hesap kısıtlaması/ban (özellikle yeni hesaplar, benzer içerik) | Orta | Yüksek | Resmi API, warming, persona başına özgün içerik, kota bütçeleyici, hacmi kademeli artırma, aynı IP'den çok hesap oluşturmama |
| App review / audit reddi (TikTok, Meta) | Orta | Orta | Erken başvuru, gerçek demo videosu, gizlilik politikası, yalnızca kendi hesaplarınızla test; reddedilirse aracı servis (Ayrshare/Postiz) yedeği |
| YouTube: doğrulanmamış projede videolar özel kilitli; audit süresi | Yüksek | Yüksek | Compliance audit başvurusu Faz 0'da; audit öncesi yüklemeler pipeline testi sayılır; günde 100 yükleme kotası hedefi karşılar |
| YouTube "inauthentic content" (seri üretim) YPP politikası | Orta | Yüksek | Persona başına özgün script/görsel; şablon çeşitliliği; K4 özgünlük katmanı personalar arası da çalışır |
| X API maliyet/politika değişiklikleri; AI yanıt botu ön onay şartı | Yüksek | Orta | Adaptör soyutlaması; X yanıtları insan onaylı taslak modunda; "Automated" etiketi; X'i düşürülebilir kanal olarak tasarlama |
| "AI kokusu" ile düşük etkileşim | Orta | Yüksek | Kalite kapısı, sizin gerçek yazı örnekleriniz, insan onay dönemi, geri besleme döngüsü |
| Yanlış bilgi yayma (hız uğruna) | Orta | Yüksek | K2 doğruluk katmanı, tek kaynaklı iddia reddi, kaynak gösterme, düzeltme protokolü |
| Telif ihlali | Düşük | Yüksek | Yalnızca ticari lisanslı stok/AI/kendi medya; provenance kaydı; logo/marka tespiti; ekran kayıtlarını kısa ve atıflı tutma |
| Yasal etiketleme yükümlülüğü (AI/deepfake, reklam) | Orta | Yüksek | Sentetik insan/ses içeriğinde otomatik etiket; #reklam/#işbirliği zorunlu alan; EU AI Act Madde 50 takibi |
| Maliyet patlaması (LLM döngüleri) | Orta | Orta | Günlük $ üst sınırı, yeniden üretim tur limiti, batch API, prompt caching, Sonnet'e düşürme kuralları |
| Tek kişilik bakım yükü | Yüksek | Orta | Temporal ile gözlemlenebilir workflow, alarm, otomatik token yenileme, iyi loglama |

## 14. Karar Özeti ve İlk Adımlar

**Yapılabilir mi?** Evet; iki koşulla: hesaplar **elle** açılır ve sistem **resmi API'lerle**, **gerçek kalite** hedefiyle çalışır. Bu koşullar altında tarif ettiğiniz her özellik (trend yakalama, günde 5 post + 2 video, 20 persona, admin panel, yorum/DM/e-posta yanıtı, iş birliği CRM'i, para eşiğinde alarm, telifsiz medya üretimi, kalite kapısı, kendi fotoğraflarınızla gün aşırı plan) mevcut araçlarla inşa edilebilir.

**Bu hafta yapılacaklar:**
1. Meta, TikTok, Google, X, Telegram geliştirici hesaplarını açın; gizlilik politikası sayfasını yayınlayın; app review süreçlerini başlatın (en uzun süren iş bu).
2. İlk persona için 15–20 adet kendi yazdığınız post/ yorum örneğini toplayın (ses kitabının çekirdeği).
3. Monorepo iskeletini ve Temporal + Postgres + Redis Compose dosyasını ayağa kaldırın.
4. Telegram kanalı + bot ile ilk uçtan uca yayını yapın (aynı gün mümkündür).
