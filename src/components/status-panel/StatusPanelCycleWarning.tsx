import React from 'react';

import './StatusPanel.scss';
import './StatusPanelCycleWarning.scss';

const StatusPanelCycleWarning: React.FC = () => (
  <div className="application-status-panel__item" data-testid="cycle-warning-panel">
    <div className="argocd-application-map__status-panel__title">
      <label>WARNING</label>
    </div>
    <div className="application-status-panel__item-value">
      <div className="application-status-panel__icon">
        <i className="fa fa-exclamation-triangle" style={{ color: '#f4c030' }}></i>
      </div>
      <div className="application-status-panel__text" style={{ color: '#f4c030' }}>
        &nbsp;Circular dependency detected
      </div>
    </div>
    <div className="application-status-panel__item__row argocd-application-map__status-panel__warning-box">
      <div className="application-status-panel__text argocd-application-map__status-panel__warning-text">
        <div className="argocd-application-map__status-panel__warning-header">
          <i className="fa fa-exclamation-circle argocd-application-map__status-panel__warning-icon"></i>
          <strong>Circular dependencies in ArgoCD can lead to:</strong>
        </div>
        <ul className="argocd-application-map__status-panel__warning-list">
          <li>Infinite sync loops</li>
          <li>Unstable application states</li>
          <li>Race conditions during removal</li>
        </ul>
        <div className="argocd-application-map__status-panel__warning-footer">
          Consider reviewing your application dependencies to resolve these loops.
        </div>
      </div>
    </div>
  </div>
);

export default StatusPanelCycleWarning;
