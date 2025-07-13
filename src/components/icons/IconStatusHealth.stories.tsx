import { Meta, StoryObj } from '@storybook/react';

import '../../styles/index.scss';
import { HealthStatus } from '../../types/application';
import IconStatusHealth from './IconStatusHealth';

const meta: Meta<typeof IconStatusHealth> = {
  title: 'Icons/IconStatusHealth',
  component: IconStatusHealth,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(HealthStatus),
      table: {
        defaultValue: { summary: HealthStatus.Unknown },
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconStatusHealth>;

export const Healthy: Story = { args: { status: HealthStatus.Healthy } };
export const Degraded: Story = { args: { status: HealthStatus.Degraded } };
export const Progressing: Story = { args: { status: HealthStatus.Progressing } };
export const Suspended: Story = { args: { status: HealthStatus.Suspended } };
export const Missing: Story = { args: { status: HealthStatus.Missing } };
export const Unknown: Story = { args: { status: HealthStatus.Unknown } };

export const HealthyDark: Story = {
  ...Healthy,
  name: 'Healthy (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const DegradedDark: Story = {
  ...Degraded,
  name: 'Degraded (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const ProgressingDark: Story = {
  ...Progressing,
  name: 'Progressing (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const SuspendedDark: Story = {
  ...Suspended,
  name: 'Suspended (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const MissingDark: Story = {
  ...Missing,
  name: 'Missing (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const UnknownDark: Story = {
  ...Unknown,
  name: 'Unknown (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
