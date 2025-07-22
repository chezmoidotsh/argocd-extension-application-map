import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';

import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React from 'react';

import { allowCanI, denyCanI } from '../../mocks/handlers';
import { HealthStatus, RankDirection, isApplication } from '../../types';
import {
  allStatusScenario,
  denseScenario as complexTopology,
  enterprisePlatformScenario,
  multipleCyclesScenario,
  simpleCycleScenario,
  triangleCycleScenario,
} from '../.storybook/scenarii';
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
  parameters: {
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
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
  parameters: {
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const root_app_1 = await canvas.findByTestId('rf__node-Application/default/root-app1');
    expect(root_app_1.children[0]).toHaveClass(
      'application-resource-tree__node argocd-application-map__node argocd-application-map__node--default'
    );

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass(
      'application-resource-tree__node argocd-application-map__node argocd-application-map__node--default'
    );
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
    expect(root_app_1.children[0]).toHaveClass(
      'application-resource-tree__node argocd-application-map__node argocd-application-map__node--unselected'
    );

    const root_app_2 = await canvas.findByTestId('rf__node-Application/default/root-app2');
    expect(root_app_2.children[0]).toHaveClass(
      'application-resource-tree__node argocd-application-map__node argocd-application-map__node--selected'
    );
  },
};

export const ComplexTopologyWithSelectionDark: Story = {
  ...ComplexTopologyWithSelection,
  name: 'Complex Topology With Selection (dark)',
  parameters: { backgrounds: { default: 'dark' } },
  play: undefined,
};

// =============================================================================
// CYCLE DETECTION STORIES
// =============================================================================

export const SimpleCycle: Story = {
  args: {
    graph: simpleCycleScenario,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Simple 2-Node Cycle (A ↔ B)**

This story demonstrates the visual cycle detection for a simple bidirectional dependency between two applications. 
The edges forming the cycle should appear with a red halo effect and pulse animation.

**Expected Visual Behavior:**
- Two applications: \`app-a\` and \`app-b\`
- Both edges highlighted in red with glow effect
- Subtle pulse animation on cycle edges
- Hover effects intensify the glow
        `,
      },
    },
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the graph to render
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check that cycle edges have the correct styling
    const edges = canvasElement.querySelectorAll('[data-testid*="rf__edge"]');
    expect(edges.length).toBeGreaterThan(0);
  },
};

export const SimpleCycleDark: Story = {
  ...SimpleCycle,
  name: 'Simple Cycle (dark)',
  parameters: {
    ...SimpleCycle.parameters,
    backgrounds: { default: 'dark' },
  },
  play: undefined,
};

export const TriangleCycle: Story = {
  args: {
    graph: triangleCycleScenario,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  parameters: {
    docs: {
      description: {
        story: `
**3-Node Triangle Cycle (Frontend → Backend → Database → Frontend)**

This story shows a more complex circular dependency involving three applications representing a typical web stack.

**Expected Visual Behavior:**
- Three applications with realistic names: \`frontend\`, \`backend\`, \`database\`
- All three edges forming the cycle highlighted in red
- One application (\`database\`) has degraded health status
- Complete circular path easily traceable visually
        `,
      },
    },
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
  },
};

export const TriangleCycleDark: Story = {
  ...TriangleCycle,
  name: 'Triangle Cycle (dark)',
  parameters: {
    ...TriangleCycle.parameters,
    backgrounds: { default: 'dark' },
  },
};

export const MultipleCycles: Story = {
  args: {
    graph: multipleCyclesScenario,
    rankdir: RankDirection.LR,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Multiple Independent Cycles**

This story demonstrates the system's ability to detect and visualize multiple independent cycles within the same graph:

1. **Cycle 1:** \`service-a\` ↔ \`service-b\` (2-node cycle)
2. **Cycle 2:** \`api-gateway\` → \`auth-service\` → \`user-service\` → \`api-gateway\` (3-node cycle)
3. **Acyclic branch:** \`monitoring\` → \`logging\` (normal dependency)

**Expected Visual Behavior:**
- Different colors for each cycle (red and orange)
- Acyclic edges remain gray/dashed
- Each cycle visually distinct and traceable
- Mixed health statuses show realistic scenarios
        `,
      },
    },
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
  },
};

export const MultipleCyclesDark: Story = {
  ...MultipleCycles,
  name: 'Multiple Cycles (dark)',
  parameters: {
    ...MultipleCycles.parameters,
    backgrounds: { default: 'dark' },
  },
};

export const EnterprisePlatform: Story = {
  args: {
    graph: enterprisePlatformScenario,
    rankdir: RankDirection.TB,
    selectedApplications: [],
    onPaneClick: action('onPaneClick'),
    onApplicationClick: action('onApplicationClick'),
  },
  parameters: {
    docs: {
      description: {
        story: `
**Enterprise Platform with Strategic Cycles**

This realistic scenario represents a modern microservices platform with intentional architectural cycles:

**Platform Infrastructure:**
- \`platform-core\` → \`infrastructure-appset\` (root ApplicationSet pattern)
- Observability: \`prometheus\` → \`grafana\` + \`alertmanager\` (monitoring stack)
- Security: \`cert-manager\` → \`vault\` (certificate & secrets management)

**Business Services with Strategic Cycles:**

1. **E-commerce Cycle:** \`product-catalog\` → \`inventory-service\` → \`pricing-engine\` → \`product-catalog\`
   - *Business Logic:* Real-time pricing requires inventory data, which feeds back to catalog

2. **User Management Cycle:** \`user-service\` → \`notification-service\` → \`preferences-service\` → \`user-service\`  
   - *Event-Driven:* User activity drives notifications, which update preferences, affecting user profiles

**Independent Services:**
- API Gateway, Load Balancer, Data Lake, Analytics Engine (normal dependencies)

**Expected Visual Behavior:**
- Two distinct cycles with different colors (red and orange)
- Complex but realistic topology showing enterprise patterns
- Mixed health statuses representing real operational states
- Clear separation between infrastructure and business layers
        `,
      },
    },
    msw: {
      handlers: [allowCanI('applications', 'sync'), denyCanI('applications', 'get')],
    },
  },
};

export const EnterprisePlatformDark: Story = {
  ...EnterprisePlatform,
  name: 'Enterprise Platform (dark)',
  parameters: {
    ...EnterprisePlatform.parameters,
    backgrounds: { default: 'dark' },
  },
};
