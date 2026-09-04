import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { PersonaWizard } from '@/components/persona/wizard';
import { ShellPage } from '@/components/shell-page';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';

export default async function PersonaWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, cookieStore] = await Promise.all([params, cookies()]);
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, null);
  return (
    <ShellPage locale={locale}>
      <Suspense>
        <PersonaWizard id={id} />
      </Suspense>
    </ShellPage>
  );
}
