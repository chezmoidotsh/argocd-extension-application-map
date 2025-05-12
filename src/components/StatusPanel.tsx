/**
 * @fileoverview StatusPanel component for displaying application health and sync status in ArgoCD
 * This component provides a visual overview of the health and synchronization status of applications
 * in an ArgoCD cluster, including warnings for self-loops in the application graph.
 */

import React, { useCallback } from "react";
import {
  ApplicationGraph,
  HealthStatus,
  SyncStatus,
  HealthStatuses,
  SyncStatuses,
} from "../types";
import "../styles/index.scss";
import { hasCycle } from "../utils/cyclic_graph";

/**
 * Component for displaying health status information
 * @component
 */
const StatusPanelHealthRow: React.FC<{
  statuses: HealthStatus[];
  onStatusClick: (status: HealthStatus) => void;
}> = ({ statuses, onStatusClick: onHealthStatusClick }) => {
  const statusCounts = statuses.reduce(
    (acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<HealthStatus, number>,
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
    ].find((status) => (statusCounts[status] || 0) > 0) || HealthStatus.Healthy;

  return (
    <div className="application-status-panel__item">
      <div style={{ lineHeight: "19.5px", marginBottom: "0.3em" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgb(109, 127, 139)",
          }}
        >
          APPS HEALTH
        </label>
      </div>

      <div className="application-status-panel__item-value">
        <div className="application-status-panel__icon">
          <i
            qe-id="utils-health-status-title"
            title={globalStatus}
            className={`fa ${HealthStatuses[globalStatus].icon} utils-health-status-icon`}
            style={{ color: HealthStatuses[globalStatus].color }}
          ></i>
        </div>
        <div className="application-status-panel__text">
          &nbsp;{globalStatus}
        </div>
      </div>
      {Object.entries(statusCounts).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div
                className="application-status-panel__icon"
                style={{ width: "25px" }}
              >
                <i
                  qe-id="utils-health-status-title"
                  title={title}
                  className={`fa ${HealthStatuses[title as HealthStatus].icon}`}
                  style={{ color: HealthStatuses[title as HealthStatus].color }}
                ></i>
              </div>
              <div
                className="application-status-panel__text"
                onClick={() => onHealthStatusClick(title as HealthStatus)}
                style={{ cursor: "pointer" }}
              >
                {count} applications {title.toLocaleLowerCase()}
              </div>
            </div>
          ),
      )}
    </div>
  );
};

/**
 * Component for displaying sync status information
 * @component
 */
const StatusPanelSyncRow: React.FC<{
  statuses: (SyncStatus | undefined)[];
  onStatusClick: (status: SyncStatus) => void;
}> = ({ statuses, onStatusClick: onSyncStatusClick }) => {
  const statusCounts = statuses.reduce(
    (acc, status) => {
      const syncStatus = status || SyncStatus.Unknown;
      acc[syncStatus] = (acc[syncStatus] || 0) + 1;
      return acc;
    },
    {} as Record<SyncStatus, number>,
  );

  /**
   * Determines the global sync status based on a priority order of statuses.
   * The order is from most severe to least severe:
   * 1. OutOfSync - An application is out of sync with the desired state
   * 2. Unknown - An application sync status is unknown
   * 3. Synced - Everything is in sync with the desired state
   */
  const globalStatus =
    [SyncStatus.OutOfSync, SyncStatus.Unknown, SyncStatus.Synced].find(
      (status) => (statusCounts[status] || 0) > 0,
    ) || SyncStatus.Synced;

  return (
    <div className="application-status-panel__item">
      <div style={{ lineHeight: "19.5px", marginBottom: "0.3em" }}>
        <label
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "rgb(109, 127, 139)",
          }}
        >
          APPS SYNC
        </label>
      </div>

      <div className="application-status-panel__item-value">
        <div className="application-status-panel__icon">
          <i
            qe-id="utils-sync-status-title"
            title={globalStatus}
            className={`fa ${SyncStatuses[globalStatus].icon} utils-sync-status-icon`}
            style={{ color: SyncStatuses[globalStatus].color }}
          ></i>
        </div>
        <div className="application-status-panel__text">
          &nbsp;{globalStatus}
        </div>
      </div>
      {Object.entries(statusCounts).map(
        ([title, count]) =>
          count > 0 && (
            <div key={title} className="application-status-panel__item__row">
              <div
                className="application-status-panel__icon"
                style={{ width: "25px" }}
              >
                <i
                  qe-id="utils-sync-status-title"
                  title={title}
                  className={`fa ${SyncStatuses[title as SyncStatus].icon}`}
                  style={{ color: SyncStatuses[title as SyncStatus].color }}
                ></i>
              </div>
              <div
                className="application-status-panel__text"
                onClick={() => onSyncStatusClick(title as SyncStatus)}
                style={{ cursor: "pointer" }}
              >
                {count} applications {title.toLocaleLowerCase()}
              </div>
            </div>
          ),
      )}
    </div>
  );
};

/**
 * Main StatusPanel component that displays overall application status information
 * @component
 *
 * @example
 * ```tsx
 * <StatusPanel graph={applicationGraph} onFilterUpdated={handleFilterUpdate} />
 * ```
 */
const StatusPanel: React.FC<{
  graph: ApplicationGraph;
  onFilterUpdated: (selectedNodes: string[]) => void;
}> = ({ graph, onFilterUpdated }) => {
  const healthStatuses = graph
    .mapNodes((_, attr) => attr.data)
    .filter((node) => node.kind === "Application")
    .map((node) => node.status?.health || HealthStatus.Unknown);
  const syncStatuses = graph
    .mapNodes((_, attr) => attr.data)
    .filter((node) => node.kind === "Application")
    .map((node) => node.status?.sync);

  const onHealthStatusClick = useCallback(
    (status: HealthStatus) => {
      onFilterUpdated(
        graph.filterNodes((_, attr) => attr.data.status?.health === status),
      );
    },
    [graph, onFilterUpdated],
  );

  const onSyncStatusClick = useCallback(
    (status: SyncStatus) => {
      onFilterUpdated(
        graph.filterNodes((_, attr) => attr.data.status?.sync === status),
      );
    },
    [graph, onFilterUpdated],
  );

  return (
    <div className="application-details__status-panel">
      <div className="application-status-panel row">
        <StatusPanelHealthRow
          statuses={healthStatuses}
          onStatusClick={onHealthStatusClick}
        />
        <StatusPanelSyncRow
          statuses={syncStatuses}
          onStatusClick={onSyncStatusClick}
        />
        {hasCycle(graph) && (
          <div className="application-status-panel__item">
            <div style={{ lineHeight: "19.5px", marginBottom: "0.3em" }}>
              <label
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "rgb(109, 127, 139)",
                }}
              >
                WARNING
              </label>
            </div>
            <div className="application-status-panel__item-value">
              <div className="application-status-panel__icon">
                <i
                  className="fa fa-exclamation-triangle"
                  style={{ color: "#f4c030" }}
                ></i>
              </div>
              <div
                className="application-status-panel__text"
                style={{ color: "#f4c030" }}
              >
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
                  Consider reviewing your application dependencies to resolve
                  these loops.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusPanel;
