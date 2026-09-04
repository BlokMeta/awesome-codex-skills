import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routerMock } from '@/test/setup';
import { renderApp } from '@/test/render';

const signIn = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  authClient: { signIn: { email: (...a: unknown[]) => signIn(...a) } },
}));

import { SignInForm } from './sign-in-form';

describe('SignInForm', () => {
  beforeEach(() => {
    signIn.mockReset();
    routerMock.push.mockReset();
  });

  it('submits credentials, then navigates home', async () => {
    signIn.mockResolvedValue({ data: { user: {} }, error: null });
    const { container } = renderApp(<SignInForm />);
    await userEvent.type(screen.getByLabelText(/^Email/), 'ayse@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(signIn).toHaveBeenCalledWith({ email: 'ayse@example.com', password: 'correct horse battery staple' });
    expect(routerMock.push).toHaveBeenCalledWith('/');
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the translated error on 401 and routes to two-factor when required', async () => {
    signIn.mockResolvedValueOnce({ data: null, error: { status: 401 } });
    renderApp(<SignInForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Email or password is wrong.')).toBeInTheDocument();
    signIn.mockResolvedValueOnce({ data: { twoFactorRedirect: true }, error: null });
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(routerMock.push).toHaveBeenLastCalledWith('/two-factor');
  });

  it('renders Turkish when the locale is tr', () => {
    renderApp(<SignInForm />, 'tr');
    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^E-posta/)).toBeInTheDocument();
  });
});
