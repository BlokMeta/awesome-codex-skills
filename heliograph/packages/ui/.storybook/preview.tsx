import '@heliograph/tokens/css';
import '../src/web/styles.css';
import type { Preview } from '@storybook/react-vite';

/**
 * Every story renders in light and dark, LTR and RTL (docs/07 §6). The pseudo-locale story text
 * is passed by the stories themselves; the toolbar switches direction and theme.
 */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Colour scheme',
      toolbar: { icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    direction: {
      description: 'Writing direction',
      toolbar: { icon: 'transfer', items: ['ltr', 'rtl'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light', direction: 'ltr' },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.dataset['theme'] = String(globals['theme'] ?? 'light');
      document.documentElement.dir = String(globals['direction'] ?? 'ltr');
      return (
        <div style={{ padding: 24, background: 'var(--hg-ground)', color: 'var(--hg-ink)' }}>
          <Story />
        </div>
      );
    },
  ],
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
};

export default preview;
