# ADR-0003: API sözleşmesi için oRPC

- **Durum:** Kabul edildi
- **Tarih:** 2026-09-03
- **Karar vericiler:** Proje sahibi + mimari ajan

## Bağlam
Web ve mobil aynı API'yi tüketiyor; OpenAPI (Prism mock, Pact, üçüncü taraf) gerekli; tip güvenliği istenir. tRPC'nin OpenAPI desteği alpha; ts-rest bakım riskinde.

## Karar
`packages/contracts` içinde oRPC contract (Zod 4); `@orpc/nest` ile uygulama; OpenAPI 3.1 üretimi; TanStack Query bağları web+RN'de aynı istemci. Yedek yol: @nestjs/swagger + orval.

## Sonuçlar
Artı: tek kaynak, tip güvenliği, OpenAPI bedava. Eksi: oRPC ekosistemi tRPC'den küçük; 2.0 beta'ya geçiş ileride. Reddedilen: tRPC, ts-rest, elle REST.
