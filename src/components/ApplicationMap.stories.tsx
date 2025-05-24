import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { within } from '@storybook/test';
import { expect } from '@storybook/test';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';
import { HealthStatus, RankDirection, isApplication } from '../types';
import { allStatusScenario, denseScenario as complexTopology } from './.storybook/scenarii';
import Map from './ApplicationMap';

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
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
};

export const ComplexTopology: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root_app_1 = await canvas.findByTestId('rf__node-Application/default/root-app1');
    expect(root_app_1.children[0]).toHaveClass('argocd-application-map__node--default');

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass('argocd-application-map__node--default');
  },
};

export const ComplexTopologyWithSelection: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedApplications: complexTopology.filterNodes(
      (_, attributes) => isApplication(attributes.data) && attributes.data.status.health === HealthStatus.Degraded
    ),
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
    onApplicationSetClick: action('onApplicationSetClick'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root_app_1 = await canvas.findByTestId('rf__node-Application/default/root-app1');
    expect(root_app_1.children[0]).toHaveClass('argocd-application-map__node--unselected');

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass('argocd-application-map__node--selected');
  },
};
