import { DirectedGraph } from 'graphology';

import { HealthStatus, SyncStatus } from '../../types/application';
import { ArgoApplication, ArgoApplicationSet } from '../../types/argocd';
import { updateGraph } from '../graph_manager';

// Helper to create a mock application payload
const createMockApp = (
  name: string,
  owner?: { kind: 'ApplicationSet'; name: string },
  resources?: any[]
): ArgoApplication => {
  const app: ArgoApplication = {
    kind: 'Application',
    metadata: {
      name,
      namespace: 'argocd',
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

// --- TESTS ---
describe('updateGraph', () => {
  /**
   * Diagram:
   *   ┌────────────┐
   *   │ appA       │
   *   └────────────┘
   * (Single node added)
   */
  it('adds a simple application node', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const appA = createMockApp('appA');
    updateGraph(graph, 'ADDED', appA);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Diagram:
   *   ┌────────────┐     ┌──────────────┐
   *   │ appset1    │ ◁── │ appB         │
   *   └────────────┘     └──────────────┘
   * (appB owned by appset1)
   */
  it('adds a node with ownerReferences', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const app = createMockApp('appB', { kind: 'ApplicationSet', name: 'appset1' });
    updateGraph(graph, 'ADDED', app);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Diagram:
   *   ┌────────────┐
   *   │ appA       │
   *   └───┬────────┘
   *       │
   *   ┌───▽────────┐
   *   │ appB       │
   *   └────────────┘
   * (appA references appB in status.resources)
   */
  it('adds resources from status.resources as stub nodes', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const app = createMockApp('appA', undefined, [{ kind: 'Application', name: 'appB', namespace: 'argocd' }]);
    updateGraph(graph, 'ADDED', app);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Initial diagram:
   *   ┌────────────┐
   *   │ appA       │
   *   └────────────┘
   * After MODIFIED:
   *   ┌────────────┐
   *   │ appA       │ (status updated)
   *   └────────────┘
   */
  it('updates the attributes of an existing node', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const app = createMockApp('appA');
    updateGraph(graph, 'ADDED', app);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Initial diagram:
   *   ┌────────────┐
   *   │ appA       │
   *   └────────────┘
   * After DELETED:
   *   (no more appA node)
   */
  it('removes a node on DELETED', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const app = createMockApp('appA');
    updateGraph(graph, 'ADDED', app);

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
    const app = createMockApp('appA', undefined, [{ kind: 'ApplicationSet', name: 'appset1', namespace: 'argocd' }]);
    updateGraph(graph, 'ADDED', app);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Diagram:
   *   ┌────────────┐     ┌──────────────┐     ┌──────────────┐
   *   │ app-of-apps│ ──▶ │ appA         │ ──▶ │ appB         │
   *   └────────────┘     └──────────────┘     └──────────────┘
   * (appA references appB in status.resources)
   */
  it('should handle app-of-apps without ownerReferences', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const appA = createMockApp('appA', { kind: 'ApplicationSet', name: 'app-of-apps' }, [
      { kind: 'Application', name: 'appB', namespace: 'argocd' },
    ]);
    const appB = createMockApp('appB');

    updateGraph(graph, 'ADDED', appA);
    updateGraph(graph, 'ADDED', appB);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Initial diagram:
   *   ┌────────────┐     ┌──────────────┐
   *   │ appset1    │ ◁── │ appA         │
   *   └────────────┘     └──────────────┘
   *   ┌────────────┐     ┌──────────────┐
   *   │ appset1    │ ◁── │ appB         │
   *   └────────────┘     └──────────────┘
   * After DELETED appA:
   *   ┌────────────┐     ┌──────────────┐
   *   │ appset1    │ ◁── │ appB         │
   *   └────────────┘     └──────────────┘
   * After DELETED appB:
   *   (appset1 is removed as it has no children)
   */
  it('removes an ApplicationSet parent when it becomes orphaned', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const appA = createMockApp('appA', { kind: 'ApplicationSet', name: 'appset1' });
    const appB = createMockApp('appB', { kind: 'ApplicationSet', name: 'appset1' });

    updateGraph(graph, 'ADDED', appA);
    updateGraph(graph, 'ADDED', appB);

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Initial diagram:
   *   ┌────────────┐     ┌────────────┐
   *   │ appA       │ ──▶ │ appB       │
   *   └────────────┘     └────────────┘
   * After MODIFIED appA:
   *   ┌────────────┐     ┌────────────┐
   *   │ appA       │ ──▶ │ appC       │
   *   └────────────┘     └────────────┘
   *   ┌────────────┐
   *   │ appB       │
   *   └────────────┘
   */
  it('updates resources for a node on MODIFIED event', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const appA_v1 = createMockApp('appA', undefined, [{ kind: 'Application', name: 'appB', namespace: 'argocd' }]);
    updateGraph(graph, 'ADDED', appA_v1);
    expect(graph.export()).toMatchSnapshot();

    const appA_v2 = createMockApp('appA', undefined, [{ kind: 'Application', name: 'appC', namespace: 'argocd' }]);
    updateGraph(graph, 'MODIFIED', appA_v2);

    expect(graph.hasEdge('Application/argocd/appA', 'Application/argocd/appB')).toBe(false);
    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Diagram:
   *   ┌────────────┐     ┌────────────┐
   *   │ appA       │ ──▶ │ appB       │
   *   └────────────┘     └────────────┘
   *                      (status: Unknown/Unknown)
   *
   * After appA is processed, which lists appB as Healthy/Synced in its resources,
   * appB's status in the graph should be updated.
   *
   *   ┌────────────┐     ┌────────────┐
   *   │ appA       │ ──▶ │ appB       │
   *   └────────────┘     └────────────┘
   *                      (status: Healthy/Synced)
   */
  it("updates a child's unknown status from a parent's resource definition", () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();

    const appA = createMockApp('appA', undefined, [
      {
        kind: 'Application',
        name: 'appB',
        namespace: 'argocd',
        health: { status: HealthStatus.Unknown },
        status: SyncStatus.Unknown,
      },
    ]);
    updateGraph(graph, 'ADDED', appA);

    expect(graph.export()).toMatchSnapshot();

    // 2. Create appA, which lists appB as a resource with a known status
    updateGraph(graph, 'MODIFIED', {
      ...appA,
      status: {
        ...appA.status,
        resources: appA.status.resources.map((resource) => ({
          ...resource,
          health: { status: HealthStatus.Healthy },
          status: SyncStatus.Synced,
        })),
      },
    });

    expect(graph.export()).toMatchSnapshot();
  });

  /**
   * Initial diagram:
   *   ┌────────────┐     ┌──────────────┐     ┌────────────┐
   *   │ appset1    │ ◁── │ appA         │ ──▶ │ appB       │
   *   └────────────┘     └──────────────┘     └────────────┘
   * After DELETED appA:
   *                                              ┌────────────┐
   *                                              │ appB       │
   *                                              └────────────┘
   *   (appset1 is removed as it's orphaned, appB remains)
   */
  it('correctly handles deletion of a node that is both a parent and a child', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const appA = createMockApp('appA', { kind: 'ApplicationSet', name: 'appset1' }, [
      { kind: 'Application', name: 'appB', namespace: 'argocd' },
    ]);
    const appB = createMockApp('appB');

    updateGraph(graph, 'ADDED', appB);
    updateGraph(graph, 'ADDED', appA);

    expect(graph.export()).toMatchSnapshot();

    updateGraph(graph, 'DELETED', appA);

    expect(graph.export()).toMatchSnapshot();
  });

  it('handles incomplete or malformed SSE payloads gracefully', () => {
    const graph = new DirectedGraph<ArgoApplication | ArgoApplicationSet>();
    const malformedApp: ArgoApplication = {
      kind: 'Application',
      metadata: {
        name: 'malformedApp',
        namespace: 'argocd',
      },
      status: {
        health: { status: undefined },
        sync: { status: undefined },
        resources: [],
      },
    };

    updateGraph(graph, 'ADDED', malformedApp);
    expect(graph.export()).toMatchSnapshot();

    const appWithBadResource = createMockApp('appWithBadResource', undefined, [
      { kind: 'Application', name: null, namespace: 'argocd' }, // name is null
    ]);
    updateGraph(graph, 'ADDED', appWithBadResource);
    expect(graph.export()).toMatchSnapshot();
  });
});
