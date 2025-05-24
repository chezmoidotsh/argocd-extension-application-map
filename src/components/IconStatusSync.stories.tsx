import { Meta, StoryObj } from '@storybook/react';

import '../styles/index.scss';
import { SyncStatus } from '../types/application';
import IconStatusSync from './IconStatusSync';

const meta: Meta<typeof IconStatusSync> = {
  title: 'Icons/IconStatusSync',
  component: IconStatusSync,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(SyncStatus),
      table: {
        defaultValue: { summary: SyncStatus.Unknown },
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof IconStatusSync>;

export const Synced: Story = { args: { status: SyncStatus.Synced } };
export const OutOfSync: Story = { args: { status: SyncStatus.OutOfSync } };
export const Unknown: Story = { args: { status: SyncStatus.Unknown } };

export const SyncedDark: Story = { ...Synced, name: 'Synced (dark)', parameters: { backgrounds: { default: 'dark' } } };
export const OutOfSyncDark: Story = {
  ...OutOfSync,
  name: 'OutOfSync (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const UnknownDark: Story = {
  ...Unknown,
  name: 'Unknown (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
