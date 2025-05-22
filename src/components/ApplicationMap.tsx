import Dagre from '@dagrejs/dagre';
import * as React from 'react';
import {
  Edge,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import { useEffect } from 'react';
import '../styles/index.scss';
import { ApplicationGraph, HealthStatus, SyncStatus } from '../types';
import ApplicationMapNavigationControls from './ApplicationMapNavigationControls';
import ApplicationMapNode, {
  ApplicationMapNode as ApplicationMapNodeType,
  NODE_HEIGHT,
  NODE_WIDTH,
} from './ApplicationMapNode';

// Style constants
const EDGE_STYLES_DEFAULT = {
  stroke: '#777',
  strokeWidth: 1,
  strokeDasharray: '3,3',
  strokeOpacity: 1,
};
const EDGE_STYLES = {
  default: EDGE_STYLES_DEFAULT,
  selected: {
    ...EDGE_STYLES_DEFAULT,
    strokeDasharray: 'none',
    strokeOpacity: 1,
  },
  unselected: {
    ...EDGE_STYLES_DEFAULT,
    strokeOpacity: 0.25,
  },
} as const;

const MARKER_END_DEFAULT = {
  type: MarkerType.ArrowClosed,
  color: '#555',
  strokeWidth: 3,
};
const MARKER_END = {
  default: MARKER_END_DEFAULT,
  selected: MARKER_END_DEFAULT,
  unselected: {
    ...MARKER_END_DEFAULT,
    opacity: 0.5,
  },
} as const;

const FIT_VIEW_OPTIONS = { maxZoom: 1, minZoom: 0.5 };

/**
 * Props for the ApplicationMap component
 */
interface ApplicationMapProps {
  graph: ApplicationGraph;
  rankdir: RankDirectionType;

  selectedNodes?: string[];
  selectedEdges?: string[];

  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
  onPaneClick?: () => void;
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
  onApplicationSetClick?: (event: React.MouseEvent, applicationSetId: string) => void;
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
    rankdir: 'LR',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  RL: {
    rankdir: 'RL',
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
  },
  TB: {
    rankdir: 'TB',
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  BT: {
    rankdir: 'BT',
    sourcePosition: Position.Top,
    targetPosition: Position.Bottom,
  },
} as const;

/**
 * Type representing the direction of graph layout
 */
export type RankDirectionType = (typeof RankDirection)[keyof typeof RankDirection];

/**
 * Generates a Dagre layout for the given graph
 * @param graph The application graph to layout
 * @param rankdir The direction of the graph layout
 * @returns A Dagre graph with computed layout
 */
const generateLayout = (graph: ApplicationGraph, rankdir: string): Dagre.graphlib.Graph => {
  const dagreGraph = new Dagre.graphlib.Graph().setDefaultNodeLabel(() => ({})).setGraph({ rankdir });

  graph.forEachNode((node) => {
    dagreGraph.setNode(node, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  graph.forEachEdge((_edge, _attributes, source, target) => {
    dagreGraph.setEdge(source, target, {});
  });

  Dagre.layout(dagreGraph);
  return dagreGraph;
};

/**
 * Generic function to preserve styles when updating nodes or edges
 * @param oldItems The existing items (nodes or edges)
 * @param newItems The new items to be set
 * @returns New items with preserved styles from old items
 */
const preserveStyles = <T extends { id: string; style?: any }>(oldItems: T[], newItems: T[]): T[] => {
  const existingStyles = oldItems.reduce((acc, item) => ({ ...acc, [item.id]: item.style }), {} as Record<string, any>);

  return newItems.map((item) => ({
    ...item,
    style: existingStyles[item.id] || item.style,
  }));
};

/**
 * The **ApplicationMap** is a visual component that displays an **interactive graph** of ArgoCD applications and their
 * relationships.
 *
 * It provides a way for users to quickly **visualize** application and ApplicationSet resources in a **graphical
 * representation** and explore their **dependencies** and **relationships**, allowing them to understand the structure
 * and status of their ArgoCD environment, making complex deployments more accessible and manageable.
 */
const ApplicationMap: React.FC<ApplicationMapProps> = ({
  graph,
  rankdir,
  onEdgeClick,
  onPaneClick,
  onApplicationClick,
  onApplicationSetClick,
  selectedNodes = [],
  selectedEdges = [],
  ...props
}) => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const { getNodes, getEdges } = useReactFlow();
  const nodeTypes = React.useMemo(() => ({ application: ApplicationMapNode }), []);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  /**
   * Modifies where the nodes and edges are positioned in the graph based on the rank direction
   */
  useEffect(() => {
    if (!graph) return;

    const dagreGraph = generateLayout(graph, rankdir.rankdir);

    // Generate the final nodes and edges
    const layoutedNodes = graph.mapNodes((node, attributes): ApplicationMapNodeType => {
      const { x, y } = dagreGraph.node(node);
      return {
        // Core properties
        id: node,
        type: 'application',

        // Data properties
        data:
          attributes.data.kind == 'Application'
            ? {
                kind: 'Application',
                name: attributes.data.metadata.name,
                namespace: attributes.data.metadata.namespace,
                health: attributes.data.status?.health ?? HealthStatus.Unknown,
                sync: attributes.data.status?.sync ?? SyncStatus.Unknown,

                onApplicationClick: onApplicationClick,
              }
            : {
                kind: 'ApplicationSet',
                name: attributes.data.metadata.name,
                namespace: attributes.data.metadata.namespace,

                onApplicationSetClick: onApplicationSetClick,
              },

        // Layout properties
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        position: {
          x: x - NODE_WIDTH / 2,
          y: y - NODE_HEIGHT / 2,
        },

        // Connection properties
        sourcePosition: rankdir.sourcePosition,
        targetPosition: rankdir.targetPosition,

        // Interaction properties
        selectable: attributes.data.kind !== 'ApplicationSet',
        draggable: false,
        connectable: false,
        deletable: false,
        hidden: false,
      } as ApplicationMapNodeType;
    });

    const layoutedEdges = graph.mapEdges(
      (edge, _attributes, source, target): Edge => ({
        // Core properties
        id: edge,
        type: 'smoothstep',
        source,
        target,

        // Style properties
        style: EDGE_STYLES.default,
        markerEnd: MARKER_END.default,
      })
    );

    setNodes((old) => preserveStyles(old, layoutedNodes));
    setEdges((old) => preserveStyles(old, layoutedEdges));
  }, [graph, rankdir, onApplicationClick, onApplicationSetClick]);

  /**
   * Handles node selection and updates the node styles accordingly
   */
  useEffect(() => {
    console.log('selectedNodes', selectedNodes);
    if (!getNodes().length) return;
    console.log('selectedNodes', selectedNodes);

    // If no nodes are selected, reset the node styles to the default state
    if (!selectedNodes?.length) {
      setNodes(
        getNodes().map((node) => ({
          ...node,
          data: {
            ...node.data,
            selected: undefined,
          },
          markerEnd: MARKER_END.default,
        }))
      );
    } else {
      console.log('selectedNodes', selectedNodes);
      const selectedNodesIds = selectedNodes.reduce(
        (acc, id) => ({ ...acc, [id]: true }),
        {} as Record<string, boolean>
      );

      setNodes(
        getNodes().map((node) => ({
          ...node,
          data: {
            ...node.data,
            selected: selectedNodesIds[node.id] ? true : false,
          },
          markerEnd: selectedNodesIds[node.id] ? MARKER_END.selected : MARKER_END.unselected,
        }))
      );
    }
  }, [selectedNodes]);

  /**
   * Handles edge selection and updates the edge styles accordingly
   */
  useEffect(() => {
    if (!getEdges().length) return;
    if (!selectedEdges?.length) {
      setEdges(getEdges().map((edge) => ({ ...edge, style: EDGE_STYLES.default })));
    } else {
      const selectedEdgesIds = selectedEdges.reduce(
        (acc, id) => ({ ...acc, [id]: true }),
        {} as Record<string, boolean>
      );

      setEdges(
        getEdges().map((edge) => ({
          ...edge,
          style: selectedEdgesIds[edge.id] ? EDGE_STYLES.selected : EDGE_STYLES.unselected,
        }))
      );
    }
  }, [selectedEdges]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      style={{ width: '100%', height: '100%' }}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
    >
      <MiniMap position="top-right" pannable={true} zoomable={true} aria-label="ArgoCD Application Map Mini Map" />
      <ApplicationMapNavigationControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        fitView={fitView}
        aria-label="ArgoCD Application Map Navigation Controls"
      />
    </ReactFlow>
  );
};

export default ApplicationMap;
