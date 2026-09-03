# ADR-0001: Modüler monolit ve hexagonal mimari

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Tek ekip, 12 bounded context, uzun süren iş akışları. Mikroservis operasyon yükü tek kişilik ekip için ağır; düz katmanlı monolit ise sınırların erimesine yol açıyor.

## Karar
NestJS içinde modüler monolit; her modül domain/application/infrastructure/interface katmanlı; domain paketi framework'süz (`packages/domain`); modüller arası iletişim public application servisleri veya outbox olayları ile. dependency-cruiser sınırları CI'da zorlar.

## Sonuçlar
Artı: test edilebilirlik, ileride modül başına ayrıştırma. Eksi: daha fazla dosya/boilerplate; ilk hızda küçük kayıp. Reddedilen: mikroservisler, düz MVC.
