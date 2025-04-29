import React from "react";

interface SyncStatusIconProps {
  status?: string;
}

const SyncStatusIcon: React.FC<SyncStatusIconProps> = ({ status }) => {
  if (status === "OutOfSync") {
    return (
      <i
        qe-id="utils-sync-status-title"
        title="OutOfSync"
        className="fa fa-arrow-up utils-sync-status-icon"
        style={{ color: "#f4b740", marginRight: 4 }}
      ></i>
    );
  }

  let color = "#b1b1b1";
  let icon = "fa-check-circle";
  let title = status;

  if (status === "Synced") {
    color = "#18be94";
    title = "Synced";
  } else if (status === "Unknown") {
    color = "#b1b1b1";
    title = "Unknown";
  } else if (status === "Syncing") {
    color = "#0dadea";
    icon = "fa-sync fa-spin";
    title = "Syncing";
  }

  return (
    <i
      qe-id="utils-sync-status-title"
      title={title}
      className={`fa ${icon} utils-sync-status-icon`}
      style={{ color, marginRight: 4 }}
    ></i>
  );
};

export default SyncStatusIcon; 