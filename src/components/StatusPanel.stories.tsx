import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import StatusPanel, {
  StatusPanelHealth,
  StatusPanelSync,
} from "./StatusPanel";
import {
  HealthStatus,
  SyncStatus,
  ApplicationUnion,
} from "../types/application";
import { ApplicationGraphNode } from "../types";
import { DirectedGraph } from "graphology";
import { action } from "@storybook/addon-actions";

// Helper to create a mock Application node
function createAppNode(
  id: string,
  data: Partial<ApplicationUnion> & { kind?: "Application" },
) {
  return {
    id,
    data: {
      kind: "Application",
      metadata: { name: id, namespace: "default" },
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
  // Add mapNodes and filterNodes helpers for StatusPanel
  (graph as any).mapNodes = (fn: (id: string, attr: any) => any) => {
    return graph
      .nodes()
      .map((id) => fn(id, { data: graph.getNodeAttribute(id, "data") }));
  };
  (graph as any).filterNodes = (fn: (id: string, attr: any) => boolean) => {
    return graph
      .nodes()
      .filter((id) => fn(id, { data: graph.getNodeAttribute(id, "data") }));
  };
  return graph as any;
}

const meta: Meta<typeof StatusPanel> = {
  title: "Status Panel/StatusPanel",
  component: StatusPanel,
  tags: ["autodocs"],
  subcomponents: {
    StatusPanelHealth: StatusPanelHealth,
    StatusPanelSync: StatusPanelSync,
  },
};
export default meta;
type Story = StoryObj<typeof StatusPanel>;

const degradedNode = createAppNode("app-degraded", {
  status: { health: HealthStatus.Degraded, sync: SyncStatus.OutOfSync },
});
const healthyNode = createAppNode("app-healthy", {
  status: { health: HealthStatus.Healthy, sync: SyncStatus.Synced },
});
const missingNode = createAppNode("app-missing", {
  status: { health: HealthStatus.Missing, sync: SyncStatus.Unknown },
});
const progressingNode = createAppNode("app-progressing", {
  status: { health: HealthStatus.Progressing, sync: SyncStatus.Unknown },
});
const suspendedNode = createAppNode("app-suspended", {
  status: { health: HealthStatus.Suspended, sync: SyncStatus.Unknown },
});

export const AllStatuses: Story = {
  args: {
    graph: makeGraph([
      healthyNode,
      degradedNode,
      progressingNode,
      missingNode,
      suspendedNode,
    ]),
    onFilterUpdated: action("onFilterUpdated"),
  },
};

export const AllHealthy: Story = {
  args: {
    graph: makeGraph([
      createAppNode("app1", {
        status: { health: HealthStatus.Healthy, sync: SyncStatus.Synced },
      }),
      createAppNode("app2", {
        status: { health: HealthStatus.Healthy, sync: SyncStatus.Synced },
      }),
    ]),
    onFilterUpdated: action("onFilterUpdated"),
  },
};

export const WithCycleWarning: Story = {
  args: {
    graph: makeGraph(
      [healthyNode, degradedNode],
      [
        ["app-healthy", "app-degraded"],
        ["app-degraded", "app-healthy"], // cycle
      ],
    ),
    onFilterUpdated: action("onFilterUpdated"),
  },
};

// Stories for StatusPanelHealth
export const HealthStatusExample: Story = {
  render: (args) => (
    <StatusPanelHealth
      statuses={[
        HealthStatus.Healthy,
        HealthStatus.Degraded,
        HealthStatus.Healthy,
        HealthStatus.Missing,
        HealthStatus.Progressing,
        HealthStatus.Healthy,
        HealthStatus.Suspended,
      ]}
      onStatusClick={action("onHealthStatusClick")}
    />
  ),
};
HealthStatusExample.decorators = [
  (Story) => (
    <div className="application-status-panel">
      <Story />
    </div>
  ),
];

// Stories for StatusPanelSync
export const SyncStatusExample: Story = {
  render: (args) => (
    <StatusPanelSync
      statuses={[
        SyncStatus.Synced,
        SyncStatus.OutOfSync,
        SyncStatus.Synced,
        SyncStatus.Unknown,
        SyncStatus.OutOfSync,
      ]}
      onStatusClick={action("onSyncStatusClick")}
    />
  ),
};
SyncStatusExample.decorators = [
  (Story) => (
    <div className="application-status-panel">
      <Story />
    </div>
  ),
];
