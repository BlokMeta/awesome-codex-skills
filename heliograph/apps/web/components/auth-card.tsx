import type { ReactNode } from 'react';

/** Centered card for the unauthenticated screens: calm ground, one flash accent. */
export function AuthCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <section className="w-full max-w-sm bg-surface border border-line rounded-[var(--hg-radius-md)] p-6 grid gap-5">
        <header className="grid gap-2">
          <span aria-hidden="true" className="block h-1 w-10 bg-flash rounded-full" />
          <h1 className="text-[length:var(--hg-font-size-xl)] leading-[var(--hg-line-height-xl)] m-0">
            {title}
          </h1>
        </header>
        {children}
        {footer ? (
          <footer className="text-ink2 text-[length:var(--hg-font-size-sm)]">{footer}</footer>
        ) : null}
      </section>
    </main>
  );
}
