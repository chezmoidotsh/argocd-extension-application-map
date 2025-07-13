import React, { useCallback, useEffect, useState } from 'react';

import { ConnectionStatus } from '../../hooks/useApplicationSSE';
import { ApplicationGraph, HealthStatus, SyncStatus, isApplication } from '../../types';
import { hasCycle as hasCycleFn } from '../../utils/has_cycle';
import StatusPanelCycleWarning from './StatusPanelCycleWarning';
import StatusPanelHealth from './StatusPanelHealth';
import StatusPanelSSEStatus from './StatusPanelSSEStatus';
import StatusPanelSync from './StatusPanelSync';

const StatusPanel: React.FC<{
  graph: ApplicationGraph;
  onStatusClicked: (selectedNodes: string[]) => void;
  sseStatus?: ConnectionStatus;
  sseMessage?: string;
}> = ({ graph, onStatusClicked: onFilterUpdated, sseStatus = ConnectionStatus.CONNECTING, sseMessage }) => {
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
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          <StatusPanelSSEStatus status={sseStatus} message={sseMessage} />
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
