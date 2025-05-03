import React from "react";
import { SyncStatus } from "../types";

/**
 * Type definition for all sync status configurations
 */
type SyncStatusesType = {
  [K in SyncStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
};

/**
 * Configuration mapping for all sync statuses
 * @type {SyncStatusesType}
 */
const SyncStatuses: SyncStatusesType = {
  [SyncStatus.Synced]: {
    color: "#18be94",
    icon: "fa-check-circle",
    title: "Synced",
  },
  [SyncStatus.OutOfSync]: {
    color: "#f4c030",
    icon: "fa-arrow-alt-circle-up",
    title: "OutOfSync",
  },
  [SyncStatus.Unknown]: {
    color: "#ccd6dd",
    icon: "fa-circle-notch fa-spin",
  },
} as const;

/**
 * StatusIconSync component displays an icon representing the sync status of an application
 * @component
 * @param {Object} props - Component props
 * @param {SyncStatus} [props.status] - The sync status to display
 * @returns {JSX.Element} A Font Awesome icon with appropriate styling
 * @example
 * <StatusIconSync status={SyncStatus.Synced} />
 */
const StatusIconSync: React.FC<{ status?: SyncStatus }> = ({ status: rawStatus }) => {
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

export default StatusIconSync;
