import React from 'react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';

// FontAwesome icon mapping for each status
const iconMap: Record<ConnectionStatus, { icon: string; color: string; title: string; fontSize?: number }> = {
  [ConnectionStatus.OPEN]: { icon: 'fa-circle', color: '#4caf50', title: 'Connected', fontSize: 12 },
  [ConnectionStatus.CONNECTING]: { icon: 'fa-spinner fa-spin', color: '#fbc02d', title: 'Connecting…', fontSize: 18 },
  [ConnectionStatus.CLOSED]: { icon: 'fa-circle', color: '#e53935', title: 'Disconnected', fontSize: 12 },
  [ConnectionStatus.ERROR]: { icon: 'fa-exclamation-circle', color: '#e53935', title: 'Error', fontSize: 18 },
  [ConnectionStatus.RETRYING]: {
    icon: 'fa-rotate-right fa-spin',
    color: '#1976d2',
    title: 'Reconnecting…',
    fontSize: 18,
  },
};

const IconStatusSSE: React.FC<{ status: ConnectionStatus }> = ({ status }) => {
  const { icon, color, title, fontSize } = iconMap[status] || iconMap[ConnectionStatus.CLOSED];
  return (
    <i
      className={`fa ${icon} utils-sse-status-icon`}
      title={title}
      style={{ color, fontSize: fontSize || 18, marginRight: 0, verticalAlign: 'middle' }}
      aria-label={title}
    />
  );
};

export default IconStatusSSE;
