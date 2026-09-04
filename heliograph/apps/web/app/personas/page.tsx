import { cookies } from 'next/headers';
import { PersonasList } from '@/components/persona/personas-list';
import { ShellPage } from '@/components/shell-page';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';

export default async function PersonasPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value, null);
  return (
    <ShellPage locale={locale}>
      <PersonasList />
    </ShellPage>
  );
}
