import { Meta, StoryObj } from '@storybook/react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';
import StatusPanelSSEStatus from './StatusPanelSSEStatus';

const meta: Meta<typeof StatusPanelSSEStatus> = {
  title: 'Components/Status Panel/SSE Status',
  component: StatusPanelSSEStatus,
};
export default meta;
type Story = StoryObj<typeof StatusPanelSSEStatus>;

export const Connected: Story = {
  args: { status: ConnectionStatus.Open, message: 'Connected successfully' },
};
export const Connecting: Story = {
  args: { status: ConnectionStatus.Connecting, message: 'Connecting...' },
};
export const Disconnected: Story = {
  args: { status: ConnectionStatus.Closed, message: 'Disconnected' },
};
export const Error: Story = {
  args: { status: ConnectionStatus.Error, message: 'Error occurred' },
};
export const Reconnecting: Story = {
  args: { status: ConnectionStatus.Retrying, message: 'Reconnecting...' },
};
