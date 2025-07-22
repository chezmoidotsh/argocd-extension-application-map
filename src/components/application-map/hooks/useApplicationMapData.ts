import { DirectedGraph } from 'graphology';

import { Edge, MarkerType } from '@xyflow/react';
import { useMemo } from 'react';

import { ApplicationGraphNode, RankDirectionType, isApplication } from '../../../types';
import { CycleDetectionResult } from '../../../types/cycles';
import { applyLayoutToGraph } from '../../../utils/applyLayoutToGraph';
import type { ApplicationMapNodeType } from '../node';
import { getCycleColor, getCycleEdgeStyle, getCycleInfoForEdge } from '../utils/cycleUtils';

/**
 * Node dimensions for consistent sizing
 */
export const NODE_WIDTH = 282;
export const NODE_HEIGHT = 52;

/**
 * Parameters for generating application map data
 */
interface UseApplicationMapDataParams {
  graph: DirectedGraph<ApplicationGraphNode> | null;
  rankdir: RankDirectionType;
  selectedApplications: string[];
  cycleInfo: CycleDetectionResult;
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
}

/**
 * Return type for the application map data hook
 */
interface ApplicationMapData {
  nodes: ApplicationMapNodeType[];
  edges: Edge[];
}

/**
 * Custom hook that generates nodes and edges for the application map
 * @param params Configuration parameters
 * @returns Object containing nodes and edges for React Flow
 */
export function useApplicationMapData(params: UseApplicationMapDataParams): ApplicationMapData {
  const { graph, rankdir, selectedApplications, cycleInfo, onApplicationClick } = params;

  return useMemo(() => {
    if (!graph || graph.order === 0) {
      return { nodes: [], edges: [] };
    }

    console.debug('[Extension] Generating ApplicationMap nodes and edges from graph:', graph);

    // Prepare graph for layout by injecting dimensions
    const spatialized = graph as DirectedGraph<ApplicationGraphNode & { width: number; height: number }>;
    spatialized.forEachNode((node, attributes) => {
      spatialized.setNodeAttribute(node, 'width', NODE_WIDTH);
      spatialized.setNodeAttribute(node, 'height', NODE_HEIGHT);
    });

    // Apply layout algorithm
    const layouted = applyLayoutToGraph(spatialized, rankdir.rankdir);

    // Generate React Flow nodes
    const nodes = layouted.mapNodes((node, attrs): ApplicationMapNodeType => {
      const isSelection = selectedApplications.length > 0;
      const isSelected = selectedApplications.includes(node);
      const { width, height, ...nodeAttrs } = attrs;

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

    // Generate React Flow edges with cycle styling
    const edges = layouted.mapEdges((edge, _, source, target): Edge => {
      const edgeId = `${source}-${target}`;
      const edgeCycleInfo = getCycleInfoForEdge(edgeId, cycleInfo);

      return {
        // Context properties
        id: edge,
        type: 'smoothstep',
        source,
        target,

        // UI properties - conditional styling based on cycle detection
        style: edgeCycleInfo
          ? getCycleEdgeStyle(edgeCycleInfo.cycleIndex)
          : { stroke: '#777', strokeWidth: 1, strokeDasharray: '3,3', strokeOpacity: 1 },

        // CSS class for cycle edges (enables CSS animations and hover effects)
        className: edgeCycleInfo
          ? `argocd-application-map__cycle-edge argocd-application-map__cycle-edge--cycle-${edgeCycleInfo.cycleIndex}`
          : undefined,

        // Marker styling (arrow head)
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeCycleInfo ? getCycleColor(edgeCycleInfo.cycleIndex) : '#555',
          strokeWidth: 3,
        },

        // Custom data for testing and debugging
        data: {
          isCycle: !!edgeCycleInfo,
          cycleIndex: edgeCycleInfo?.cycleIndex,
          cycleId: edgeCycleInfo?.cycleId,
          testId: edgeCycleInfo ? 'cycle-edge' : 'normal-edge',
        },

        // Interaction properties
        selectable: false,
      };
    });

    console.debug('[Extension] Generated ApplicationMap nodes and edges:', { nodes, edges });
    return { nodes, edges };
  }, [graph, rankdir, selectedApplications, cycleInfo, onApplicationClick]);
}
