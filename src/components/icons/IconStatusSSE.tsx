import React from 'react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';

/**
 * Mapping of connection statuses to their corresponding icons, colors, and titles.
 */
const iconMappings: {
  [K in ConnectionStatus]: {
    readonly icon: string;
    readonly color: string;
    readonly title: string;
    readonly fontSize: number;
  };
} = {
  [ConnectionStatus.Open]: {
    icon: 'fa-circle',
    color: '#4caf50',
    title: 'Connected',
    fontSize: 12,
  },
  [ConnectionStatus.Connecting]: {
    icon: 'fa-spinner fa-spin',
    color: '#fbc02d',
    title: 'Connecting…',
    fontSize: 18,
  },
  [ConnectionStatus.Closed]: {
    icon: 'fa-circle',
    color: '#e53935',
    title: 'Disconnected',
    fontSize: 12,
  },
  [ConnectionStatus.Error]: {
    icon: 'fa-exclamation-circle',
    color: '#e53935',
    title: 'Error',
    fontSize: 18,
  },
  [ConnectionStatus.Retrying]: {
    icon: 'fa-rotate-right fa-spin',
    color: '#1976d2',
    title: 'Reconnecting…',
    fontSize: 18,
  },
} as const;

/**
 * The **IconStatusSSE** displays a **visual indicator** of the SSE connection status.
 */
const IconStatusSSE: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const { icon, color, title, fontSize } = iconMappings[status] || iconMappings[ConnectionStatus.Closed];
  return (
    <i
      className={`fa ${icon} utils-sse-status-icon`}
      title={title}
      style={{ color, fontSize, marginRight: 0, verticalAlign: 'middle' }}
      aria-label={title}
    />
  );
};

export default IconStatusSSE;
