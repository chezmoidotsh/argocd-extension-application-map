import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import { allowCanI } from '../../../mocks/handlers';
import '../../../styles/index.scss';
import { HealthStatus, SyncStatus } from '../../../types/application';
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
