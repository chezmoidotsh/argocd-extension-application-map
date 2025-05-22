import Dagre from '@dagrejs/dagre';
import * as React from 'react';
import { Edge, MarkerType, MiniMap, ReactFlow, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';
import '../styles/index.scss';
import { ApplicationGraph, HealthStatus, RankDirectionType, SyncStatus } from '../types';
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
 * Generates ReactFlow nodes and edges from the application graph and layout direction
 */
function generateFlowElementsFromGraph(
  graph: ApplicationGraph,
  rankdir: RankDirectionType,
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void,
  onApplicationSetClick?: (event: React.MouseEvent, applicationSetId: string) => void
): { nodes: ApplicationMapNodeType[]; edges: Edge[] } {
  const dagreGraph = generateLayout(graph, rankdir.rankdir);

  const nodes = graph.mapNodes((node, attributes): ApplicationMapNodeType => {
    const { x, y } = dagreGraph.node(node);
    return {
      id: node,
      type: 'application',
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
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
      sourcePosition: rankdir.sourcePosition,
      targetPosition: rankdir.targetPosition,
      selectable: attributes.data.kind !== 'ApplicationSet',
      draggable: false,
      connectable: false,
      deletable: false,
      hidden: false,
    } as ApplicationMapNodeType;
  });

  const edges = graph.mapEdges(
    (edge, _attributes, source, target): Edge => ({
      id: edge,
      type: 'smoothstep',
      source,
      target,
      style: EDGE_STYLES.default,
      markerEnd: MARKER_END.default,
    })
  );

  return { nodes, edges };
}

/**
 * Applies selection status to nodes based on selectedApplications
 */
function applySelectionToFlowNodes(
  nodes: ApplicationMapNodeType[],
  selectedApplications?: string[]
): ApplicationMapNodeType[] {
  if (!selectedApplications?.length) {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        selected: undefined as boolean | undefined,
      },
      markerEnd: MARKER_END.default,
    }));
  } else {
    const selectedNodesIds = selectedApplications.reduce(
      (acc, id) => ({ ...acc, [id]: true }),
      {} as Record<string, boolean>
    );
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        selected: selectedNodesIds[node.id] ? true : (false as boolean),
      },
      markerEnd: selectedNodesIds[node.id] ? MARKER_END.selected : MARKER_END.unselected,
    }));
  }
}

/**
 * The **ApplicationMap** is a visual component that displays an **interactive graph** of ArgoCD applications and their
 * relationships.
 *
 * It provides a way for users to quickly **visualize** application and ApplicationSet resources in a **graphical
 * representation** and explore their **dependencies** and **relationships**, allowing them to understand the structure
 * and status of their ArgoCD environment, making complex deployments more accessible and manageable.
 */
const ApplicationMap: React.FC<{
  graph: ApplicationGraph;
  rankdir: RankDirectionType;

  selectedApplications?: string[];

  onPaneClick?: () => void;
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
  onApplicationSetClick?: (event: React.MouseEvent, applicationSetId: string) => void;
}> = ({
  graph,
  rankdir,
  selectedApplications = [],
  onPaneClick,
  onApplicationClick,
  onApplicationSetClick,
  ...props
}) => {
  const { getNodes, zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const nodeTypes = React.useMemo(() => ({ application: ApplicationMapNode }), []);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  useEffect(() => {
    if (!graph) return;
    const { nodes: layoutedNodes, edges: layoutedEdges } = generateFlowElementsFromGraph(
      graph,
      rankdir,
      onApplicationClick,
      onApplicationSetClick
    );

    setNodes(applySelectionToFlowNodes(layoutedNodes, selectedApplications));
    setEdges(layoutedEdges);
  }, [graph, rankdir, onApplicationClick, onApplicationSetClick]);

  useEffect(() => {
    if (!getNodes().length) return;
    setNodes(applySelectionToFlowNodes(getNodes() as ApplicationMapNodeType[], selectedApplications));
  }, [selectedApplications]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      style={{ width: '100%', height: '100%' }}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
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
