import { Meta, StoryObj } from '@storybook/react';

import StatusPanelCycleWarning from './StatusPanelCycleWarning';

const meta: Meta<typeof StatusPanelCycleWarning> = {
  title: 'Components/Status Panel/Cycle Warning',
  component: StatusPanelCycleWarning,
};
export default meta;
type Story = StoryObj<typeof StatusPanelCycleWarning>;

export const Default: Story = {
  args: {},
};
