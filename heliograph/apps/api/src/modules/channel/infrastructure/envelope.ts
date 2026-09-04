import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Envelope encryption for stored secrets (docs/08 §3): every credential gets its own data key
 * (DEK, AES-256-GCM); the DEK is wrapped by a key-encryption key. `MasterKeyWrapper` wraps with
 * the operator-provided master key; a KMS/Vault transit wrapper implements the same interface.
 */
export interface KeyWrapper {
  readonly keyVersion: number;
  wrap(dek: Buffer): Promise<Buffer>;
  unwrap(wrapped: Buffer, keyVersion: number): Promise<Buffer>;
}

interface Envelope {
  readonly ciphertext: Buffer;
  readonly wrappedDek: Buffer;
  readonly keyVersion: number;
}

const IV_BYTES = 12;
const TAG_BYTES = 16;

function seal(key: Buffer, plaintext: Buffer): Buffer {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]);
}

function open(key: Buffer, sealed: Buffer): Buffer {
  const iv = sealed.subarray(0, IV_BYTES);
  const tag = sealed.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = sealed.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}

export class MasterKeyWrapper implements KeyWrapper {
  readonly keyVersion = 1;
  private readonly key: Buffer;

  /** `HG_ENCRYPTION_MASTER_KEY`: 32 bytes, base64 (docs/14: `openssl rand -base64 32`). */
  constructor(masterKeyBase64: string) {
    const key = Buffer.from(masterKeyBase64, 'base64');
    if (key.length !== 32) throw new Error('HG_ENCRYPTION_MASTER_KEY must decode to 32 bytes');
    this.key = key;
  }

  async wrap(dek: Buffer): Promise<Buffer> {
    return seal(this.key, dek);
  }

  async unwrap(wrapped: Buffer, keyVersion: number): Promise<Buffer> {
    if (keyVersion !== this.keyVersion) throw new Error(`unknown key version ${keyVersion}`);
    return open(this.key, wrapped);
  }
}

export async function encryptSecret(wrapper: KeyWrapper, secret: string): Promise<Envelope> {
  const dek = randomBytes(32);
  try {
    return {
      ciphertext: seal(dek, Buffer.from(secret, 'utf8')),
      wrappedDek: await wrapper.wrap(dek),
      keyVersion: wrapper.keyVersion,
    };
  } finally {
    dek.fill(0);
  }
}

export async function decryptSecret(wrapper: KeyWrapper, envelope: Envelope): Promise<string> {
  const dek = await wrapper.unwrap(envelope.wrappedDek, envelope.keyVersion);
  try {
    return open(dek, envelope.ciphertext).toString('utf8');
  } finally {
    dek.fill(0);
  }
}
