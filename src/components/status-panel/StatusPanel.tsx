import { DirectedGraph } from 'graphology';

import React, { useCallback, useEffect, useState } from 'react';

import {
  Application,
  ApplicationGraphNode,
  ConnectionStatus,
  ConnectionStatusDetails,
  HealthStatus,
  SourceDriftStatus,
  SyncStatus,
  isApplication,
} from '../../types';
import './StatusPanel.scss';
import StatusPanelConnectionStatus from './StatusPanelConnectionStatus';
import StatusPanelHealth from './StatusPanelHealth';
import StatusPanelSync from './StatusPanelSync';

const StatusPanel: React.FC<{
  graph: DirectedGraph<ApplicationGraphNode>;
  onStatusClicked: (selectedNodes: string[]) => void;
  connectionStatus: ConnectionStatusDetails;
}> = ({
  graph,
  onStatusClicked: onFilterUpdated,
  connectionStatus: sseStatus = { status: ConnectionStatus.Unknown },
}) => {
  const [countPerHealthStatuses, setCountPerHealthStatuses] = useState<Record<HealthStatus, number>>({
    [HealthStatus.Degraded]: 0,
    [HealthStatus.Healthy]: 0,
    [HealthStatus.Missing]: 0,
    [HealthStatus.Progressing]: 0,
    [HealthStatus.Suspended]: 0,
    [HealthStatus.Unknown]: 0,
  });
  const [countPerSyncStatuses, setCountPerSyncStatuses] = useState<Record<SyncStatus | SourceDriftStatus, number>>({
    [SourceDriftStatus.Conform]: 0,
    [SourceDriftStatus.Drift]: 0,
    [SyncStatus.OutOfSync]: 0,
    [SyncStatus.Synced]: 0,
    [SyncStatus.Unknown]: 0,
  });

  useEffect(() => {
    const appNodes = graph.mapNodes((_, attr) => attr).filter(isApplication) as (Application & {
      status?: { drift?: SourceDriftStatus };
    })[];

    const reducePerStatus = <T extends string>(
      accessor: (application: Application & { status?: { drift?: SourceDriftStatus } }) => T
    ) =>
      appNodes.reduce(
        (acc, node) => {
          const status = accessor(node);
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<T, number>
      );

    setCountPerHealthStatuses(reducePerStatus((app) => app.status?.health?.status || HealthStatus.Unknown));
    setCountPerSyncStatuses({
      ...reducePerStatus((app) => app.status?.sync?.status || SyncStatus.Unknown),
      ...reducePerStatus((app) => app.status?.drift || SourceDriftStatus.Conform),
    });
  }, [graph]);

  const onHealthStatusClick = useCallback(
    (status: HealthStatus) => {
      onFilterUpdated(
        graph.filterNodes(
          (_, attr) => isApplication(attr) && (attr.status?.health?.status || HealthStatus.Unknown) === status
        )
      );
    },
    [graph, onFilterUpdated]
  );

  const onSyncStatusClick = useCallback(
    (status: SyncStatus | SourceDriftStatus) => {
      onFilterUpdated(
        status === SourceDriftStatus.Drift
          ? graph.filterNodes(
              (_, attr) => isApplication(attr) && (attr.status?.drift || SourceDriftStatus.Conform) === status
            )
          : graph.filterNodes(
              (_, attr) => isApplication(attr) && (attr.status?.sync?.status || SyncStatus.Unknown) === status
            )
      );
    },
    [graph, onFilterUpdated]
  );

  return (
    <div className="application-details__status-panel">
      <div className="application-status-panel row" style={{ position: 'relative' }}>
        <StatusPanelHealth statuses={countPerHealthStatuses} onStatusClick={onHealthStatusClick} />
        <StatusPanelSync statuses={countPerSyncStatuses} onStatusClick={onSyncStatusClick} />
        <div style={{ position: 'absolute', top: 5, right: 5 }}>
          <StatusPanelConnectionStatus status={sseStatus} />
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
