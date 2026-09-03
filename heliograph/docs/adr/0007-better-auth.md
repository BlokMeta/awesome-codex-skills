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
