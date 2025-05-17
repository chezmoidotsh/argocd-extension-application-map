import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ApplicationMapNode, {
  ApplicationMapNode_Application,
  ApplicationMapNode_ApplicationSet,
} from "./ApplicationMapNode";
import {
  ApplicationUnion,
  HealthStatus,
  SyncStatus,
} from "../types/application";
import { RankDirection } from "./ApplicationMap";
import { ReactFlowProvider } from "@xyflow/react";
import { action } from "@storybook/addon-actions";

// Mock data for Application
const applicationData: ApplicationUnion = {
  kind: "Application",
  metadata: {
    namespace: "default",
    name: "storybook-app",
  },
  spec: {
    sources: [
      {
        repoURL: "https://github.com/example/repo.git",
        path: "./",
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
  },
};

// Mock data for ApplicationSet
const applicationSetData: ApplicationUnion = {
  kind: "ApplicationSet",
  metadata: {
    namespace: "default",
    name: "storybook-appset",
  },
};

const meta: Meta<typeof ApplicationMapNode> = {
  title: "ApplicationMap/Node",
  component: ApplicationMapNode,
  tags: ["autodocs"],
  decorators: [
    (Story: any) => (
      <ReactFlowProvider>
        <Story />
      </ReactFlowProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ApplicationMapNode>;

export const Application: Story = {
  parameters: {
    controls: {
      // Ignore all properties from NodeProps
      exclude: [
        'deletable',
        'draggable',
        'dragging',
        'dragHandle',
        'height',
        'id',
        'isConnectable',
        'parentId',
        'positionAbsoluteX',
        'positionAbsoluteY',
        'selectable',
        'selected',
        'sourcePosition',
        'targetPosition',
        'type',
        'width',
        'zIndex',
      ],
    },
    deepControls: { enabled: true },
  },
  args: {
    data: applicationData,
    height: 52,
    width: 282,
    selectable: true,
  },
};

export const ApplicationSet: Story = {
  parameters: {
    controls: {
      // Ignore all properties from NodeProps
      exclude: [
        'deletable',
        'draggable',
        'dragging',
        'dragHandle',
        'height',
        'id',
        'isConnectable',
        'parentId',
        'positionAbsoluteX',
        'positionAbsoluteY',
        'selectable',
        'selected',
        'sourcePosition',
        'targetPosition',
        'type',
        'width',
        'zIndex',
      ],
    },
    deepControls: { enabled: true },
  },
  args: {
    data: applicationSetData,
    height: 52,
    width: 282,
  },
};
