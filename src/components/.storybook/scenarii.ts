import { DirectedGraph } from 'graphology';

import { ApplicationGraphNode } from '../../types';
import { HealthStatus, SourceDriftStatus, SyncStatus } from '../../types/application';
import { Application, ApplicationSet } from '../../types/application';
import { resourceId } from '../../utils';

export type ArgoApplicationGraph = DirectedGraph<ApplicationGraphNode>;

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
  private graph: ArgoApplicationGraph;

  /**
   * Initializes a new, empty ScenarioGraph.
   */
  constructor() {
    this.graph = new DirectedGraph() as ArgoApplicationGraph;
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
    sourceDriftStatus: SourceDriftStatus = SourceDriftStatus.Conform,
    parentRef?: { kind: 'Application' | 'ApplicationSet'; namespace: string; name: string }
  ): ScenarioGraph {
    const nodeId = resourceId('Application', namespace, name);
    const app: Application & { status?: { drift?: SourceDriftStatus } } = {
      kind: 'Application',
      metadata: { name, namespace },
      spec: {
        project: 'default',
        source: { repoURL: 'http://localhost', path: '/', targetRevision: 'HEAD' },
        destination: { server: 'https://kubernetes.default.svc', namespace: 'default' },
        syncPolicy: {},
      },
      status: {
        drift: sourceDriftStatus,
        health: { status: healthStatus },
        sync: { status: syncStatus },
      },
    };

    if (this.graph.hasNode(nodeId)) {
      this.graph.replaceNodeAttributes(nodeId, app);
    } else {
      this.graph.addNode(nodeId, app);
    }

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
    const nodeId = resourceId('ApplicationSet', namespace, name);
    const appSet: ApplicationSet = {
      kind: 'ApplicationSet',
      metadata: { name, namespace },
    };

    if (this.graph.hasNode(nodeId)) {
      this.graph.replaceNodeAttributes(nodeId, appSet);
    } else {
      this.graph.addNode(nodeId, appSet);
    }

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
  createScenarioGraph(): ArgoApplicationGraph {
    return this.graph;
  }
}

/**
 * A scenario graph with nodes exhibiting all possible health and sync statuses.
 * Suitable for testing status indicators in StatusPanel.
 */
export const allStatusScenario = new ScenarioGraph()
  .createApplication(
    'app-healthy-synced',
    'default',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform
  )
  .createApplication(
    'app-degraded-outofSync',
    'default',
    HealthStatus.Degraded,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Drift
  )
  .createApplication(
    'app-progressing-outofSync',
    'default',
    HealthStatus.Progressing,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Conform
  )
  .createApplication(
    'app-missing-outofSync',
    'default',
    HealthStatus.Missing,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Drift
  )
  .createApplication(
    'app-suspended-outofSync',
    'default',
    HealthStatus.Suspended,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Drift
  )
  .createApplication(
    'app-unknown-unknown',
    'default',
    HealthStatus.Unknown,
    SyncStatus.Unknown,
    SourceDriftStatus.Conform
  )
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
  .createApplication('team1-service1', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team1',
  })
  .createApplication(
    'team1-service2',
    'default',
    HealthStatus.Degraded,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Drift,
    {
      kind: 'ApplicationSet',
      namespace: 'default',
      name: 'appset-team1',
    }
  )
  .createApplication(
    'team1-service3',
    'default',
    HealthStatus.Progressing,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'default',
      name: 'appset-team1',
    }
  )

  // Create team2 applications with ApplicationSet parent (diversified statuses)
  .createApplication('team2-api1', 'default', HealthStatus.Missing, SyncStatus.OutOfSync, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })
  .createApplication('team2-api2', 'default', HealthStatus.Suspended, SyncStatus.Unknown, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })
  .createApplication('team2-frontend', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-team2',
  })

  // Create infrastructure applications with ApplicationSet parent (diversified statuses)
  .createApplication(
    'infra-monitoring',
    'default',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'default',
      name: 'appset-infra',
    }
  )
  .createApplication('infra-logging', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync, SourceDriftStatus.Drift, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication(
    'infra-database',
    'default',
    HealthStatus.Progressing,
    SyncStatus.Unknown,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'default',
      name: 'appset-infra',
    }
  )
  .createApplication('infra-cache', 'default', HealthStatus.Missing, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'default',
    name: 'appset-infra',
  })
  .createApplication(
    'infra-queue',
    'default',
    HealthStatus.Suspended,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'default',
      name: 'appset-infra',
    }
  )

  // Create dependent applications with their parents (diversified statuses)
  .createApplication('auth-service', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'team1-service1',
  })
  .createApplication(
    'user-service',
    'default',
    HealthStatus.Degraded,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'default',
      name: 'team1-service2',
    }
  )
  .createApplication(
    'product-service',
    'default',
    HealthStatus.Progressing,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'default',
      name: 'team1-service3',
    }
  )
  .createApplication(
    'payment-service',
    'default',
    HealthStatus.Missing,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'default',
      name: 'team2-api1',
    }
  )
  .createApplication(
    'notification-service',
    'default',
    HealthStatus.Suspended,
    SyncStatus.Unknown,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'default',
      name: 'team2-api2',
    }
  )

  .createScenarioGraph();

/**
 * A scenario graph with a simple 2-node cycle (A ↔ B)
 */
export const simpleCycleScenario = new ScenarioGraph()
  .createApplication('app-a', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('app-b', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'app-a',
  })
  // Close the cycle: B -> A
  .addParentRef(
    { kind: 'Application', namespace: 'default', name: 'app-b' },
    { kind: 'Application', namespace: 'default', name: 'app-a' }
  )
  .createScenarioGraph();

