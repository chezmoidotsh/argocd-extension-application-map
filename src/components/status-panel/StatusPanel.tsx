import { DirectedGraph } from 'graphology';

import React, { useCallback, useEffect, useState } from 'react';

import { ApplicationGraphNode, ConnectionStatus, ConnectionStatusDetails, SourceDriftStatus } from '../../types';
import { Application, HealthStatus, SyncStatus, isApplication } from '../../types';
import { hasCycle as hasCycleFn } from '../../utils/hasCycle';
import './StatusPanel.scss';
import StatusPanelConnectionStatus from './StatusPanelConnectionStatus';
import StatusPanelCycleWarning from './StatusPanelCycleWarning';
import StatusPanelHealth from './StatusPanelHealth';
import StatusPanelSourceDrift from './StatusPanelSourceDrift';
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
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [countPerDriftStatus, setCountPerDriftStatus] = useState<Record<SourceDriftStatus, number>>({
    [SourceDriftStatus.Conform]: 0,
    [SourceDriftStatus.Drift]: 0,
    [SourceDriftStatus.Unknown]: 0,
  });
  const [hasCycle, setHasCycle] = useState<boolean>(false);

  useEffect(() => {
    const appNodes = graph.mapNodes((_, attr) => attr).filter(isApplication) as (Application & {
      status?: { drift?: SourceDriftStatus };
    })[];
    setHealthStatuses(appNodes.map((node) => node.status?.health?.status || HealthStatus.Unknown));
    setSyncStatuses(appNodes.map((node) => node.status?.sync?.status || SyncStatus.Unknown));
    setCountPerDriftStatus(
      appNodes.reduce(
        (acc, node) => {
          const driftStatus = node.status?.drift || SourceDriftStatus.Unknown;
          acc[driftStatus] = (acc[driftStatus] || 0) + 1;
          return acc;
        },
        {} as Record<SourceDriftStatus, number>
      )
    );
    setHasCycle(hasCycleFn(graph));
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
    (status: SyncStatus) => {
      onFilterUpdated(
        graph.filterNodes(
          (_, attr) => isApplication(attr) && (attr.status?.sync?.status || SyncStatus.Unknown) === status
        )
      );
    },
    [graph, onFilterUpdated]
  );

  const onSourceDriftStatusClick = useCallback(
    (status: SourceDriftStatus) => {
      onFilterUpdated(
        graph.filterNodes(
          (_, attr) => isApplication(attr) && (attr.status?.drift || SourceDriftStatus.Unknown) === status
        )
      );
    },
    [graph, onFilterUpdated]
  );

  return (
    <div className="application-details__status-panel">
      <div className="application-status-panel row" style={{ position: 'relative' }}>
        <StatusPanelHealth statuses={healthStatuses} onStatusClick={onHealthStatusClick} />
        <StatusPanelSync statuses={syncStatuses} onStatusClick={onSyncStatusClick} />
        <StatusPanelSourceDrift countPerStatus={countPerDriftStatus} onStatusClick={onSourceDriftStatusClick} />
        {hasCycle && <StatusPanelCycleWarning />}
        <div style={{ position: 'absolute', top: 5, right: 5 }}>
          <StatusPanelConnectionStatus status={sseStatus} />
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
