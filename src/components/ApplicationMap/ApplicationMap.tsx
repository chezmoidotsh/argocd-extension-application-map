import Dagre from '@dagrejs/dagre';

import * as React from 'react';
import { Edge, MarkerType, ReactFlow, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

import { ApplicationGraph, RankDirectionType, isApplication, isApplicationSet } from '../../types';
import { ApplicationMapNavigationControls } from '../ApplicationMapNavigationControls';
import { ApplicationMapNode, NODE_HEIGHT, NODE_WIDTH } from '../ApplicationMapNode';
import type { ApplicationMapNodeType } from '../ApplicationMapNode';

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
      data: isApplication(attributes)
        ? {
            ...attributes,
            kind: 'Application',
            onApplicationClick: onApplicationClick,
          }
        : isApplicationSet(attributes)
          ? {
              ...attributes,
              kind: 'ApplicationSet',
              onApplicationSetClick: onApplicationSetClick,
            }
          : ({} as any),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      position: {
        x: x - NODE_WIDTH / 2,
        y: y - NODE_HEIGHT / 2,
      },
      sourcePosition: rankdir.sourcePosition,
      targetPosition: rankdir.targetPosition,
      selectable: attributes.kind !== 'ApplicationSet',
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
      style: { stroke: '#777', strokeWidth: 1, strokeDasharray: '3,3', strokeOpacity: 1 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#555', strokeWidth: 3 },
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
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const nodeTypes = React.useMemo(() => ({ application: ApplicationMapNode }), []);

  // Combine node and edge generation with selection application into a single effect
  useEffect(() => {
    if (!graph) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = generateFlowElementsFromGraph(
      graph,
      rankdir,
      onApplicationClick,
      onApplicationSetClick
    );

    const nodesWithSelection = applySelectionToFlowNodes(layoutedNodes, selectedApplications);

    setNodes(nodesWithSelection);
    setEdges(layoutedEdges);
  }, [graph, rankdir, onApplicationClick, onApplicationSetClick, selectedApplications]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      style={{ width: '100%', height: '100%' }}
      fitView
      fitViewOptions={{ maxZoom: 1, minZoom: 0.5 }}
      onPaneClick={onPaneClick}
    >
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