/**
 * A scenario graph with a 3-node cycle (A → B → C → A)
 */
export const triangleCycleScenario = new ScenarioGraph()
  .createApplication('frontend', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('backend', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'frontend',
  })
  .createApplication('database', 'default', HealthStatus.Degraded, SyncStatus.OutOfSync, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'backend',
  })
  // Close the cycle: database -> frontend
  .addParentRef(
    { kind: 'Application', namespace: 'default', name: 'database' },
    { kind: 'Application', namespace: 'default', name: 'frontend' }
  )
  .createScenarioGraph();

/**
 * A scenario graph with multiple independent cycles
 */
export const multipleCyclesScenario = new ScenarioGraph()
  // Cycle 1: A ↔ B
  .createApplication('service-a', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('service-b', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'service-a',
  })
  .addParentRef(
    { kind: 'Application', namespace: 'default', name: 'service-b' },
    { kind: 'Application', namespace: 'default', name: 'service-a' }
  )

  // Cycle 2: C → D → E → C
  .createApplication('api-gateway', 'default', HealthStatus.Progressing, SyncStatus.Synced)
  .createApplication('auth-service', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'api-gateway',
  })
  .createApplication('user-service', 'default', HealthStatus.Missing, SyncStatus.OutOfSync, SourceDriftStatus.Drift, {
    kind: 'Application',
    namespace: 'default',
    name: 'auth-service',
  })
  .addParentRef(
    { kind: 'Application', namespace: 'default', name: 'user-service' },
    { kind: 'Application', namespace: 'default', name: 'api-gateway' }
  )

  // Independent acyclic branch
  .createApplication('monitoring', 'default', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplication('logging', 'default', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'default',
    name: 'monitoring',
  })
  .createScenarioGraph();

/**
 * A realistic enterprise platform with strategic cycles
 * Represents a microservices platform with intentional circular dependencies
 */
export const enterprisePlatformScenario = new ScenarioGraph()
  // Platform Core Infrastructure
  .createApplication('platform-core', 'platform', HealthStatus.Healthy, SyncStatus.Synced)
  .createApplicationSet('infrastructure-appset', 'platform', {
    kind: 'Application',
    namespace: 'platform',
    name: 'platform-core',
  })

  // Observability Stack (acyclic)
  .createApplication(
    'prometheus',
    'observability',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'platform',
      name: 'infrastructure-appset',
    }
  )
  .createApplication('grafana', 'observability', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'observability',
    name: 'prometheus',
  })
  .createApplication(
    'alertmanager',
    'observability',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'observability',
      name: 'prometheus',
    }
  )

  // Security & Identity Stack
  .createApplication('cert-manager', 'security', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'platform',
    name: 'infrastructure-appset',
  })
  .createApplication('vault', 'security', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'security',
    name: 'cert-manager',
  })

  // Business Applications with Strategic Cycles
  .createApplicationSet('business-appset', 'business', {
    kind: 'Application',
    namespace: 'platform',
    name: 'platform-core',
  })

  // E-commerce Platform (contains cycles for event-driven architecture)
  .createApplication(
    'product-catalog',
    'business',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'ApplicationSet',
      namespace: 'business',
      name: 'business-appset',
    }
  )
  .createApplication(
    'inventory-service',
    'business',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'business',
      name: 'product-catalog',
    }
  )
  .createApplication(
    'pricing-engine',
    'business',
    HealthStatus.Degraded,
    SyncStatus.OutOfSync,
    SourceDriftStatus.Drift,
    {
      kind: 'Application',
      namespace: 'business',
      name: 'inventory-service',
    }
  )
  // Strategic cycle: pricing depends on product catalog for real-time pricing
  .addParentRef(
    { kind: 'Application', namespace: 'business', name: 'pricing-engine' },
    { kind: 'Application', namespace: 'business', name: 'product-catalog' }
  )

  // User Management & Notification Cycle (event-driven notifications)
  .createApplication('user-service', 'business', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'business',
    name: 'business-appset',
  })
  .createApplication(
    'notification-service',
    'business',
    HealthStatus.Progressing,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'business',
      name: 'user-service',
    }
  )
  .createApplication(
    'preferences-service',
    'business',
    HealthStatus.Healthy,
    SyncStatus.Synced,
    SourceDriftStatus.Conform,
    {
      kind: 'Application',
      namespace: 'business',
      name: 'notification-service',
    }
  )
  // Cycle: user preferences inform notifications, which update user activity
  .addParentRef(
    { kind: 'Application', namespace: 'business', name: 'preferences-service' },
    { kind: 'Application', namespace: 'business', name: 'user-service' }
  )

  // API Gateway & Load Balancer (independent services)
  .createApplication('api-gateway', 'platform', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'platform',
    name: 'infrastructure-appset',
  })
  .createApplication('load-balancer', 'platform', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'Application',
    namespace: 'platform',
    name: 'api-gateway',
  })

  // Data Platform (some analytics dependencies)
  .createApplication('data-lake', 'data', HealthStatus.Healthy, SyncStatus.Synced, SourceDriftStatus.Conform, {
    kind: 'ApplicationSet',
    namespace: 'platform',
    name: 'infrastructure-appset',
  })
  .createApplication('analytics-engine', 'data', HealthStatus.Missing, SyncStatus.OutOfSync, SourceDriftStatus.Drift, {
    kind: 'Application',
    namespace: 'data',
    name: 'data-lake',
  })
  .createScenarioGraph();

/**
 * Legacy alias for backward compatibility
 * @deprecated Use simpleCycleScenario instead
 */
export const cyclicScenario = simpleCycleScenario;
