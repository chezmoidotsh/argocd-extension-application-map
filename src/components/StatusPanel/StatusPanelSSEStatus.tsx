import React, { useState } from 'react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';
import IconStatusSSE from '../icons/IconStatusSSE';

export interface StatusPanelSSEStatusProps {
  status: ConnectionStatus;
  message?: string;
}

const StatusPanelSSEStatus: React.FC<StatusPanelSSEStatusProps> = ({ status, message }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
    [ConnectionStatus.Open]: { color: '#4caf50', label: 'Connected' },
    [ConnectionStatus.Connecting]: { color: '#fbc02d', label: 'Connecting…' },
    [ConnectionStatus.Closed]: { color: '#e53935', label: 'Disconnected' },
    [ConnectionStatus.Error]: { color: '#e53935', label: 'Error' },
    [ConnectionStatus.Retrying]: { color: '#1976d2', label: 'Reconnecting…' },
  };
  const { label } = statusConfig[status] || statusConfig[ConnectionStatus.Closed];
  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: 8, marginTop: 5 }}>
      <span
        style={{ cursor: 'pointer', padding: 2, display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        tabIndex={0}
        aria-label={label}
      >
        <IconStatusSSE status={status} />
      </span>
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 100,
            background: '#fff',
            color: '#222',
            border: '1px solid #ccc',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            padding: '10px 16px',
            minWidth: 180,
            marginTop: 8,
            fontSize: 13,
            whiteSpace: 'pre-line',
          }}
          role="tooltip"
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
          {message && <div style={{ color: '#666', fontSize: 12 }}>{message}</div>}
        </div>
      )}
    </div>
  );
};

export default React.memo(StatusPanelSSEStatus);
