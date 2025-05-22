import React from 'react';
import { HealthStatus, HealthStatuses } from '../types';

/**
 * The **IconStatusHealth** displays a **visual indicator** of an application's health status.
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
