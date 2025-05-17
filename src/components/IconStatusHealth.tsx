import React from "react";
import { HealthStatus, HealthStatuses } from "../types";

/**
 * ApplicationNodeStatusIconHealth component displays an icon representing the health status of an application
 * @component
 * @param {Object} props - Component props
 * @param {HealthStatus} [props.status] - The health status to display
 * @returns {JSX.Element} A Font Awesome icon with appropriate styling
 * @example
 * <ApplicationNodeStatusIconHealth status={HealthStatus.Healthy} />
 */
const IconStatusHealth: React.FC<{ status?: HealthStatus }> = ({
  status: rawStatus,
}) => {
  const status =
    rawStatus && HealthStatuses[rawStatus] ? rawStatus : HealthStatus.Unknown;
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

export default IconStatusHealth;
