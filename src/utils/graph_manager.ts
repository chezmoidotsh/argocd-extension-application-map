import { DirectedGraph } from 'graphology';

import { HealthStatus, SyncStatus } from '../types/application';
import { ArgoApplication, ArgoApplicationSet, ManagedResource, isArgoApplicationSet } from '../types/argocd';

/**
 * Generates a unique node identifier from a resource's properties.
 * @param resource - The resource for which to create an ID.
 * @returns A unique string ID.
 */
function getNodeId(resource: { kind: string; name: string; namespace: string }): string {
  return `${resource.kind}/${resource.namespace}/${resource.name}`;
}

/**
 * Handles 'DELETED' events to update the graph.
 *
 * @param graph - The graphology instance to update.
 * @param payload - The application data from the event.
 */
function handleDelete(graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>, payload: ArgoApplication) {
  if (!payload.metadata.name || !payload.metadata.namespace) return;

  const appNodeId = getNodeId({
    kind: 'Application',
    name: payload.metadata.name,
    namespace: payload.metadata.namespace,
  });

  if (!graph.hasNode(appNodeId)) return;

  const parents = graph.inNeighbors(appNodeId);
  graph.dropNode(appNodeId);

  // After deleting a node, check if any of its former parents (ApplicationSets)
  // have become orphaned and remove them.
  parents.forEach((parentNodeId) => {
    if (
      graph.hasNode(parentNodeId) &&
      isArgoApplicationSet(graph.getNodeAttributes(parentNodeId)) &&
      graph.outDegree(parentNodeId) === 0
    ) {
      graph.dropNode(parentNodeId);
    }
  });
}

/**
 * Handles 'ADDED' and 'MODIFIED' events to update the graph.
 *
 * @param graph - The graphology instance to update.
 * @param payload - The application data from the event.
 */
function handleAddOrModify(graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>, payload: ArgoApplication) {
  if (!payload.metadata.name || !payload.metadata.namespace) return;

  const appNodeId = getNodeId({
    kind: 'Application',
    name: payload.metadata.name,
    namespace: payload.metadata.namespace,
  });

  // Add or update the main application node
  graph.hasNode(appNodeId)
    ? graph.replaceNodeAttributes(appNodeId, { kind: 'Application', ...payload })
    : graph.addNode(appNodeId, { kind: 'Application', ...payload });

  updateOwnerReferences(graph, payload, appNodeId);
  updateResourceReferences(graph, payload, appNodeId);
}

/**
 * Updates the graph with owner references, creating parent nodes and edges.
 * It also cleans up stale ownership edges.
 *
 * @param graph - The graphology instance.
 * @param payload - The application data.
 * @param appNodeId - The ID of the current application node.
 */
function updateOwnerReferences(
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>,
  payload: ArgoApplication,
  appNodeId: string
) {
  const newOwnerIds = new Set<string>();
  if (payload.metadata.ownerReferences) {
    for (const owner of payload.metadata.ownerReferences) {
      if (owner.kind !== 'Application' && owner.kind !== 'ApplicationSet') continue;

      const parentNodeId = getNodeId({
        kind: owner.kind,
        name: owner.name,
        namespace: payload.metadata.namespace!,
      });
      newOwnerIds.add(parentNodeId);

      if (!graph.hasNode(parentNodeId)) {
        graph.addNode(parentNodeId, {
          kind: owner.kind,
          metadata: { name: owner.name, namespace: payload.metadata.namespace },
        });
      }
      graph.mergeDirectedEdgeWithKey(`${parentNodeId}->${appNodeId}`, parentNodeId, appNodeId);
    }
  }

  // Clean up stale owner references
  const currentOwners = new Set(graph.inNeighbors(appNodeId));
  for (const ownerId of currentOwners) {
    if (!newOwnerIds.has(ownerId) && isArgoApplicationSet(graph.getNodeAttributes(ownerId))) {
      graph.dropEdge(ownerId, appNodeId);
      if (graph.outDegree(ownerId) === 0) {
        graph.dropNode(ownerId);
      }
    }
  }
}

/**
 * Updates the graph with resource references, creating child nodes and edges.
 * It also cleans up stale resource edges.
 *
 * @param graph - The graphology instance.
 * @param payload - The application data.
 * @param appNodeId - The ID of the current application node.
 */
