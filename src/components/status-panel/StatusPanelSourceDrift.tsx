import React from 'react';

import { SourceDriftStatus } from '../../types';
import { IconStatusSourceDrift } from '../icons';
import './StatusPanel.scss';

interface StatusPanelSourceDriftProps {
  countPerStatus: Record<SourceDriftStatus, number>;
  onStatusClick: (status: SourceDriftStatus) => void;
}

const StatusPanelSourceDrift: React.FC<StatusPanelSourceDriftProps> = ({ countPerStatus, onStatusClick }) => {
  const count = countPerStatus[SourceDriftStatus.Drift] || 0;

  if (count === 0) {
    return null; // Do not render if there are no drifted applications
  }

  return (
    <div
      className="application-status-panel__item"
      data-testid="source-drift-status-panel"
      style={{ marginTop: '5px' }}
    >
      <div className="argocd-application-map__status-panel__title">
        <label>DRIFTED APPS</label>
      </div>
      <div className="application-status-panel__item-value">
        <IconStatusSourceDrift status={SourceDriftStatus.Drift} />
        &nbsp;Source drift detected
      </div>
      <div key="Drift" className="application-status-panel__item__row">
        <div className="application-status-panel__icon" style={{ width: '25px' }}>
          <IconStatusSourceDrift status={SourceDriftStatus.Drift} />
        </div>
        <div
          onClick={() => onStatusClick(SourceDriftStatus.Drift)}
          data-testid={`source-drift-status-drift-row`}
          style={{ cursor: 'pointer' }}
        >
          {count} {count === 1 ? 'application has' : 'applications have'} it(s) source(s) drifted from its reference
        </div>
      </div>
    </div>
  );
};

export default StatusPanelSourceDrift;
