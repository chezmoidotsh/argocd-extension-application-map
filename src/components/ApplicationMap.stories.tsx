import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import Map, { RankDirection } from "./ApplicationMap";
import { ReactFlowProvider } from "@xyflow/react";
import { DirectedGraph } from "graphology";
import {
  ApplicationUnion,
  HealthStatus,
  SyncStatus,
} from "../types/application";
import { ApplicationGraphNode } from "../types";
import { action } from "@storybook/addon-actions";
import "@xyflow/react/dist/style.css";

// Helpers to create mock nodes and graph (adapted from StatusPanel.stories)
function createAppNode(
  id: string,
  data: Partial<ApplicationUnion> & { kind?: "Application" | "ApplicationSet" },
) {
  return {
    id,
    data: {
      kind: data.kind || "Application",
      metadata: { name: id, namespace: "default" },
      ...(data.kind === "ApplicationSet"
        ? {}
        : {
            spec: {
              sources: [
                {
                  repoURL: "https://github.com/example/repo.git",
                  path: ".",
                  targetRevision: "main",
                },
              ],
              destination: {
                server: "https://kubernetes.default.svc",
                namespace: "default",
              },
              project: "default",
              syncPolicy: {},
            },
            status: {
              health: HealthStatus.Healthy,
              sync: SyncStatus.Synced,
              ...data.status,
            },
          }),
      ...data,
    } as ApplicationUnion,
    position: { x: 0, y: 0 },
    width: 100,
    height: 40,
    selected: false,
    dragging: false,
    draggable: false,
    selectable: false,
    positionAbsolute: { x: 0, y: 0 },
    draggingHandle: null,
    zIndex: 0,
    parentNode: undefined,
    extent: undefined,
    sourcePosition: undefined,
    targetPosition: undefined,
    hidden: false,
    dataType: undefined,
  } as ApplicationGraphNode;
}

function makeGraph(
  nodes: ApplicationGraphNode[],
  edges: Array<[string, string]> = [],
) {
  const graph = new DirectedGraph<ApplicationGraphNode>();
  nodes.forEach((node) => graph.addNode(node.id, node));
  edges.forEach(([from, to]) => graph.addEdge(from, to));
  // Add mapNodes and mapEdges helpers for ApplicationMap
  (graph as any).mapNodes = (fn: (id: string, attr: any) => any) => {
    return graph
      .nodes()
      .map((id) => fn(id, { data: graph.getNodeAttribute(id, "data") }));
  };
  (graph as any).mapEdges = (
    fn: (edge: string, attr: any, source: string, target: string) => any,
  ) => {
    return graph.edges().map((edge) => {
      const source = graph.source(edge);
      const target = graph.target(edge);
      return fn(edge, {}, source, target);
    });
  };
  return graph as any;
}

const meta: Meta<typeof Map> = {
  title: "ApplicationMap/Map",
  component: Map,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="argocd-application-map__container">
        <ReactFlowProvider>
          <div
            style={{ width: "100vw", height: "60vh", background: "#f8f9fa" }}
          >
            <Story />
          </div>
        </ReactFlowProvider>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Map>;

const appNode = createAppNode("app-1", {
  kind: "Application",
  status: { health: HealthStatus.Healthy, sync: SyncStatus.Synced },
});
const appSetNode = createAppNode("appset-1", { kind: "ApplicationSet" });

export const Basic: Story = {
  args: {
    graph: makeGraph([appNode, appSetNode], [["app-1", "appset-1"]]),
    rankdir: RankDirection.LR,
    selectedNodes: [],
    selectedEdges: [],
    onEdgeClick: action("onEdgeClick"),
    onPaneClick: action("onPaneClick"),
  },
};
