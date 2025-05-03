import React from "react";
import { HealthStatus } from "../types/application";

/**
 * Type definition for all health status configurations
 */
type HealthStatusesType = {
  [K in HealthStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
};

/**
 * Configuration mapping for all health statuses
 * @type {HealthStatusesType}
 */
const HealthStatuses: HealthStatusesType = {
  [HealthStatus.Healthy]: {
    color: "#18be94",
    icon: "fa-heart",
    title: "Healthy",
  },
  [HealthStatus.Suspended]: {
    color: "#766f94",
    icon: "fa-pause-circle",
    title: "Suspended",
  },
  [HealthStatus.Degraded]: {
    color: "#e96d76",
    icon: "fa-heart-broken",
    title: "Degraded",
  },
  [HealthStatus.Progressing]: {
    color: "#0dadea",
    icon: "fa-circle-notch fa-spin",
    title: "Progressing",
  },
  [HealthStatus.Missing]: {
    color: "#f4c030",
    icon: "fa-ghost",
    title: "Missing",
  },
  [HealthStatus.Unknown]: {
    color: "#ccd6dd",
    icon: "fa-question-circle",
  },
};

/**
 * StatusIconHealth component displays an icon representing the health status of an application
 * @component
 * @param {Object} props - Component props
 * @param {HealthStatus} [props.status] - The health status to display
 * @returns {JSX.Element} A Font Awesome icon with appropriate styling
 * @example
 * <StatusIconHealth status={HealthStatus.Healthy} />
 */
const StatusIconHealth: React.FC<{ status?: HealthStatus }> = ({ status: rawStatus }) => {
  const status = rawStatus && HealthStatuses[rawStatus] ? rawStatus : HealthStatus.Unknown;
  return (
    <i
      qe-id="utils-health-status-title"
      title={HealthStatuses[status].title}
      className={`fa ${HealthStatuses[status].icon} utils-health-status-icon`}
      style={{
        color: HealthStatuses[status].color,
        marginRight: 4,
      }}
    ></i>
  );
};

export default StatusIconHealth;
