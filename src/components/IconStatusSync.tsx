import { SyncStatus, SyncStatuses } from '../types';
import React from 'react';

/**
 * This component renders a FontAwesome icon representing the synchronization status of an application.
 * It is used throughout the UI to provide a consistent, visual indicator of whether an application is
 * in sync, out of sync, or in an unknown state.
 */
const IconStatusSync: React.FC<{ status?: SyncStatus }> = ({ status: rawStatus }) => {
  const status = rawStatus && SyncStatuses[rawStatus] ? rawStatus : SyncStatus.Unknown;
  return (
    <i
      qe-id="utils-sync-status-title"
      title={SyncStatuses[status].title}
      className={`fa ${SyncStatuses[status].icon} utils-sync-status-icon`}
      style={{
        color: SyncStatuses[status].color,
        marginRight: 4,
      }}
    ></i>
  );
};

export default IconStatusSync;
