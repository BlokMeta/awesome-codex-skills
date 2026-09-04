import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderApp } from '@/test/render';
import { IdentityForm } from './identity-form';

describe('IdentityForm', () => {
  it('derives the slug, submits identity values and shows the slug-taken error', async () => {
    const onSubmit = vi.fn();
    const { rerender } = renderApp(
      <IdentityForm submitLabel="Next" busy={false} onSubmit={onSubmit} />,
    );
    await userEvent.type(screen.getByTestId('p-name'), 'Deniz Işık');
    expect(screen.getByTestId('p-slug')).toHaveValue('deniz-isik');
    await userEvent.selectOptions(screen.getByTestId('p-niche'), 'ai');
    await userEvent.click(screen.getByTestId('p-submit'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Deniz Işık',
        slug: 'deniz-isik',
        niche: 'ai',
        language: 'tr',
      }),
    );
    rerender(
      <IdentityForm
        submitLabel="Next"
        busy={false}
        onSubmit={onSubmit}
        error={{ data: { problem: { code: 'persona.slug_taken' } } }}
      />,
    );
    expect(
      screen.getByText('That URL name is already used in this workspace.'),
    ).toBeInTheDocument();
  });
});
