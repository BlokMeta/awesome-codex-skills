import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Switch } from './Switch.js';
import { TextInput } from './TextInput.js';

const meta = { title: 'Core/Form' } satisfies Meta;
export default meta;

function InputDemo({ error, multiline }: { error?: string; multiline?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <div style={{ width: 320 }}>
      <TextInput
        label="E-posta"
        hint="İş e-postanı kullan"
        kind="email"
        value={value}
        onChangeText={setValue}
        required
        error={error}
        multiline={multiline}
      />
    </div>
  );
}

export const Input: StoryObj = { render: () => <InputDemo /> };
export const InputError: StoryObj = { render: () => <InputDemo error="Geçersiz adres" /> };
export const Textarea: StoryObj = { render: () => <InputDemo multiline /> };

function SwitchDemo() {
  const [on, setOn] = useState(false);
  return (
    <Switch
      label="Otomatik yayın"
      description="Kapı geçen içerik onaysız yayınlanır"
      checked={on}
      onChange={setOn}
    />
  );
}
export const SwitchStory: StoryObj = { name: 'Switch', render: () => <SwitchDemo /> };
