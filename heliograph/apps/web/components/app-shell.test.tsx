import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const meFn = vi.fn();
const signOut = vi.fn();
const setActive = vi.fn();
vi.mock('@/lib/api', () => ({ api: { identity: { me: (...a: unknown[]) => meFn(...a) } } }));
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    signOut: (...a: unknown[]) => signOut(...a),
    organization: { setActive: (...a: unknown[]) => setActive(...a) },
  },
}));

import { AppShell } from './app-shell';

const me = {
  operator: {
    id: 'op',
    email: 'a@b.c',
    name: 'Ayşe',
    emailVerified: true,
    locale: 'en',
    timezone: 'UTC',
    twoFactorEnabled: false,
  },
  workspaces: [
    { id: 'ws_a', name: 'Atölye A', slug: 'a', role: 'owner' },
    { id: 'ws_b', name: 'Studio B', slug: 'b', role: 'editor' },
  ],
  activeWorkspaceId: 'ws_a',
};

describe('AppShell', () => {
  beforeEach(() => {
    meFn.mockReset();
    signOut.mockReset();
    setActive.mockReset();
    routerMock.push.mockReset();
    routerMock.replace.mockReset();
  });

  it('renders navigation, the active workspace with its role, and the switcher', async () => {
    meFn.mockResolvedValue(me);
    renderApp(<AppShell locale="en">{(m) => <p>hello {m.operator.name}</p>}</AppShell>);
    expect(await screen.findByText('hello Ayşe')).toBeInTheDocument();
    expect(screen.getByTestId('active-workspace')).toHaveTextContent('Atölye A');
    expect(screen.getByTestId('active-workspace')).toHaveTextContent('Owner');
    expect(screen.getByRole('link', { name: 'Queue' })).toHaveAttribute('href', '/queue');
    setActive.mockResolvedValue({});
    await userEvent.click(screen.getByRole('button', { name: 'Studio B' }));
    expect(setActive).toHaveBeenCalledWith({ organizationId: 'ws_b' });
  });

  it('signs out and returns to sign-in', async () => {
    meFn.mockResolvedValue(me);
    signOut.mockResolvedValue({});
    renderApp(<AppShell locale="en">{() => null}</AppShell>);
    await userEvent.click(await screen.findByTestId('sign-out'));
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/sign-in'));
  });

  it('bounces to sign-in when /v1/me fails', async () => {
    meFn.mockRejectedValue(new Error('401'));
    renderApp(<AppShell locale="en">{() => null}</AppShell>);
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/sign-in'));
  });
});
