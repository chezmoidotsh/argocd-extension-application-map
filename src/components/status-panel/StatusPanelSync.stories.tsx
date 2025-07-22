import { Meta, StoryObj } from '@storybook/react';

import { SourceDriftStatus, SyncStatus } from '../../types';
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
      [SourceDriftStatus.Conform]: 1,
      [SourceDriftStatus.Drift]: 2,
      [SyncStatus.Synced]: 2,
      [SyncStatus.OutOfSync]: 1,
      [SyncStatus.Unknown]: 1,
    },
    onStatusClick: () => {},
  },
};
