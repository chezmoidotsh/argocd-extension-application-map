import {
  ApplicationGraph,
  ApplicationGraphNode,
  HealthStatus,
  SyncStatus,
} from "../types";
import { ArgoApplication, ArgoResourceTree } from "../types/argocd";
import { resourceId } from "./resource_id";

/**
 * Updates the application graph with the latest application state and its resource tree
 * @param graph - The application graph to update
 * @param application - The Argo application to process
 * @param resourceTree - The resource tree of the application
 */
export function updateApplicationGraph(
  graph: ApplicationGraph,
  application: ArgoApplication,
  resourceTree: ArgoResourceTree,
): void {
  const appId = resourceId(
    "Application",
    application.metadata.namespace,
    application.metadata.name,
  );

  // Add or update the application node
  if (!graph.hasNode(appId)) {
    graph.addNode(appId, {
      id: appId,
      position: { x: 0, y: 0 },
    } as ApplicationGraphNode);
  }
  graph.setNodeAttribute(appId, "data", {
    kind: "Application",
    metadata: {
      annotations: application.metadata?.annotations,
      labels: application.metadata?.labels,
      name: application.metadata?.name,
      namespace: application.metadata?.namespace,
    },
    spec: {
      sources:
        application.spec?.sources ??
        (application.spec?.source ? [application.spec?.source] : []),
      destination: {
        server: application.spec?.destination.server,
        namespace: application.spec?.destination.namespace,
      },
      project: application.spec?.project,
      syncPolicy: {
        automated: application.spec?.syncPolicy?.automated && {
          prune: application.spec?.syncPolicy?.automated?.prune,
          selfHeal: application.spec?.syncPolicy?.automated?.selfHeal,
        },
      },
    },
    status: {
      health:
        (application.status?.health?.status as HealthStatus) ??
        HealthStatus.Unknown,
      sync:
        (application.status?.sync?.status as SyncStatus) ?? SyncStatus.Unknown,
    },
  });

  // Process each resource from the resource tree
  for (const node of resourceTree.nodes) {
    // We only care about Application and ApplicationSet resources
    if (
      node.group !== "argoproj.io" ||
      (node.kind !== "Application" && node.kind !== "ApplicationSet")
    ) {
      continue;
    }

    const resourceNodeId = resourceId(node.kind, node.namespace, node.name);

    // Add or update the resource node
    if (!graph.hasNode(resourceNodeId)) {
      graph.addNode(resourceNodeId, {
        id: resourceNodeId,
        position: { x: 0, y: 0 },
        data: {
          kind: node.kind,
          metadata: {
            name: node.name,
            namespace: node.namespace,
          },
        },
      } as ApplicationGraphNode);
    }

    // Process parentRefs if they exist
    if (node.parentRefs && node.parentRefs.length > 0) {
      for (const parentRef of node.parentRefs) {
        // Only process Application and ApplicationSet parent references
        if (
          parentRef.group === "argoproj.io" &&
          (parentRef.kind === "Application" ||
            parentRef.kind === "ApplicationSet")
        ) {
          const parentNodeId = resourceId(
            parentRef.kind,
            parentRef.namespace,
            parentRef.name,
          );

          // Add parent node if it doesn't exist
          if (!graph.hasNode(parentNodeId)) {
            graph.addNode(parentNodeId, {
              id: parentNodeId,
              position: { x: 0, y: 0 },
              data: {
                kind: parentRef.kind,
                metadata: {
                  name: parentRef.name,
                  namespace: parentRef.namespace,
                },
              },
            } as ApplicationGraphNode);
          }

          // Add edge from parent to child if it doesn't exist
          if (!graph.hasEdge(parentNodeId, resourceNodeId)) {
            graph.addEdge(parentNodeId, resourceNodeId);
          }
        }
      }
    } else {
      // Add edge from application to resource if it doesn't exist
      if (!graph.hasEdge(appId, resourceNodeId)) {
        graph.addEdge(appId, resourceNodeId);
      }
    }
  }
}
