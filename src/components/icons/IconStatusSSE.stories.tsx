import { Meta, StoryObj } from '@storybook/react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';
import '../../styles/index.scss';
import IconStatusSSE from './IconStatusSSE';

const meta: Meta<typeof IconStatusSSE> = {
  title: 'Icons/Status SSE',
  component: IconStatusSSE,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: Object.values(ConnectionStatus),
      table: {
        defaultValue: { summary: ConnectionStatus.Open },
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconStatusSSE>;

export const Closed: Story = { args: { status: ConnectionStatus.Closed } };
export const Connected: Story = { args: { status: ConnectionStatus.Open } };
export const Connecting: Story = { args: { status: ConnectionStatus.Connecting } };
export const Disconnected: Story = { args: { status: ConnectionStatus.Closed } };
export const Error: Story = { args: { status: ConnectionStatus.Error } };
export const Reconnecting: Story = { args: { status: ConnectionStatus.Retrying } };

export const ClosedDark: Story = {
  ...Closed,
  name: 'Closed (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const ConnectedDark: Story = {
  ...Connected,
  name: 'Connected (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const ConnectingDark: Story = {
  ...Connecting,
  name: 'Connecting (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const DisconnectedDark: Story = {
  ...Disconnected,
  name: 'Disconnected (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const ErrorDark: Story = {
  ...Error,
  name: 'Error (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
export const ReconnectingDark: Story = {
  ...Reconnecting,
  name: 'Reconnecting (dark)',
  parameters: { backgrounds: { default: 'dark' } },
};
