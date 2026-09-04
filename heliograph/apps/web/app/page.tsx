import { cookies } from 'next/headers';
import { Home } from '@/components/home';
import { LOCALE_COOKIE, resolveLocale } from '@/lib/locale';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value, null);
  return <Home locale={locale} />;
}