function updateResourceReferences(
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>,
  payload: ArgoApplication,
  appNodeId: string
) {
  const newResourceNodeIds = new Set<string>();
  if (payload.status?.resources) {
    for (const res of payload.status.resources) {
      if (
        (res.kind === 'Application' || res.kind === 'ApplicationSet') &&
        typeof res.name === 'string' &&
        typeof res.namespace === 'string'
      ) {
        const resNodeId = getNodeId({ kind: res.kind, name: res.name, namespace: res.namespace });
        newResourceNodeIds.add(resNodeId);

        if (!graph.hasNode(resNodeId)) {
          // Add as a stub node
          graph.addNode(resNodeId, {
            kind: res.kind,
            metadata: { name: res.name, namespace: res.namespace },
            status: { health: res.health, sync: { status: res.status } },
          });
        } else {
          updateChildNodeStatus(graph, resNodeId, res);
        }
        graph.mergeDirectedEdgeWithKey(`${appNodeId}->${resNodeId}`, appNodeId, resNodeId);
      }
    }
  }

  // Clean up stale resource references
  const currentChildren = new Set(graph.outNeighbors(appNodeId));
  for (const childId of currentChildren) {
    if (!newResourceNodeIds.has(childId)) {
      graph.dropEdge(appNodeId, childId);
    }
  }
}

/**
 * Updates the status of a child node if its current status is 'Unknown'.
 *
 * @param graph - The graphology instance.
 * @param childNodeId - The ID of the child node to update.
 * @param resource - The resource data from the parent.
 */
function updateChildNodeStatus(
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>,
  childNodeId: string,
  resource: ManagedResource
) {
  const childAttrs = graph.getNodeAttributes(childNodeId) as ArgoApplication;
  const currentHealth = childAttrs.status?.health?.status;
  const currentSync = childAttrs.status?.sync?.status;

  let hasChanges = false;
  if (resource.health && (!currentHealth || currentHealth === HealthStatus.Unknown)) {
    if (!childAttrs.status) (childAttrs as any).status = {};
    childAttrs.status.health = resource.health;
    hasChanges = true;
  }
  if (resource.status && (!currentSync || currentSync === SyncStatus.Unknown)) {
    if (!childAttrs.status) (childAttrs as any).status = {};
    if (!childAttrs.status.sync) (childAttrs.status as any).sync = {};
    childAttrs.status.sync.status = resource.status;
    hasChanges = true;
  }

  if (hasChanges) {
    graph.replaceNodeAttributes(childNodeId, childAttrs);
  }
}

/**
 * Updates the graph based on the action and payload.
 *
 * @param graph - The graphology instance.
 * @param action - The action to perform (ADDED, MODIFIED, DELETED).
 * @param payload - The application data from the event.
 * ---
 * How the graph is updated when an SSE event is received from ArgoCD:
 *
 * 1. updateGraph() is called with action and payload
 * 2. Validate payload (name & namespace must exist)
 * 3. Switch on action:
 *
 *    IF action = DELETED:
 *    └─ handleDelete()
 *       ├─ Check if node exists (exit if not)
 *       ├─ Get parent nodes
 *       ├─ Drop the main node
 *       └─ For each parent: if it's an orphaned ApplicationSet, drop it
 *
 *    IF action = ADDED or MODIFIED:
 *    └─ handleAddOrModify()
 *       ├─ Add new node OR replace existing node attributes
 *       ├─ updateOwnerReferences()
 *       │  ├─ Create/update parent nodes from ownerReferences
 *       │  ├─ Create edges from parents to current node
 *       │  └─ Clean up stale owner references (drop orphaned ApplicationSets)
 *       └─ updateResourceReferences()
 *          ├─ For each resource in status.resources:
 *          │  ├─ Create new stub node OR updateChildNodeStatus()
 *          │  └─ Create edge from current node to resource
 *          └─ Clean up stale resource references (drop unused edges)
 *
 * The updateChildNodeStatus() function is only called when a resource node
 * already exists and we need to update its status from Unknown to Known.
 */
export function updateGraph(
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>,
  action: 'ADDED' | 'MODIFIED' | 'DELETED',
  payload: ArgoApplication
): void {
  if (!payload.metadata?.name || !payload.metadata?.namespace) {
    console.warn('Skipping updateGraph: missing name or namespace in metadata', payload);
    return;
  }

  switch (action) {
    case 'DELETED':
      handleDelete(graph, payload);
      break;
    case 'ADDED':
    case 'MODIFIED':
      handleAddOrModify(graph, payload);
      break;
  }
}
