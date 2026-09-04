import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { SelectField } from './SelectField.js';
import { TagInput } from './TagInput.js';

const meta = { title: 'Core/Select & Tags' } satisfies Meta;
export default meta;

function Demo() {
  const [niche, setNiche] = useState('devops');
  const [tags, setTags] = useState(['kuru', 'somut']);
  return (
    <div style={{ display: 'grid', gap: 16, width: 360 }}>
      <SelectField
        label="Alan"
        value={niche}
        onChange={setNiche}
        options={[
          { value: 'devops', label: 'DevOps' },
          { value: 'ai', label: 'Yapay zekâ' },
          { value: 'both', label: 'DevOps + yapay zekâ' },
        ]}
      />
      <TagInput
        label="Ton sözcükleri"
        hint="Enter ile ekle"
        values={tags}
        onChange={setTags}
        removeLabel={(v) => `${v} kaldır`}
        max={8}
      />
    </div>
  );
}
export const Default: StoryObj = { render: () => <Demo /> };
