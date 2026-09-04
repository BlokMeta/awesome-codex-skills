import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { routerMock } from '@/test/setup';
import { renderApp } from '@/test/render';

const create = vi.fn();
const setActive = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  authClient: { organization: { create: (...a: unknown[]) => create(...a), setActive: (...a: unknown[]) => setActive(...a) } },
}));

import { slugify, WorkspaceCreateForm } from './workspace-create-form';

describe('WorkspaceCreateForm', () => {
  it('derives a URL-safe slug from Turkish names', () => {
    expect(slugify('Atölye Işık & Gölge')).toBe('atolye-isik-golge');
    expect(slugify('  Çok   Güzel ')).toBe('cok-guzel');
  });

  it('creates the workspace, activates it and goes home', async () => {
    create.mockResolvedValue({ data: { id: 'ws_1' }, error: null });
    setActive.mockResolvedValue({ data: {}, error: null });
    renderApp(<WorkspaceCreateForm />);
    await userEvent.type(screen.getByLabelText(/^Workspace name/), 'Atölye A');
    expect(screen.getByTestId('slug')).toHaveValue('atolye-a');
    await userEvent.click(screen.getByRole('button', { name: 'Create workspace' }));
    expect(create).toHaveBeenCalledWith({ name: 'Atölye A', slug: 'atolye-a' });
    expect(setActive).toHaveBeenCalledWith({ organizationId: 'ws_1' });
    expect(routerMock.push).toHaveBeenCalledWith('/');
  });
});
