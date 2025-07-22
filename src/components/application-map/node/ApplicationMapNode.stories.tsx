import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import { allowCanI } from '../../../mocks/handlers';
import { HealthStatus, SourceDriftStatus, SyncStatus } from '../../../types/application';
import { NODE_HEIGHT, NODE_WIDTH } from '../ApplicationMap';
import ApplicationMapNode from './ApplicationMapNode';

const meta: Meta<typeof ApplicationMapNode> = {
  title: 'Components/Application Map/Node',
  component: ApplicationMapNode,
  tags: ['autodocs'],
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

// Default Application node props
const applicationNodeProps = {
  data: {
    kind: 'Application' as const,
    metadata: { name: 'storybook-app', namespace: 'default' },
    status: {
      health: { status: HealthStatus.Healthy },
      sync: { status: SyncStatus.Synced },
    },
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: () => {
      throw new Error('onApplicationSetClick must not be called on ApplicationNode');
    },
  },
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
};

// Default ApplicationSet node props
const applicationSetNodeProps = {
  data: {
    kind: 'ApplicationSet' as const,
    metadata: { name: 'storybook-appset', namespace: 'default' },
    onApplicationClick: () => {
      throw new Error('onApplicationClick must not be called on ApplicationSetNode');
    },
    onApplicationSetClick: action('onApplicationSetClick'),
  },
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
};

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
    msw: {
      handlers: [allowCanI('applications', 'sync'), allowCanI('applications', 'get')],
    },
  },
  args: applicationNodeProps,
  argTypes: {
    'data.kind': { table: { disable: true } },
    'data.metadata.name': { control: 'text' },
    'data.metadata.namespace': { control: 'text' },
    'data.status.health.status': { control: 'select', options: Object.values(HealthStatus) },
    'data.status.sync.status': { control: 'select', options: Object.values(SyncStatus) },
    'data.selected': { control: 'boolean' },
  } as any,

  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    // Check if the application node is rendered
    const node = await canvas.findByTestId('application-map-node');
    expect(node).not.toBeNull();

    // Check if the application icon is rendered
    const icon = await canvas.findByLabelText('Application icon');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('icon');
    expect(icon).toHaveClass('argo-icon-application');

    // Check if the node kind text is rendered
    const nodeKind = await canvas.findByText('application');
    expect(nodeKind).not.toBeNull();

    // Check if the application name is rendered
    const name = await canvas.findByText('default/storybook-app');
    expect(name).not.toBeNull();

    // Check if the health and sync status icons are rendered
    // The actual icon elements might be harder to target specifically without data-testid
    const nodeContent = node.querySelector('.application-resource-tree__node-content');
    expect(nodeContent).not.toBeNull();

    const statusIcons = nodeContent?.querySelector('.application-resource-tree__node-status-icon');
    expect(statusIcons).not.toBeNull();

    // Test click handler
    await userEvent.click(node);
    // The onApplicationClick action will be called, which is tested by Storybook
  },
};

export const ApplicationDark: Story = {
  ...Application,
  name: 'Application (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
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
  args: applicationSetNodeProps,
  argTypes: {
    'data.kind': { table: { disable: true } },
    'data.metadata.name': { control: 'text' },
    'data.metadata.namespace': { control: 'text' },
    'data.selected': { control: 'boolean' },
  } as any,

  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    // Check if the applicationset node is rendered
    const node = await canvas.findByTestId('application-map-node');
    expect(node).not.toBeNull();

    // Check if the ApplicationSet icon is rendered
    const icon = await canvas.findByLabelText('ApplicationSet icon');
    expect(icon).not.toBeNull();
    expect(icon).toHaveClass('argocd-application-map__node-kind-icon__as-icon');

    // Check if the node kind text is rendered
    const nodeKind = await canvas.findByText('applicationset');
    expect(nodeKind).not.toBeNull();

    // Check if the applicationset name is rendered
    const name = await canvas.findByText('default/storybook-appset');
    expect(name).not.toBeNull();

    // Test click handler
    await userEvent.click(node);
    // The onApplicationSetClick action will be called, which is tested by Storybook
  },
};

