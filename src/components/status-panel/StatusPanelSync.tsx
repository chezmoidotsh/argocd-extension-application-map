import React from 'react';

import { SyncStatus } from '../../types';
import IconStatusSync from '../icons/IconStatusSync';
import './StatusPanel.scss';

export interface StatusPanelSyncProps {
  statuses: Record<SyncStatus, number>;
  onStatusClick: (status: SyncStatus) => void;
}

const StatusPanelSync: React.FC<StatusPanelSyncProps> = ({ statuses, onStatusClick }) => {
  const globalStatus =
    [SyncStatus.OutOfSync, SyncStatus.Unknown, SyncStatus.Synced].find((status) => (statuses[status] || 0) > 0) ||
    SyncStatus.Synced;

  return (
    <div className="application-status-panel__item" data-testid="sync-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{Object.values(statuses).reduce((a, b) => a + b, 0) === 1 ? 'APP SYNC' : 'APPS SYNC'}</label>
      </div>
      <div className="application-status-panel__item-value">
        <IconStatusSync status={globalStatus} />
        &nbsp;{globalStatus}
      </div>
      {Object.entries(statuses).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div className="application-status-panel__icon" style={{ width: '25px' }}>
                <IconStatusSync status={title as SyncStatus} />
              </div>
              <div
                onClick={() => onStatusClick(title as SyncStatus)}
                data-testid={`sync-status-${title.toLocaleLowerCase()}-row`}
                style={{ cursor: 'pointer' }}
              >
                {count} {count === 1 ? 'application' : 'applications'} {title.toLocaleLowerCase()}
              </div>
            </div>
          )
      )}
    </div>
  );
};

export default StatusPanelSync;
