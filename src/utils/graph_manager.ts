import { DirectedGraph } from 'graphology';

import { HealthStatus, SyncStatus } from '../types/application';
import { ArgoApplication, ArgoApplicationSet, ManagedResource, isArgoApplicationSet } from '../types/argocd';

/**
 * Defines the attributes stored for each node in the application graph.
 */
export interface ApplicationNodeAttributes {
  kind: 'Application' | 'ApplicationSet';
  name: string;
  namespace: string;
  healthStatus?: HealthStatus;
  syncStatus?: SyncStatus;
}

/**
 * Generates a unique node identifier from a resource's properties.
 * @param resource - The resource for which to create an ID.
 * @returns A unique string ID.
 */
function getNodeId(resource: { kind: string; name: string; namespace: string }): string {
  return `${resource.kind}/${resource.namespace}/${resource.name}`;
}

/**
 * Updates a graphology graph instance based on an SSE event from ArgoCD.
 * This function mutates the graph for performance reasons.
 *
 * @param graph - The graphology instance to update.
 * @param action - The type of event (ADDED, MODIFIED, DELETED).
 * @param payload - The application data from the event.
 */
export function updateGraph(
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>,
  action: 'ADDED' | 'MODIFIED' | 'DELETED',
  payload: ArgoApplication
): void {
  const appNodeId = getNodeId({
    kind: 'Application',
    ...payload.metadata,
  });

  if (action === 'DELETED') {
    if (graph.hasNode(appNodeId)) {
      const parents = graph.inNeighbors(appNodeId);
      graph.dropNode(appNodeId);

      // Remove all parents that are ApplicationSets and have no children
      parents.forEach((parentNodeId) => {
        if (graph.hasNode(parentNodeId)) {
          const isAppSet = isArgoApplicationSet(graph.getNodeAttributes(parentNodeId));
          if (isAppSet && graph.outDegree(parentNodeId) === 0) {
            graph.dropNode(parentNodeId);
          }
        }
      });
    }
    return;
  }

  if (graph.hasNode(appNodeId)) {
    graph.replaceNodeAttributes(appNodeId, payload);

    // Remove stale outgoing edges (resources)
    const existingResourceEdges = graph.outEdges(appNodeId);
    const newResourceNodeIds = new Set<string>();

    if (payload.status?.resources) {
      payload.status.resources.forEach((res) => {
        if (
          (res.kind === 'Application' || res.kind === 'ApplicationSet') &&
          typeof res.name === 'string' &&
          typeof res.namespace === 'string'
        ) {
          newResourceNodeIds.add(getNodeId({ name: res.name, namespace: res.namespace, kind: res.kind }));
        }
      });
    }

    existingResourceEdges.forEach((edge) => {
      const targetNodeId = graph.target(edge);
      if (!newResourceNodeIds.has(targetNodeId)) {
        graph.dropEdge(edge);
      }
    });

    // Remove stale incoming edges (ownerReferences)
    const existingOwnerEdges = graph.inEdges(appNodeId);
    const newOwnerNodeIds = new Set<string>();

    if (payload.metadata.ownerReferences) {
      payload.metadata.ownerReferences.forEach((owner) => {
        newOwnerNodeIds.add(
          getNodeId({
            kind: owner.kind,
            name: owner.name,
            namespace: payload.metadata.namespace,
          })
        );
      });
    }

    existingOwnerEdges.forEach((edge) => {
      const sourceNodeId = graph.source(edge);
      if (graph.hasNode(sourceNodeId)) {
        const sourceAttributes = graph.getNodeAttributes(sourceNodeId);
        // This heuristic assumes that any 'ownerReference' managed dynamically
        // must come from an ApplicationSet. Resource dependencies from Applications
        // are managed by the parent's `outEdges` update logic.
        if (isArgoApplicationSet(sourceAttributes) && !newOwnerNodeIds.has(sourceNodeId)) {
          graph.dropEdge(edge);
        }
      }
    });
  } else {
    graph.addNode(appNodeId, payload);
  }

  if (payload.metadata.ownerReferences) {
    payload.metadata.ownerReferences
      .filter((o) => o.kind === 'ApplicationSet' || o.kind === 'Application')
      .forEach((owner) => {
        const parentNodeId = getNodeId({
          kind: owner.kind,
          name: owner.name,
          namespace: payload.metadata.namespace, // Assuming parent is in the same namespace (cross-namespace OwnerReferences is not supported by Kubernetes)
        });

        if (!graph.hasNode(parentNodeId)) {
          graph.addNode(parentNodeId, {
            kind: owner.kind as 'Application' | 'ApplicationSet',
            metadata: {
              name: owner.name,
              namespace: payload.metadata.namespace,
            },
          });
        }
        graph.mergeDirectedEdgeWithKey(`${parentNodeId}->${appNodeId}`, parentNodeId, appNodeId);
      });
  }

  if (payload.status?.resources) {
    payload.status.resources.forEach((res: ManagedResource) => {
      if (
        (res.kind === 'Application' || res.kind === 'ApplicationSet') &&
        typeof res.name === 'string' &&
        typeof res.namespace === 'string'
      ) {
        const resNodeId = getNodeId({
          kind: res.kind,
          name: res.name,
          namespace: res.namespace,
        });

        if (!graph.hasNode(resNodeId)) {
          graph.addNode(resNodeId, {
            kind: res.kind,
            metadata: {
              name: res.name,
              namespace: res.namespace,
            },
          });
        }
        graph.mergeDirectedEdgeWithKey(`${appNodeId}->${resNodeId}`, appNodeId, resNodeId);
      }
    });
  }
}
