import React from 'react';

import { SyncStatus } from '../../types';
import IconStatusSync from '../icons/IconStatusSync';
import './StatusPanel.scss';

export interface StatusPanelSyncProps {
  statuses: SyncStatus[];
  onStatusClick: (status: SyncStatus) => void;
}

const StatusPanelSync: React.FC<StatusPanelSyncProps> = ({ statuses, onStatusClick }) => {
  const register = statuses.reduce(
    (acc, status) => {
      acc[status || SyncStatus.Unknown] = (acc[status || SyncStatus.Unknown] || 0) + 1;
      return acc;
    },
    {} as Record<SyncStatus, number>
  );

  const globalStatus =
    [SyncStatus.OutOfSync, SyncStatus.Unknown, SyncStatus.Synced].find((status) => (register[status] || 0) > 0) ||
    SyncStatus.Synced;

  return (
    <div className="application-status-panel__item" data-testid="sync-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{statuses.length === 1 ? 'APP SYNC' : 'APPS SYNC'}</label>
      </div>
      <div className="application-status-panel__item-value">
        <IconStatusSync status={globalStatus} />
        &nbsp;{globalStatus}
      </div>
      {Object.entries(register).map(
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
