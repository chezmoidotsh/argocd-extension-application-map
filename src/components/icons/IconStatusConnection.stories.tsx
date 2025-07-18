import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import '../../styles/index.scss';
import { ConnectionStatus } from '../../types';
import IconStatusConnection from './IconStatusConnection';

const meta: Meta<typeof IconStatusConnection> = {
  title: 'Icons/SSE Status',
  component: IconStatusConnection,
  tags: ['autodocs'],
  argTypes: {
    status: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof IconStatusConnection>;

const rowStyle = { display: 'flex', gap: 16, alignItems: 'center', padding: 16 };

export const AllLight: Story = {
  render: () => (
    <div style={rowStyle}>
      {Object.values(ConnectionStatus).map((status) => (
        <div key={status} style={{ textAlign: 'center' }}>
          <IconStatusConnection status={status} />
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