export const ApplicationSetDark: Story = {
  ...ApplicationSet,
  name: 'ApplicationSet (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
};

// Source Drift Examples
export const ApplicationWithSourceDrift: Story = {
  ...Application,
  name: 'Application with Source Drift',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'drift-app', namespace: 'production' },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: { status: SyncStatus.Synced },
        drift: SourceDriftStatus.Drift,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story:
          'Application with detected source drift. The drift icon is shown and the "Discard drift" button is enabled.',
      },
    },
  },
  play: undefined,
};

export const ApplicationConformingSource: Story = {
  ...Application,
  name: 'Application Conforming to Source Reference',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'conform-app', namespace: 'staging' },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: { status: SyncStatus.Synced },
        drift: SourceDriftStatus.Conform,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story:
          'Application conforming to its source reference. No drift icon is shown and the "Discard drift" button is disabled.',
      },
    },
  },
  play: undefined,
};

export const ApplicationUnknownDriftStatus: Story = {
  ...Application,
  name: 'Application with Unknown Drift Status',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'unknown-drift-app', namespace: 'development' },
      status: {
        health: { status: HealthStatus.Degraded },
        sync: { status: SyncStatus.OutOfSync },
        drift: SourceDriftStatus.Conform,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story:
          'Application with conforming drift status. This happens when no source reference annotations are found or the application spec is incomplete.',
      },
    },
  },
  play: undefined,
};

export const ApplicationRepositoryDrift: Story = {
  ...Application,
  name: 'Repository URL Drift Example',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'repo-drift-example', namespace: 'production' },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: { status: SyncStatus.Synced },
        drift: SourceDriftStatus.Drift,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story: `Repository URL drift example. 

**Current source**: \`github.com/org/new-repo\`  
**Reference source**: \`github.com/org/old-repo\`

This happens when the application is using a different repository than specified in the source reference annotations.`,
      },
    },
  },
  play: undefined,
};

export const ApplicationPathDrift: Story = {
  ...Application,
  name: 'Path Drift Example',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'path-drift-example', namespace: 'production' },
      status: {
        health: { status: HealthStatus.Progressing },
        sync: { status: SyncStatus.Synced },
        drift: SourceDriftStatus.Drift,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story: `Path drift example.

**Current source**: \`manifests/v2\`  
**Reference source**: \`manifests/v1\`

This happens when the application is using a different path within the repository than specified in the reference annotations.`,
      },
    },
  },
  play: undefined,
};

export const ApplicationRevisionDrift: Story = {
  ...Application,
  name: 'Target Revision Drift Example',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'revision-drift-example', namespace: 'production' },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: { status: SyncStatus.OutOfSync },
        drift: SourceDriftStatus.Drift,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story: `Target revision drift example.

**Current source**: \`feature-branch\`  
**Reference source**: \`main\`

This happens when the application is targeting a different branch, tag, or commit than specified in the reference annotations.`,
      },
    },
  },
  play: undefined,
};

export const ApplicationChartDrift: Story = {
  ...Application,
  name: 'Chart Drift Example',
  args: {
    ...applicationNodeProps,
    data: {
      ...applicationNodeProps.data,
      metadata: { name: 'chart-drift-example', namespace: 'production' },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: { status: SyncStatus.Synced },
        drift: SourceDriftStatus.Drift,
      },
    },
  },
  parameters: {
    ...Application.parameters,
    docs: {
      description: {
        story: `Chart drift example (for Helm applications).

**Current source**: \`nginx-v2\`  
**Reference source**: \`nginx-v1\`

This happens when the Helm chart name differs from the reference specified in the annotations.`,
      },
    },
  },
  play: undefined,
};

export const ApplicationDriftDark: Story = {
  ...ApplicationWithSourceDrift,
  name: 'Application with Source Drift (dark)',
  parameters: {
    ...ApplicationWithSourceDrift.parameters,
    backgrounds: { default: 'dark' },
  },
  play: undefined,
};
