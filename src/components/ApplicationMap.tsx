import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import { useEffect } from "react";
import { ArgoCDApplicationSet, ArgoCDApplication } from "../types";
import ApplicationNode from "./ArgoApplicationNode";
import { generateGraph, RankDirection } from "../utils/graph";

const ApplicationMap: React.FC<{
  applications: ArgoCDApplication[];
  applicationSets: ArgoCDApplicationSet[];
}> = ({ applications, applicationSets, ...props }) => {
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

    console.log("Nodes:", layoutedNodes);
    console.log("Edges:", layoutedEdges);
  }, [applications, applicationSets]);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={{ application: ApplicationNode }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default ApplicationMap;
