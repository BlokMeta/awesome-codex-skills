import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button } from './Button.js';
import { Sheet } from './Sheet.js';

const meta = { title: 'Core/Sheet', component: Sheet } satisfies Meta<typeof Sheet>;
export default meta;

function Demo({ side }: { side: 'end' | 'bottom' }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button label="Kapı raporunu aç" onPress={() => setOpen(true)} />
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Kapı raporu"
        description="8 katman"
        closeLabel="Kapat"
        side={side}
      >
        <p>K1 kural · K3 stil · K4 özgünlük · K8 risk</p>
      </Sheet>
    </>
  );
}
export const End: StoryObj = { render: () => <Demo side="end" /> };
export const Bottom: StoryObj = { render: () => <Demo side="bottom" /> };
