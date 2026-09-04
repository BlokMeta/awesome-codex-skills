import { cookies } from 'next/headers';
import { AppShell } from '@/components/app-shell';
import { Today } from '@/components/today';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, null);
  return <AppShell locale={locale}>{(me) => <Today me={me} />}</AppShell>;
}
