import { SyncStatus, HealthStatus } from "./application";

/**
 * Represents an ArgoCD Application resource
 * @interface ArgoCDApplication
 * @example
 * ```tsx
 * const app: ArgoCDApplication = {
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
export interface ArgoCDApplication {
  /**
   * Metadata about the ArgoCD Application
   * @type {Object}
   */
  metadata: Metadata;
  /**
   * Specification of the ArgoCD Application
   * @type {Object}
   */
  spec: {
    /**
     * Source configuration for the application
     * @type {Object}
     */
    source: SourceConfig;
    /**
     * Destination configuration for the application
     * @type {Object}
     */
    destination: DestinationConfig;
    /** ArgoCD project name */
    project: string;
    /**
     * Synchronization policy configuration
     * @type {Object}
     */
    syncPolicy: SyncPolicy;
  };
  /**
   * Current status of the ArgoCD Application
   * @type {Object}
   */
  status: ApplicationStatus;
}

/**
 * Represents an ArgoCD ApplicationSet resource
 * @interface ArgoCDApplicationSet
 * @example
 * ```tsx
 * const appSet: ArgoCDApplicationSet = {
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
export interface ArgoCDApplicationSet {
  /**
   * Metadata about the ArgoCD ApplicationSet
   * @type {Object}
   */
  metadata: {
    /** Name of the ApplicationSet */
    name: string;
    /** Kubernetes namespace where the ApplicationSet is deployed */
    namespace: string;
    /** Labels attached to the ApplicationSet */
    labels: Record<string, string>;
    /** Annotations attached to the ApplicationSet */
    annotations: Record<string, string>;
  };
  /**
   * Current status of the ArgoCD ApplicationSet
   * @type {Object}
   */
  status: {
    /**
     * List of Kubernetes resources managed by the ApplicationSet
     * @type {Array<ResourceStatus>}
     */
    resources: Array<{
      /** API group of the resource */
      group: string;
      /** API version of the resource */
      version: string;
      /** Kind of the resource */
      kind: string;
      /** Namespace of the resource */
      namespace: string;
      /** Name of the resource */
      name: string;
      /** Current status of the resource */
      status: SyncStatus;
      /**
       * Health status of the resource
       * @type {Object}
       */
      health: {
        /** Health status (e.g., Healthy, Degraded, Progressing) */
        status: HealthStatus;
      };
    }>;
    /**
     * List of conditions describing the current state of the ApplicationSet
     * @type {Array<Condition>}
     */
    conditions?: Array<{
      /** Type of condition */
      type: string;
      /** Status of the condition */
      status: string;
      /** Last time the condition transitioned from one status to another */
      lastTransitionTime: string;
      /** Human-readable message indicating details about the transition */
      message?: string;
    }>;
  };
}

/**
 * Interface for common metadata fields
 */
export interface Metadata {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

/**
 * Interface for source configuration
 */
export interface SourceConfig {
  repoURL: string;
  path: string;
  targetRevision: string;
}

/**
 * Interface for destination configuration
 */
export interface DestinationConfig {
  server: string;
  namespace: string;
}

/**
 * Interface for automated sync policy
 */
export interface AutomatedSyncPolicy {
  prune: boolean;
  selfHeal: boolean;
}

/**
 * Interface for sync policy
 */
export interface SyncPolicy {
  automated: AutomatedSyncPolicy;
}

/**
 * Interface for resource status
 */
export interface ResourceStatus {
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
 * Interface for application status
 */
export interface ApplicationStatus {
  resources: ResourceStatus[];
  sync: {
    status: SyncStatus;
    revision: string;
  };
  health: {
    status: HealthStatus;
  };
  reconciledAt?: string;
}
