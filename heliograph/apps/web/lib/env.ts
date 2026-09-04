/** Public runtime configuration of the web app (values inlined at build time by Next). */
export const API_URL: string = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';
export const AUTH_URL = `${API_URL}/v1/auth`;
