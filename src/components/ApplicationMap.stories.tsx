import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';
import { HealthStatus, isApplication } from '../types';
import { allStatusScenario, denseScenario as complexTopology } from './.storybook/scenarii';
import Map, { RankDirection } from './ApplicationMap';

const meta: Meta<typeof Map> = {
  title: 'Components/Application Map/ApplicationMap',
  component: Map,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div className="argocd-application-map__container">
        <ReactFlowProvider>
          <Story />
        </ReactFlowProvider>
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Map>;

export const Basic: Story = {
  args: {
    graph: allStatusScenario,
    rankdir: RankDirection.LR,
    selectedNodes: [],
    selectedEdges: [],
    onEdgeClick: action('onEdgeClick'),
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
};

export const ComplexTopology: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedNodes: [],
    selectedEdges: [],
    onEdgeClick: action('onEdgeClick'),
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
};

export const TopologyWithSelection: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedNodes: complexTopology.filterNodes(
      (_, attributes) => isApplication(attributes.data) && attributes.data.status.health === HealthStatus.Degraded
    ),
    selectedEdges: [],
    onEdgeClick: action('onEdgeClick'),
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
};
