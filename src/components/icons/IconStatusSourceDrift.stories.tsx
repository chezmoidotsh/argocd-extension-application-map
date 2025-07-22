import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import '../../styles/index.scss';
import { SourceDriftStatus } from '../../types/application';
import IconStatusSourceDrift from './IconStatusSourceDrift';

const meta: Meta<typeof IconStatusSourceDrift> = {
  title: 'Icons/Source Drift Status',
  component: IconStatusSourceDrift,
  tags: ['autodocs'],
  argTypes: {
    status: { table: { disable: true } },
  },
};
export default meta;
type Story = StoryObj<typeof IconStatusSourceDrift>;

const rowStyle = { display: 'flex', gap: 16, alignItems: 'center', padding: 16 };

export const AllLight: Story = {
  render: () => (
    <div style={rowStyle}>
      {Object.values(SourceDriftStatus).map((status) => (
        <div key={status} style={{ textAlign: 'center' }}>
          <div style={{ minHeight: 16, minWidth: 16 }}>
            <IconStatusSourceDrift status={status} />
          </div>
          <div style={{ fontSize: 12 }}>
            {status}
            {status === SourceDriftStatus.Conform && ' (no icon)'}
          </div>
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
