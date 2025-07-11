import { DirectedGraph } from 'graphology';

import { HealthStatus, SyncStatus } from '../../types/application';
import { ArgoApplication, ArgoApplicationSet } from '../../types/argocd';
import { updateGraph } from '../graph_manager';

// Helper to create a mock application payload
const createMockApp = (
  name: string,
  namespace: string = 'argocd',
  owner?: { kind: 'Application' | 'ApplicationSet'; name: string },
  resources?: any[]
): ArgoApplication => {
  const app: ArgoApplication = {
    kind: 'Application',
    metadata: {
      name,
      namespace,
      ...(owner
        ? {
            ownerReferences: [
              {
                apiVersion: 'argoproj.io/v1alpha1',
                kind: owner.kind,
                name: owner.name,
              },
            ],
          }
        : {}),
    },
    status: {
      health: { status: HealthStatus.Healthy },
      sync: { status: SyncStatus.Synced },
      resources: resources || [],
    },
  };
  return app;
};

describe('updateGraph', () => {
  describe('Basic Operations (Nodes & Edges)', () => {
    /**
     * Diagram:
     *   ┌────────────┐
     *   │ appA       │
     *   └────────────┘
     * (A single node is added to the graph)
     */
    it('adds a simple application node', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA');
      updateGraph(graph, 'ADDED', appA);

      expect(graph.hasNode('Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Initial diagram:
     *   ┌────────────┐
     *   │ appA       │
     *   └────────────┘
     * After MODIFIED:
     *   ┌────────────┐
     *   │ appA       │ (status updated to "Progressing")
     *   └────────────┘
     */
    it('updates the attributes of an existing node on MODIFIED', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      let appA = createMockApp('appA');
      updateGraph(graph, 'ADDED', appA);

      const initialAttrs = graph.getNodeAttributes('Application/argocd/appA') as ArgoApplication;
      expect(initialAttrs.status.health.status).toBe(HealthStatus.Healthy);
      expect(graph.export()).toMatchSnapshot();

      // Modify the app's status
      appA = {
        ...appA,
        status: { ...appA.status, health: { status: HealthStatus.Progressing } },
      };
      updateGraph(graph, 'MODIFIED', appA);

      const updatedAttrs = graph.getNodeAttributes('Application/argocd/appA') as ArgoApplication;
      expect(updatedAttrs.status.health.status).toBe(HealthStatus.Progressing);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Initial diagram:
     *   ┌────────────┐
     *   │ appA       │
     *   └────────────┘
     * After DELETED:
     *   (Graph is empty)
     */
    it('removes a node on DELETED', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA');
      updateGraph(graph, 'ADDED', appA);

      expect(graph.hasNode('Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();

      updateGraph(graph, 'DELETED', appA);
      expect(graph.hasNode('Application/argocd/appA')).toBe(false);
      expect(graph.order).toBe(0);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Scenario: A `DELETED` event is received for a node that is not in the graph.
     * Expected: The function should not throw an error and the graph remains unchanged.
     */
    it('handles deletion of a non-existent node gracefully', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA');

      // Attempt to delete a node that was never added
      expect(() => {
        updateGraph(graph, 'DELETED', appA);
      }).not.toThrow();

      expect(graph.order).toBe(0);
    });
  });

  describe('Resource and Ownership Handling (Edges)', () => {
    /**
     * Diagram:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset1    │ ──▶ │ appB         │
     *   └────────────┘     └──────────────┘
     * (appB is owned by appset1, creating an incoming edge to appset1)
     */
    it('adds a node with ownerReferences, creating a parent', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const app = createMockApp('appB', 'argocd', { kind: 'ApplicationSet', name: 'appset1' });
      updateGraph(graph, 'ADDED', app);

      expect(graph.hasNode('Application/argocd/appB')).toBe(true);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.hasEdge('ApplicationSet/argocd/appset1', 'Application/argocd/appB')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Diagram:
     *   ┌────────────┐     ┌────────────┐
     *   │ appA       │ ──▶ │ appB       │
     *   └────────────┘     └────────────┘
     * (appA references appB in status.resources, creating an outgoing edge from appA)
     */
    it('adds resources from status.resources as stub nodes', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const app = createMockApp('appA', 'argocd', undefined, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      updateGraph(graph, 'ADDED', app);

      expect(graph.hasNode('Application/argocd/appA')).toBe(true);
      expect(graph.hasNode('Application/argocd/appB')).toBe(true);
      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Diagram:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appA       │ ──▶ │ appset1      │
     *   └────────────┘     └──────────────┘
     * (appA references appset1 in status.resources)
     */
    it('adds an ApplicationSet referenced in resources', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const app = createMockApp('appA', 'argocd', undefined, [
        { kind: 'ApplicationSet', name: 'appset1', namespace: 'argocd' },
      ]);
      updateGraph(graph, 'ADDED', app);

      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.hasEdge('Application/argocd/appA', 'ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Scenario: Test that applications with the same name but in different namespaces are treated as distinct nodes.
     * Diagram:
     *   ┌──────────────────────────┐     ┌──────────────────────────┐
     *   │ appA (ns: default)       │ ──▶ │ appB (ns: argocd)        │
     *   └──────────────────────────┘     └──────────────────────────┘
     */
    it('handles resources in different namespaces correctly', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'default', undefined, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      const appB = createMockApp('appB', 'argocd');

      updateGraph(graph, 'ADDED', appA);
      updateGraph(graph, 'ADDED', appB);

      expect(graph.hasNode('Application/default/appA')).toBe(true);
      expect(graph.hasNode('Application/argocd/appB')).toBe(true);
      expect(graph.hasEdge('Application/default/appA', 'Application/argocd/appB')).toBe(true);
      expect(graph.order).toBe(2); // Ensure no extra nodes are created
      expect(graph.export()).toMatchSnapshot();
    });
  });

  describe('ApplicationSet Lifecycle', () => {
    /**
     * Initial diagram:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset1    │ ──▶ │ appA         │
     *   └────────────┘     └──────────────┘
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset1    │ ──▶ │ appB         │
     *   └────────────┘     └──────────────┘
     * After DELETED appA:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset1    │ ──▶ │ appB         │
     *   └────────────┘     └──────────────┘
     * After DELETED appB:
     *   (appset1 is removed as it has no children left)
     */
    it('removes an ApplicationSet parent when it becomes orphaned', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'argocd', { kind: 'ApplicationSet', name: 'appset1' });
      const appB = createMockApp('appB', 'argocd', { kind: 'ApplicationSet', name: 'appset1' });

      updateGraph(graph, 'ADDED', appA);
      updateGraph(graph, 'ADDED', appB);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.outDegree('ApplicationSet/argocd/appset1')).toBe(2);
      expect(graph.export()).toMatchSnapshot();

      // Delete one child, AppSet should remain
      updateGraph(graph, 'DELETED', appA);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.outDegree('ApplicationSet/argocd/appset1')).toBe(1);
      expect(graph.export()).toMatchSnapshot();

      // Delete the last child, AppSet should be removed
      updateGraph(graph, 'DELETED', appB);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(false);
      expect(graph.order).toBe(0);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Initial diagram:
     *   ┌────────────┐     ┌──────────────┐     ┌────────────┐
     *   │ appset1    │ ──▶ │ appA         │ ──▶ │ appB       │
     *   └────────────┘     └──────────────┘     └────────────┘
     * After DELETED appA:
     *   (appset1 is removed as it's orphaned)
     *                                              ┌────────────┐
     *                                              │ appB       │
     *                                              └────────────┘
     */
    it('correctly handles deletion of a node that is both a parent and a child', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'argocd', { kind: 'ApplicationSet', name: 'appset1' }, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      const appB = createMockApp('appB');

      updateGraph(graph, 'ADDED', appB);
      updateGraph(graph, 'ADDED', appA);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.hasEdge('ApplicationSet/argocd/appset1', 'Application/argocd/appA')).toBe(true);
      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(true);
      expect(graph.export()).toMatchSnapshot();

      updateGraph(graph, 'DELETED', appA);

      // appA and its parent appset1 should be gone, but appB remains.
      expect(graph.hasNode('Application/argocd/appA')).toBe(false);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(false);
      expect(graph.hasNode('Application/argocd/appB')).toBe(true);
      expect(graph.order).toBe(1);
      expect(graph.export()).toMatchSnapshot();
    });
  });

  describe('App-of-Apps Scenarios', () => {
    /**
     * Diagram:
     *   ┌────────────┐     ┌──────────────┐     ┌──────────────┐
     *   │ app-of-apps│ ──▶ │ appA         │ ──▶ │ appB         │
     *   └────────────┘     └──────────────┘     └──────────────┘
     * (app-of-apps owns appA, which in turn references appB)
     */
    it('should handle app-of-apps with ownerReferences', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'argocd', { kind: 'ApplicationSet', name: 'app-of-apps' }, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      const appB = createMockApp('appB');

      updateGraph(graph, 'ADDED', appA);
      updateGraph(graph, 'ADDED', appB);

      expect(graph.hasEdge('ApplicationSet/argocd/app-of-apps', 'Application/argocd/appA')).toBe(true);
      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Initial diagram:
     *   ┌────────────┐     ┌────────────┐
     *   │ appA       │ ──▶ │ appB       │
     *   └────────────┘     └────────────┘
     * After MODIFIED appA (now references appC):
     *   ┌────────────┐     ┌────────────┐
     *   │ appA       │ ──▶ │ appC       │
     *   └────────────┘     └────────────┘
     *   ┌────────────┐
     *   │ appB       │ (appB becomes an orphan node)
     *   └────────────┘
     */
    it('updates resources for a node on MODIFIED event, orphaning old children', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA_v1 = createMockApp('appA', 'argocd', undefined, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      updateGraph(graph, 'ADDED', appA_v1);
      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(true);

      const appA_v2 = createMockApp('appA', 'argocd', undefined, [
        { kind: 'Application', name: 'appC', namespace: 'argocd' },
      ]);
      updateGraph(graph, 'MODIFIED', appA_v2);

      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(false);
      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appC')).toBe(true);
      expect(graph.hasNode('Application/argocd/appB')).toBe(true); // appB is now an orphan
      expect(graph.export()).toMatchSnapshot();
    });
  });

  describe('Status & Attribute Updates', () => {
    /**
     * Scenario: A parent's resource definition contains status info for a child.
     * This info should update the child node if the child is a stub or has an "Unknown" status.
     *
     * Initial state: appB is a stub node (Unknown/Unknown)
     *   ┌────────────┐     ┌────────────┐
     *   │ appA       │ ──▶ │ appB       │ (status: Unknown)
     *   └────────────┘     └────────────┘
     * After appA is MODIFIED with health info for appB:
     *   ┌────────────┐     ┌────────────┐
     *   │ appA       │ ──▶ │ appB       │ (status: Healthy/Synced)
     *   └────────────┘     └────────────┘
     */
    it("updates a child's unknown status from a parent's resource definition", () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();

      // 1. Add appA, which creates appB as a stub with "Unknown" status
      const appA_v1 = createMockApp('appA', 'argocd', undefined, [
        {
          kind: 'Application',
          name: 'appB',
          namespace: 'argocd',
          health: { status: HealthStatus.Unknown },
          status: SyncStatus.Unknown,
        },
      ]);
      updateGraph(graph, 'ADDED', appA_v1);

      const initialAttrs = graph.getNodeAttributes('Application/argocd/appB') as ArgoApplication;
      expect(initialAttrs.status.health.status).toBe(HealthStatus.Unknown);
      expect(initialAttrs.status.sync.status).toBe(SyncStatus.Unknown);
      expect(graph.export()).toMatchSnapshot();

      // 2. Modify appA, providing a healthy status for appB in its resources
      const appA_v2 = {
        ...appA_v1,
        status: {
          ...appA_v1.status,
          resources: [
            {
              ...appA_v1.status.resources[0],
              health: { status: HealthStatus.Healthy },
              status: SyncStatus.Synced,
            },
          ],
        },
      };
      updateGraph(graph, 'MODIFIED', appA_v2);

      const updatedAttrs = graph.getNodeAttributes('Application/argocd/appB') as ArgoApplication;
      expect(updatedAttrs.status.health.status).toBe(HealthStatus.Healthy);
      expect(updatedAttrs.status.sync.status).toBe(SyncStatus.Synced);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Scenario: An application's ownership changes from one ApplicationSet to another.
     * Initial state:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset1    │ ──▶ │ appA         │
     *   └────────────┘     └──────────────┘
     * After MODIFIED:
     *   ┌────────────┐     ┌──────────────┐
     *   │ appset2    │ ──▶ │ appA         │
     *   └────────────┘     └──────────────┘
     *   (appset1 is removed as it's now orphaned)
     */
    it('handles change of ownership (ownerReference)', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();

      // 1. appA is owned by appset1
      let appA = createMockApp('appA', 'argocd', { kind: 'ApplicationSet', name: 'appset1' });
      updateGraph(graph, 'ADDED', appA);
      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(true);
      expect(graph.hasEdge('ApplicationSet/argocd/appset1', 'Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();

      // 2. appA is now owned by appset2
      appA = createMockApp('appA', 'argocd', { kind: 'ApplicationSet', name: 'appset2' });
      updateGraph(graph, 'MODIFIED', appA);

      expect(graph.hasNode('ApplicationSet/argocd/appset1')).toBe(false); // Should be removed as it's orphaned
      expect(graph.hasEdge('ApplicationSet/argocd/appset1', 'Application/argocd/appA')).toBe(false);
      expect(graph.hasNode('ApplicationSet/argocd/appset2')).toBe(true);
      expect(graph.hasEdge('ApplicationSet/argocd/appset2', 'Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });
  });

  describe('Edge Cases & Malformed Data', () => {
    /**
     * Scenario: The SSE stream sends an incomplete or badly-formed payload.
     * The update function should not crash and should handle the bad data gracefully.
     */
    it('handles incomplete or malformed SSE payloads gracefully', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const malformedApp: any = {
        kind: 'Application',
        metadata: {
          // Missing name and namespace
        },
        status: {}, // Missing health, sync, resources
      };

      expect(() => {
        updateGraph(graph, 'ADDED', malformedApp);
      }).not.toThrow();
      expect(graph.order).toBe(0); // No node should be added

      const appWithBadResource = createMockApp('appWithBadResource', 'argocd', undefined, [
        { kind: 'Application', name: null, namespace: 'argocd' }, // name is null
      ]);
      expect(() => {
        updateGraph(graph, 'ADDED', appWithBadResource);
      }).not.toThrow();
      // The parent node is added, but the edge/child with null name is ignored
      expect(graph.hasNode('Application/argocd/appWithBadResource')).toBe(true);
      expect(graph.order).toBe(1);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Diagram:
     *   ┌────────────┐
     *   │   AppA     │◀──┐
     *   └─────┬──────┘   │
     *         │          │
     *   ┌─────▽──────┐   │
     *   │   AppB     │───┘
     *   └────────────┘
     * (A references B, B references A)
     */
    it('handles cyclical dependencies gracefully', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'argocd', undefined, [
        { kind: 'Application', name: 'appB', namespace: 'argocd' },
      ]);
      const appB = createMockApp('appB', 'argocd', undefined, [
        { kind: 'Application', name: 'appA', namespace: 'argocd' },
      ]);

      expect(() => {
        updateGraph(graph, 'ADDED', appA);
        updateGraph(graph, 'ADDED', appB);
      }).not.toThrow();

      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(true);
      expect(graph.hasEdge('Application/argocd/appB', 'Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });

    /**
     * Diagram:
     *   ┌────────────┐
     *   │   AppA     │──┐
     *   └─────┬──────┘  │
     *         └─────────┘
     * (A references itself in its resources)
     */
    it('handles self-referencing applications gracefully', () => {
      const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
      const appA = createMockApp('appA', 'argocd', undefined, [
        { kind: 'Application', name: 'appA', namespace: 'argocd' },
      ]);

      expect(() => {
        updateGraph(graph, 'ADDED', appA);
      }).not.toThrow();

      expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appA')).toBe(true);
      expect(graph.export()).toMatchSnapshot();
    });
  });
});
