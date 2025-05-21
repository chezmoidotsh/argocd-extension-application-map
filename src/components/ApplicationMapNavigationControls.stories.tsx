import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import React from 'react';
import ApplicationMapNavigationControls from './ApplicationMapNavigationControls';

const meta: Meta<typeof ApplicationMapNavigationControls> = {
  title: 'ApplicationMap/NavigationControls',
  component: ApplicationMapNavigationControls,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <ReactFlowProvider>
        <div style={{ padding: 24, background: '#f8f9fa', minHeight: 200 }}>
          <Story />
        </div>
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
