# ADR-0007: Kimlik doğrulama için better-auth

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Self-host, passkey + TOTP, Next + Expo istemcileri, ileride organizasyon/rol eklentileri. Lucia deprecated, Auth.js bakım modunda, Clerk SaaS maliyeti.

## Karar
better-auth 1.7 NestJS içinde mount edilir; `@better-auth/expo` mobilde; passkey ve TOTP eklentileri; oturum rotasyonu ve aile iptali.

## Sonuçlar
Artı: sahiplik, maliyet yok, tipli istemci. Eksi: barındırılan UI yok (kendi ekranlarımız zaten var). Reddedilen: Clerk (istenirse ADR ile), Auth.js, Lucia.

## Uygulama notları (2026-09-04, M0.8)
1. **Mount:** better-auth'un fetch handler'ı Fastify'a doğrudan `/v1/auth/*` rotası olarak bağlanır (`auth.mount.ts`); topluluk paketi `@thallesp/nestjs-better-auth` Express-öncelikli ve Nest body parser'ını kapattığı için kullanılmadı. Oturum doğrulaması global `SessionGuard` ile (`auth.api.getSession`), `@Public()` istisnası.
2. **Şema eşlemesi:** better-auth modelleri kendi tablolarımıza `modelName`/`fields` ile eşlenir: user→`operators`, session→`sessions` (`activeOrganizationId`→`active_workspace_id`), account→`auth_accounts`, verification→`verifications`, organization→`workspaces`, member→`memberships` (`organizationId`→`workspace_id`, `userId`→`operator_id`), invitation→`invitations`, passkey→`passkeys`, twoFactor→`two_factors`. Drizzle property adları = better-auth alan adları; kolonlar snake_case. Böylece davet/üyelik satırlarını better-auth yazar, domain (`MembershipRepository`) okur.
3. **Roller:** domain izin matrisi (`ROLE_PERMISSIONS`) better-auth `createAccessControl` ifadelerine yansıtılır; organization eklentisinin kendi eylemleri (`organization/member/invitation`) owner/admin'e verilir. Drift testi: `access-control.test.ts`.
4. **Oturum modeli:** docs/08'deki "15 dk JWT + rotasyonlu refresh" yerine better-auth veritabanı oturumu (30 gün, günlük uzatma) ve **cookie önbelleği kapalı** (kural 13: iptal anında etkili). Kimlikler ULID (`advanced.database.generateId`).
5. **E-posta:** `EmailSender` portu; doğrulama/sıfırlama/davet e-postaları bu porttan. Resend adaptörü M1.4; o zamana kadar `LogEmailSender`. Davet kabulü doğrulanmış e-posta ister (better-auth varsayılanı korunur).
6. **Parola:** better-auth scrypt (docs/08 güncellendi).
