import React from 'react';

import { HealthStatus } from '../../types';
import IconStatusHealth from '../icons/IconStatusHealth';
import './StatusPanel.scss';

export interface StatusPanelHealthProps {
  statuses: HealthStatus[];
  onStatusClick: (status: HealthStatus) => void;
}

const StatusPanelHealth: React.FC<StatusPanelHealthProps> = ({ statuses, onStatusClick }) => {
  const register = statuses.reduce(
    (acc, status) => {
      acc[status || HealthStatus.Healthy] = (acc[status || HealthStatus.Healthy] || 0) + 1;
      return acc;
    },
    {} as Record<HealthStatus, number>
  );

  const globalStatus =
    [
      HealthStatus.Degraded,
      HealthStatus.Missing,
      HealthStatus.Progressing,
      HealthStatus.Unknown,
      HealthStatus.Healthy,
      HealthStatus.Suspended,
    ].find((status) => (register[status] || 0) > 0) || HealthStatus.Healthy;

  return (
    <div className="application-status-panel__item" data-testid="health-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{statuses.length === 1 ? 'APP HEALTH' : 'APPS HEALTH'}</label>
      </div>
      <div className="application-status-panel__item-value">
        <IconStatusHealth status={globalStatus} />
        &nbsp;{globalStatus}
      </div>
      {Object.entries(register).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div className="application-status-panel__icon" style={{ width: '25px' }}>
                <IconStatusHealth status={title as HealthStatus} />
              </div>
              <div
                onClick={() => onStatusClick(title as HealthStatus)}
                data-testid={`health-status-${title.toLocaleLowerCase()}-row`}
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

export default StatusPanelHealth;
