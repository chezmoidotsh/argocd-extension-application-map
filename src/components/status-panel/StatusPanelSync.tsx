import React from 'react';

import { SourceDriftStatus, SyncStatus } from '../../types';
import IconStatusSourceDrift from '../icons/IconStatusSourceDrift';
import IconStatusSync from '../icons/IconStatusSync';
import './StatusPanel.scss';

export interface StatusPanelSyncProps {
  statuses: Record<SyncStatus | SourceDriftStatus, number>;
  onStatusClick: (status: SyncStatus | SourceDriftStatus) => void;
}

const StatusPanelSync: React.FC<StatusPanelSyncProps> = ({ statuses, onStatusClick }) => {
  const globalStatus =
    [SyncStatus.OutOfSync, SyncStatus.Unknown, SourceDriftStatus.Drift, SyncStatus.Synced].find(
      (status) => (statuses[status] || 0) > 0
    ) || SyncStatus.Synced;

  return (
    <div className="application-status-panel__item" data-testid="sync-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{Object.values(statuses).reduce((a, b) => a + b, 0) === 1 ? 'APP SYNC' : 'APPS SYNC'}</label>
      </div>
      <div className="application-status-panel__item-value">
        {globalStatus === SourceDriftStatus.Drift ? (
          <IconStatusSourceDrift status={SourceDriftStatus.Drift} />
        ) : (
          <IconStatusSync status={globalStatus as SyncStatus} />
        )}
        &nbsp;{globalStatus}
      </div>
      {Object.entries(statuses)
        .filter(([a]) => a !== SourceDriftStatus.Conform) // Exclude Conform status from the list
        .map(
          ([title, count]) =>
            count > 0 &&
            (title === SourceDriftStatus.Drift ? (
              <div key={title} className="application-status-panel__item__row">
                <div className="application-status-panel__icon" style={{ width: '25px' }}>
                  <IconStatusSourceDrift status={title as SourceDriftStatus} />
                </div>
                <div
                  onClick={() => onStatusClick(title as SourceDriftStatus)}
                  data-testid={`sync-status-${title.toLocaleLowerCase()}-row`}
                  style={{ cursor: 'pointer' }}
                >
                  {count}{' '}
                  {count === 1
                    ? 'application has its source drifted from its reference'
                    : 'applications have their source drifted from their reference'}
                </div>
              </div>
            ) : (
              <div key={title} className="application-status-panel__item__row">
                <div className="application-status-panel__icon" style={{ width: '25px' }}>
                  <IconStatusSync status={title as SyncStatus} />
                </div>
                <div
                  onClick={() => onStatusClick(title as SyncStatus)}
                  data-testid={`sync-status-${title.toLocaleLowerCase()}-row`}
                  style={{ cursor: 'pointer' }}
                >
                  {count} {count === 1 ? 'application' : 'applications'}{' '}
                  {title.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}
                </div>
              </div>
            ))
        )}
    </div>
  );
};

export default StatusPanelSync;
