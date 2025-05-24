import { DirectedGraph } from 'graphology';

import type { ApplicationGraph } from '../../types';
import { HealthStatus, SyncStatus } from '../../types/application';
import { createOrUpdateApplicationNode, resourceId, updateApplicationSubResources } from '../../utils';

/**
 * ScenarioGraph provides a fluent API to build and manipulate an ApplicationGraph
 * for Storybook scenarios and tests. It supports creating Application and ApplicationSet nodes,
 * linking them, and retrieving the resulting graph.
 *
 * Usage:
 *
 * ```ts
 *   const scenario = new ScenarioGraph()
 *     .createApplication(...)
 *     .createApplicationSet(...)
 *     .addParentRef(...)
 *     .createScenarioGraph()
 * ```
 *
 * This is intended for use in Storybook and test environments only.
 */
export class ScenarioGraph {
  private graph: ApplicationGraph;

  /**
   * Initializes a new, empty ScenarioGraph.
   */
  constructor() {
    this.graph = new DirectedGraph() as ApplicationGraph;
  }

  /**
   * Creates an ArgoCD Application node and adds it to the graph.
   *
   * @param name - The name of the Application
   * @param namespace - The namespace of the Application (default: 'default')
   * @param healthStatus - The health status of the Application (default: Healthy)
   * @param syncStatus - The sync status of the Application (default: Synced)
   */
  createApplication(
    name: string,
    namespace: string = 'default',
    healthStatus: HealthStatus = HealthStatus.Healthy,
    syncStatus: SyncStatus = SyncStatus.Synced,
    parentRef?: { kind: 'Application' | 'ApplicationSet'; namespace: string; name: string }
  ): ScenarioGraph {
    createOrUpdateApplicationNode(this.graph, {
      kind: 'Application',
      metadata: {
        name,
        namespace,
      },
      spec: {
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace,
        },
        project: 'default',
        sources: [
          {
            path: 'apps/hello-world',
            repoURL: 'https://github.com/argoproj/argocd-example-apps.git',
            targetRevision: 'HEAD',
          },
        ],
        syncPolicy: {
          automated: { prune: true, selfHeal: true },
        },
      },
      status: {
        health: { status: healthStatus },
        sync: { status: syncStatus, revision: '' }, // TODO: currently, no revision is used
      },
    });
    if (parentRef) {
      this.addParentRef(parentRef, { kind: 'Application', namespace, name });
    }
    return this;
  }

  /**
   * Creates an ApplicationSet node and adds it to the graph.
   *
   * @param name - The name of the ApplicationSet
   * @param namespace - The namespace of the ApplicationSet (default: 'default')
   */
  createApplicationSet(
    name: string,
    namespace: string = 'default',
    parentRef?: { kind: 'Application'; namespace: string; name: string }
  ): ScenarioGraph {
    updateApplicationSubResources(this.graph, undefined, {
      nodes: [
        {
          group: 'argoproj.io',
          version: 'v1alpha1',
          kind: 'ApplicationSet',
          namespace,
          name,
          uid: `${namespace}-${name}-uid`,
          resourceVersion: '1',
          createdAt: new Date().toISOString(),
          parentRefs: [],
        },
      ],
    });
    if (parentRef) {
      this.addParentRef(parentRef, { kind: 'ApplicationSet', namespace, name });
    }
    return this;
  }

  /**
   * Creates a directed edge (link) between two nodes (Application or ApplicationSet) in the graph.
   *
   * @param source - The source node (must exist in the graph)
   * @param target - The target node (must exist in the graph)
   * @throws If either node does not exist, or if linking two ApplicationSets
   */
  addParentRef(
    source: { kind: 'Application' | 'ApplicationSet'; namespace: string; name: string },
    target: { kind: 'Application' | 'ApplicationSet'; namespace: string; name: string }
  ): ScenarioGraph {
    const targetId = resourceId(target.kind, target.namespace, target.name);
    const sourceId = resourceId(source.kind, source.namespace, source.name);

    if (!this.graph.hasNode(targetId)) {
      throw new Error(`Target node ${targetId} does not exist`);
    }
    if (!this.graph.hasNode(sourceId)) {
      throw new Error(`Source node ${sourceId} does not exist`);
    }

    if (target.kind === 'ApplicationSet' && source.kind === 'ApplicationSet') {
      throw new Error('ApplicationSet nodes cannot be linked together');
    }

    this.graph.addEdge(sourceId, targetId);
    return this;
  }

  /**
   * Returns the current ApplicationGraph instance.
   *
   * @returns The constructed ApplicationGraph
   */
  createScenarioGraph(): ApplicationGraph {
    return this.graph;
  }
}

