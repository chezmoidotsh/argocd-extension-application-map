import { DirectedGraph } from 'graphology';

import React, { useCallback, useEffect, useState } from 'react';

import { ConnectionStatus, ConnectionStatusDetails } from '../../types';
import { Application, ApplicationSet, HealthStatus, SyncStatus, isApplication } from '../../types';
import { hasCycle as hasCycleFn } from '../../utils/hasCycle';
import StatusPanelConnectionStatus from './StatusPanelConnectionStatus';
import StatusPanelCycleWarning from './StatusPanelCycleWarning';
import StatusPanelHealth from './StatusPanelHealth';
import StatusPanelSync from './StatusPanelSync';

const StatusPanel: React.FC<{
  graph: DirectedGraph<Application | ApplicationSet>;
  onStatusClicked: (selectedNodes: string[]) => void;
  connectionStatus: ConnectionStatusDetails;
}> = ({
  graph,
  onStatusClicked: onFilterUpdated,
  connectionStatus: sseStatus = { status: ConnectionStatus.Unknown },
}) => {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [hasCycle, setHasCycle] = useState<boolean>(false);

  useEffect(() => {
    const appNodes = graph.mapNodes((_, attr) => attr).filter(isApplication);
    setHealthStatuses(appNodes.map((node) => node.status?.health?.status || HealthStatus.Unknown));
    setSyncStatuses(appNodes.map((node) => node.status?.sync?.status || SyncStatus.Unknown));
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

  return (
    <div className="application-details__status-panel">
      <div className="application-status-panel row" style={{ position: 'relative' }}>
        <StatusPanelHealth statuses={healthStatuses} onStatusClick={onHealthStatusClick} />
        <StatusPanelSync statuses={syncStatuses} onStatusClick={onSyncStatusClick} />
        {hasCycle && <StatusPanelCycleWarning />}
        <div style={{ position: 'absolute', top: 5, right: 5 }}>
          <StatusPanelConnectionStatus status={sseStatus} />
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
