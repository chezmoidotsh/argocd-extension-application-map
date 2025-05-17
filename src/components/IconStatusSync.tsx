import React from "react";
import { SyncStatus, SyncStatuses } from "../types";

/**
 * ApplicationNodeStatusIconSync component displays an icon representing the sync status of an application
 * @component
 * @param {Object} props - Component props
 * @param {SyncStatus} [props.status] - The sync status to display
 * @returns {JSX.Element} A Font Awesome icon with appropriate styling
 * @example
 * <ApplicationNodeStatusIconSync status={SyncStatus.Synced} />
 */
const IconStatusSync: React.FC<{ status?: SyncStatus }> = ({
  status: rawStatus,
}) => {
  const status =
    rawStatus && SyncStatuses[rawStatus] ? rawStatus : SyncStatus.Unknown;
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
