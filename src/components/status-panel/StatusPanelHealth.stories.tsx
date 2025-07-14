import { Meta, StoryObj } from '@storybook/react';

import { HealthStatus } from '../../types';
import StatusPanelHealth from './StatusPanelHealth';

const meta: Meta<typeof StatusPanelHealth> = {
  title: 'Components/StatusPanel/StatusPanelHealth',
  component: StatusPanelHealth,
};
export default meta;
type Story = StoryObj<typeof StatusPanelHealth>;

export const Default: Story = {
  args: {
    statuses: [HealthStatus.Healthy, HealthStatus.Degraded, HealthStatus.Healthy, HealthStatus.Missing],
    onStatusClick: () => {},
  },
};
