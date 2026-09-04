import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const signUp = vi.fn();
vi.mock('@/lib/auth-client', () => ({
  authClient: { signUp: { email: (...a: unknown[]) => signUp(...a) } },
}));

import { SignUpForm } from './sign-up-form';

describe('SignUpForm', () => {
  beforeEach(() => {
    signUp.mockReset();
    routerMock.push.mockReset();
  });

  it('creates the account with locale and timezone, then goes to consents', async () => {
    signUp.mockResolvedValue({ data: { user: {} }, error: null });
    renderApp(<SignUpForm />);
    await userEvent.type(screen.getByLabelText(/^Name/), 'Ayşe');
    await userEvent.type(screen.getByLabelText(/^Email/), 'ayse@example.com');
    await userEvent.type(screen.getByLabelText(/^Password/), 'correct horse battery staple');
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ayşe',
        email: 'ayse@example.com',
        locale: expect.any(String),
      }),
    );
    expect(routerMock.push).toHaveBeenCalledWith('/consents');
  });

  it('shows the duplicate-email and generic errors', async () => {
    signUp.mockResolvedValueOnce({ data: null, error: { code: 'USER_ALREADY_EXISTS' } });
    renderApp(<SignUpForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText('An account with this email already exists.'),
    ).toBeInTheDocument();
    signUp.mockResolvedValueOnce({ data: null, error: { code: 'OTHER' } });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });
});
