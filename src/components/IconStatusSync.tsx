import React from 'react';
import { SyncStatus, SyncStatuses } from '../types';

/**
 * The **IconStatusSync** displays a **visual indicator** of an application's synchronization status.
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
