import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Badge } from './Badge.js';
import { List } from './List.js';

const meta = { title: 'Core/List' } satisfies Meta;
export default meta;

const page = (n: number) =>
  Array.from({ length: 25 }, (_, i) => ({ id: `p${n}-${i}`, label: `Gönderi ${n * 25 + i}` }));

function Demo() {
  const [pages, setPages] = useState([page(0)]);
  const [loading, setLoading] = useState(false);
  const items = pages.flat();
  return (
    <List
      items={items}
      keyOf={(i) => i.id}
      renderItem={(i) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12 }}>
          <span>{i.label}</span>
          <Badge label="Planlandı" tone="tide" dot />
        </div>
      )}
      ariaLabel="Gönderiler"
      hasMore={pages.length < 4}
      loading={loading}
      onLoadMore={() => {
        setLoading(true);
        setTimeout(() => {
          setPages((p) => [...p, page(p.length)]);
          setLoading(false);
        }, 600);
      }}
      loadMoreLabel="Daha fazla"
      emptyTitle="Henüz gönderi yok"
      height={360}
    />
  );
}
export const CursorPaginated: StoryObj = { render: () => <Demo /> };
