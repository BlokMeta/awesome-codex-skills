# 14 — Operatör Kurulum Listesi (senin yapacakların)

Uygulama, `.env` dosyasına (veya Doppler'a) aşağıdaki değerler girilince çalışacak şekilde tasarlanmıştır. Bu listedeki her madde **yalnızca senin** yapabileceğin işlerdir: hesap açma, kimlik doğrulama, ödeme yöntemi, inceleme başvurusu. Kod tarafında hiçbir şey beklemez.

Sıra önemli: **A → B → C** en uzun süren inceleme süreçlerini erkenden başlatır. Her maddede: nereden, ne alınacak, hangi env değişkenine yazılacak, ücret, süre.

İşaretler: 🟢 ücretsiz · 🟡 ücretli/kredi · ⏳ inceleme/bekleme var · 🔐 gizli bilgi (yalnızca `.env`/Doppler)

---

## A. İlk gün (temeller ve uzun süren başvurular)

### A1. Alan adı ve e-posta 🟡
- **Ne:** Bir alan adı (ör. `heliograph.app` veya kendi markan). Gizlilik politikası, kullanım şartları ve OAuth geri dönüş adresleri için zorunlu.
- **Nereden:** Cloudflare Registrar (en ucuz, DNS dahil) veya Namecheap.
- **Yap:** DNS'i Cloudflare'a al. `app.<alan>` (web), `api.<alan>` (API), `legal.<alan>/privacy`, `legal.<alan>/terms` sayfaları (ben üreteceğim, sen yayınlayacaksın).
- **Env:** `HG_PUBLIC_WEB_URL=https://app.<alan>`, `HG_PUBLIC_API_URL=https://api.<alan>`
- **E-posta:** Google Workspace (persona başına alias: `deniz@<alan>`) veya yalnızca Resend inbound (A6). Persona e-postaları için Workspace daha sağlam.

### A2. GitHub 🟢
- Repo zaten var. **Yap:** `Settings → Secrets and variables → Actions` içine CI için gerekenler (aşağıda "CI" etiketli olanlar). Branch koruması `main`.
- Renovate uygulamasını kur (ücretsiz): https://github.com/apps/renovate

### A3. Meta (Instagram + Threads) 🟢 ⏳
1. https://developers.facebook.com → geliştirici hesabı (kişisel Facebook hesabınla; Business Verification için ileride işletme belgeleri gerekebilir ama **kendi hesapların için gerekmez**).
2. **Uygulama oluştur** → "Other" → "Business" tipi → ad: Heliograph.
3. **Instagram ürünü ekle** → "Instagram API with Instagram Login" → App ID / App Secret al.
4. **Threads ürünü ekle** → ayrı Threads App ID / Secret verir.
5. Geri dönüş URL'leri: `https://api.<alan>/v1/channels/oauth/instagram/callback` ve `.../threads/callback` (yerel için `http://localhost:4000/...` da ekle).
6. İzinler (scopes): Instagram: `instagram_business_basic, instagram_business_content_publish, instagram_business_manage_comments, instagram_business_manage_messages`. Threads: `threads_basic, threads_content_publish, threads_manage_replies, threads_read_replies, threads_manage_insights`.
7. **Kendi hesapların için (başlangıç):** App Dashboard → Roles → "Instagram Testers" / "Threads Testers" olarak her persona hesabını ekle; hesaptan daveti kabul et. Bu aşamada App Review gerekmez.
7b. **Başka kullanıcılara hizmet için (SaaS, M1.9):** **Advanced Access** → App Review (her izin için ekran kaydı + kullanım açıklaması) + **Business Verification** (şirket belgeleri: vergi levhası/ticaret sicil, adres kanıtı, alan adı e-postası). Uygulama ayarlarında **Privacy Policy URL**, **Terms URL**, **Data Deletion Callback URL** (`https://api.<alan>/webhooks/meta/data-deletion`) zorunlu. Yıllık **Data Protection Assessment** anketi gelir; runbook'u ben hazırlarım, sen cevaplarsın. Süre: 2–6 hafta.
8. Webhook (yorum/DM için): `https://api.<alan>/webhooks/meta`, doğrulama token'ını sen belirle.
- **Env 🔐:** `HG_META_APP_ID`, `HG_META_APP_SECRET`, `HG_THREADS_APP_ID`, `HG_THREADS_APP_SECRET`, `HG_META_WEBHOOK_VERIFY_TOKEN` (rastgele 32 karakter, sen üret)
- **Süre:** 1 saat. Ücret: yok.

### A4. TikTok 🟢 ⏳⏳ (en uzun süreç, hemen başla)
1. https://developers.tiktok.com → hesap → **Manage apps → Create app**.
2. Uygulama bilgileri: ad, açıklama, **web sitesi URL'si** (A1), gizlilik politikası URL'si, kullanım şartları URL'si, uygulama ikonu.
3. Ürünler: **Login Kit** + **Content Posting API** (Direct Post) + **Display API**. Scope'lar: `user.info.basic, video.publish, video.upload, video.list`.
4. Redirect URI: `https://api.<alan>/v1/channels/oauth/tiktok/callback`.
5. **App review'a gönder**: her scope için gerekçe + **demo video** (uygulamanın TikTok'a nasıl paylaştığını gösteren ekran kaydı; ben staging'de bu akışı hazırlayıp sana kaydettireceğim). Süre: birkaç gün – 2 hafta.
6. Onay sonrası **Content Posting audit** başvurusu (halka açık paylaşım için). Bu ikinci inceleme; kadar yalnızca özel/`SELF_ONLY` paylaşım yapılabilir.
7. Yorum yanıtı için ayrıca **TikTok for Business** geliştirici başvurusu (isteğe bağlı, M4).
- **Env 🔐:** `HG_TIKTOK_CLIENT_KEY`, `HG_TIKTOK_CLIENT_SECRET`
- **Not:** Persona TikTok hesapları başvuru sırasında "test kullanıcısı" olarak eklenir (sandbox).

### A5. Google (YouTube) 🟢 ⏳
1. https://console.cloud.google.com → yeni proje "heliograph".
2. **APIs & Services → Library → YouTube Data API v3** etkinleştir (isteğe bağlı: YouTube Analytics API).
3. **OAuth consent screen**: External, uygulama adı, destek e-postası, gizlilik/şart URL'leri, scope'lar: `https://www.googleapis.com/auth/youtube.upload`, `youtube.force-ssl` (yorumlar), `yt-analytics.readonly`. Test kullanıcıları: persona Google hesapları.
4. **Credentials → OAuth client ID (Web)**: redirect `https://api.<alan>/v1/channels/oauth/youtube/callback`.
5. **Compliance audit / quota**: https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits → "YouTube API Services – Audit and Quota Extension Form". Bu yapılmadan yüklenen videolar **özel** kalır. Formda uygulamanın amacını, ekran görüntülerini, gizlilik politikasını istiyor. Süre: 1–4 hafta.
6. OAuth "Verification": kendi hesapların "test kullanıcısı" iken şart değil; **başka kullanıcılara hizmet için zorunlu** (M1.9). Gerekenler: alan adı sahipliği (Search Console), marka doğrulama (logo, ana sayfa), gizlilik politikasında **Limited Use** beyanı (`legal/en/privacy-policy.md` §5 hazır), her hassas kapsam için gerekçe ve demo videosu. YouTube kapsamları "hassas" sınıfındadır; "kısıtlı" sınıfa girseydi CASA güvenlik değerlendirmesi gerekirdi ⚠ (teyit edilecek). Süre: 2–6 hafta.
- **Env 🔐:** `HG_GOOGLE_CLIENT_ID`, `HG_GOOGLE_CLIENT_SECRET`
- **Ayrıca (isteğe bağlı, Gemini/Imagen/Veo için):** https://aistudio.google.com → API key → `HG_GOOGLE_AI_API_KEY`. Ücret: kullanım başına, kart gerekir.

### A6. X (Twitter) 🟡 ⏳
1. https://developer.x.com → Developer Portal → hesap (X hesabınla), telefon doğrulaması.
2. **Proje + uygulama** oluştur; User authentication settings: **OAuth 2.0**, tip "Web App", callback `https://api.<alan>/v1/channels/oauth/x/callback`, website URL.
3. Scope'lar: `tweet.read tweet.write users.read offline.access media.write dm.read dm.write`.
4. **Ödeme:** Şubat 2026'dan beri yeni geliştiriciler için **kullanım başına ödeme**. Kart ekle, başlangıç kredisi yükle (50–100 $ yeterli; post başına ~0,015 $, linkli ~0,20 $ ⚠).
5. Her persona X hesabında **Settings → Your account → Account information → Automation** → "Automated" etiketini aç ve yöneten hesap olarak kendi ana hesabını göster (kural gereği).
6. İsteğe bağlı: AI üretimi otomatik yanıtlar için X'e yazılı ön onay başvurusu (Developer Portal üzerinden destek talebi). Onay gelene kadar yanıtlar panelde senin tıklamanla gider.
- **Env 🔐:** `HG_X_CLIENT_ID`, `HG_X_CLIENT_SECRET`

### A7. Telegram 🟢
1. Telegram'da **@BotFather** → `/newbot` → bot adı ve kullanıcı adı → **bot token**.
2. `/setprivacy` → Disable (grup mesajlarını görebilsin, yorum yanıtı için).
3. Her persona için: bir **kanal** aç, botu **yönetici** yap (mesaj gönderme izni); kanala bağlı bir **tartışma grubu** oluştur ve botu oraya da ekle.
4. Kendi alarm kanalın için ikinci bot (veya aynı bot): sana kritik alarmları DM atacak. Bota `/start` yaz; chat id'yi uygulama otomatik yakalar.
- **Env 🔐:** `HG_TELEGRAM_BOT_TOKEN`, `HG_TELEGRAM_ALERT_BOT_TOKEN` (aynı olabilir), `HG_TELEGRAM_ALERT_CHAT_ID` (uygulama ilk `/start`'ta gösterir)

### A8. Apple ve Google Play (mobil uygulama mağazaları) 🟡 ⏳
- **Apple Developer Program:** https://developer.apple.com/programs → 99 $/yıl, kimlik doğrulama 1–3 gün. Gerekli: Apple ID, iki faktör, kart. (Bireysel hesap yeter; şirket için D-U-N-S.)
- **Google Play Console:** https://play.google.com/console → 25 $ tek seferlik, kimlik doğrulama (kimlik belgesi), 1–3 gün.
- **Expo (EAS):** https://expo.dev → hesap → **Access token** (Settings → Access tokens) → CI için. Free plan başlangıçta yeter (15+15 build/ay).
- **Env/CI 🔐:** `EXPO_TOKEN` (CI), `HG_APNS_*` ve `HG_FCM_*` gerekmez (Expo Push kullanıyoruz); Apple App Store Connect API key (EAS Submit için: Issuer ID, Key ID, .p8) ve Google Play service account JSON → EAS secrets'a.

---

## B. Yapay zekâ ve medya sağlayıcıları

| # | Sağlayıcı | Ne için | Nereden | Ücret | Env 🔐 |
|---|---|---|---|---|---|
| B1 | **Anthropic** | Script, post, yargıç, sınıflandırma | https://console.anthropic.com → API Keys; kart ekle; **Usage limits** ile aylık üst sınır koy | Kullanım (Opus 5: 5$/25$ per 1M; Sonnet 5: 2$/10$) | `HG_ANTHROPIC_API_KEY` |
| B2 | **OpenAI** (yedek LLM + whisper-1) | Failover, altyazı yedeği | https://platform.openai.com → API keys | Kullanım | `HG_OPENAI_API_KEY` (opsiyonel) |
| B3 | **ElevenLabs** | Seslendirme, kendi ses klonun | https://elevenlabs.io → Profile → API key; plan **Creator** (22 $/ay) ile başla | 22–99 $/ay | `HG_ELEVENLABS_API_KEY` |
| B4 | **fal.ai** | FLUX görsel, Kling video, LoRA eğitimi | https://fal.ai/dashboard/keys; kredi yükle | Kullanım (~0,03 $/görsel, ~0,084 $/sn video) | `HG_FAL_API_KEY` |
| B5 | **Ideogram** | Metinli kapak/thumbnail | https://ideogram.ai/manage-api | Kullanım (0,03–0,10 $/görsel) | `HG_IDEOGRAM_API_KEY` (opsiyonel) |
| B6 | **Pexels** | Stok video/foto | https://www.pexels.com/api/ → key | 🟢 200 istek/saat | `HG_PEXELS_API_KEY` |
| B7 | **Pixabay** | Stok görsel/video | https://pixabay.com/api/docs/ (giriş yap, key sayfada) | 🟢 | `HG_PIXABAY_API_KEY` |
| B8 | **Tavily** | Anlık haber/anahtar kelime arama | https://app.tavily.com → API key | 🟢 1.000 kredi/ay; 30 $/ay üstü | `HG_TAVILY_API_KEY` |
| B9 | **Exa** (opsiyonel) | Semantik arama | https://dashboard.exa.ai | 20 $ başlangıç kredisi | `HG_EXA_API_KEY` |
| B10 | **Hugging Face** | Trend modeller (rate limit için token) | https://huggingface.co/settings/tokens (read) | 🟢 | `HG_HF_TOKEN` |
| B11 | **GitHub token** | GitHub release/trend taraması (rate limit için) | https://github.com/settings/tokens → fine-grained, public repo read | 🟢 | `HG_GITHUB_TOKEN` |
| B12 | **Deepgram** (opsiyonel) | Altyazı, GPU yoksa | https://console.deepgram.com | 200 $ ücretsiz kredi | `HG_DEEPGRAM_API_KEY` |
| B13 | **Remotion** | Video render | Lisans: ≤3 çalışan **ücretsiz**, kayıt gerekmez | 🟢 | – |

Kendi sesin için: ElevenLabs'te **Professional Voice Clone** (Creator planında var) → 30 dk temiz kayıt yükle → `voice_id` → personanın ses ayarına yazılır (panelden).

---

## C. Altyapı ve operasyon

| # | Servis | Ne için | Nereden | Ücret | Env 🔐 |
|---|---|---|---|---|---|
| C1 | **VPS** | api, workers, web, temporal, postgres, redis | Hetzner (CPX41: 8 vCPU/16 GB ≈ 30 €/ay) veya CCX33; Ubuntu 24.04; Docker kurulu | 30–60 €/ay | `HG_DEPLOY_HOST`, SSH anahtarı (CI) |
| C2 | **Cloudflare R2** | Medya depolama | Cloudflare → R2 → bucket `heliograph-media` → API token (Object Read & Write) | 🟢 10 GB; sonra 0,015 $/GB, egress ücretsiz | `HG_S3_ENDPOINT`, `HG_S3_BUCKET`, `HG_S3_ACCESS_KEY_ID`, `HG_S3_SECRET_ACCESS_KEY`, `HG_S3_PUBLIC_BASE_URL` |
| C3 | **Resend** | E-posta gönderim + **inbound** (persona e-postaları) | https://resend.com → domain doğrula (DNS kayıtları) → API key; Inbound: MX kaydı + webhook `https://api.<alan>/webhooks/email` | 🟢 3.000/ay; 20 $/ay üstü | `HG_RESEND_API_KEY`, `HG_RESEND_WEBHOOK_SECRET` |
| C4 | **Doppler** | Tüm gizli bilgilerin tek yeri (yerel + CI + sunucu) | https://doppler.com → proje `heliograph`, config `dev/stg/prd` → service token | 🟢 3 kullanıcıya kadar | `DOPPLER_TOKEN` (yalnızca makinede) |
| C5 | **Sentry** | Hata takibi (api, web, mobil) | https://sentry.io → 3 proje → DSN'ler | 🟢 5K hata/ay | `HG_SENTRY_DSN_API`, `HG_SENTRY_DSN_WEB`, `HG_SENTRY_DSN_MOBILE`, `SENTRY_AUTH_TOKEN` (CI, source map) |
| C6 | **Grafana Cloud** (opsiyonel; yoksa VPS'te self-host) | Metrik/log/trace | https://grafana.com → ücretsiz katman → OTLP endpoint + token | 🟢 | `HG_OTEL_EXPORTER_OTLP_ENDPOINT`, `HG_OTEL_EXPORTER_OTLP_HEADERS` |
| C7 | **Temporal** | Self-host (compose) varsayılan; Temporal Cloud istersen | https://cloud.temporal.io | 🟢 self-host | `HG_TEMPORAL_ADDRESS`, `HG_TEMPORAL_NAMESPACE`, (Cloud: `HG_TEMPORAL_API_KEY`) |
| C8 | **Argos** (opsiyonel) | Görsel regresyon | https://argos-ci.com → GitHub app | 🟢 5K ekran/ay | `ARGOS_TOKEN` (CI) |
| C9 | **Turborepo remote cache** (opsiyonel) | CI hızlandırma | Vercel hesabı → token | 🟢 | `TURBO_TOKEN`, `TURBO_TEAM` (CI) |

Uygulamanın kendi ürettiği gizli bilgiler (sen üret, bir kez, `openssl rand -base64 48`):
`HG_APP_SECRET` (oturum/JWT imzası), `HG_ENCRYPTION_MASTER_KEY` (token zarf şifreleme; **kaybedersen tüm kanal bağlantıları yeniden yapılır**, yedekle), `HG_META_WEBHOOK_VERIFY_TOKEN`, `HG_WEBHOOK_SIGNING_SECRET`.

---

## D. Persona hesapları (her persona için, elle)

Her persona = 6 hesap. Ortalama 60–90 dk / persona. Sistem sana profil paketini (isim, bio, avatar, kapak, link-in-bio metni) hazırlar; sen yapıştırırsın.

| Adım | Nasıl | Dikkat |
|---|---|---|
| D1 | **Telefon numarası**: Her persona için ayrı numara gerekir (Instagram, X, TikTok, Telegram doğrulaması). Seçenek: fiziksel SIM (en güvenli), eSIM (Türk operatörleri), sanal numara servisleri **riskli** (platformlar çoğunu engeller) | Aynı numarayı çok hesapta kullanma |
| D2 | **E-posta**: `persona@<alan>` (Workspace alias) | Persona başına ayrı |
| D3 | **Instagram**: uygulamadan aç → Professional → **Creator** hesabına çevir → Threads'i bu hesaba bağla | Aynı cihazda en fazla 5 hesap; farklı cihaz/aralıklı açılış |
| D4 | **TikTok**: uygulamadan aç; audit tamamlanana kadar **gizli** hesap | Cihaz başına 3 hesap sınırı |
| D5 | **YouTube**: persona Google hesabı → kanal oluştur → kanal adı/avatar → **Gelişmiş özellikler** için telefon doğrulaması (özel thumbnail, >15 dk için) | Google hesabı A5'te "test kullanıcısı" olarak eklenir |
| D6 | **X**: hesap aç → "Automated" etiketi (A6.5) → bio'da yöneten hesap | Kısa süre sonra kısıtlama gelirse itiraz |
| D7 | **Telegram**: kanal + tartışma grubu + botu yönetici yap (A7) | – |
| D8 | Panelde persona sihirbazı → **Kanalları bağla** (OAuth ekranlarında persona hesabıyla giriş) → Başlat | Her bağlantı ~2 dk |

Isınma: ilk 7 gün düşük hacim otomatik; sen bir şey yapmazsın.

---

## E. Yasal ve içerik hazırlığı

- **Gizlilik politikası + kullanım şartları** sayfaları (ben üreteceğim; sen alan adında yayınlarsın). Tüm app review'lar bunu ister.
- **KVKK aydınlatma metni** (persona e-posta/DM yanıtları için) — üreteceğim.
- Reklam/iş birliği için **fiyat aralıkları** (rate card) — panelde sen girersin; sistem asla kendi fiyat söylemez.
- **Ses kitabı çekirdeği**: ilk persona için 15–20 kendi yazdığın post/yorum örneği (Türkçe/İngilizce), 3–5 gerçek DevOps anısı (kimlik bilgisi içermeyen).
- **Kendi medyan** (bireysel influencer modu): 50–100 fotoğraf, dikey öncelikli; ses klonu için 30 dk temiz kayıt; yüz LoRA istersen 20–30 çeşitli fotoğraf + yazılı onayın (sistemde saklanır).

---

## G. SaaS'a geçişle eklenen işler (ücretli ürün, başka kullanıcılar)

| # | İş | Nereden / nasıl | Ücret / süre | Not |
|---|---|---|---|---|
| G1 | **Şirket** | Mali müşavir ile: şahıs şirketi (hızlı) veya Ltd. Şti.; vergi levhası, e-imza, e-Arşiv/e-Fatura başvurusu; ETBİS kaydı (kendi sitenden satış) | Şahıs: birkaç gün; Ltd: 1–2 hafta ⚠ | Business Verification'lar bu belgeleri ister |
| G2 | **Mali müşavir** | Aylık; MoR faturalaması, ihracat KDV istisnası, e-Arşiv | ⚠ ~3–6 bin TL/ay | docs/15 §2.3 |
| G3 | **Avukat incelemesi** | `legal/` taslakları (KVKK + tüketici + AI) | Tek seferlik ⚠ | Yayın öncesi zorunlu |
| G4 | **Paddle (MoR)** | https://paddle.com → satıcı başvurusu: şirket bilgileri, web sitesi, hukuki sayfalar canlı, ürün açıklaması; onay sonrası API key + webhook secret | 3–10 gün ⚠; ~%5 + 0,50 $ | `HG_PADDLE_API_KEY`, `HG_PADDLE_WEBHOOK_SECRET`, `HG_PADDLE_CLIENT_TOKEN` |
| G5 | **iyzico** (faz 2, TRY) | https://www.iyzico.com → üye işyeri başvurusu (şirket belgeleri) | 1–2 hafta ⚠ | `HG_IYZICO_API_KEY`, `HG_IYZICO_SECRET` |
| G6 | **İYS** (pazarlama e-postası/SMS için) | https://iys.org.tr → marka kaydı (MERSİS ile) | Ücretsiz; birkaç gün | Onaylar İYS'ye aktarılır |
| G7 | **VERBİS değerlendirmesi** | Avukat/mali müşavir ile eşik kontrolü; gerekirse https://verbis.kvkk.gov.tr kayıt | – | docs/16 §2.5 |
| G8 | **Meta Business Verification + App Review** | A3 madde 7b | 2–6 hafta | Demo videoları ben hazırlarım |
| G9 | **Google OAuth doğrulaması** | A5 madde 6 | 2–6 hafta | Search Console alan adı doğrulaması senin |
| G10 | **TikTok audit** (üçüncü taraf kullanıcı) | A4 | 2–4 hafta | – |
| G11 | **Mağaza hesapları** | A8; ayrıca App Privacy / Data Safety formları (envanterden ben doldururum, sen onaylarsın); demo hesap | – | Uygulama içi hesap silme zorunlu (kodda var) |
| G12 | **AB/UK temsilcisi** (AB müşterisi olursa) | GDPR md. 27 temsilci servisi (ör. DataRep, EDPO) ⚠ | ~100–300 €/yıl ⚠ | docs/16 §3 |
| G13 | **Alt işleyici sözleşmeleri** | Anthropic, Google, ElevenLabs, fal, Cloudflare, Paddle, Resend, Sentry'nin DPA/SCC sayfalarını kabul et, PDF'leri `legal/dpa/` klasörüne koy | Ücretsiz | KVKK standart sözleşme bildirimi gerekirse 5 iş günü ⚠ |
| G14 | **Affiliate programı** (lansman) | Rewardful veya Tolt hesabı ⚠ | ~49–99 $/ay | docs/15 §5.2 |
| G15 | **Destek kanalı** | destek@<alan> (Resend inbound) + yardım merkezi sayfası | – | – |

## F. Kontrol listesi (kısa)

**Bugün:** A1 alan adı · A3 Meta app · A4 TikTok başvurusu · A5 Google proje + audit formu · A6 X geliştirici + kredi · A7 BotFather · A8 Apple/Play kayıt · C4 Doppler · B1 Anthropic anahtarı
**Bu hafta:** B3 ElevenLabs · B4 fal · B6/B7 stok · B8 Tavily · C1 VPS · C2 R2 · C3 Resend · C5 Sentry · ilk persona hesapları (D)
**Beklerken:** E ses kitabı örnekleri, rate card, gizlilik sayfalarını yayınlama

Tüm env anahtarlarının tam listesi ve açıklamaları: [`../.env.example`](../.env.example). Uygulama açılışta eksik/geçersiz değişkenleri tek tek raporlar (`pnpm doctor`).
