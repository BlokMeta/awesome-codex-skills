import type { MeResponse } from '@heliograph/contracts';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const consentStatus = vi.fn();
const entitlements = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    privacy: { consentStatus: (...a: unknown[]) => consentStatus(...a) },
    billing: { entitlements: (...a: unknown[]) => entitlements(...a) },
  },
}));

import { Today } from './today';

const me = (over: Partial<MeResponse> = {}): MeResponse => ({
  operator: {
    id: 'op',
    email: 'ayse@example.com',
    name: 'Ayşe',
    emailVerified: true,
    locale: 'tr',
    timezone: 'Europe/Istanbul',
    twoFactorEnabled: false,
  },
  workspaces: [{ id: 'ws', name: 'Atölye', slug: 'atolye', role: 'owner' }],
  activeWorkspaceId: 'ws',
  ...over,
});
const noPending = { pending: [], accepted: [], optional: {}, published: {} };

describe('Today', () => {
  beforeEach(() => {
    consentStatus.mockReset();
    entitlements.mockReset();
    routerMock.replace.mockReset();
  });

  it('shows plan and credits from the API', async () => {
    consentStatus.mockResolvedValue(noPending);
    entitlements.mockResolvedValue({
      plan: { code: 'free', name: 'Free' },
      credits: { balance: 3, monthlyGrant: 30, warning: 'ok' },
      entitlements: [],
      subscription: null,
      workspaceId: 'ws',
    });
    renderApp(<Today me={me()} />);
    expect(screen.getByTestId('welcome')).toHaveTextContent('Welcome, Ayşe');
    expect(await screen.findByTestId('plan')).toHaveTextContent('Plan: Free');
    expect(screen.getByTestId('credits')).toHaveTextContent('3 media credits');
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it('redirects to consents when documents are pending', async () => {
    consentStatus.mockResolvedValue({ ...noPending, pending: ['terms'] });
    renderApp(<Today me={me()} />);
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/consents'));
  });

  it('redirects to workspace creation when the operator has none', async () => {
    consentStatus.mockResolvedValue(noPending);
    renderApp(<Today me={me({ workspaces: [], activeWorkspaceId: null })} />);
    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith('/workspaces/new'));
    expect(entitlements).not.toHaveBeenCalled();
  });
});
