import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';
import ApplicationMapNavigationControls from './ApplicationMapNavigationControls';

const meta: Meta<typeof ApplicationMapNavigationControls> = {
  title: 'Components/Application Map/ApplicationMapNavigationControls',
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

export const Basic: Story = {
  args: {
    zoomIn: action('zoomIn'),
    zoomOut: action('zoomOut'),
    fitView: action('fitView'),
  },
};
