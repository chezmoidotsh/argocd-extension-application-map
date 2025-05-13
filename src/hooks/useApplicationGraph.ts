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
    const fetchApplications = async () => {
      const response = await fetch("/api/v1/applications");
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items as ArgoApplication[];
    };

    const fetchApplicationSets = async () => {
      const response = await fetch("/api/v1/applicationsets");
      if (!response.ok) {
        throw new Error(
          `Failed to fetch application sets: ${response.statusText}`,
        );
      }

      const data = await response.json();
      return data.items as ArgoApplicationSet[];
    };

    Promise.all([fetchApplications(), fetchApplicationSets()])
      .then(([applications, applicationSets]) => {
        const graph = new DirectedGraph<ApplicationGraphNode>();

        applications?.forEach((application) => {
          addApplicationToGraph(graph, application);
        });

        applicationSets?.forEach((applicationSet) => {
          addApplicationSetToGraph(graph, applicationSet);
        });

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

/**
 * Adds an application to the graph
 * @param {ApplicationGraph} graph - The application graph to update
 * @param {ArgoApplication} application - The application to add
 */
function addApplicationToGraph(
  graph: ApplicationGraph,
  application: ArgoApplication,
) {
  const aId = resourceId("Application", application.metadata.namespace, application.metadata.name);
  if (!graph.hasNode(aId)) {
    graph.addNode(aId, {
      id: aId,
      position: { x: 0, y: 0 },
      data: convertApplication(application),
    });
  } else {
    // NOTE: the application already exists if a previous application deploys this application
    // NOTE2: application from the API always has the latest status
    graph.updateNodeAttribute(aId, "data", () =>
      convertApplication(application),
    );
  }

  // Creates/updates all deployed applications and links them to this application
  application.status?.resources
    ?.filter(
      (resource) =>
        resource.group === "argoproj.io" &&
        (resource.kind === "Application" || resource.kind === "ApplicationSet"),
    )
    .forEach((resource) => {
      const rId = resourceId(resource.kind, resource.namespace, resource.name);
      if (!graph.hasNode(rId)) {
        graph.addNode(rId, {
          id: rId,
          position: { x: 0, y: 0 },
          data: {
            kind: resource.kind,
            metadata: {
              name: resource.name,
              namespace: resource.namespace,
            },
            status: {
              health: resource.health?.status ?? HealthStatus.Unknown,
              sync: (resource.status as SyncStatus) ?? SyncStatus.Unknown,
            },
          } as Application,
        });
      }
      graph.addEdgeWithKey(
        `${aId} → ${rId}`,
        aId,
        rId,
      );
    });
}

/**
 * Adds an application set to the graph
 * @param {ApplicationGraph} graph - The application graph to update
 * @param {ArgoApplicationSet} applicationSet - The application set to add
 */
function addApplicationSetToGraph(
  graph: ApplicationGraph,
  applicationSet: ArgoApplicationSet,
) {
  const asId = resourceId("ApplicationSet", applicationSet.metadata.namespace, applicationSet.metadata.name);
  if (!graph.hasNode(asId)) {
    graph.addNode(asId, {
      id: asId,
      position: { x: 0, y: 0 },
      data: convertApplicationSet(applicationSet),
    });
  } else {
    // NOTE: the application set already exists if a previous application deploys this application set
    graph.updateNodeAttribute(asId, "data", (old) => ({
      ...convertApplicationSet(applicationSet),
      status: old.status,
    }));
  }

  // Creates/updates all deployed applications and links them to this application set
  applicationSet.status?.resources?.forEach((resource) => {
    const rId = resourceId(resource.kind, resource.namespace, resource.name);
    if (!graph.hasNode(rId)) {
      // WARN: this append when the application is removed but the application set is not aware of it
      return;
    } else {
      graph.addEdgeWithKey(
        `${asId} → ${rId}`,
        asId,
        rId,
      );
    }
  });
}
