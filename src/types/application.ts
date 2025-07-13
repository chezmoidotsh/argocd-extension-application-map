import { ArgoDestination, ArgoSource, ArgoSyncPolicy, Metadata } from './argocd';

/**
 * Type representing the possible application kinds
 */
export type ApplicationKind = 'Application' | 'ApplicationSet';

/**
 * Enum representing the possible health status values
 * @enum {string}
 */
export enum HealthStatus {
  /** Application is healthy and running as expected */
  Healthy = 'Healthy',
  /** Application is suspended */
  Suspended = 'Suspended',
  /** Application is in a degraded state */
  Degraded = 'Degraded',
  /** Application is currently progressing */
  Progressing = 'Progressing',
  /** Application is missing */
  Missing = 'Missing',
  /** Application health status is unknown */
  Unknown = 'Unknown',
}

/**
 * Converts a string to a HealthStatus enum value.
 * @param status - The string to convert.
 * @returns The HealthStatus enum value.
 */
export function StringToHealthStatus(str: string): HealthStatus {
  // Compatible with ES5/ES2015: use manual array
  const values = [
    HealthStatus.Healthy,
    HealthStatus.Suspended,
    HealthStatus.Degraded,
    HealthStatus.Progressing,
    HealthStatus.Missing,
    HealthStatus.Unknown,
  ];
  return values.indexOf(str as HealthStatus) !== -1 ? (str as HealthStatus) : HealthStatus.Unknown;
}

/**
 * Enum representing the possible sync status values
 * @enum {string}
 */
export enum SyncStatus {
  /** Application is in sync with the desired state */
  Synced = 'Synced',
  /** Application is out of sync with the desired state */
  OutOfSync = 'OutOfSync',
  /** Application sync status is unknown */
  Unknown = 'Unknown',
}

/**
 * Converts a string to a SyncStatus enum value.
 * @param status - The string to convert.
 * @returns The SyncStatus enum value.
 */
export function StringToSyncStatus(str: string): SyncStatus {
  const values = [SyncStatus.Synced, SyncStatus.OutOfSync, SyncStatus.Unknown];
  return values.indexOf(str as SyncStatus) !== -1 ? (str as SyncStatus) : SyncStatus.Unknown;
}

/**
 * Interface for application specification
 * @interface ApplicationSpec
 * @property {ArgoDestination} destination - The destination configuration for the application
 * @property {string} project - The ArgoCD project name
 * @property {ArgoSyncPolicy} syncPolicy - The synchronization policy configuration
 */
export interface ApplicationSpec {
  sources: ArgoSource[];
  destination: ArgoDestination;
  project: string;
  syncPolicy: ArgoSyncPolicy;
}

/**
 * Interface for application status
 * @interface ApplicationStatus
 * @property {HealthStatus} health - The current health status of the application
 * @property {SyncStatus} sync - The current sync status of the application
 */
export interface ApplicationStatus {
  health: HealthStatus;
  sync: SyncStatus;
}

/**
 * Interface representing a single ArgoCD application
 * @interface Application
 * @property {string} kind - The kind of the application, always "Application"
 * @property {Metadata} metadata - Application metadata including name, namespace, and labels
 * @property {ApplicationSpec} spec - Application specification including sources, destination, project, and sync policy
 * @property {ApplicationStatus} status - Current status including health and sync state
 */
export interface Application {
  kind: 'Application';
  metadata: Metadata;
  spec: ApplicationSpec;
  status: ApplicationStatus;
}

/**
 * Interface representing an ArgoCD ApplicationSet
 * @interface ApplicationSet
 * @property {string} kind - The kind of the application set, always "ApplicationSet"
 * @property {Metadata} metadata - Application set metadata including name, namespace, and labels
 */
export interface ApplicationSet {
  kind: 'ApplicationSet';
  metadata: Metadata;
}

/**
 * Interface representing an ArgoCD application or application set
 * @interface ApplicationUnion
 *
 * This is a discriminated union type with two variants:
 *
 * 1. Application:
 *    - Represents a single ArgoCD application
 *    - Contains a complete specification including sources, destination, project and sync policy
 *    - Used for managing individual application deployments
 *
 * 2. ApplicationSet:
 *    - Represents an ArgoCD ApplicationSet
 *    - Does not contain a spec as ApplicationSets are managed differently
 *    - Used for managing multiple applications through templates
 *
 * @property {ApplicationKind} kind - The kind of application (Application or ApplicationSet)
 * @property {Metadata} metadata - Application metadata including name, namespace, and labels
 * @property {ApplicationSpec} [spec] - Application specification (only present for Application kind)
 * @property {ApplicationStatus} [status] - Current status including health and sync state (only present for Application kind)
 */
export type ApplicationUnion = Application | ApplicationSet;
