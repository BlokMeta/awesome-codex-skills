'use client';

import { AppShell } from './app-shell';
import { Today } from './today';

/** Client boundary for the home route: server layout resolves the locale, this renders the shell. */
export function Home({ locale }: { locale: string }) {
  return <AppShell locale={locale}>{(me) => <Today me={me} />}</AppShell>;
}
