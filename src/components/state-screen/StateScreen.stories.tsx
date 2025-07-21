import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import StateScreen from './StateScreen';

const meta: Meta<typeof StateScreen> = {
  title: 'Components/State Screen',
  component: StateScreen,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    children: { control: false },
  },
};
export default meta;
type Story = StoryObj<typeof StateScreen>;

export const Default: Story = {
  args: {
    icon: 'argo-icon-application',
    title: 'No applications available',
    subtitle: 'Create new application to start',
  },
};

export const DefaultDark: Story = {
  ...Default,
  name: 'Default (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};

export const WithAdditionalContent: Story = {
  args: {
    icon: 'fa-solid fa-xmark',
    title: 'Failed to load',
    subtitle: 'Please try refreshing',
    children: (
      <pre
        style={{
          color: '#ff6b6b',
          background: '#fff0f0',
          padding: '0.5em',
          borderRadius: 4,
        }}
      >
        Error: Failed to load
      </pre>
    ),
  },
};

export const WithAdditionalContentDark: Story = {
  ...WithAdditionalContent,
  name: 'With Additional Content (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
