# @heliograph/tokens

Tasarım sisteminin tek kaynağı (docs/07 §2, ADR-0005). `tokens/*.json` DTCG biçimindedir; `pnpm build`:

- `build/tokens.css` → `--hg-*` CSS değişkenleri; açık tema `:root`, koyu tema `prefers-color-scheme` (`:root:not([data-theme="light"])`) ve `[data-theme="dark"]` altında; `prefers-reduced-motion` süreleri sıfırlar.
- `build/theme.js` + `theme.d.ts` → Unistyles için `lightTheme` / `darkTheme`.
- `src/tokens.ts` → tipli, düzleştirilmiş görünüm (`tokens.color.light.tide`).

Testler her iki temada WCAG AA kontrastı, nötr renklerin saf gri olmamasını ve ölçeklerin tutarlılığını doğrular; palet değişikliği bu testlerden geçmeden merge edilmez.

Kural: bileşenlerde token dışı renk/boşluk yasak (`docs/03 §8`).
