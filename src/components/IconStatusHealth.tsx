import { HealthStatus, HealthStatuses } from '../types';
import React from 'react';

/**
 * This component renders a FontAwesome icon representing the health status of an application.
 * It is used throughout the UI to provide a consistent, visual indicator of whether an application is
 * healthy, degraded, missing, progressing, unknown, or suspended.
 */
const IconStatusHealth: React.FC<{ status?: HealthStatus }> = ({ status: rawStatus }) => {
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

export default IconStatusHealth;
