import React from 'react';

import { HealthStatus } from '../../types';

/**
 * Mapping of health statuses to their corresponding JSX elements.
 *
 * NOTE: This constant guarantees that all health statuses are covered.
 */
const icons: {
  [K in HealthStatus]: JSX.Element;
} = {
  // Healthy icons representing an application that is in good health.
  [HealthStatus.Healthy]: (
    <i
      className="fa fa-heart utils-health-status-icon argocd-application-map__health-status-icon--healthy"
      title="Healthy"
    />
  ),

  // Suspended icons representing an application that is temporarily inactive (manually paused).
  [HealthStatus.Suspended]: (
    <i
      className="fa fa-pause-circle utils-health-status-icon argocd-application-map__health-status-icon--suspended"
      title="Suspended"
    />
  ),

  // Degraded icons representing an application that is experiencing issues but is still operational.
  [HealthStatus.Degraded]: (
    <i
      className="fa fa-heart-broken utils-health-status-icon argocd-application-map__health-status-icon--degraded"
      title="Degraded"
    />
  ),

  // Progressing icons representing an application that is currently undergoing changes or updates.
  [HealthStatus.Progressing]: (
    <i
      className="fa fa-circle-notch fa-spin utils-health-status-icon argocd-application-map__health-status-icon--progressing"
      title="Progressing"
    />
  ),

  // Missing icons representing an application that is not found or is missing.
  [HealthStatus.Missing]: (
    <i
      className="fa fa-ghost utils-health-status-icon argocd-application-map__health-status-icon--missing"
      title="Missing"
    />
  ),

  // Unknown icons representing an application whose health status is not determined or is unknown.
  [HealthStatus.Unknown]: (
    <i
      className="fa fa-question-circle utils-health-status-icon argocd-application-map__health-status-icon--unknown"
      title="Unknown"
    />
  ),
} as const;

/**
 * The **IconStatusHealth** displays a **visual indicator** of an application's health status.
 */
const IconStatusHealth: React.FC<{ status?: HealthStatus }> = ({ status }) =>
  icons[status] || icons[HealthStatus.Unknown];

export default IconStatusHealth;
