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
 * @property {Metadata} metadata - Metadata about the ArgoCD Application
 * @property {Object} spec - Specification of the ArgoCD Application
 * @property {Source} spec.source - Optional source configuration for the application
 * @property {Source[]} spec.sources - Optional sources configuration for the application
 * @property {Destination} spec.destination - Destination configuration for the application
 * @property {string} spec.project - ArgoCD project name
 * @property {SyncPolicy} spec.syncPolicy - Synchronization policy configuration
 * @property {ApplicationStatus} status - Current status of the ArgoCD Application
 */
export interface ArgoApplication {
  kind: "Application";
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

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Configuration for an ArgoCD source
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
 * Status information for an ArgoCD application
 * @property {Object} sync - Synchronization status information
 * @property {SyncStatus} sync.status - The current sync status
 * @property {string} sync.revision - The current revision being synced
 * @property {Object} health - Health status information
 * @property {HealthStatus} health.status - The current health status
 * @property {string} [reconciledAt] - Optional timestamp of the last reconciliation
 */
export interface ArgoApplicationStatus {
  sync: {
    status: SyncStatus;
    revision: string;
  };
  health: {
    status: HealthStatus;
  };
  reconciledAt?: string;
}

// ============================================================================
// Resource Tree Types
// ============================================================================

/**
 * Root structure containing all ArgoCD resources in the tree view
 */
export interface ArgoResourceTree {
  nodes: ArgoResourceNode[];
}

/**
 * Complete ArgoCD resource structure representing a node in the resource tree
 *
 * Resource identification
 * @property {string} group - The API group of the resource (e.g. 'argoproj.io')
 * @property {string} version - The API version of the resource (e.g. 'v1alpha1')
 * @property {'Application' | 'ApplicationSet'} kind - The kind of the resource
 *
 * Resource metadata
 * @property {string} namespace - The namespace where the resource is located
 * @property {string} name - The name of the resource
 * @property {string} uid - The unique identifier of the resource
 * @property {string} resourceVersion - The resource version from Kubernetes
 * @property {string} createdAt - The timestamp when the resource was created
 *
 * Optional properties
 * @property {Object} [health] - Health status of the resource
 * @property {HealthStatus} health.status - Current health status
 * @property {string} health.message - Detailed health status message
 * @property {ArgoResourceParentRef[]} [parentRefs] - References to parent resources
 */
export interface ArgoResourceNode {
  // Resource identification
  group: string;
  version: string;
  kind: "Application" | "ApplicationSet";

  // Resource metadata
  namespace: string;
  name: string;
  uid: string;
  resourceVersion: string;
  createdAt: string;

  // Optional properties
  health?: {
    status: HealthStatus;
    message: string;
  };
  parentRefs?: ArgoResourceParentRef[];
}

/**
 * A reference to a parent resource
 * @property {string} group - The API group of the parent resource
 * @property {string} kind - The kind of the parent resource
 * @property {string} namespace - The namespace of the parent resource
 * @property {string} name - The name of the parent resource
 */
export interface ArgoResourceParentRef {
  group: string;
  kind: string;
  namespace: string;
  name: string;
}
