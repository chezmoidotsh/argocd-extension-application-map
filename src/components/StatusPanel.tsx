import React, { useCallback, useEffect, useState } from 'react';
import '../styles/index.scss';
import { ApplicationGraph, HealthStatus, SyncStatus, isApplication } from '../types';
import { hasCycle as hasCycleFn } from '../utils/has_cycle';
import IconStatusHealth from './IconStatusHealth';
import IconStatusSync from './IconStatusSync';

/**
 * Displays an aggregated summary of ArgoCD application health states.
 */
export const StatusPanelHealth: React.FC<{
  statuses: HealthStatus[];
  onStatusClick: (status: HealthStatus) => void;
}> = ({ statuses, onStatusClick: onHealthStatusClick }) => {
  // Count the number of applications for each health status
  const register = statuses.reduce(
    (acc, status) => {
      acc[status || HealthStatus.Healthy] = (acc[status || HealthStatus.Healthy] || 0) + 1;
      return acc;
    },
    {} as Record<HealthStatus, number>
  );

  /**
   * Determines the global health status based on a priority order of statuses.
   * The order is from most severe to least severe:
   * 1. Degraded - An application is degraded and needs immediate attention
   * 2. Missing - An application is missing resources that should exist
   * 3. Progressing - An application is currently in a transitional state
   * 4. Unknown - An application is unknown and cannot be determined
   * 5. Healthy - Everything is working as expected
   * 6. Suspended - All applications are intentionally suspended
   */
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
    // NOTE: The style overrides the default margin-top of 7px set by `application-status-panel__item:first-child`
    <div className="application-status-panel__item" data-testid="health-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{statuses.length === 1 ? 'APP HEALTH' : 'APPS HEALTH'}</label>
      </div>

      <div className="application-status-panel__item-value">
        <div className="application-status-panel__icon">
          <IconStatusHealth status={globalStatus} />
        </div>
        <div className="application-status-panel__text">&nbsp;{globalStatus}</div>
      </div>
      {Object.entries(register).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div className="application-status-panel__icon" style={{ width: '25px' }}>
                <IconStatusHealth status={title as HealthStatus} />
              </div>
              <div
                className="application-status-panel__text"
                onClick={() => onHealthStatusClick(title as HealthStatus)}
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

/**
 * Displays an aggregated summary of ArgoCD application sync states.
 */
export const StatusPanelSync: React.FC<{
  statuses: SyncStatus[];
  onStatusClick: (status: SyncStatus) => void;
}> = ({ statuses, onStatusClick: onSyncStatusClick }) => {
  const register = statuses.reduce(
    (acc, status) => {
      acc[status || SyncStatus.Unknown] = (acc[status || SyncStatus.Unknown] || 0) + 1;
      return acc;
    },
    {} as Record<SyncStatus, number>
  );

  /**
   * Determines the global sync status based on a priority order of statuses.
   * The order is from most severe to least severe:
   * 1. OutOfSync - An application is out of sync with the desired state
   * 2. Unknown - An application sync status is unknown
   * 3. Synced - Everything is in sync with the desired state
   */
  const globalStatus =
    [SyncStatus.OutOfSync, SyncStatus.Unknown, SyncStatus.Synced].find((status) => (register[status] || 0) > 0) ||
    SyncStatus.Synced;

  return (
    <div className="application-status-panel__item" data-testid="sync-status-panel" style={{ marginTop: '5px' }}>
      <div className="argocd-application-map__status-panel__title">
        <label>{statuses.length === 1 ? 'APP SYNC' : 'APPS SYNC'}</label>
      </div>

      <div className="application-status-panel__item-value">
        <div className="application-status-panel__icon">
          <IconStatusSync status={globalStatus} />
        </div>
        <div className="application-status-panel__text">&nbsp;{globalStatus}</div>
      </div>
      {Object.entries(register).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div className="application-status-panel__icon" style={{ width: '25px' }}>
                <IconStatusSync status={title as SyncStatus} />
              </div>
              <div
                className="application-status-panel__text"
                onClick={() => onSyncStatusClick(title as SyncStatus)}
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

/**
 * Highlights circular dependency issues in the ArgoCD application graph.
 */
export const StatusPanelCycleWarning: React.FC = () => (
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

/**
 * StatusPanel component for displaying application health and sync status in ArgoCD
 *
 * This component provides a comprehensive dashboard for monitoring:
 * - **Health Status**: Aggregates and prioritizes application health states (Degraded, Missing, Progressing, etc.)
 * - **Sync Status**: Tracks synchronization between desired and actual states (OutOfSync, Synced, Unknown)
 * - **Dependency Warnings**: Detects and highlights circular dependencies that could cause instability
 *
 * The panel implements a priority-based status algorithm that surfaces the most critical issues first,
 * and provides interactive filtering capabilities to isolate applications by status.
 */
const StatusPanel: React.FC<{
  graph: ApplicationGraph;
  onFilterUpdated: (selectedNodes: string[]) => void;
}> = ({ graph, onFilterUpdated }) => {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [hasCycle, setHasCycle] = useState<boolean>(false);

  // Update the statuses and cycle status when the graph changes
  useEffect(() => {
    const appNodes = graph.mapNodes((_, attr) => attr.data).filter(isApplication);
    setHealthStatuses(appNodes.map((node) => node.status.health));
    setSyncStatuses(appNodes.map((node) => node.status.sync));
    setHasCycle(hasCycleFn(graph));
  }, [graph]);

  const onHealthStatusClick = useCallback(
    (status: HealthStatus) => {
      onFilterUpdated(graph.filterNodes((_, attr) => isApplication(attr.data) && attr.data.status.health === status));
    },
    [graph, onFilterUpdated]
  );

  const onSyncStatusClick = useCallback(
    (status: SyncStatus) => {
      onFilterUpdated(graph.filterNodes((_, attr) => isApplication(attr.data) && attr.data.status.sync === status));
    },
    [graph, onFilterUpdated]
  );

  return (
    <div className="application-details__status-panel">
      <div className="application-status-panel row">
        <StatusPanelHealth statuses={healthStatuses} onStatusClick={onHealthStatusClick} />
        <StatusPanelSync statuses={syncStatuses} onStatusClick={onSyncStatusClick} />
        {hasCycle && <StatusPanelCycleWarning />}
      </div>
    </div>
  );
};

export default StatusPanel;
