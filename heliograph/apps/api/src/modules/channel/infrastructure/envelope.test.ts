import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret, MasterKeyWrapper } from './envelope.js';

const master = randomBytes(32).toString('base64');

describe('envelope encryption', () => {
  it('round-trips a secret with a fresh DEK per call and never stores plaintext', async () => {
    const wrapper = new MasterKeyWrapper(master);
    const a = await encryptSecret(wrapper, 'EAAB-access-token');
    const b = await encryptSecret(wrapper, 'EAAB-access-token');
    expect(a.ciphertext.equals(b.ciphertext)).toBe(false);
    expect(a.wrappedDek.equals(b.wrappedDek)).toBe(false);
    expect(a.ciphertext.toString('utf8')).not.toContain('EAAB');
    expect(await decryptSecret(wrapper, a)).toBe('EAAB-access-token');
    expect(await decryptSecret(wrapper, b)).toBe('EAAB-access-token');
  });

  it('fails closed on a tampered ciphertext, a wrong master key or an unknown key version', async () => {
    const wrapper = new MasterKeyWrapper(master);
    const env = await encryptSecret(wrapper, 'secret');
    const tampered = Buffer.from(env.ciphertext);
    tampered[tampered.length - 1] ^= 0x01;
    await expect(decryptSecret(wrapper, { ...env, ciphertext: tampered })).rejects.toThrow();
    const other = new MasterKeyWrapper(randomBytes(32).toString('base64'));
    await expect(decryptSecret(other, env)).rejects.toThrow();
    await expect(decryptSecret(wrapper, { ...env, keyVersion: 2 })).rejects.toThrow(
      'unknown key version',
    );
    expect(() => new MasterKeyWrapper('c2hvcnQ=')).toThrow('32 bytes');
  });
});
