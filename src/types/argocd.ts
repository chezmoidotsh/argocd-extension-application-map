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

import { SyncStatus, HealthStatus } from "./application";

// ============================================================================
// Kubernetes Core Types
// ============================================================================

/**
 * Common metadata fields for Kubernetes resources
 * @interface Metadata
 * @property {string} name - The name of the resource
 * @property {string} namespace - The Kubernetes namespace
 * @property {Record<string, string>} [labels] - Optional labels attached to the resource
 * @property {Record<string, string>} [annotations] - Optional annotations attached to the resource
 */
export interface Metadata {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

// ============================================================================
// Core ArgoCD Resources
// ============================================================================

/**
 * Represents an ArgoCD Application resource
 * @interface Application
 * @property {Metadata} metadata - Metadata about the ArgoCD Application
 * @property {Object} spec - Specification of the ArgoCD Application
 * @property {Source} spec.source - Optional source configuration for the application
 * @property {Source[]} spec.sources - Optional sources configuration for the application
 * @property {Destination} spec.destination - Destination configuration for the application
 * @property {string} spec.project - ArgoCD project name
 * @property {SyncPolicy} spec.syncPolicy - Synchronization policy configuration
 * @property {ApplicationStatus} status - Current status of the ArgoCD Application
 * @example
 * ```tsx
 * const app: Application = {
 *   metadata: {
 *     name: 'my-app',
 *     namespace: 'default',
 *     labels: { 'app.kubernetes.io/name': 'my-app' },
 *     annotations: { 'argocd.argoproj.io/sync-wave': '0' }
 *   },
 *   spec: {
 *     source: {
 *       repoURL: 'https://github.com/org/repo.git',
 *       path: 'manifests',
 *       targetRevision: 'HEAD'
 *     },
 *     destination: {
 *       server: 'https://kubernetes.default.svc',
 *       namespace: 'default'
 *     },
 *     project: 'default',
 *     syncPolicy: {
 *       automated: {
 *         prune: true,
 *         selfHeal: true
 *       }
 *     }
 *   }
 * };
 * ```
 */
export interface ArgoApplication {
  metadata: Metadata;
  spec: {
    source?: ArgoSource;
    sources?: ArgoSource[];
    destination: ArgoDestination;
    project: string;
    syncPolicy: ArgoSyncPolicy;
  };
  status: ArgoApplicationStatus;
}

/**
 * Represents an ArgoCD ApplicationSet resource
 * @interface ApplicationSet
 * @property {Object} metadata - Metadata about the ArgoCD ApplicationSet
 * @property {string} metadata.name - Name of the ApplicationSet
 * @property {string} metadata.namespace - Kubernetes namespace where the ApplicationSet is deployed
 * @property {Record<string, string>} metadata.labels - Labels attached to the ApplicationSet
 * @property {Record<string, string>} metadata.annotations - Annotations attached to the ApplicationSet
 * @property {Object} status - Current status of the ArgoCD ApplicationSet
 * @property {Array<Object>} status.resources - List of Kubernetes resources managed by the ApplicationSet
 * @property {string} status.resources[].group - API group of the resource
 * @property {string} status.resources[].version - API version of the resource
 * @property {string} status.resources[].kind - Kind of the resource
 * @property {string} status.resources[].namespace - Namespace of the resource
 * @property {string} status.resources[].name - Name of the resource
 * @property {SyncStatus} status.resources[].status - Current status of the resource
 * @property {Object} status.resources[].health - Health status of the resource
 * @property {HealthStatus} status.resources[].health.status - Health status value
 * @property {Array<Object>} [status.conditions] - List of conditions describing the current state of the ApplicationSet
 * @property {string} status.conditions[].type - Type of condition
 * @property {string} status.conditions[].status - Status of the condition
 * @property {string} status.conditions[].lastTransitionTime - Last time the condition transitioned from one status to another
 * @property {string} [status.conditions[].message] - Human-readable message indicating details about the transition
 * @example
 * ```tsx
 * const appSet: ApplicationSet = {
 *   metadata: {
 *     name: 'my-app-set',
 *     namespace: 'argocd',
 *     labels: { 'app.kubernetes.io/name': 'my-app-set' },
 *     annotations: {}
 *   },
 *   status: {
 *     resources: [{
 *       group: 'argoproj.io',
 *       version: 'v1alpha1',
 *       kind: 'Application',
 *       namespace: 'argocd',
 *       name: 'my-app',
 *       status: 'Synced',
 *       health: { status: 'Healthy' }
 *     }]
 *   }
 * };
 * ```
 */
export interface ArgoApplicationSet {
  metadata: {
    name: string;
    namespace: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
  };
  status: {
    resources: Array<{
      group: string;
      version: string;
      kind: string;
      namespace: string;
      name: string;
      status: SyncStatus;
      health: {
        status: HealthStatus;
      };
    }>;
    conditions?: Array<{
      type: string;
      status: string;
      lastTransitionTime: string;
      message?: string;
    }>;
  };
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for an ArgoCD source
 * @interface Source
 * @property {string} repoURL - The URL of the Git repository
 * @property {string} path - The path within the repository
 * @property {string} targetRevision - The target revision to sync to (branch, tag, or commit)
 * @property {object} [helm] - Optional Helm chart configuration
 * @property {object} [kustomize] - Optional Kustomize configuration
 * @property {object} [directory] - Optional directory configuration
 * @property {object} [plugin] - Optional plugin configuration
 */
export interface ArgoSource {
  repoURL: string;
  path: string;
  targetRevision: string;
  helm?: object | undefined;
  kustomize?: object | undefined;
  directory?: object | undefined;
  plugin?: object | undefined;
}

/**
 * Configuration for the destination cluster
 * @interface Destination
 * @property {string} server - The Kubernetes server URL
 * @property {string} namespace - The target namespace in the cluster
 */
export interface ArgoDestination {
  server: string;
  namespace: string;
}

/**
 * Configuration for automated synchronization
 * @interface AutomatedSync
 * @property {boolean} prune - Whether to prune resources that are no longer in the source
 * @property {boolean} selfHeal - Whether to automatically heal when drift is detected
 */
export interface ArgoAutomatedSync {
  prune: boolean;
  selfHeal: boolean;
}

/**
 * Configuration for synchronization policy
 * @interface SyncPolicy
 * @property {AutomatedSync} [automated] - Optional automated sync configuration
 */
export interface ArgoSyncPolicy {
  automated?: ArgoAutomatedSync;
}

// ============================================================================
// Status Types
// ============================================================================

/**
 * Status information for a Kubernetes resource
 * @interface ResourceStatus
 * @property {string} group - The API group of the resource
 * @property {string} version - The API version of the resource
 * @property {string} kind - The kind of the resource
 * @property {string} namespace - The namespace of the resource
 * @property {string} name - The name of the resource
 * @property {string} status - The current status of the resource
 * @property {Object} health - The health status of the resource
 * @property {HealthStatus} health.status - The health status value
 */
export interface ArgoResourceStatus {
  group: string;
  version: string;
  kind: string;
  namespace: string;
  name: string;
  status: string;
  health: {
    status: HealthStatus;
  };
}

/**
 * Status information for an ArgoCD application
 * @interface ApplicationStatus
 * @property {ResourceStatus[]} resources - List of resources managed by the application
 * @property {Object} sync - Synchronization status information
 * @property {SyncStatus} sync.status - The current sync status
 * @property {string} sync.revision - The current revision being synced
 * @property {Object} health - Health status information
 * @property {HealthStatus} health.status - The current health status
 * @property {string} [reconciledAt] - Optional timestamp of the last reconciliation
 */
export interface ArgoApplicationStatus {
  resources: ArgoResourceStatus[];
  sync: {
    status: SyncStatus;
    revision: string;
  };
  health: {
    status: HealthStatus;
  };
  reconciledAt?: string;
}
