# @heliograph/contracts

API sözleşmesinin tek kaynağı (ADR-0003). oRPC contract + Zod 4 şemaları; buradan:

- `openapi.json` üretilir (`pnpm --filter @heliograph/contracts gen`, deterministik; CI diff kontrolü),
- `apps/api` `@orpc/nest` ile uygular,
- web/mobil tipli istemciyi (`@orpc/client`) kullanır,
- Prism mock ve Pact sözleşme testleri bu dosyayı okur.

## Yapı

```
src/
  common/   pagination (opaque cursor), problem (RFC 9457)
  system/   health, config health
  index.ts  contract = oc.router({...})
scripts/generate-openapi.ts
openapi.json  (üretilmiş, commit'li)
```

Kural: yeni uç nokta = önce burada şema, sonra `gen`, sonra uygulama (docs/05 §10).
