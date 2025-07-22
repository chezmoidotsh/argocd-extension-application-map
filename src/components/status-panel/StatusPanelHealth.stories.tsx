import { Meta, StoryObj } from '@storybook/react';

import { HealthStatus } from '../../types';
import StatusPanelHealth from './StatusPanelHealth';

const meta: Meta<typeof StatusPanelHealth> = {
  title: 'Components/Status Panel/Health',
  component: StatusPanelHealth,
};
export default meta;
type Story = StoryObj<typeof StatusPanelHealth>;

export const Default: Story = {
  args: {
    statuses: {
      [HealthStatus.Degraded]: 1,
      [HealthStatus.Healthy]: 2,
      [HealthStatus.Missing]: 1,
      [HealthStatus.Progressing]: 0,
      [HealthStatus.Suspended]: 0,
      [HealthStatus.Unknown]: 0,
    },
    onStatusClick: () => {},
  },
};
