import { useEffect, useState } from "react";
import { ApplicationGraph, ApplicationGraphNode } from "../types";
import { ArgoApplication, ArgoResourceTree } from "../types/argocd";
import { DirectedGraph } from "graphology";
import { updateApplicationGraph } from "../utils";

/**
 * Generic function to fetch a single resource's details from the API
 * @param kind - The kind of resource ('applications' or 'applicationsets')
 * @param name - The name of the resource
 * @param namespace - The namespace of the resource
 * @returns The detailed resource data
 */
async function fetchApplicationDetails(
  name: string,
  namespace: string,
): Promise<{ application: ArgoApplication; resourceTree: ArgoResourceTree }> {
  const details = await fetch(
    `/api/v1/applications/${encodeURIComponent(name)}?appNamespace=${encodeURIComponent(namespace)}`,
  );
  if (!details.ok) {
    throw new Error(
      `Failed to fetch application ${namespace}/${name}: ${details.statusText}`,
    );
  }

  const resourceTree = await fetch(
    `/api/v1/applications/${encodeURIComponent(name)}/resource-tree?appNamespace=${encodeURIComponent(namespace)}`,
  );
  if (!resourceTree.ok) {
    throw new Error(
      `Failed to fetch resource tree for ${namespace}/${name}: ${resourceTree.statusText}`,
    );
  }

  return {
    application: (await details.json()) as ArgoApplication,
    resourceTree: (await resourceTree.json()) as ArgoResourceTree,
  };
}

/**
 * Fetch all applications and their resource trees
 */
async function fetchAllApplications(): Promise<
  Array<{ application: ArgoApplication; resourceTree: ArgoResourceTree }>
> {
  const response = await fetch(`/api/v1/applications`);
  if (!response.ok) {
    throw new Error(`Failed to fetch applications: ${response.statusText}`);
  }

  const data = await response.json();
  const resources = data.items as {
    metadata: { name: string; namespace: string };
  }[];

  return Promise.all(
    resources.map((resource) =>
      fetchApplicationDetails(
        resource.metadata.name,
        resource.metadata.namespace,
      ),
    ),
  );
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
    // Initialize a new graph
    const graph = new DirectedGraph<ApplicationGraphNode>();

    // Fetch all applications
    fetchAllApplications()
      .then((results) => {
        // Process each application and its resource tree
        for (const { application, resourceTree } of results) {
          try {
            // Update the graph with this application and its resource tree
            updateApplicationGraph(graph, application, resourceTree);
          } catch (error) {
            throw new Error(
              `Error processing application ${application.metadata.namespace}/${application.metadata.name}: ${error}`,
            );
          }
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
