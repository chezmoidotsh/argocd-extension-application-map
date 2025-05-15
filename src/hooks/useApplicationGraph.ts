import { useEffect, useState } from "react";
import { Application } from "../types";
import {
  ApplicationGraph,
  ApplicationGraphNode,
  HealthStatus,
  SyncStatus,
} from "../types";
import { ArgoApplication, ArgoApplicationSet } from "../types/argocd";
import { DirectedGraph } from "graphology";
import { convertApplication, convertApplicationSet } from "../utils/converters";

/**
 * Generic function to fetch a single resource's details from the API
 * @param kind - The kind of resource ('applications' or 'applicationsets')
 * @param name - The name of the resource
 * @param namespace - The namespace of the resource
 * @returns The detailed resource data
 */
async function fetchResourceDetails<
  T extends ArgoApplication | ArgoApplicationSet,
>(
  kind: "applications" | "applicationsets",
  name: string,
  namespace: string,
): Promise<T> {
  const paramName =
    kind === "applications" ? "appNamespace" : "appsetNamespace";
  const response = await fetch(
    `/api/v1/${kind}/${encodeURIComponent(name)}?${paramName}=${encodeURIComponent(namespace)}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${kind.slice(0, -1)} ${namespace}/${name} details: ${response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

/**
 * Generic function to fetch all resources of a specific type from the API
 * @param kind - The kind of resource ('applications' or 'applicationsets')
 * @returns Array of detailed resource data
 */
async function fetchAllResources<
  T extends ArgoApplication | ArgoApplicationSet,
>(kind: "applications" | "applicationsets"): Promise<T[]> {
  const response = await fetch(`/api/v1/${kind}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${kind}: ${response.statusText}`);
  }

  const data = await response.json();
  const resources = data.items as {
    metadata: { name: string; namespace: string };
  }[];

  return Promise.all(
    resources.map((resource) =>
      fetchResourceDetails<T>(
        kind,
        resource.metadata.name,
        resource.metadata.namespace,
      ),
    ),
  );
}

/**
 * Generates a unique ID for a resource in the format kind/namespace/name
 * @param kind - The kind of the resource
 * @param namespace - The namespace of the resource
 * @param name - The name of the resource
 * @returns The generated ID
 */
function resourceId(kind: string, namespace: string, name: string): string {
  return `${kind}/${namespace}/${name}`;
}

/**
 * Adds an application to the graph
 * @param {ApplicationGraph} graph - The application graph to update
 * @param {ArgoApplication} application - The application to add
 */
async function addApplicationToGraph(
  graph: DirectedGraph,
  application: ArgoApplication,
): Promise<void> {
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
      data: convertApplication(application),
    } as ApplicationGraphNode);
  } else {
    graph.updateNodeAttribute(appId, "data", (old) => ({
      ...old,
      status: {
        health:
          (application.status?.health?.status as HealthStatus) ||
          HealthStatus.Unknown,
        sync:
          (application.status?.sync?.status as SyncStatus) ||
          SyncStatus.Unknown,
      },
    }));
  }

  try {
    // Process each resource from the application status
    for (const resource of application.status?.resources?.filter(
      (r) =>
        r.group === "argoproj.io" &&
        (r.kind === "Application" || r.kind === "ApplicationSet"),
    ) || []) {
      const resourceNodeId = resourceId(
        resource.kind,
        resource.namespace,
        resource.name,
      );

      // Add or update the resource node
      if (!graph.hasNode(resourceNodeId)) {
        graph.addNode(resourceNodeId, {
          id: resourceNodeId,
          position: { x: 0, y: 0 },
          data: {
            kind: resource.kind,
            metadata: {
              name: resource.name,
              namespace: resource.namespace,
            },
            status: {
              health:
                (resource.health?.status as HealthStatus) ||
                HealthStatus.Unknown,
              sync: (resource.status as SyncStatus) || SyncStatus.Unknown,
            },
          } as Application,
        } as ApplicationGraphNode);
      }

      // Add or ensure edge exists from application to resource
      if (!graph.hasEdge(appId, resourceNodeId)) {
        graph.addEdge(appId, resourceNodeId);
      }
    }
  } catch (error) {
    console.error(
      `Error fetching application ${application.metadata.namespace}/${application.metadata.name} details:`,
      error,
    );
    throw error;
  }
}

/**
 * Adds an application set to the graph
 * @param {ApplicationGraph} graph - The application graph to update
 * @param {ArgoApplicationSet} applicationSet - The application set to add
 */
async function addApplicationSetToGraph(
  graph: ApplicationGraph,
  applicationSet: ArgoApplicationSet,
): Promise<void> {
  const asId = resourceId(
    "ApplicationSet",
    applicationSet.metadata.namespace,
    applicationSet.metadata.name,
  );

  // Add or update the ApplicationSet node
  if (!graph.hasNode(asId)) {
    graph.addNode(asId, {
      id: asId,
      position: { x: 0, y: 0 },
      data: convertApplicationSet(applicationSet),
    });
  }

  try {
    // Creates/updates all deployed applications and links them to this application set
    applicationSet.status?.resources?.forEach((resource) => {
      const rId = resourceId(resource.kind, resource.namespace, resource.name);
      if (!graph.hasNode(rId)) {
        // WARN: this happens when the application is removed but the application set is not aware of it
        return;
      }
      graph.addEdgeWithKey(`${asId} → ${rId}`, asId, rId);
    });
  } catch (error) {
    console.error(
      `Error fetching ApplicationSet ${applicationSet.metadata.namespace}/${applicationSet.metadata.name} details:`,
      error,
    );
    throw error;
  }
}

/**
 * Hook to fetch the application graph
 */
export const useApplicationGraph = (): {
  isLoading: boolean;
  graph: ApplicationGraph | null;
  error: Error | null;
} => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [graph, setGraph] = useState<ApplicationGraph | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Promise.all([
      fetchAllResources<ArgoApplication>("applications"),
      fetchAllResources<ArgoApplicationSet>("applicationsets"),
    ])
      .then(async ([applications, applicationSets]) => {
        const graph = new DirectedGraph<ApplicationGraphNode>();

        // First, add all applications to the graph
        for (const application of applications) {
          await addApplicationToGraph(graph, application);
        }

        // Then process all ApplicationSets
        for (const applicationSet of applicationSets) {
          await addApplicationSetToGraph(graph, applicationSet);
        }

        setGraph(graph);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError(error);
        setIsLoading(false);
      });
  }, []);

  return {
    isLoading,
    graph,
    error,
  };
};
