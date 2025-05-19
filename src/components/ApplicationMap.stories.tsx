import { allStatusScenario, denseScenario } from './.storybook/scenarii';
import Map, { RankDirection } from './ApplicationMap';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

const meta: Meta<typeof Map> = {
  title: 'ApplicationMap/Map',
  component: Map,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div className="argocd-application-map__container">
        <ReactFlowProvider>
          <div style={{ width: '100vw', height: '60vh', background: '#f8f9fa' }}>
            <Story />
          </div>
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
    graph: denseScenario,
    rankdir: RankDirection.LR,
    selectedNodes: [],
    selectedEdges: [],
    onEdgeClick: action('onEdgeClick'),
    onPaneClick: action('onPaneClick'),
  },
};
