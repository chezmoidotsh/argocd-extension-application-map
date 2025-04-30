import {
  Metadata,
  SourceConfig,
  DestinationConfig,
  SyncPolicy,
} from "./argocd";

/**
 * Type representing the possible application kinds
 */
export type ApplicationKind = "Application" | "ApplicationSet";

/**
 * Enum representing the possible health status values
 */
export enum HealthStatus {
  Healthy = "Healthy",
  Degraded = "Degraded",
  Progressing = "Progressing",
  Unknown = "Unknown",
}

/**
 * Enum representing the possible sync status values
 */
export enum SyncStatus {
  Synced = "Synced",
  OutOfSync = "OutOfSync",
  Unknown = "Unknown",
}

/**
 * Interface for application specification
 */
export interface ApplicationSpec {
  source: SourceConfig;
  destination: DestinationConfig;
  project: string;
  syncPolicy: SyncPolicy;
}

/**
 * Interface for application status
 */
export interface ApplicationStatus {
  health: HealthStatus;
  sync: SyncStatus;
}

/**
 * Interface representing an ArgoCD application or application set
 */
export interface Application {
  /** The kind of application (Application or ApplicationSet) */
  kind: ApplicationKind;
  /** Application metadata */
  metadata: Metadata;
  /** Application specification */
  spec?: ApplicationSpec;
  /** Application status */
  status: ApplicationStatus;
  /** Resources managed by the application */
  resources?: Array<Application>;
}
