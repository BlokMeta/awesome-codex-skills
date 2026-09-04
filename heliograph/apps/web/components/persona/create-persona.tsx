'use client';

import { messages } from '@heliograph/i18n';
import { useRouter } from 'next/navigation';
import { problemCode, useCreatePersona } from '@/lib/personas';
import { useT } from '@/lib/use-t';
import { IdentityForm } from './identity-form';

export function CreatePersona() {
  const t = useT();
  const router = useRouter();
  const create = useCreatePersona();
  const limitHit = problemCode(create.error) === 'billing.entitlement_exceeded';
  return (
    <div className="grid gap-5 max-w-xl">
      <h1 className="m-0 text-[length:var(--hg-font-size-2xl)] leading-[var(--hg-line-height-2xl)]">
        {t(messages.persona.newPersona)}
      </h1>
      {limitHit ? (
        <p className="m-0 text-warn" data-testid="limit">
          {t(messages.persona.error.limit, {
            limit: Number(
              (create.error as { data?: { problem?: { params?: { limit?: number } } } }).data
                ?.problem?.params?.limit ?? 1,
            ),
          })}
        </p>
      ) : null}
      <IdentityForm
        submitLabel={t(messages.persona.wizard.next)}
        busy={create.isPending}
        error={limitHit ? undefined : create.error}
        onSubmit={(v) =>
          create.mutate(v, { onSuccess: (p) => router.push(`/personas/${p.id}/wizard?step=voice`) })
        }
      />
    </div>
  );
}
