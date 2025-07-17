import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import '../../styles/index.scss';
import { SyncStatus } from '../../types/application';
import IconStatusSync from './IconStatusSync';

const meta: Meta<typeof IconStatusSync> = {
  title: 'Icons/Sync Status',
  component: IconStatusSync,
  tags: ['autodocs'],
  argTypes: {
    status: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof IconStatusSync>;

const rowStyle = { display: 'flex', gap: 16, alignItems: 'center', padding: 16 };

export const AllLight: Story = {
  render: () => (
    <div style={rowStyle}>
      {Object.values(SyncStatus).map((status) => (
        <div key={status} style={{ textAlign: 'center' }}>
          <IconStatusSync status={status} />
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
