import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: ['@heliograph/ui', '@heliograph/i18n', '@heliograph/contracts', '@heliograph/domain', '@heliograph/tokens'],
  env: {
    NEXT_PUBLIC_API_URL: process.env['HG_PUBLIC_API_URL'] ?? 'http://localhost:4000',
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
