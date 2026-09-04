import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { personaFixture } from '@/test/persona-fixture';
import { renderApp } from '@/test/render';
import { routerMock } from '@/test/setup';

const list = vi.fn();
vi.mock('@/lib/api', () => ({ api: { persona: { list: (...a: unknown[]) => list(...a) } } }));

import { PersonasList } from './personas-list';

describe('PersonasList', () => {
  beforeEach(() => {
    list.mockReset();
    routerMock.push.mockReset();
  });

  it('shows the empty state and routes to the wizard', async () => {
    list.mockResolvedValue({
      data: [],
      page: { nextCursor: null, prevCursor: null, limit: 25, hasMore: false },
      meta: { requestId: 'r' },
    });
    renderApp(<PersonasList />);
    await userEvent.click(await screen.findByRole('button', { name: 'New persona' }));
    expect(routerMock.push).toHaveBeenCalledWith('/personas/new');
    expect(screen.getByTestId('personas-empty')).toBeInTheDocument();
  });

  it('renders rows with status badges and requests the next page with the cursor', async () => {
    list
      .mockResolvedValueOnce({
        data: [
          personaFixture(),
          personaFixture({ id: 'p2', name: 'İkinci', slug: 'ikinci', status: 'active' }),
        ],
        page: { nextCursor: 'c1', prevCursor: null, limit: 25, hasMore: true },
        meta: { requestId: 'r' },
      })
      .mockResolvedValueOnce({
        data: [personaFixture({ id: 'p3', name: 'Üçüncü', slug: 'ucuncu' })],
        page: { nextCursor: null, prevCursor: null, limit: 25, hasMore: false },
        meta: { requestId: 'r' },
      });
    renderApp(<PersonasList />);
    expect(await screen.findByText('Deniz Işık')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(list).toHaveBeenLastCalledWith({ limit: 25, cursor: 'c1' });
    expect(await screen.findByText('Üçüncü')).toBeInTheDocument();
  });
});
