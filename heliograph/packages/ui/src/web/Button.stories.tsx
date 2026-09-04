import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, IconButton } from './Button.js';

const meta = {
  title: 'Core/Button',
  component: Button,
  args: { label: 'Yayınla', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const AllStates: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <Button {...args} variant="primary" />
      <Button {...args} variant="secondary" label="İkincil" />
      <Button {...args} variant="ghost" label="Hayalet" />
      <Button {...args} variant="danger" label="Sil" />
      <Button {...args} disabled label="Devre dışı" />
      <Button {...args} loading label="Yükleniyor" />
      <Button {...args} flash label="Canlı" />
    </div>
  ),
};
export const Pseudo: Story = {
  name: 'Pseudo-locale (long text)',
  args: { label: '[Ƥűƀľīşħ ŧħē ƥōşŧ ňōŵ !!!]' },
};
export const Icon: Story = {
  render: () => (
    <IconButton
      accessibilityLabel="Kapat"
      icon={
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      }
    />
  ),
};
