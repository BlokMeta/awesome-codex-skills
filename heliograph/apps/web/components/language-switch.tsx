'use client';

import { messages, userFacingLocales } from '@heliograph/i18n';
import { useRouter } from 'next/navigation';
import { LOCALE_COOKIE } from '@/lib/locale';
import { useT } from '@/lib/use-t';

export function LanguageSwitch({ current }: { current: string }) {
  const t = useT();
  const router = useRouter();
  return (
    <label className="grid gap-1 text-[length:var(--hg-font-size-xs)] text-ink3 uppercase tracking-[var(--hg-tracking-label)]">
      {t(messages.nav.language)}
      <select
        className="hg-field__control"
        value={current}
        onChange={(e) => {
          document.cookie = `${LOCALE_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        {userFacingLocales().map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
    </label>
  );
}
