import type { Preview } from '@storybook/react';
import './storybook-argo-v3.0.0.css';

// Force la classe 'theme-light' sur le body pour toutes les stories
if (typeof window !== 'undefined') {
  document.body.classList.add('theme-light');
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'ArgoBG',
      values: [{ name: 'ArgoBG', value: '#e3eaef' }],
    },
  },
};

export default preview;
