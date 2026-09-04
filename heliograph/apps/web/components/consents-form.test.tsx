import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const consentStatus = vi.fn();
const acceptConsents = vi.fn();
vi.mock('@/lib/api', () => ({
  api: {
    privacy: {
      consentStatus: (...a: unknown[]) => consentStatus(...a),
      acceptConsents: (...a: unknown[]) => acceptConsents(...a),
    },
  },
}));

import { ConsentsForm } from './consents-form';

const pending = {
  pending: ['terms', 'privacy', 'aup', 'ai_processing'],
  accepted: [],
  optional: { cookies: 'not_granted' },
  published: {
    terms: '2026-09-03',
    privacy: '2026-09-03',
    aup: '2026-09-03',
    ai_processing: '2026-09-03',
  },
};

describe('ConsentsForm', () => {
  beforeEach(() => {
    consentStatus.mockReset();
    acceptConsents.mockReset();
    routerMock.push.mockReset();
  });

  it('lists pending documents with versions and accepts them all at the published version', async () => {
    consentStatus.mockResolvedValue(pending);
    acceptConsents.mockResolvedValue({ ...pending, pending: [] });
    renderApp(<ConsentsForm />);
    const list = await screen.findByTestId('pending-docs');
    expect(list.querySelectorAll('li').length).toBe(4);
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
    expect(screen.getAllByText('v2026-09-03').length).toBe(4);
    await userEvent.click(screen.getByRole('button', { name: 'Accept and continue' }));
    expect(acceptConsents).toHaveBeenCalledWith({
      accept: ['terms', 'privacy', 'aup', 'ai_processing'].map((document) => ({
        document,
        version: '2026-09-03',
      })),
    });
    await waitFor(() => expect(routerMock.push).toHaveBeenCalledWith('/'));
  });

  it('calls onDone immediately when nothing is pending', async () => {
    consentStatus.mockResolvedValue({ ...pending, pending: [] });
    const onDone = vi.fn();
    renderApp(<ConsentsForm onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
