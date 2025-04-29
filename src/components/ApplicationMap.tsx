import { ReactFlow, ReactFlowProps, Node, Edge, Position, useNodesState, useEdgesState, MarkerType } from "@xyflow/react"
import { useEffect } from "react"
import Dagre from '@dagrejs/dagre';
import { MultiDirectedGraph } from "graphology";
import { Application } from "../types";
import moment from 'moment';
import ArgoApplicationNode from "./ArgoApplicationNode";

const DEFAULT_NODE_PROPERTIES = {
    // Default position
    position: { x: -1000, y: -1000 },

    // Default node dimensions, based on the ArgoCD design system
    width: 282,
    height: 52,

    // Disable all interactions
    selectable: true,
    draggable: false,
    connectable: false,
    deletable: false,

    // TODO: Handle directional edges
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
}

const ApplicationMap: React.FC<{applications: Application[]}> = ({applications, ...props}) => {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);

    useEffect(() => {
        if (!applications?.length) return;
    
        const graph = new MultiDirectedGraph<Application & {reactflow?: Node}>();

        // Generate the simple relationships between Applications/ApplicationSets
        applications.forEach(app => {
            const appId = `${app.namespace}/${app.name}`;
            if (!graph.hasNode(appId)) { 
                graph.addNode(appId, {
                    ...app,
                    reactflow: {
                        ...DEFAULT_NODE_PROPERTIES,

                        id: appId,
                        data: { label: appId, kind: app.kind },
                    },
                });
            }
            graph.updateNodeAttributes(appId, attr => ({
                ...attr,
                reactflow: {
                    ...attr.reactflow,
                    data: {
                        ...attr.reactflow.data,
                        age: app.creationTimestamp ? moment(app.creationTimestamp).fromNow() : undefined,
                    },
                }
            }));

            app.resources?.forEach(resource => {
                const resourceId = `${resource.namespace}/${resource.name}`;
                if (!graph.hasNode(resourceId)) { 
                    graph.addNode(resourceId, {
                        ...resource,
                        reactflow: {
                            ...DEFAULT_NODE_PROPERTIES,

                            id: resourceId,
                            data: { label: resourceId, kind: resource.kind },
                        },
                    }); }
                graph.addEdge(appId, resourceId);
            });
        });

        // Generate the Nodes and Edges
        const nodes: Node[] = graph.mapNodes((node, attr) => {
            const type = 'application'; // Forcer le type pour les applications
            return {
                ...attr.reactflow,
                type,
                data: {
                    ...attr.reactflow.data,
                    name: attr.name,
                    namespace: attr.namespace,
                    syncStatus: attr.sync?.status,
                    syncStatusColor: attr.sync?.status === 'Synced' ? '#18be94' : '#f4b740',
                    healthStatus: attr.health?.status,
                    age: attr.reactflow.data.age,
                }
            }
        });
        const edges: Edge[] = graph.mapEdges((id, attributes, source, target) => ({
            id,
            type: 'smoothstep',
            source,
            target,
            style: {
                stroke: '#b1b1b1',
                strokeWidth: 2,
                strokeDasharray: '4,4'
            },
            markerEnd: {
                type: MarkerType.ArrowClosed,
            }
        }));

        // Layout the Graph
        const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
        g.setGraph({ rankdir: 'LR' });

        nodes.forEach((node) => g.setNode(node.id, { ...node }));
        edges.forEach((edge) => g.setEdge(edge.source, edge.target));
        Dagre.layout(g);

        // Generate final nodes with positions
        setNodes(nodes.map((node) => ({
            ...node,
            position: {
                x: g.node(node.id).x - DEFAULT_NODE_PROPERTIES.width / 2,
                y: g.node(node.id).y - DEFAULT_NODE_PROPERTIES.height / 2,
            },
        })));
        setEdges(edges);

        console.log('Nodes:', nodes);
        console.log('Edges:', edges);
    }, [applications]);

    return <ReactFlow {...props} nodes={nodes} edges={edges} nodeTypes={{ application: ArgoApplicationNode }} />;
}

export default ApplicationMap;