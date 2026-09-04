import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge.js';
import { EmptyState } from './EmptyState.js';
import { Skeleton } from './Skeleton.js';

const meta = { title: 'Core/Feedback' } satisfies Meta;
export default meta;

export const Badges: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <Badge label="Taslak" />
      <Badge label="Planlandı" tone="tide" dot />
      <Badge label="Canlı" tone="flash" dot />
      <Badge label="Yayında" tone="good" dot />
      <Badge label="Kota" tone="warn" dot />
      <Badge label="Başarısız" tone="critical" dot />
    </div>
  ),
};

export const Skeletons: StoryObj = {
  render: () => (
    <div style={{ display: 'grid', gap: 8, width: 240 }}>
      <Skeleton width="60%" />
      <Skeleton />
      <Skeleton shape="rect" />
      <Skeleton shape="circle" width={40} />
    </div>
  ),
};

export const Empty: StoryObj = {
  render: () => (
    <EmptyState
      title="Henüz persona yok"
      description="İlk personanı oluşturarak trend yakalamayı başlat."
      actionLabel="Persona oluştur"
    />
  ),
};
