import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const verifyTotp = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  authClient: { twoFactor: { verifyTotp: (...a: unknown[]) => verifyTotp(...a) } },
}));

import { TwoFactorForm } from './two-factor-form';

describe('TwoFactorForm', () => {
  beforeEach(() => {
    verifyTotp.mockReset();
    routerMock.push.mockReset();
  });

  it('verifies the code with a trusted device and goes home', async () => {
    verifyTotp.mockResolvedValue({ data: {}, error: null });
    renderApp(<TwoFactorForm />);
    await userEvent.type(screen.getByLabelText(/^Code/), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(verifyTotp).toHaveBeenCalledWith({ code: '123456', trustDevice: true });
    expect(routerMock.push).toHaveBeenCalledWith('/');
  });

  it('shows the invalid-code error', async () => {
    verifyTotp.mockResolvedValue({ data: null, error: { status: 401 } });
    renderApp(<TwoFactorForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
    expect(await screen.findByText('That code is not valid.')).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
  });
});