/**
 * A scenario graph with nodes exhibiting all possible health and sync statuses.
 * Suitable for testing status indicators in StatusPanel.
 */
export const allStatusScenario = new ScenarioGraph()
  .createApplication('app-healthy-synced', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('app-degraded-outofSync', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync)
  .createApplication('app-progressing-outofSync', 'default', HealthStatus.Progressing, SyncStatus.OutOfSync)
  .createApplication('app-missing-outofSync', 'default', HealthStatus.Missing, SyncStatus.OutOfSync)
  .createApplication('app-suspended-outofSync', 'default', HealthStatus.Suspended, SyncStatus.OutOfSync)
  .createApplication('app-unknown-unknown', 'default', HealthStatus.Unknown, SyncStatus.Unknown)
  .createScenarioGraph();

/**
 * A dense graph with multiple branches and a variety of health and sync statuses.
 * This can be used for both StatusPanel and ApplicationMap stories to test layout and status diversity.
 */
export const denseScenario = new ScenarioGraph()
  // Create root applications
  .createApplication('root-app1', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('root-app2', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync)

  // Create ApplicationSets
  .createApplicationSet('appset-team1', 'default', { kind: 'Application', namespace: 'default', name: 'root-app1' })
  .createApplicationSet('appset-team2', 'default', { kind: 'Application', namespace: 'default', name: 'root-app1' })
  .createApplicationSet('appset-infra', 'default', { kind: 'Application', namespace: 'default', name: 'root-app2' })

  // Create team1 applications with ApplicationSet parent (diversified statuses)
  .createApplication('team1-service1', 'default', HealthStatus.Healthy, SyncStatus.Synced, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team1',
  })
  .createApplication('team1-service2', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team1',
  })
  .createApplication('team1-service3', 'default', HealthStatus.Progressing, SyncStatus.Synced, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team1',
  })

  // Create team2 applications with ApplicationSet parent (diversified statuses)
  .createApplication('team2-api1', 'default', HealthStatus.Missing, SyncStatus.OutOfSync, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })
  .createApplication('team2-api2', 'default', HealthStatus.Suspended, SyncStatus.Unknown, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })
  .createApplication('team2-frontend', 'default', HealthStatus.Healthy, SyncStatus.Synced, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })

  // Create infrastructure applications with ApplicationSet parent (diversified statuses)
  .createApplication('infra-monitoring', 'default', HealthStatus.Healthy, SyncStatus.Synced, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication('infra-logging', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication('infra-database', 'default', HealthStatus.Progressing, SyncStatus.Unknown, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication('infra-cache', 'default', HealthStatus.Missing, SyncStatus.Synced, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication('infra-queue', 'default', HealthStatus.Suspended, SyncStatus.OutOfSync, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })

  // Create dependent applications with their parents (diversified statuses)
  .createApplication('auth-service', 'default', HealthStatus.Healthy, SyncStatus.Synced, {
    kind: 'Application',
    namespace: 'default',
    name: 'team1-service1',
  })
  .createApplication('user-service', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync, {
    kind: 'Application',
    namespace: 'default',
    name: 'team1-service2',
  })
  .createApplication('product-service', 'default', HealthStatus.Progressing, SyncStatus.Synced, {
    kind: 'Application',
    namespace: 'default',
    name: 'team1-service3',
  })
  .createApplication('payment-service', 'default', HealthStatus.Missing, SyncStatus.OutOfSync, {
    kind: 'Application',
    namespace: 'default',
    name: 'team2-api1',
  })
  .createApplication('notification-service', 'default', HealthStatus.Suspended, SyncStatus.Unknown, {
    kind: 'Application',
    namespace: 'default',
    name: 'team2-api2',
  })

  .createScenarioGraph();

/**
 * A scenario graph with a cycle (loop) to test cycle detection in StatusPanel.
 */
export const cyclicScenario = new ScenarioGraph()
  // Create applications that will form a cycle
  .createApplication('app-a', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('app-b', 'default', HealthStatus.Healthy, SyncStatus.Synced, {
    kind: 'Application',
    namespace: 'default',
    name: 'app-a',
  })
  // Close the cycle: D -> A
  .addParentRef(
    { kind: 'Application', namespace: 'default', name: 'app-b' },
    { kind: 'Application', namespace: 'default', name: 'app-a' }
  )
  .createScenarioGraph();
