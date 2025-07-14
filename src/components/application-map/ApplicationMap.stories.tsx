import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import '../../styles/index.scss';
import { HealthStatus, RankDirection, isApplication } from '../../types';
import { allStatusScenario, denseScenario as complexTopology } from '../.storybook/scenarii';
import Map from './ApplicationMap';

const meta: Meta<typeof Map> = {
  title: 'Components/Application Map/Map',
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

export const Default: Story = {
  args: {
    graph: allStatusScenario,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
};

export const DefaultDark: Story = {
  ...Default,
  name: 'Default (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
};

export const ComplexTopology: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root_app_1 = await canvas.findByTestId('rf__node-Application/default/root-app1');
    expect(root_app_1.children[0]).toHaveClass('argocd-application-map__node--default');

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass('argocd-application-map__node--default');
  },
};

export const ComplexTopologyDark: Story = {
  ...ComplexTopology,
  name: 'Complex Topology (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
};

export const ComplexTopologyWithSelection: Story = {
  args: {
    graph: complexTopology,
    rankdir: RankDirection.LR,
    selectedApplications: complexTopology.filterNodes(
      (_, attributes) => isApplication(attributes) && attributes.status?.health?.status === HealthStatus.Degraded
    ),
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root_app_1 = await canvas.findByTestId('rf__node-Application/default/root-app1');
    expect(root_app_1.children[0]).toHaveClass('argocd-application-map__node--unselected');

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass('argocd-application-map__node--selected');
  },
};

export const ComplexTopologyWithSelectionDark: Story = {
  ...ComplexTopologyWithSelection,
  name: 'Complex Topology With Selection (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
};
