import React from 'react';

import { HealthStatus } from '../../types';

/**
 * Mapping of health statuses to their corresponding icons, colors, and titles.
 */
const iconMapping: {
  [K in HealthStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
} = {
  [HealthStatus.Healthy]: {
    color: '#18be94',
    icon: 'fa-heart',
    title: 'Healthy',
  },
  [HealthStatus.Suspended]: {
    color: '#f4c030',
    icon: 'fa-pause-circle',
    title: 'Suspended',
  },
  [HealthStatus.Degraded]: {
    color: '#e96d76',
    icon: 'fa-heart-broken',
    title: 'Degraded',
  },
  [HealthStatus.Progressing]: {
    color: '#0d84ff',
    icon: 'fa-circle-notch fa-spin',
    title: 'Progressing',
  },
  [HealthStatus.Missing]: {
    color: '#ccd6dd',
    icon: 'fa-ghost',
    title: 'Missing',
  },
  [HealthStatus.Unknown]: {
    color: '#ccd6dd',
    icon: 'fa-question-circle',
  },
} as const;

/**
 * The **IconStatusHealth** displays a **visual indicator** of an application's health status.
 */
const IconStatusHealth: React.FC<{ status?: HealthStatus }> = ({ status }) => {
  const { icon, color, title } = iconMapping[status] || iconMapping[HealthStatus.Unknown];
  return (
    <i
      qe-id="utils-health-status-title"
      title={title}
      className={`fa ${icon} utils-health-status-icon`}
      style={{ color, marginRight: 4 }}
    ></i>
  );
};

export default IconStatusHealth;
