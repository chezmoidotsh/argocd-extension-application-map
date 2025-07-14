import { DirectedGraph } from 'graphology';

import * as React from 'react';
import { Edge, MarkerType, ReactFlow, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useEffect } from 'react';

import { RankDirectionType, isApplication } from '../../types';
import { ArgoApplication, ArgoApplicationSet } from '../../types/argocd';
import { applyLayoutToGraph } from '../../utils/graph';
import { ApplicationMapNavigationControls } from '../ApplicationMapNavigationControls';
import { ApplicationMapNode } from './node';
import type { ApplicationMapNodeType } from './node';

/**
 * Node width and height constants for the application map nodes.
 * These dimensions are used to ensure consistent sizing across the application map and to
 * be the same as the dimensions used in ArgoCD UI.
 */
export const NODE_WIDTH = 282;
export const NODE_HEIGHT = 52;

/**
 * The **ApplicationMapProps** interface defines the properties for the ApplicationMap component.
 *
 * @property graph - The application graph to display, containing nodes and edges representing applications and their relationships.
 * @property rankdir - The direction of the graph layout (e.g., "LR" for left-to-right).
 * @property selectedApplications - A list of application IDs that are currently selected in the graph.
 * @property onPaneClick - Callback function triggered when the pane is clicked.
 * @property onApplicationClick - Callback function triggered when an application node is clicked.
 */
type ApplicationMapProps = {
  graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>;
  rankdir: RankDirectionType;

  selectedApplications?: string[];

  onPaneClick?: () => void;
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
};

/**
 * The **ApplicationMap** is a visual component that displays an **interactive graph** of ArgoCD applications and their
 * relationships.
 *
 * It provides a way for users to quickly **visualize** application and ApplicationSet resources in a **graphical
 * representation** and explore their **dependencies** and **relationships**, allowing them to understand the structure
 * and status of their ArgoCD environment, making complex deployments more accessible and manageable.
 *
 * @param props - The properties passed to the ApplicationMap component.
 */
const ApplicationMap: React.FC<ApplicationMapProps> = ({
  graph,
  rankdir,
  selectedApplications = [],
  onPaneClick,
  onApplicationClick,
  ...props
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const nodeTypes = React.useMemo(() => ({ application: ApplicationMapNode }), []);

  // Combine node and edge generation with selection application into a single effect
  useEffect(() => {
    if (!graph || graph.order === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    console.debug('[Extension] Generating ApplicationMap nodes and edges from graph:', graph);
    const spatialized = graph as DirectedGraph<
      (ArgoApplication | ArgoApplicationSet) & { width: number; height: number }
    >;

    // NOTE: inject width and height attributes to the graph nodes in order to be able to use them in the layout
    spatialized.forEachNode((node, attributes) => {
      spatialized.setNodeAttribute(node, 'width', NODE_WIDTH);
      spatialized.setNodeAttribute(node, 'height', NODE_HEIGHT);
    });

    // Apply the layout to the graph
    const layouted = applyLayoutToGraph(spatialized, rankdir.rankdir);

    // Generate React Flow nodes and edges from the layouted graph
    const nodes = layouted.mapNodes((node, attrs): ApplicationMapNodeType => {
      const isSelection = selectedApplications.length > 0;
      const isSelected = selectedApplications.includes(node);
      const { width, height, ...nodeAttrs } = attrs;

      // Prepare the node for React Flow with necessary properties
      return {
        // Context properties
        id: node,
        type: 'application',
        data: {
          ...nodeAttrs,
          selected: isSelection ? isSelected : undefined,
          onApplicationClick: isApplication(nodeAttrs) ? onApplicationClick : undefined,
        },

        // UI properties
        width,
        height,
        position: { x: attrs.x, y: attrs.y },
        sourcePosition: rankdir.sourcePosition,
        targetPosition: rankdir.targetPosition,

        // Interaction properties
        selectable: true,
        draggable: false,
        connectable: false,
        deletable: false,
      };
    });

    const edges = layouted.mapEdges(
      (edge, _, source, target): Edge => ({
        id: edge,
        type: 'smoothstep',
        source,
        target,
        style: { stroke: '#777', strokeWidth: 1, strokeDasharray: '3,3', strokeOpacity: 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#555', strokeWidth: 3 },
      })
    );

    // Save the nodes and edges to state
    console.debug('[Extension] Generated ApplicationMap nodes and edges:', { nodes, edges });
    setNodes(nodes);
    setEdges(edges);
  }, [graph, rankdir, onApplicationClick, selectedApplications]);

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
