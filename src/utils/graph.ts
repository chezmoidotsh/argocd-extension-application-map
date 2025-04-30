import { Node, Edge, Position } from "reactflow";
import Dagre, { GraphLabel } from "@dagrejs/dagre";
import { Application } from "../types";
import { MultiDirectedGraph } from "graphology";

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

/**
 * Recursively merges two objects, only replacing values that are not undefined
 * @param target The target object to merge into
 * @param source The source object containing new values
 * @returns The merged object
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        typeof target[key] === "object" &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key] as any);
      } else {
        result[key] = source[key] as any;
      }
    }
  }

  return result;
}

/**
 * Converts a list of ArgoCD applications into a ReactFlow graph
 * @param applications List of ArgoCD applications to visualize
 * @param opts Layout options for Dagre including rank direction and node dimensions
 * @returns An object containing the graph nodes and edges with calculated positions
 */
export function generateGraph(
  applications: Application[],
  opts: Omit<GraphLabel, "rankdir"> & {
    rankdir: RankDirectionType;
    nodeSize: { width: number; height: number };
  },
): {
  nodes: Node<Application>[];
  edges: Edge[];
} {
  const defaultProps = {
    width: opts.nodeSize?.width,
    height: opts.nodeSize?.height,
    position: { x: -1000, y: -1000 },
    sourcePosition: opts.rankdir.sourcePosition,
    targetPosition: opts.rankdir.targetPosition,
  };

  console.debug(`Generating graph from applications:`, applications);
  // Generate the graph from the application list
  const graph = new MultiDirectedGraph<Node<Application>>();
  for (const app of applications) {
    if (!app?.metadata?.namespace || !app?.metadata?.name) {
      throw new Error(
        `Application has missing metadata: ${JSON.stringify(app)}`,
      );
    }

    const sourceId = `${app.metadata.namespace}/${app.metadata.name}`;
    if (!graph.hasNode(sourceId)) {
      graph.addNode(sourceId, { id: sourceId, data: app, ...defaultProps });
    } else {
      graph.updateNodeAttribute(
        sourceId,
        "data",
        (old: Application | undefined) => deepMerge(old || app, app),
      );
    }

    if (app.resources?.length) {
      for (const resource of app.resources) {
        if (!resource?.metadata?.namespace || !resource?.metadata?.name) {
          throw new Error(
            `Resource has missing metadata: ${JSON.stringify(resource)}`,
          );
        }

        const targetId = `${resource.metadata.namespace}/${resource.metadata.name}`;
        if (!graph.hasNode(targetId)) {
          graph.addNode(targetId, {
            id: targetId,
            data: resource,
            ...defaultProps,
          });
        } else {
          graph.updateNodeAttribute(
            targetId,
            "data",
            (old: Application | undefined) =>
              deepMerge(old || resource, resource),
          );
        }

        graph.addEdge(sourceId, targetId);
      }
    }
  }

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
  const nodes = graph.mapNodes((node, attributes): Node<Application> => {
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

  console.debug(`Generated graph:`, { nodes, edges });
  return { nodes, edges };
}
