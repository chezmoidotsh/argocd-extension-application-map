import { Meta, StoryObj } from '@storybook/react';

import { SyncStatus } from '../../types';
import StatusPanelSync from './StatusPanelSync';

const meta: Meta<typeof StatusPanelSync> = {
  title: 'Components/Status Panel/Sync',
  component: StatusPanelSync,
};
export default meta;
type Story = StoryObj<typeof StatusPanelSync>;

export const Default: Story = {
  args: {
    statuses: {
      [SyncStatus.Synced]: 2,
      [SyncStatus.OutOfSync]: 1,
      [SyncStatus.Unknown]: 1,
    },
    onStatusClick: () => {},
  },
};
