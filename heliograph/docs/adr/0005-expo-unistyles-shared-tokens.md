# ADR-0005: Mobil: Expo SDK 57 + Unistyles 3; bileşen değil token paylaşımı

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Web (Next) ve mobil (Expo) aynı görsel dili taşımalı. Bileşen paylaşımı (RN-Web) web tarafında shadcn/Base UI ekosisteminden vazgeçmeyi gerektirir ve erişilebilirlik/performans ödünleri getirir.

## Karar
Token'lar DTCG JSON'da tek kaynak → Style Dictionary → CSS değişkenleri (web) + TS tema (Unistyles). `packages/ui` bileşenleri **aynı props API'si ile iki uygulama** (web: shadcn/Base UI+Tailwind; RN: Unistyles). Mobil stil: Unistyles 3 (New-Arch, tema/breakpoint, yeniden render yok).

## Sonuçlar
Artı: her platformda en iyi yerel deneyim; token disiplini. Eksi: bileşen başına iki uygulama (Storybook ile görsel eşitlik testi). Reddedilen: NativeWind v5 (preview), Tamagui (kit lock-in), react-strict-dom (0.0.x).
