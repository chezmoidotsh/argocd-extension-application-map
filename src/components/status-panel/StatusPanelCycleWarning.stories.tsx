import { Meta, StoryObj } from '@storybook/react';

import StatusPanelCycleWarning from './StatusPanelCycleWarning';

const meta: Meta<typeof StatusPanelCycleWarning> = {
  title: 'Components/StatusPanel/StatusPanelCycleWarning',
  component: StatusPanelCycleWarning,
};
export default meta;
type Story = StoryObj<typeof StatusPanelCycleWarning>;

export const Default: Story = {
  args: {},
};
