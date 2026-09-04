'use client';

import type { ReactNode } from 'react';
import { AppShell } from './app-shell';

/** Client boundary used by every route inside the app shell. */
export function ShellPage({ locale, children }: { locale: string; children: ReactNode }) {
  return <AppShell locale={locale}>{() => children}</AppShell>;
}
