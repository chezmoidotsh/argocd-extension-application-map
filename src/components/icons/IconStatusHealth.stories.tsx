import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import '../../styles/index.scss';
import { HealthStatus } from '../../types/application';
import IconStatusHealth from './IconStatusHealth';

const meta: Meta<typeof IconStatusHealth> = {
  title: 'Icons/Health Status',
  component: IconStatusHealth,
  tags: ['autodocs'],
  argTypes: {
    status: { table: { disable: true } },
  },
};
export default meta;
type Story = StoryObj<typeof IconStatusHealth>;

const rowStyle = { display: 'flex', gap: 16, alignItems: 'center', padding: 16 };

export const AllLight: Story = {
  render: () => (
    <div style={rowStyle}>
      {Object.values(HealthStatus).map((status) => (
        <div key={status} style={{ textAlign: 'center' }}>
          <IconStatusHealth status={status} />
          <div style={{ fontSize: 12 }}>{status}</div>
        </div>
      ))}
    </div>
  ),
  name: 'All icons (light)',
};

export const AllDark: Story = {
  ...AllLight,
  name: 'All icons (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
