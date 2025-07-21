import { Meta, StoryObj } from '@storybook/react';

import React from 'react';

import { ConnectionStatus } from '../../types';
import StatusPanelConnectionStatus from './StatusPanelConnectionStatus';

const meta: Meta<typeof StatusPanelConnectionStatus> = {
  title: 'Components/Status Panel/SSE Connection Status',
  component: StatusPanelConnectionStatus,
};
export default meta;
type Story = StoryObj<typeof StatusPanelConnectionStatus>;

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StatusPanelConnectionStatus
        status={{ status: ConnectionStatus.Connected, since: new Date(Date.now() - 6000000) }}
      />
      <StatusPanelConnectionStatus status={{ status: ConnectionStatus.Connecting }} />
      <StatusPanelConnectionStatus
        status={{ status: ConnectionStatus.Closed, since: new Date(Date.now() - 5 * 60 * 1000 - 15 * 1000) }}
      />
      <StatusPanelConnectionStatus status={{ status: ConnectionStatus.Error }} />
      <StatusPanelConnectionStatus status={{ status: ConnectionStatus.Retrying }} />
      <StatusPanelConnectionStatus status={{ status: ConnectionStatus.Unknown }} />
    </div>
  ),
};

export const Connected: Story = {
  args: {
    status: {
      status: ConnectionStatus.Connected,
      since: new Date(Date.now()),
    },
  },
};
export const Connecting: Story = {
  args: {
    status: {
      status: ConnectionStatus.Connecting,
    },
  },
};
export const Disconnected: Story = {
  args: {
    status: {
      status: ConnectionStatus.Closed,
      since: new Date(Date.now()),
    },
  },
};
export const Error: Story = {
  args: {
    status: {
      status: ConnectionStatus.Error,
    },
  },
};
export const Reconnecting: Story = {
  args: {
    status: {
      status: ConnectionStatus.Retrying,
    },
  },
};
export const Unknown: Story = {
  args: {
    status: {
      status: ConnectionStatus.Unknown,
    },
  },
};
