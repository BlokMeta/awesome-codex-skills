import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { Badge } from './Badge.js';
import { EmptyState } from './EmptyState.js';
import { Skeleton } from './Skeleton.js';

describe('Badge', () => {
  it('always shows text next to colour (docs/07 §8) and passes axe', async () => {
    const { container } = render(<Badge label="Canlı" tone="flash" dot testID="badge" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Canlı');
    expect(badge).toHaveAttribute('data-tone', 'flash');
    expect(badge.querySelector('.hg-badge__dot')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('Skeleton', () => {
  it('is hidden from assistive tech and sizes from props', () => {
    render(<Skeleton width={120} height={16} testID="sk" />);
    const sk = screen.getByTestId('sk');
    expect(sk).toHaveAttribute('aria-hidden', 'true');
    expect(sk).toHaveStyle({ width: '120px', height: '16px' });
  });

  it('circle uses its width as height', () => {
    render(<Skeleton width={32} shape="circle" testID="c" />);
    expect(screen.getByTestId('c')).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('accepts string widths', () => {
    render(<Skeleton width="50%" shape="rect" testID="r" />);
    expect(screen.getByTestId('r')).toHaveStyle({ width: '50%' });
  });
});

describe('EmptyState', () => {
  it('renders heading, description and an action button', async () => {
    const onAction = vi.fn();
    const { container } = render(
      <EmptyState
        title="Henüz persona yok"
        description="İlk personanı oluşturarak başla."
        actionLabel="Persona oluştur"
        onAction={onAction}
      />,
    );
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Henüz persona yok');
    await userEvent.click(screen.getByRole('button', { name: 'Persona oluştur' }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });

  it('renders without optional parts', () => {
    render(<EmptyState title="Boş" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText('undefined')).toBeNull();
  });
});
