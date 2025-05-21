import { HealthStatus, SyncStatus } from './application';

/**
 * Type definition for all health status configurations
 */
export type HealthStatusesType = {
  [K in HealthStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
};

/**
 * Type definition for all sync status configurations
 */
export type SyncStatusesType = {
  [K in SyncStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
};

/**
 * Configuration mapping for all health statuses
 */
export const HealthStatuses: HealthStatusesType = {
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
 * Configuration mapping for all sync statuses
 */
export const SyncStatuses: SyncStatusesType = {
  [SyncStatus.Synced]: {
    color: '#18be94',
    icon: 'fa-check-circle',
    title: 'Synced',
  },
  [SyncStatus.OutOfSync]: {
    color: '#f4c030',
    icon: 'fa-arrow-alt-circle-up',
    title: 'OutOfSync',
  },
  [SyncStatus.Unknown]: {
    color: '#ccd6dd',
    icon: 'fa-circle-notch fa-spin',
  },
} as const;
