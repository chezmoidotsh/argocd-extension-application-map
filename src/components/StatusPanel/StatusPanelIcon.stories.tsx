import { Meta, StoryObj } from '@storybook/react';

import StatusPanelIcon from './StatusPanelIcon';

const meta: Meta<typeof StatusPanelIcon> = {
  title: 'Components/StatusPanel/StatusPanelIcon',
  component: StatusPanelIcon,
};
export default meta;
type Story = StoryObj<typeof StatusPanelIcon>;

export const Default: Story = {
  args: {
    icon: <i className="fa fa-check" />,
    color: 'green',
    fontSize: 16,
    title: 'Check',
  },
};
