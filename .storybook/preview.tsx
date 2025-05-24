import type { Preview, StoryFn } from '@storybook/react';

import React from 'react';

import './storybook-argo-v3.0.0.css';

const withColorScheme = (Story: StoryFn, { parameters }: any) => {
  const colorScheme = parameters.backgrounds.default || 'light';

  return (
    // theme-(light|dark) and application-details are required to configure properly all components with the official
    // ArgoCD styles
    <div className={`theme-${colorScheme}`} style={{ display: 'inherit' }}>
      <div className={'application-details'}>
        <Story />
      </div>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#dee6eb' },
        { name: 'dark', value: '#100f0f' },
      ],
    },
  },
  decorators: [withColorScheme],
};

export default preview;
