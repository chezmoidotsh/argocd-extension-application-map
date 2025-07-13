import React, { useState } from 'react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';

export interface StatusPanelSSEStatusProps {
  status: ConnectionStatus;
  message?: string;
}

const StatusPanelSSEStatus: React.FC<StatusPanelSSEStatusProps> = ({ status, message }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const statusConfig: Record<ConnectionStatus, { color: string; label: string }> = {
    [ConnectionStatus.OPEN]: { color: '#4caf50', label: 'Connected' },
    [ConnectionStatus.CONNECTING]: { color: '#fbc02d', label: 'Connecting…' },
    [ConnectionStatus.CLOSED]: { color: '#e53935', label: 'Disconnected' },
    [ConnectionStatus.ERROR]: { color: '#e53935', label: 'Error' },
    [ConnectionStatus.RETRYING]: { color: '#1976d2', label: 'Reconnecting…' },
  };
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
  const { icon, color, title, fontSize } = iconMap[status] || iconMap[ConnectionStatus.CLOSED];
  const { label } = statusConfig[status] || statusConfig[ConnectionStatus.CLOSED];
  return (
    <div style={{ position: 'relative', display: 'inline-block', marginRight: 8, marginTop: 5 }}>
      <span
        style={{ color, fontSize: fontSize || 18, cursor: 'pointer', padding: 2, display: 'inline-block' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        tabIndex={0}
        aria-label={label}
      >
        <i
          className={`fa ${icon} utils-sse-status-icon`}
          title={title}
          style={{ color, fontSize: fontSize || 18, marginRight: 0, verticalAlign: 'middle' }}
          aria-label={title}
        />
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
