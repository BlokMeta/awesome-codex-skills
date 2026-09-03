# ADR-0006: i18n kütüphanesi olarak Lingui 6

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Next ve Expo'da ortak ICU MessageFormat, .po katalogları, derleme zamanı çıkarımı, pseudo-locale ve 'dil paketi ekle = katalog ekle' hedefi. next-intl RN'de çalışmıyor; Paraglide'ın Metro desteği yok.

## Karar
Lingui 6: `packages/i18n` tek katalog kaynağı; Next'te SWC eklentisi, Expo'da Metro transformer; mesaj id'leri elle (context.screen.element); `lingui extract/compile` CI'da; fuzzy = eksik.

## Sonuçlar
Artı: iki platformda tek kütüphane, ICU yerel, Crowdin/Weblate uyumu. Eksi: i18next kadar geniş TMS ekosistemi yok. Reddedilen: i18next(+icu), react-intl, next-intl, Paraglide.
