import type { CredentialStore } from '@heliograph/domain';
import { and, eq, isNull } from 'drizzle-orm';
import { ulid } from 'ulid';
import type { Database } from '../../../db/client.js';
import { withWorkspace } from '../../../db/tenant.js';
import { decryptSecret, encryptSecret, type KeyWrapper } from './envelope.js';
import { credentials } from './schema.js';

/**
 * Credentials at rest are envelope-encrypted (envelope.ts) and tenant-scoped by RLS. `reveal`
 * is the only way plaintext leaves this class; callers must not persist or log the value.
 */
export class DrizzleCredentialStore implements CredentialStore {
  constructor(
    private readonly db: Database,
    private readonly wrapper: KeyWrapper,
  ) {}

  async put(input: {
    workspaceId: string;
    kind: string;
    secret: string;
    expiresAt: Date | null;
  }): Promise<string> {
    const id = ulid();
    const envelope = await encryptSecret(this.wrapper, input.secret);
    await withWorkspace(this.db, input.workspaceId, async (tx) => {
      await tx.insert(credentials).values({
        id,
        workspaceId: input.workspaceId,
        kind: input.kind,
        ciphertext: envelope.ciphertext,
        wrappedDek: envelope.wrappedDek,
        keyVersion: envelope.keyVersion,
        expiresAt: input.expiresAt,
      });
    });
    return id;
  }

  async reveal(workspaceId: string, credentialId: string): Promise<string | null> {
    const row = await withWorkspace(this.db, workspaceId, async (tx) => {
      const [r] = await tx
        .select()
        .from(credentials)
        .where(
          and(
            eq(credentials.workspaceId, workspaceId),
            eq(credentials.id, credentialId),
            isNull(credentials.revokedAt),
          ),
        )
        .limit(1);
      return r ?? null;
    });
    if (!row) return null;
    return decryptSecret(this.wrapper, {
      ciphertext: row.ciphertext,
      wrappedDek: row.wrappedDek,
      keyVersion: row.keyVersion,
    });
  }

  async rotate(
    workspaceId: string,
    credentialId: string,
    secret: string,
    expiresAt: Date | null,
  ): Promise<void> {
    const envelope = await encryptSecret(this.wrapper, secret);
    await withWorkspace(this.db, workspaceId, async (tx) => {
      await tx
        .update(credentials)
        .set({
          ciphertext: envelope.ciphertext,
          wrappedDek: envelope.wrappedDek,
          keyVersion: envelope.keyVersion,
          expiresAt,
          rotatedAt: new Date(),
          revokedAt: null,
        })
        .where(and(eq(credentials.workspaceId, workspaceId), eq(credentials.id, credentialId)));
    });
  }

  /** Destroys the ciphertext (docs/08 §3: disconnect = the secret is gone, not just flagged). */
  async revoke(workspaceId: string, credentialId: string): Promise<void> {
    await withWorkspace(this.db, workspaceId, async (tx) => {
      await tx
        .delete(credentials)
        .where(and(eq(credentials.workspaceId, workspaceId), eq(credentials.id, credentialId)));
    });
  }
}
