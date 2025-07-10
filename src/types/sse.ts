/**
 * Type definitions for ArgoCD Server-Sent Events (SSE).
 *
 * These types are derived from the event stream provided by the
 * `/api/v1/stream/applications` endpoint and are used to process
 * real-time application updates.
 */

export type SSEEventType = 'ADDED' | 'MODIFIED' | 'DELETED';

/**
 * Represents a reference to an owner Kubernetes object.
 */
export interface OwnerReference {
  apiVersion: string;
  kind: 'Application' | 'ApplicationSet';
  name: string;
}

/**
 * Represents a resource managed by an ArgoCD Application.
 */
export interface Resource {
  group: string;
  kind: 'Application' | 'ApplicationSet';
  name: string;
  namespace: string;
  version: string;
}

/**
 * Defines the structure of an application object received through the SSE stream.
 * It contains the minimal set of properties required for graph construction and status updates.
 */
export interface SSEApplication {
  metadata: {
    name: string;
    namespace: string;
    ownerReferences?: OwnerReference[];
  };
  status: {
    health: {
      status: string;
    };
    resources: Resource[];
    sync: {
      status: string;
    };
  };
}

/**
 * Represents the top-level event structure from the ArgoCD SSE stream.
 */
export interface SSEEvent {
  result: {
    type: SSEEventType;
    application: SSEApplication;
  };
}
