import * as React from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
  Position,
  Node,
  Edge,
} from "@xyflow/react";
import { useEffect } from "react";
import { ApplicationGraph } from "../types";
import ApplicationNode from "./ApplicationNode";
import ApplicationMapNavigationControls from "./ApplicationMapNavigationControls";
import Dagre from "@dagrejs/dagre";

// Constants
const NODE_SIZE = { width: 282, height: 52 };
const EDGE_STYLE = {
  stroke: "#555",
  strokeWidth: 1,
  strokeDasharray: "5,6",
};
const MARKER_END = {
  type: MarkerType.ArrowClosed,
  color: "#555",
  strokeWidth: 3,
};
const FIT_VIEW_OPTIONS = {
  maxZoom: 1,
  minZoom: 0.25,
};

/**
 * Props for the ApplicationMap component
 */
interface ApplicationMapProps {
  graph: ApplicationGraph;
  rankdir: RankDirectionType;
}

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
 * Generates a Dagre layout for the given graph
 * @param graph The application graph to layout
 * @param rankdir The direction of the graph layout
 * @returns A Dagre graph with computed layout
 */
const generateLayout = (
  graph: ApplicationGraph,
  rankdir: string,
): Dagre.graphlib.Graph => {
  const dagreGraph = new Dagre.graphlib.Graph()
    .setDefaultNodeLabel(() => ({}))
    .setGraph({ rankdir });

  graph.forEachNode((node) => {
    dagreGraph.setNode(node, {
      width: NODE_SIZE.width,
      height: NODE_SIZE.height,
    });
  });

  graph.forEachEdge((_edge, _attributes, source, target) => {
    dagreGraph.setEdge(source, target, {});
  });

  Dagre.layout(dagreGraph);
  return dagreGraph;
};

/**
 * ApplicationMap component displays a graph visualization of ArgoCD applications and their relationships
 * @component
 * @example
 * ```tsx
 * <ApplicationMap
 *   applications={applications}
 *   applicationSets={applicationSets}
 * />
 * ```
 */
const ApplicationMap: React.FC<ApplicationMapProps> = ({
  graph,
  rankdir,
  ...props
}) => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  useEffect(() => {
    if (!graph) return;

    const dagreGraph = generateLayout(graph, rankdir.rankdir);

    // Generate the final nodes and edges
    const layoutedNodes = graph.mapNodes((node, attributes): Node => {
      const { x, y } = dagreGraph.node(node);
      return {
        // Core properties
        id: node,
        type: "application",
        data: attributes.data,

        // Layout properties
        position: {
          x: x - NODE_SIZE.width / 2,
          y: y - NODE_SIZE.height / 2,
        },
        width: NODE_SIZE.width,
        height: NODE_SIZE.height,

        // Connection properties
        sourcePosition: rankdir.sourcePosition,
        targetPosition: rankdir.targetPosition,

        // Interaction properties
        selectable: true,
        draggable: false,
        connectable: false,
        deletable: false,
      };
    });

    const layoutedEdges = graph.mapEdges(
      (edge, _attributes, source, target): Edge => ({
        // Core properties
        id: edge,
        type: "smoothstep",
        source,
        target,

        // Style properties
        style: EDGE_STYLE,
        markerEnd: MARKER_END,
      }),
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [graph, rankdir]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={{ application: ApplicationNode }}
      style={{ width: "100%", height: "100%" }}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
    >
      <MiniMap
        position="top-right"
        pannable={true}
        zoomable={true}
        aria-label="ArgoCD Application Map Mini Map"
      />
      <ApplicationMapNavigationControls aria-label="ArgoCD Application Map Navigation Controls" />
    </ReactFlow>
  );
};

export default ApplicationMap;
