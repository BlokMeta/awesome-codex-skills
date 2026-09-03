# @heliograph/domain

Saf TypeScript iş kuralları. **Framework importu yok** (Nest, Drizzle, Temporal, React). Yalnızca `zod`, `ulid` ve test için `fast-check`/`vitest` (dependency-cruiser ile zorlanır).

## Yapı

```
src/
  shared/    Result, DomainError, Clock/Rng portları, Id
  persona/   Persona aggregate (durum makinesi, ısınma), PostingPolicy (günlük slot planlama)
  config/    PolicyEntry (sürümlü dinamik yapılandırma), staleness, ConfigReader/PolicyRepository portları (ADR-0011)
  billing/   Entitlement kontrolü, kredi defteri (ADR-0012)
```

Her bounded context kendi klasöründe; public API yalnızca `src/index.ts`.

## Kurallar
- Beklenen başarısızlık = `Result.err(DomainError)`, `throw` yok.
- Zaman ve rastgelelik yalnızca `Clock`/`Rng` portlarından.
- Her fonksiyonun birim testi; sayısal/planlama mantığında property-based test.
- Kapsam eşiği: %90 satır, %85 dal (`vitest.base`).
