import { mswLoader } from 'msw-storybook-addon/csf3';

import type { Preview, StoryFn } from '@storybook/react-webpack5';

import React from 'react';

import '../src/styles/index.scss';
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
      options: {
        light: { name: 'light', value: '#dee6eb' },
        dark: { name: 'dark', value: '#100f0f' }
      }
    },
  },

  decorators: [withColorScheme],
  loaders: [mswLoader()],

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  },

  tags: ['autodocs']
};

export default preview;
