/**
 * Type definitions for ArgoCD resources and configurations
 *
 * This file contains TypeScript interfaces that define the structure of ArgoCD resources
 * and their configurations. These types are used throughout the application to ensure
 * type safety when working with ArgoCD resources.
 *
 * The types are organized in the following sections:
 * 1. Kubernetes Core Types (Metadata)
 * 2. Core ArgoCD Resources (Application, ApplicationSet)
 * 3. Configuration Types (Source, Destination, Sync Policy)
 * 4. Status Types (ResourceStatus, ApplicationStatus)
 */
import { Metadata } from './kubernetes';

/**
 * Represents an ArgoCD Application resource
 * @property {Metadata} metadata - Metadata about the ArgoCD Application
 * @property {Object} spec - Specification of the ArgoCD Application
 * @property {Source} spec.source - Optional source configuration for the application
 * @property {Source[]} spec.sources - Optional sources configuration for the application
 * @property {Destination} spec.destination - Destination configuration for the application
 * @property {string} spec.project - ArgoCD project name
 * @property {SyncPolicy} spec.syncPolicy - Synchronization policy configuration
 * @property {ApplicationStatus} status - Current status of the ArgoCD Application
 */
export interface Application {
  kind: 'Application';
  metadata: Metadata;
  spec?: {
    source?: ApplicationSource;
    sources?: ApplicationSource[];
    destination: ApplicationDestination;
    project: string;
    syncPolicy: SyncPolicy;
  };
  status?: {
    health: {
      status: HealthStatus;
    };
    reconciledAt?: string;
    resources?: ManagedResource[];
    sync: {
      status: SyncStatus;
      revision?: string;
    };
  };
}

/**
 * Checks if a resource is an ArgoCD Application
 * @param resource - The resource to check
 * @returns True if the resource is an ArgoCD Application, false otherwise
 */
export function isApplication(resource: Application | ApplicationSet): resource is Application {
  return resource.kind === 'Application';
}

/**
 * Represents an ArgoCD ApplicationSet resource
 * @property {Metadata} metadata - Metadata about the ArgoCD ApplicationSet
 */
export interface ApplicationSet {
  kind: 'ApplicationSet';
  metadata: Metadata;
}

/**
 * Checks if a resource is an ArgoCD ApplicationSet
 * @param resource - The resource to check
 * @returns True if the resource is an ArgoCD ApplicationSet, false otherwise
 */
export function isApplicationSet(resource: Application | ApplicationSet): resource is ApplicationSet {
  return resource.kind === 'ApplicationSet';
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for an ArgoCD source
 * @property {string} repoURL - The URL of the Git repository
 * @property {string} path - The path within the repository
 * @property {string} targetRevision - The target revision to sync to (branch, tag, or commit)
 * @property {string} [chart] - Optional Helm chart name (for Helm repositories)
 * @property {object} [helm] - Optional Helm chart configuration
 * @property {object} [kustomize] - Optional Kustomize configuration
 * @property {object} [directory] - Optional directory configuration
 * @property {object} [plugin] - Optional plugin configuration
 */
export interface ApplicationSource {
  repoURL: string;
  path: string;
  targetRevision: string;
  chart?: string;
  helm?: object | undefined;
  kustomize?: object | undefined;
  directory?: object | undefined;
  plugin?: object | undefined;
}

/**
 * Configuration for the destination cluster
 * @property {string} server - The Kubernetes server URL
 * @property {string} namespace - The target namespace in the cluster
 */
interface ApplicationDestination {
  server: string;
  namespace: string;
}

/**
 * Configuration for automated synchronization
 * @interface AutomatedSync
 * @property {boolean} prune - Whether to prune resources that are no longer in the source
 * @property {boolean} selfHeal - Whether to automatically heal when drift is detected
 */
interface AutomatedSync {
  prune: boolean;
  selfHeal: boolean;
}

/**
 * Configuration for synchronization policy
 * @interface SyncPolicy
 * @property {AutomatedSync} [automated] - Optional automated sync configuration
 */
interface SyncPolicy {
  automated?: AutomatedSync;
}

/**
 * Represents a resource managed by an ArgoCD application
 * @property {string} group - The API group of the resource
 * @property {string} kind - The kind of the resource
 * @property {string} name - The name of the resource
 * @property {string} namespace - The namespace of the resource
 * @property {string} version - The version of the resource
 */
export interface ManagedResource {
  group: string;
  health?: {
    status: HealthStatus;
  };
  kind: string;
  name: string;
  namespace: string;
  status?: SyncStatus;
  version: string;
}

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
 * Enum representing the possible source drift status values
 * @enum {string}
 */
export enum SourceDriftStatus {
  /** Application sources are conforming to their reference */
  Conform = 'Conform',
  /** Application sources have drifted from their reference */
  Drift = 'Drift',
}
