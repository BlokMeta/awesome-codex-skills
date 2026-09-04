import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { List } from './List.js';

const items = Array.from({ length: 200 }, (_, i) => ({ id: `id-${i}`, label: `Satır ${i}` }));

describe('List', () => {
  it('virtualizes rows (renders only the viewport) and offers a load-more button', async () => {
    const onLoadMore = vi.fn();
    const { container } = render(
      <List
        items={items}
        keyOf={(i) => i.id}
        renderItem={(i) => <span>{i.label}</span>}
        ariaLabel="Gönderiler"
        hasMore
        onLoadMore={onLoadMore}
        loadMoreLabel="Daha fazla"
        emptyTitle="Boş"
        estimateSize={40}
        height={200}
      />,
    );
    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(3);
    expect(rows.length).toBeLessThan(items.length);
    expect(screen.getByRole('list', { name: 'Gönderiler' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Daha fazla' }));
    expect(onLoadMore).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('shows the empty state when there are no items', () => {
    render(
      <List
        items={[]}
        keyOf={(i: { id: string }) => i.id}
        renderItem={() => null}
        ariaLabel="Boş liste"
        hasMore={false}
        onLoadMore={() => undefined}
        loadMoreLabel="Daha"
        emptyTitle="Henüz gönderi yok"
        emptyDescription="İlk yayın planlanınca burada görünür."
      />,
    );
    expect(screen.getByRole('heading', { name: 'Henüz gönderi yok' })).toBeInTheDocument();
  });

  it('marks the list busy while loading and hides the tail when exhausted', () => {
    const { rerender } = render(
      <List
        items={items.slice(0, 3)}
        keyOf={(i) => i.id}
        renderItem={(i) => i.label}
        ariaLabel="L"
        hasMore
        loading
        onLoadMore={() => undefined}
        loadMoreLabel="Daha"
        emptyTitle="Boş"
      />,
    );
    expect(screen.getByRole('list')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Daha' })).toHaveAttribute('aria-busy', 'true');
    rerender(
      <List
        items={items.slice(0, 3)}
        keyOf={(i) => i.id}
        renderItem={(i) => i.label}
        ariaLabel="L"
        hasMore={false}
        onLoadMore={() => undefined}
        loadMoreLabel="Daha"
        emptyTitle="Boş"
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
