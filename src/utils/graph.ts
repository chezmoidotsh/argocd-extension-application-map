import { Node as ReactFlowNode, Edge, Position } from "@xyflow/react";
import Dagre, { GraphLabel } from "@dagrejs/dagre";
import {
  Application,
  ApplicationKind,
  ArgoCDApplication,
  ArgoCDApplicationSet,
  HealthStatus,
  SyncStatus,
} from "../types";
import { MultiDirectedGraph } from "graphology";
import {
  convertArgoCDApplicationSetToApplication,
  convertArgoCDApplicationToApplication,
} from "./converters";

/**
 * Constants defining different graph layout directions and their corresponding node positions
 * - LR: Left to Right
 * - RL: Right to Left
 * - TB: Top to Bottom
 * - BT: Bottom to Top
 */
export const RankDirection = {
  LR: {
    rankdir: "LR",
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  RL: {
    rankdir: "RL",
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
  },
  TB: {
    rankdir: "TB",
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  BT: {
    rankdir: "BT",
    sourcePosition: Position.Top,
    targetPosition: Position.Bottom,
  },
} as const;

/**
 * Type representing the direction of graph layout
 */
export type RankDirectionType =
  (typeof RankDirection)[keyof typeof RankDirection];

type Node = Omit<ReactFlowNode, "data"> & { data: Application };

/**
 * Converts a list of ArgoCD applications into a ReactFlow graph
 * @param applications List of ArgoCD applications to visualize
 * @param applicationSets List of ArgoCD application sets to visualize
 * @param opts Layout options for Dagre including rank direction and node dimensions
 * @returns An object containing the graph nodes and edges with calculated positions
 */
export function generateGraph(
  applications: ArgoCDApplication[],
  applicationSets: ArgoCDApplicationSet[],
  opts: Omit<GraphLabel, "rankdir"> & {
    rankdir: RankDirectionType;
    nodeSize: { width: number; height: number };
  },
): {
  nodes: Node[];
  edges: Edge[];
} {
  const defaultProps = {
    width: opts.nodeSize?.width,
    height: opts.nodeSize?.height,
    position: { x: -1000, y: -1000 },
    sourcePosition: opts.rankdir.sourcePosition,
    targetPosition: opts.rankdir.targetPosition,
  };

  // Generate the graph from the application list
  const graph = new MultiDirectedGraph<Node>();

  // Add the applications to the graph
  console.log("applications", applications);
  applications.forEach((app) => {
    if (!app?.metadata?.namespace || !app?.metadata?.name) {
      throw new Error(
        `Application has missing metadata: ${JSON.stringify(app)}`,
      );
    }

    const sourceId = `${app.metadata.namespace}/${app.metadata.name}`;
    if (!graph.hasNode(sourceId)) {
      graph.addNode(sourceId, {
        id: sourceId,
        data: convertArgoCDApplicationToApplication(app),
        ...defaultProps,
      });
    } else {
      // NOTE: if the node already exists, it has been created from application resources
      // so it probably missing some information... so we completly override it with the
      // application definition
      graph.updateNodeAttribute(sourceId, "data", (_) =>
        convertArgoCDApplicationToApplication(app),
      );
    }

    app.status.resources
      ?.filter(
        (resource) =>
          resource.kind === "Application" || resource.kind === "ApplicationSet",
      )
      .forEach((resource) => {
        if (!resource?.namespace || !resource?.name) {
          throw new Error(
            `Resource has missing metadata: ${JSON.stringify(resource)}`,
          );
        }

        const targetId = `${resource.namespace}/${resource.name}`;
        if (!graph.hasNode(targetId)) {
          graph.addNode(targetId, {
            id: targetId,
            data: {
              kind: resource.kind as ApplicationKind,
              metadata: {
                name: resource.name,
                namespace: resource.namespace,
              },
              status: {
                health: resource.health?.status as HealthStatus,
                sync: resource.status as SyncStatus,
              },
            },
            ...defaultProps,
          });
        }
        graph.addEdge(sourceId, targetId);
      });
  });

  // Add the application sets to the graph
  console.log("applicationSets", applicationSets);
  applicationSets.forEach((appSet) => {
    if (!appSet?.metadata?.namespace || !appSet?.metadata?.name) {
      throw new Error(
        `ApplicationSet has missing metadata: ${JSON.stringify(appSet)}`,
      );
    }

    const sourceId = `${appSet.metadata.namespace}/${appSet.metadata.name}`;
    // NOTE: the only case when an ApplicationSet didn't exist in the graph is when
    // the resources has been created outside of an Application.
    if (!graph.hasNode(sourceId)) {
      graph.addNode(sourceId, {
        id: sourceId,
        data: convertArgoCDApplicationSetToApplication(appSet),
        ...defaultProps,
      });
    } else {
      graph.updateNodeAttribute(sourceId, "data", (old) => ({
        metadata: {
          annotations: appSet.metadata.annotations,
          labels: appSet.metadata.labels,
          ...old?.metadata,
        },
        ...old,
      }));
    }

    appSet.status.resources?.forEach((resource) => {
      if (!resource?.namespace || !resource?.name) {
        throw new Error(
          `Resource has missing metadata: ${JSON.stringify(resource)}`,
        );
      }

      const targetId = `${resource.namespace}/${resource.name}`;
      if (!graph.hasNode(targetId)) {
        // NOTE: this should not happen but sometimes occurs when the ReplicaSet
        // has been removed and the resource list isn't updated.
        return;
      }

      graph.addEdge(sourceId, targetId);
    });
  });

  // Apply the dagre layout
  const dagreGraph = new Dagre.graphlib.Graph()
    .setDefaultNodeLabel(() => ({}))
    .setGraph({ ...opts, rankdir: opts.rankdir.rankdir });

  graph.forEachNode((node, attributes) => {
    dagreGraph.setNode(node, {
      width: attributes.width,
      height: attributes.height,
    });
  });
  graph.forEachEdge((_edge, _attributes, source, target) => {
    dagreGraph.setEdge(source, target, {});
  });
  Dagre.layout(dagreGraph);

  // Generate the final nodes and edges
  const nodes = graph.mapNodes((node, attributes): Node => {
    const dagreeNode = dagreGraph.node(node);
    return {
      ...attributes,
      position: {
        x: dagreeNode.x - attributes.width / 2,
        y: dagreeNode.y - attributes.height / 2,
      },
    };
  });
  const edges = graph.mapEdges((edge, _attributes, source, target): Edge => {
    return {
      id: edge,
      source,
      target,
    };
  });

  return { nodes, edges };
}
