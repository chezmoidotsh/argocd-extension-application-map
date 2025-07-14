import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import '../../../styles/index.scss';
import ApplicationMapNavigationControls from './ApplicationMapNavigationControls';

const meta: Meta<typeof ApplicationMapNavigationControls> = {
  title: 'Components/Application Map/Navigation Controls',
  component: ApplicationMapNavigationControls,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <ReactFlowProvider>
        <Story />
      </ReactFlowProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ApplicationMapNavigationControls>;

export const Default: Story = {
  args: {
    zoomIn: action('zoomIn'),
    zoomOut: action('zoomOut'),
    fitView: action('fitView'),
  },
};

export const DefaultDark: Story = {
  ...Default,
  name: 'Default (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
