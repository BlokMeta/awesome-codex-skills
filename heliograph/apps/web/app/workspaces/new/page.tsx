'use client';

import { messages } from '@heliograph/i18n';
import { AuthCard } from '@/components/auth-card';
import { WorkspaceCreateForm } from '@/components/workspace-create-form';
import { useT } from '@/lib/use-t';

export default function NewWorkspacePage() {
  const t = useT();
  return (
    <AuthCard title={t(messages.workspace.createTitle)}>
      <WorkspaceCreateForm />
    </AuthCard>
  );
}
