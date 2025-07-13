import { Meta, StoryObj } from '@storybook/react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';
import StatusPanelSSEStatus from './StatusPanelSSEStatus';

const meta: Meta<typeof StatusPanelSSEStatus> = {
  title: 'Components/StatusPanel/StatusPanelSSEStatus',
  component: StatusPanelSSEStatus,
};
export default meta;
type Story = StoryObj<typeof StatusPanelSSEStatus>;

export const Connected: Story = {
  args: { status: ConnectionStatus.OPEN, message: 'Connected successfully' },
};
export const Connecting: Story = {
  args: { status: ConnectionStatus.CONNECTING, message: 'Connecting...' },
};
export const Disconnected: Story = {
  args: { status: ConnectionStatus.CLOSED, message: 'Disconnected' },
};
export const Error: Story = {
  args: { status: ConnectionStatus.ERROR, message: 'Error occurred' },
};
export const Reconnecting: Story = {
  args: { status: ConnectionStatus.RETRYING, message: 'Reconnecting...' },
};
