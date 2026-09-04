import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="grid gap-3 text-center">
        <p className="font-mono text-ink3 m-0">404</p>
        <Link href="/" className="text-tide underline">
          Heliograph
        </Link>
      </div>
    </main>
  );
}
