import { createHmac } from 'node:crypto';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (const ch of clean) {
    const idx = ALPHABET.indexOf(ch);
    if (idx < 0) throw new Error(`invalid base32 char ${ch}`);
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

/** RFC 6238 TOTP (SHA-1, 6 digits, 30 s) — what authenticator apps compute from the otpauth URI. */
export function totpFromUri(uri: string, now = Date.now()): string {
  const u = new URL(uri);
  const secret = u.searchParams.get('secret');
  if (!secret) throw new Error('otpauth uri without secret');
  const digits = Number(u.searchParams.get('digits') ?? 6);
  const period = Number(u.searchParams.get('period') ?? 30);
  const counter = Math.floor(now / 1000 / period);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f;
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 10 ** digits;
  return String(code).padStart(digits, '0');
}
