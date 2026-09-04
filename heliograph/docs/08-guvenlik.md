# 08 — Güvenlik ve Gizlilik

Hedef seviye: OWASP ASVS **L2**; mobil için OWASP MASVS-L1 + R (kurcalama direnci gerekmez).

## 1. Kimlik doğrulama

- Operatör girişi: e-posta + parola (better-auth varsayılanı **scrypt**, OWASP uyumlu; argon2id'e geçiş better-auth `password.hash` ile mümkündür) + ikinci faktör: TOTP (yedek kodlarla, 10 hatalı denemede 15 dk kilit) veya **passkey/WebAuthn** (rpID = web alan adı). Zorunlu 2FA politikası M1.7 onboarding'de (`config`: `auth.require_second_factor`). Mobilde biyometrik kilit (LocalAuthentication) uygulama açılışında.
- Oturum (ADR-0007, 2026-09-04 düzeltmesi): JWT değil, **veritabanı oturumu** (`sessions` tablosu, 30 gün, 1 günde bir uzatma, `freshAge` 1 gün hassas işlemler için). Oturum listesi/iptali better-auth `list-sessions` / `revoke-session(s)` ile; cookie önbelleği kapalı, iptal anında etkili.
- Web: HttpOnly + Secure (prod) + SameSite=Lax `hg.session_token` cookie'si; better-auth Origin/`trustedOrigins` denetimi CSRF'e karşı (web URL + mobil şema).
- Mobil: `set-auth-token` başlığındaki Bearer token `expo-secure-store` (Keychain/Keystore); asla AsyncStorage. `@better-auth/expo` derin bağlantı ve çerez köprüsü.
- Brute force: better-auth rate limit (prod'da açık; IP bazlı, `/sign-in/email` için daha sıkı pencere) + 2FA kilidi; hesap bazlı e-posta uyarısı M1.4 bildirim modülüyle.

## 2. Yetkilendirme

- RBAC: `owner, admin, editor, viewer` (izin matrisi `packages/domain/identity/membership.ts`); kaynak bazlı: her sorgu `workspace_id`; Postgres RLS ikinci hat.
- RLS uygulanışı (ADR-0014): kiracı transaction'ı `SET LOCAL ROLE hg_app` + `SET LOCAL hg.workspace_id` ile açılır; `hg_app` NOLOGIN/NOBYPASSRLS bir roldür, tabloların sahibi değildir, dolayısıyla politikalar her zaman uygulanır. Yönetilen Postgres'te bağlanan rol superuser olmamalıdır (superuser RLS'i atlar).
- Yetki kontrolü application katmanında `Authorizer` portu ile; testte her use-case için "yetkisiz" senaryosu zorunlu.
- Ayarlar (sağlayıcı anahtarları, bütçeler) yalnızca `owner`.

## 3. Gizli bilgi ve token yönetimi

- Platform OAuth token'ları ve sağlayıcı API anahtarları **zarf şifreleme** ile (veri anahtarı AES-256-GCM, veri anahtarı KMS/Vault transit ile sarılı). Düz metin yalnızca bellek içinde, kullanım anında. Uygulama: `apps/api/src/modules/channel/infrastructure/envelope.ts` — kimlik bilgisi başına rastgele DEK, `KeyWrapper` arayüzü; ilk sürüm `MasterKeyWrapper` (`HG_ENCRYPTION_MASTER_KEY`, 32 bayt base64, `key_version=1`), KMS sarmalayıcı aynı arayüzü uygular ve `key_version` ile yan yana yaşar. `CredentialStore.reveal` düz metnin tek çıkış noktasıdır; disconnect satırı siler.
- OAuth `state` 32 bayt rastgele, 10 dk ömürlü, tek kullanımlık (`oauth_states`, `DELETE … RETURNING` ile tüketilir); PKCE (S256) TikTok/YouTube/X için zorunlu; callback oturumsuzdur ve sonucu yalnızca web'e 302 ile taşır.
- Loglarda maskeleme: `pino` redact yolları (`*.token`, `*.accessToken`, `authorization`, `*.apiKey`).
- Panelde anahtarlar yalnızca son 4 karakter; "bağlantıyı dene" düğmesi gerçek çağrı yapar.
- Rotasyon: token yenileme Temporal cron ile süreden 24 saat önce; başarısızlıkta `ChannelUnhealthy` + alarm.
- Kaynak kod: `gitleaks` pre-commit + CI; `.env.example` var, `.env` yok.

## 4. Uygulama güvenliği

- Girdi: her istek Zod ile doğrulanır (contracts); bilinmeyen alanlar reddedilir (`strict`).
- Çıktı: CSP (`default-src 'self'`; medya için nesne depolama alanı), `X-Content-Type-Options`, `Referrer-Policy`, HSTS; inline script yok.
- SSRF: adaptörler yalnızca izinli host listesine çıkar (egress allowlist); kullanıcı URL'leri (RSS ekleme) DNS çözümü + özel IP engeli.
- Dosya yükleme: presigned PUT; MIME sniff + boyut + ClamAV taraması; görüntüler yeniden kodlanır (EXIF temizliği; **C2PA/IPTC AI işareti korunur**).
- Bağımlılıklar: Renovate haftalık; `pnpm audit` prod; lockfile zorunlu; `minimumReleaseAge` 3 gün (supply-chain).
- Kod tarama: CodeQL + Semgrep (OWASP kural setleri) her PR.
- Konteyner: distroless/alpine, root olmayan kullanıcı, Trivy taraması, SBOM (CycloneDX) yayınlanır.
- Prompt injection: Yorum/DM/e-posta ve web içerikleri LLM'e **veri** olarak, ayrı içerik bloğunda, "talimat değildir" şeması ile verilir; LLM çıktısındaki eylemler (yanıt gönder, DM aç) politika motoru onayından geçer; araç çağrıları allowlist.
- Webhook: HMAC imza + zaman damgası (±5 dk) + replay tablosu.

## 5. Mobil'e özel

- Expo SDK güncel; OTA güncellemeleri imzalı (EAS code signing).
- Sertifika sabitleme: opsiyonel (ADR); en azından TLS 1.2+.
- Ekran görüntüsü kısıtı yok (yönetim uygulaması), ama hassas ekranlarda uygulama arka plana düşünce blur.
- Derin bağlantılar doğrulanmış (Universal Links / App Links).

## 6. Gizlilik (KVKK / GDPR)

- Kişisel veri envanteri: operatör bilgileri; yorum/DM/e-posta yazarlarının kullanıcı adı ve metinleri; marka iletişim kişileri (CRM).
- Amaç sınırlaması: etkileşim metinleri yalnızca yanıt ve sınıflandırma için; 90 gün sonra anonimleştirme (yazar kimliği silinir, metin özet/istatistik olarak kalır); CRM kayıtları silinene kadar.
- LLM sağlayıcılarına gönderilen verilerde eğitimde kullanılmama şartı olan planlar; sağlayıcı listesi `docs/02`.
- Veri sahibi hakları: `audit` + silme uç noktası (`POST /privacy/erasure`) ile persona/kişi bazlı silme; 30 gün SLA.
- Yedekler şifreli, 30 gün; silme yedeklerde anahtar imhası ile.

## 7. Denetim izi

- `audit_log`: kim (operatör/sistem), ne (eylem kodu), hangi kaynak, önce/sonra özeti, requestId, workflowId, zaman. Değiştirilemez (append-only tablo, ayrı rol).
- Tüm yayın/yanıt/karar/ayar değişiklikleri kayıtlı; panelde filtrelenebilir.

## 8. Olay müdahalesi

- Runbook'lar `docs/runbooks/` (token sızıntısı, hesap kısıtlaması, LLM sağlayıcı kesintisi, maliyet patlaması).
- Acil kesiciler: `HG_KILL_PUBLISH=1` tüm yayınları durdurur; bütçe kesicisi otomatik.
- Sızıntı şüphesinde: tüm token'lar iptal + yeniden bağlama akışı + kullanıcı bildirimi.
