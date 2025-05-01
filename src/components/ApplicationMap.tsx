import * as React from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
  MiniMap,
} from "@xyflow/react";
import { useEffect } from "react";
import { ArgoCDApplicationSet, ArgoCDApplication } from "../types";
import ApplicationNode from "./ApplicationNode";
import { generateGraph, RankDirection } from "../utils/graph";
import MapNavigationControls from "./MapNavigationControls";

/**
 * Props for the ApplicationMap component
 */
interface ApplicationMapProps {
  /** List of ArgoCD applications to display */
  applications: ArgoCDApplication[];
  /** List of ArgoCD application sets to display */
  applicationSets: ArgoCDApplicationSet[];
}

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
  applications,
  applicationSets,
  ...props
}) => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  useEffect(() => {
    if (!applications?.length || !applicationSets?.length) return;

    const { nodes, edges } = generateGraph(applications, applicationSets, {
      rankdir: RankDirection.LR,
      nodeSize: { width: 282, height: 52 },
    });

    const layoutedNodes = nodes.map((node) => ({
      ...node,
      type: "application",
      // Disable all interactions
      selectable: true,
      draggable: false,
      connectable: false,
      deletable: false,
    }));

    const layoutedEdges = edges.map((edge) => ({
      ...edge,
      type: "smoothstep",
      style: {
        stroke: "#555",
        strokeWidth: 1,
        strokeDasharray: "5,6",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#555",
        strokeWidth: 3,
      },
    }));

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [applications, applicationSets]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={{ application: ApplicationNode }}
      style={{ width: "100%", height: "100%" }}
      fitView
    >
      <MiniMap
        position="top-right"
        pannable={true}
        zoomable={true}
        aria-label="ArgoCD Application Map Mini Map"
      />
      <MapNavigationControls aria-label="ArgoCD Application Map Navigation Controls" />
    </ReactFlow>
  );
};

export default ApplicationMap;
