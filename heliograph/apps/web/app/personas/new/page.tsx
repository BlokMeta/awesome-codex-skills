import { cookies } from 'next/headers';
import { CreatePersona } from '@/components/persona/create-persona';
import { ShellPage } from '@/components/shell-page';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';

export default async function NewPersonaPage() {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value, null);
  return (
    <ShellPage locale={locale}>
      <CreatePersona />
    </ShellPage>
  );
}
