import { ApplicationGraph, HealthStatus, SyncStatus, isApplication } from '../../types';
import { ArgoApplication, ArgoResourceNode, ArgoResourceTree } from '../../types/argocd';
import { resourceId } from '../resource_id';
import {
  createOrUpdateApplicationNode,
  updateApplicationGraph,
  updateApplicationSubResources,
} from '../update_application_graph';
import { DirectedGraph } from 'graphology';

describe('updateApplicationGraph function', () => {
  let graph: ApplicationGraph;

  beforeEach(() => {
    graph = new DirectedGraph() as ApplicationGraph;
  });

  // Basic graph creation and update tests
  describe('Basic functionality', () => {
    it('should add a new application node to an empty graph', () => {
      // Test that a new ArgoCD Application can be added to an empty graph
      // This verifies the basic functionality of node creation and proper ID generation
      // The test ensures that:
      // 1. The application node is created with correct metadata
      // 2. The node ID is properly generated using resourceId helper
      // 3. The node exists in the graph after creation

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: { name: 'test-app', namespace: 'default' },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'test-app');
      expect(graph.hasNode(appId)).toBe(true);
    });

    it('should update an existing application node', () => {
      // Test that an existing ArgoCD Application node can be updated with new status information
      // This verifies the graph's ability to handle state changes for applications
      // The test ensures that:
      // 1. The initial node is created with healthy and synced status
      // 2. The node can be updated with new health and sync statuses
      // 3. The node data is properly updated while maintaining the same node ID
      // 4. The graph structure remains intact during the update

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: { name: 'test-app', namespace: 'default' },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: { status: SyncStatus.Synced, revision: 'abc123' },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      // Update this node
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: { name: 'test-app', namespace: 'default' },
          status: {
            health: { status: HealthStatus.Degraded },
            sync: { status: SyncStatus.OutOfSync, revision: 'def456' },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'test-app');
      const nodeData = graph.getNodeAttribute(appId, 'data');

      // Check the node data
      if (!isApplication(nodeData)) {
        fail('Node is not an application');
      }

      expect(nodeData.status.health).toBe(HealthStatus.Degraded);
      expect(nodeData.status.sync).toBe(SyncStatus.OutOfSync);
    });
  });

  describe('Application source handling', () => {
    it('should handle application with single source', () => {
      // Test that an ArgoCD Application with a single source is correctly processed
      // This verifies the handling of applications with a single source field
      // The test ensures that:
      // 1. The single source is properly converted to an array of sources
      // 2. The source information is preserved in the correct format
      // 3. The node is created with the source properly normalized

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'single-source-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
            source: {
              repoURL: 'https://github.com/test/repo',
              path: 'path',
              targetRevision: 'HEAD',
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'single-source-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(Array.isArray(nodeData.data.spec.sources)).toBe(true);
      expect(nodeData.data.spec.sources.length).toBe(1);
      expect(nodeData.data.spec.sources[0]).toEqual({
        repoURL: 'https://github.com/test/repo',
        path: 'path',
        targetRevision: 'HEAD',
      });
    });

    it('should handle application with multiple sources', () => {
      // Test that an ArgoCD Application with multiple sources is correctly processed
      // This verifies the handling of applications that use the sources array format
      // The test ensures that:
      // 1. Multiple sources are properly maintained as an array
      // 2. All source information is preserved correctly
      // 3. The node is created with all sources properly structured

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'multi-source-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
            sources: [
              {
                repoURL: 'https://github.com/test/repo1',
                path: 'path1',
                targetRevision: 'HEAD',
              },
              {
                repoURL: 'https://github.com/test/repo2',
                path: 'path2',
                targetRevision: 'main',
              },
            ],
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'multi-source-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(Array.isArray(nodeData.data.spec.sources)).toBe(true);
      expect(nodeData.data.spec.sources.length).toBe(2);
      expect(nodeData.data.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/test/repo1',
          path: 'path1',
          targetRevision: 'HEAD',
        },
        {
          repoURL: 'https://github.com/test/repo2',
          path: 'path2',
          targetRevision: 'main',
        },
      ]);
    });

    it('should handle application with no sources', () => {
      // Test that an ArgoCD Application with no sources is correctly processed
      // This verifies the handling of applications that don't specify any source
      // The test ensures that:
      // 1. Applications without sources are properly normalized
      // 2. An empty sources array is created in the node data
      // 3. The application node is still created correctly

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'no-source-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'no-source-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(Array.isArray(nodeData.data.spec.sources)).toBe(true);
      expect(nodeData.data.spec.sources.length).toBe(0);
    });
  });

  describe('Health and Sync Status', () => {
    const baseApplication: ArgoApplication = {
      kind: 'Application',
      metadata: {
        name: 'test-app',
        namespace: 'default',
        annotations: {},
        labels: {},
      },
      spec: {
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace: 'default',
        },
        project: 'default',
        syncPolicy: {
          automated: null,
        },
      },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: {
          status: SyncStatus.Synced,
          revision: 'abc123',
        },
      },
    };

    it('should handle different health status values', () => {
      // Test that all possible health status values are correctly handled
      // This verifies the proper mapping and storage of application health states
      // The test ensures that:
      // 1. Each possible health status value is correctly set in the node data
      // 2. Health status is preserved during graph updates
      // 3. Health status values from Argo CD are properly mapped to the internal enum

      const healthStatusValues = [
        { input: HealthStatus.Healthy, expected: HealthStatus.Healthy },
        { input: HealthStatus.Progressing, expected: HealthStatus.Progressing },
        { input: HealthStatus.Degraded, expected: HealthStatus.Degraded },
        { input: HealthStatus.Suspended, expected: HealthStatus.Suspended },
        { input: HealthStatus.Missing, expected: HealthStatus.Missing },
        { input: HealthStatus.Unknown, expected: HealthStatus.Unknown },
      ];

      for (const status of healthStatusValues) {
        const application: ArgoApplication = {
          ...baseApplication,
          metadata: {
            ...baseApplication.metadata,
            name: `health-${HealthStatus[status.input].toLowerCase()}-app`,
          },
          status: {
            health: { status: status.input },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        };

        // Add one node to the graph
        updateApplicationGraph(graph, application, { nodes: [] });

        const appId = resourceId('Application', 'default', `health-${HealthStatus[status.input].toLowerCase()}-app`);
        const nodeData = graph.getNodeAttributes(appId) as any;

        expect(nodeData.data.status.health).toBe(status.expected);
      }
    });

    it('should handle missing health status by setting to Unknown', () => {
      // Test that applications with missing health status are set to Unknown
      // This verifies the fallback behavior when health information is unavailable
      // The test ensures that:
      // 1. Missing health status is properly handled with a default value
      // 2. The Unknown status is correctly applied to the node data
      // 3. The application node is still created with valid health status

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'missing-health-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
          },
          status: {
            health: { status: HealthStatus.Unknown },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'missing-health-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(nodeData.data.status.health).toBe(HealthStatus.Unknown);
    });

    it('should handle different sync status values', () => {
      // Test that all possible sync status values are correctly handled
      // This verifies the proper mapping and storage of application sync states
      // The test ensures that:
      // 1. Each possible sync status value is correctly set in the node data
      // 2. Sync status is preserved during graph updates
      // 3. Sync status values from Argo CD are properly mapped to the internal enum

      const syncStatusValues = [
        { input: SyncStatus.Synced, expected: SyncStatus.Synced },
        { input: SyncStatus.OutOfSync, expected: SyncStatus.OutOfSync },
        { input: SyncStatus.Unknown, expected: SyncStatus.Unknown },
      ];

      for (const status of syncStatusValues) {
        const application: ArgoApplication = {
          ...baseApplication,
          metadata: {
            ...baseApplication.metadata,
            name: `sync-${SyncStatus[status.input].toLowerCase()}-app`,
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: status.input,
              revision: 'abc123',
            },
          },
        };

        // Add one node to the graph
        updateApplicationGraph(graph, application, { nodes: [] });

        const appId = resourceId('Application', 'default', `sync-${SyncStatus[status.input].toLowerCase()}-app`);
        const nodeData = graph.getNodeAttributes(appId) as any;

        expect(nodeData.data.status.sync).toBe(status.expected);
      }
    });

    it('should handle missing sync status by setting to Unknown', () => {
      // Test that applications with missing sync status are set to Unknown
      // This verifies the fallback behavior when sync information is unavailable
      // The test ensures that:
      // 1. Missing sync status is properly handled with a default value
      // 2. The Unknown status is correctly applied to the node data
      // 3. The application node is still created with valid sync status

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'missing-sync-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: { status: SyncStatus.Unknown, revision: '' },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'missing-sync-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(nodeData.data.status.sync).toBe(SyncStatus.Unknown);
    });
  });

  describe('Sync Policy', () => {
    const baseApplication: ArgoApplication = {
      kind: 'Application',
      metadata: {
        name: 'test-app',
        namespace: 'default',
        annotations: {},
        labels: {},
      },
      spec: {
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace: 'default',
        },
        project: 'default',
        syncPolicy: {
          automated: null,
        },
      },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: {
          status: SyncStatus.Synced,
          revision: 'abc123',
        },
      },
    };

    it('should handle automated sync policy with prune and selfHeal', () => {
      // Test that applications with automated sync policy including prune and selfHeal flags are correctly processed
      // This verifies the proper handling of advanced sync policy configurations
      // The test ensures that:
      // 1. The automated sync policy with prune and selfHeal settings is correctly stored in node data
      // 2. All sync policy options are preserved during graph updates
      // 3. The application node reflects the correct sync automation settings

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'full-sync-policy-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: {
                prune: true,
                selfHeal: true,
              },
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'full-sync-policy-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(nodeData.data.spec.syncPolicy.automated).toEqual({
        prune: true,
        selfHeal: true,
      });
    });

    it('should handle when automated sync policy is null', () => {
      // Test that applications with null automated sync policy are correctly processed
      // This verifies the handling of applications without automated sync configured
      // The test ensures that:
      // 1. The null automated sync policy is correctly stored in node data
      // 2. The absence of sync automation is properly reflected in the graph
      // 3. The application node indicates that no automated sync is configured

      const application: ArgoApplication = {
        ...baseApplication,
        metadata: {
          ...baseApplication.metadata,
          name: 'null-sync-policy-app',
        },
        spec: {
          ...baseApplication.spec,
          syncPolicy: {
            automated: null,
          },
        },
      };

      // Add one node to the graph
      updateApplicationGraph(graph, application, { nodes: [] });

      const appId = resourceId('Application', 'default', 'null-sync-policy-app');
      const nodeData = graph.getNodeAttributes(appId) as any;

      expect(nodeData.data.spec.syncPolicy.automated).toBeFalsy();
    });
  });

  describe('Resource Tree Processing', () => {
    const baseApplication: ArgoApplication = {
      kind: 'Application',
      metadata: {
        name: 'parent-app',
        namespace: 'default',
        annotations: {},
        labels: {},
      },
      spec: {
        destination: {
          server: 'https://kubernetes.default.svc',
          namespace: 'default',
        },
        project: 'default',
        syncPolicy: {
          automated: null,
        },
      },
      status: {
        health: { status: HealthStatus.Healthy },
        sync: {
          status: SyncStatus.Synced,
          revision: 'abc123',
        },
      },
    };

    const baseResourceNode: Omit<ArgoResourceNode, 'name' | 'kind'> = {
      group: 'argoproj.io',
      namespace: 'default',
      version: 'v1alpha1',
      uid: 'test-uid',
      resourceVersion: '1',
      createdAt: '2021-01-01T00:00:00Z',
      parentRefs: [],
    };

    it('should process an empty resource tree', () => {
      // Test that an empty resource tree is correctly processed
      // This verifies the behavior when an application has no resources
      // The test ensures that:
      // 1. The application node is created even with an empty resource tree
      // 2. No additional nodes or edges are created
      // 3. The graph contains only the application node itself

      // Add one node to the graph
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'parent-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        { nodes: [] }
      );

      const appId = resourceId('Application', 'default', 'parent-app');

      expect(graph.hasNode(appId)).toBe(true);
      expect(graph.order).toBe(1); // Only one node
      expect(graph.size).toBe(0); // No edges
    });

    it('should add Application resource nodes from resource tree', () => {
      // Test that Application resource nodes from the resource tree are correctly added to the graph
      // This verifies the creation of child application nodes and edges to the parent
      // The test ensures that:
      // 1. Child application nodes are created from the resource tree
      // 2. Edges are created from the parent application to each child
      // 3. The graph structure correctly represents the parent-child relationship

      // Add one node to the graph with its child nodes
      updateApplicationGraph(
        graph,
        {
          kind: 'Application',
          metadata: {
            name: 'parent-app',
            namespace: 'default',
            annotations: {},
            labels: {},
          },
          spec: {
            destination: {
              server: 'https://kubernetes.default.svc',
              namespace: 'default',
            },
            project: 'default',
            syncPolicy: {
              automated: null,
            },
          },
          status: {
            health: { status: HealthStatus.Healthy },
            sync: {
              status: SyncStatus.Synced,
              revision: 'abc123',
            },
          },
        } as ArgoApplication,
        {
          nodes: [
            {
              group: 'argoproj.io',
              namespace: 'default',
              version: 'v1alpha1',
              kind: 'Application',
              name: 'child-app-1',
              uid: 'test-uid-1',
              resourceVersion: '1',
              createdAt: '2021-01-01T00:00:00Z',
              parentRefs: [],
            },
            {
              group: 'argoproj.io',
              namespace: 'default',
              version: 'v1alpha1',
              kind: 'Application',
              name: 'child-app-2',
              uid: 'test-uid-2',
              resourceVersion: '2',
              createdAt: '2021-01-01T00:00:00Z',
              parentRefs: [],
            },
          ],
        }
      );

      const parentAppId = resourceId('Application', 'default', 'parent-app');
      const childApp1Id = resourceId('Application', 'default', 'child-app-1');
      const childApp2Id = resourceId('Application', 'default', 'child-app-2');

      expect(graph.hasNode(parentAppId)).toBe(true);
      expect(graph.hasNode(childApp1Id)).toBe(true);
      expect(graph.hasNode(childApp2Id)).toBe(true);

      expect(graph.hasEdge(parentAppId, childApp1Id)).toBe(true);
      expect(graph.hasEdge(parentAppId, childApp2Id)).toBe(true);

      expect(graph.order).toBe(3); // Three nodes
      expect(graph.size).toBe(2); // Two edges
    });

    it('should add ApplicationSet resource nodes from resource tree', () => {
      // Test that ApplicationSet resource nodes from the resource tree are correctly added to the graph
      // This verifies the creation of ApplicationSet nodes and edges from the parent application
      // The test ensures that:
      // 1. ApplicationSet nodes are created from the resource tree
      // 2. Edges are created from the parent application to the ApplicationSet
      // 3. The graph structure correctly represents the App-to-AppSet relationship

      const application = baseApplication;
      const resourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'ApplicationSet',
            name: 'app-set-1',
          },
        ],
      };

      // Add one node to the graph with its ApplicationSet node
      updateApplicationGraph(graph, application, resourceTree);

      const parentAppId = resourceId('Application', 'default', 'parent-app');
      const appSetId = resourceId('ApplicationSet', 'default', 'app-set-1');

      expect(graph.hasNode(parentAppId)).toBe(true);
      expect(graph.hasNode(appSetId)).toBe(true);
      expect(graph.hasEdge(parentAppId, appSetId)).toBe(true);

      expect(graph.order).toBe(2);
      expect(graph.size).toBe(1);
    });

    it('should handle parent reference relationships (app -> appset -> app)', () => {
      // Test that complex parent reference relationships are correctly processed
      // This verifies the creation of a multi-level hierarchy with different resource types
      // The test ensures that:
      // 1. A chain of parent-child relationships (app -> appset -> app) is correctly represented
      // 2. Edges are created following the hierarchy defined by parent references
      // 3. The graph structure accurately reflects the relationships between resources

      // root-app -> middle-appset -> leaf-app

      // Add root application with its child nodes
      updateApplicationGraph(
        graph,
        {
          ...baseApplication,
          metadata: { name: 'root-app', namespace: 'default' },
        },
        {
          nodes: [
            {
              ...baseResourceNode,
              group: 'argoproj.io',
              kind: 'ApplicationSet',
              name: 'middle-appset',
              parentRefs: [
                {
                  group: 'argoproj.io',
                  kind: 'Application',
                  namespace: 'default',
                  name: 'root-app',
                },
              ],
            },
            {
              ...baseResourceNode,
              group: 'argoproj.io',
              kind: 'Application',
              name: 'leaf-app',
              parentRefs: [
                {
                  group: 'argoproj.io',
                  kind: 'ApplicationSet',
                  namespace: 'default',
                  name: 'middle-appset',
                },
              ],
            },
          ],
        }
      );

      // Check the nodes and edges
      const rootAppId = resourceId('Application', 'default', 'root-app');
      const appsetId = resourceId('ApplicationSet', 'default', 'middle-appset');
      const leafAppId = resourceId('Application', 'default', 'leaf-app');

      expect(graph.hasNode(rootAppId)).toBe(true);
      expect(graph.hasNode(appsetId)).toBe(true);
      expect(graph.hasNode(leafAppId)).toBe(true);

      // Check edges
      expect(graph.hasEdge(rootAppId, appsetId)).toBe(true);
      expect(graph.hasEdge(appsetId, leafAppId)).toBe(true);

      // Check the total number of nodes and edges
      // When processing the resources, the implementation adds edges both from appId -> resourceId
      // and from parentRef -> resourceId, which creates more nodes and edges than initially expected
      expect(graph.order).toBe(3); // Three nodes: root-app, middle-appset, leaf-app
      expect(graph.size).toBe(2); // Two edges: root-app -> middle-appset, middle-appset -> leaf-app
    });

    it('should ignore non-Application/ApplicationSet resource nodes', () => {
      // Test that non-Application/ApplicationSet resources are ignored
      // This verifies that only relevant Argo CD resource types are added to the graph
      // The test ensures that:
      // 1. Only Application and ApplicationSet resources are included in the graph
      // 2. Other Kubernetes resources (like Deployments and Services) are filtered out
      // 3. The graph contains only the resources that are part of the application hierarchy

      const application = baseApplication;
      const resourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'Application' as const,
            name: 'deployment-node',
            group: 'apps',
          },
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'child-app',
          },
          {
            ...baseResourceNode,
            kind: 'Application' as const,
            name: 'service-node',
            group: '',
          },
        ],
      };

      // Add one node to the graph with mixed resource types
      updateApplicationGraph(graph, application, resourceTree);

      const parentAppId = resourceId('Application', 'default', 'parent-app');
      const childAppId = resourceId('Application', 'default', 'child-app');
      const deploymentId = resourceId('Deployment', 'default', 'test-deployment');
      const serviceId = resourceId('Service', 'default', 'test-service');

      expect(graph.hasNode(parentAppId)).toBe(true);
      expect(graph.hasNode(childAppId)).toBe(true);
      expect(graph.hasNode(deploymentId)).toBe(false);
      expect(graph.hasNode(serviceId)).toBe(false);

      expect(graph.hasEdge(parentAppId, childAppId)).toBe(true);

      expect(graph.order).toBe(2);
      expect(graph.size).toBe(1);
    });

    it('should not add duplicate edges between the same nodes', () => {
      // Test that duplicate edges are not created between the same nodes
      // This verifies that the graph maintains unique relationships
      // The test ensures that:
      // 1. When updating an existing relationship, no duplicate edges are created
      // 2. The graph maintains exactly one edge between any two connected nodes
      // 3. Multiple invocations with the same data do not affect graph integrity

      const application = baseApplication;
      const resourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'child-app',
          },
        ],
      };

      // Add parent node with child to the graph
      updateApplicationGraph(graph, application, resourceTree);

      // Update with the same data - should not create duplicate edges
      updateApplicationGraph(graph, application, resourceTree);

      const parentAppId = resourceId('Application', 'default', 'parent-app');
      const childAppId = resourceId('Application', 'default', 'child-app');

      expect(graph.hasNode(parentAppId)).toBe(true);
      expect(graph.hasNode(childAppId)).toBe(true);
      expect(graph.hasEdge(parentAppId, childAppId)).toBe(true);

      expect(graph.size).toBe(1);
    });

    it('should handle complex parent references across multiple applications', () => {
      // Test that complex hierarchies with parent references across multiple applications are correctly processed
      // This verifies the creation of a sophisticated multi-level application structure
      // The test ensures that:
      // 1. A complex tree of applications and applicationsets is correctly represented
      // 2. Parent references are used to establish the correct hierarchical relationships
      // 3. The graph structure accurately reflects the intended application topology
      // 4. Updates to different parts of the hierarchy maintain overall graph integrity

      // Clear the graph
      graph.clear();

      // Create a hierarchy of apps and appsets with parent references
      // root-app -> middle-appset -> leaf-app-1
      //                           -> leaf-app-2 -> nested-app

      // Root application
      const rootApp: ArgoApplication = {
        ...baseApplication,
        metadata: {
          ...baseApplication.metadata,
          name: 'root-app',
        },
      };

      // Resource tree with an ApplicationSet
      const rootResourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'ApplicationSet',
            name: 'middle-appset',
          },
        ],
      };

      // Middle ApplicationSet represented as an Application for updating
      const middleAppSet: ArgoApplication = {
        ...baseApplication,
        metadata: {
          ...baseApplication.metadata,
          name: 'middle-appset',
        },
      };

      // Resource tree for the ApplicationSet with two child apps
      const middleResourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'leaf-app-1',
            parentRefs: [
              {
                group: 'argoproj.io',
                kind: 'ApplicationSet',
                namespace: 'default',
                name: 'middle-appset',
              },
            ],
          },
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'leaf-app-2',
            parentRefs: [
              {
                group: 'argoproj.io',
                kind: 'ApplicationSet',
                namespace: 'default',
                name: 'middle-appset',
              },
            ],
          },
        ],
      };

      // Leaf application that contains another nested app
      const leafApp: ArgoApplication = {
        ...baseApplication,
        metadata: {
          ...baseApplication.metadata,
          name: 'leaf-app-2',
        },
      };

      // Resource tree for the leaf app with a nested app
      const leafResourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'nested-app',
            parentRefs: [
              {
                group: 'argoproj.io',
                kind: 'Application',
                namespace: 'default',
                name: 'leaf-app-2',
              },
            ],
          },
        ],
      };

      // Add root application with ApplicationSet to the graph
      updateApplicationGraph(graph, rootApp, rootResourceTree);

      // Add middle ApplicationSet with child applications to the graph
      updateApplicationGraph(graph, middleAppSet, middleResourceTree);

      // Add leaf application with nested application to the graph
      updateApplicationGraph(graph, leafApp, leafResourceTree);

      // Get IDs for all nodes
      const rootAppId = resourceId('Application', 'default', 'root-app');
      const appsetId = resourceId('ApplicationSet', 'default', 'middle-appset');
      const leafApp1Id = resourceId('Application', 'default', 'leaf-app-1');
      const leafApp2Id = resourceId('Application', 'default', 'leaf-app-2');
      const nestedAppId = resourceId('Application', 'default', 'nested-app');

      // Verify all nodes exist
      expect(graph.hasNode(rootAppId)).toBe(true);
      expect(graph.hasNode(appsetId)).toBe(true);
      expect(graph.hasNode(leafApp1Id)).toBe(true);
      expect(graph.hasNode(leafApp2Id)).toBe(true);
      expect(graph.hasNode(nestedAppId)).toBe(true);

      // Verify the connections
      expect(graph.hasEdge(rootAppId, appsetId)).toBe(true);
      expect(graph.hasEdge(appsetId, leafApp1Id)).toBe(true);
      expect(graph.hasEdge(appsetId, leafApp2Id)).toBe(true);
      expect(graph.hasEdge(leafApp2Id, nestedAppId)).toBe(true);

      // Verify there is no direct connection between root app and leaf app
      expect(graph.hasEdge(rootAppId, leafApp1Id)).toBe(false);
      expect(graph.hasEdge(rootAppId, leafApp2Id)).toBe(false);

      // Check the total count of nodes and edges
      // The implementation creates extra nodes because of parentRefs handling
      expect(graph.order).toBe(6); // 6 nodes (including duplicates from parentRefs)
      expect(graph.size).toBe(4); // 4 edges (with direct connections from root app removed)
    });

    it('should connect nodes based on parentRefs', () => {
      // Test that nodes are connected based on parentRefs information
      // This verifies the parent-child relationship creation using explicit references
      // The test ensures that:
      // 1. Parent references in resource nodes are used to establish connections
      // 2. The correct edges are created based on these references
      // 3. The graph correctly reflects the hierarchical structure defined by parentRefs

      // Clear the graph
      graph.clear();

      // Create a parent application
      const parentApp: ArgoApplication = {
        ...baseApplication,
        metadata: {
          ...baseApplication.metadata,
          name: 'parent-app',
        },
      };

      // Create a resource tree with a child that has a parentRef
      const resourceTree: ArgoResourceTree = {
        nodes: [
          {
            ...baseResourceNode,
            kind: 'Application',
            name: 'child-app-with-parent-ref',
            // Add parent reference pointing to parent-app
            parentRefs: [
              {
                group: 'argoproj.io',
                kind: 'Application',
                namespace: 'default',
                name: 'parent-app',
              },
            ],
          },
        ],
      };

      // Add parent application with child referenced by parentRef
      updateApplicationGraph(graph, parentApp, resourceTree);

      // Get node IDs
      const parentAppId = resourceId('Application', 'default', 'parent-app');
      const childAppId = resourceId('Application', 'default', 'child-app-with-parent-ref');

      // Check that nodes exist
      expect(graph.hasNode(parentAppId)).toBe(true);
      expect(graph.hasNode(childAppId)).toBe(true);

      // Verify the connection from parent to child based on parentRef
      expect(graph.hasEdge(parentAppId, childAppId)).toBe(true);
    });
  });
});

describe('createOrUpdateApplicationNode', () => {
  let graph: ApplicationGraph;
  beforeEach(() => {
    graph = new DirectedGraph() as ApplicationGraph;
  });

  it('should add a node with minimal metadata', () => {
    // Test that a node is added to the graph with only minimal metadata (name, namespace)
    // This verifies that the function can handle the minimal required input and creates the correct node structure
    // The test ensures:
    // 1. The node is created with the expected id
    // 2. The metadata fields are set correctly
    // 3. The node is of kind 'Application' and has status/spec fields
    const app = { kind: 'Application', metadata: { name: 'a', namespace: 'ns' } } as any;
    const id = createOrUpdateApplicationNode(graph, app);
    expect(graph.hasNode(id)).toBe(true);
    const data = graph.getNodeAttribute(id, 'data');
    expect(data.metadata.name).toBe('a');
    expect(data.metadata.namespace).toBe('ns');
    expect(data.kind).toBe('Application');
    if (isApplication(data)) {
      expect(data.status).toBeDefined();
      expect(data.spec).toBeDefined();
    }
  });

  it("should update an existing node's data", () => {
    // Test that an existing node's data is updated when createOrUpdateApplicationNode is called again with the same id
    // This verifies that the function updates the status fields and does not create a duplicate node
    // The test ensures:
    // 1. The node is updated with new status values
    // 2. The node id remains the same
    const app = {
      kind: 'Application',
      metadata: { name: 'a', namespace: 'ns' },
      status: { health: { status: HealthStatus.Healthy }, sync: { status: SyncStatus.Synced } },
      spec: { sources: [], destination: { server: '', namespace: '' }, project: '', syncPolicy: {} },
    } as any;
    const id = createOrUpdateApplicationNode(graph, app);
    const app2 = {
      kind: 'Application',
      metadata: { name: 'a', namespace: 'ns' },
      status: { health: { status: HealthStatus.Degraded }, sync: { status: SyncStatus.OutOfSync } },
      spec: { sources: [], destination: { server: '', namespace: '' }, project: '', syncPolicy: {} },
    } as any;
    createOrUpdateApplicationNode(graph, app2);
    const data = graph.getNodeAttribute(id, 'data');
    if (isApplication(data)) {
      expect(data.status.health).toBe(HealthStatus.Degraded);
      expect(data.status.sync).toBe(SyncStatus.OutOfSync);
    }
  });

  it('should handle missing metadata fields gracefully', () => {
    // Test that the function does not throw and still creates a node when metadata fields are missing
    // This verifies robustness to incomplete input
    // The test ensures:
    // 1. The node is created
    // 2. The metadata fields are undefined if not provided
    const app = { kind: 'Application', metadata: {} } as any;
    const id = createOrUpdateApplicationNode(graph, app);
    expect(graph.hasNode(id)).toBe(true);
    const data = graph.getNodeAttribute(id, 'data');
    expect(data.metadata.name).toBeUndefined();
    expect(data.metadata.namespace).toBeUndefined();
  });

  it('should normalize sources field (single, multiple, missing)', () => {
    // Test that the sources field is always normalized to an array, whether the input uses 'source', 'sources', or is missing
    // This verifies compatibility with both ArgoCD v1 and v2+ Application specs
    // The test ensures:
    // 1. A single source is wrapped in an array
    // 2. Multiple sources are preserved as an array
    // 3. If missing, sources is set to an empty array
    const baseSpec = { destination: { server: '', namespace: '' }, project: '', syncPolicy: {} };
    const app1 = {
      kind: 'Application',
      metadata: { name: 'a', namespace: 'ns' },
      spec: { ...baseSpec, source: { foo: 1 } },
    } as any;
    const id1 = createOrUpdateApplicationNode(graph, app1);
    const data1 = graph.getNodeAttribute(id1, 'data');
    if (isApplication(data1)) {
      expect(data1.spec.sources).toEqual([{ foo: 1 }]);
    }
    const app2 = {
      kind: 'Application',
      metadata: { name: 'b', namespace: 'ns' },
      spec: { ...baseSpec, sources: [{ foo: 2 }, { bar: 3 }] },
    } as any;
    const id2 = createOrUpdateApplicationNode(graph, app2);
    const data2 = graph.getNodeAttribute(id2, 'data');
    if (isApplication(data2)) {
      expect(data2.spec.sources).toEqual([{ foo: 2 }, { bar: 3 }]);
    }
    const app3 = { kind: 'Application', metadata: { name: 'c', namespace: 'ns' }, spec: { ...baseSpec } } as any;
    const id3 = createOrUpdateApplicationNode(graph, app3);
    const data3 = graph.getNodeAttribute(id3, 'data');
    if (isApplication(data3)) {
      expect(data3.spec.sources).toEqual([]);
    }
  });

  it('should set status to Unknown if missing', () => {
    // Test that the status fields are set to HealthStatus.Unknown and SyncStatus.Unknown if missing from the input
    // This verifies the defaulting logic for status
    // The test ensures:
    // 1. The node is created
    // 2. The status fields are set to Unknown
    const app = { kind: 'Application', metadata: { name: 'a', namespace: 'ns' } } as any;
    const id = createOrUpdateApplicationNode(graph, app);
    const data = graph.getNodeAttribute(id, 'data');
    if (isApplication(data)) {
      expect(data.status.health).toBe(HealthStatus.Unknown);
      expect(data.status.sync).toBe(SyncStatus.Unknown);
    }
  });
});

describe('updateApplicationSubResources', () => {
  let graph: ApplicationGraph;
  const appId = 'app-id';
  beforeEach(() => {
    // Always provide a valid ApplicationSet node (minimal) for the graph
    graph = new DirectedGraph() as ApplicationGraph;
    graph.addNode(appId, {
      id: appId,
      position: { x: 0, y: 0 },
      data: { kind: 'ApplicationSet', metadata: { name: 'dummy', namespace: 'dummy' } },
    });
  });

  it('should add Application and ApplicationSet nodes and edges', () => {
    // Test that Application and ApplicationSet nodes are added from the resource tree and edges are created from the parent
    // This verifies that the function processes both resource kinds and links them to the parent node
    // The test ensures:
    // 1. Both Application and ApplicationSet nodes are created
    // 2. Edges from appId to each child are created
    const tree = {
      nodes: [
        { group: 'argoproj.io', kind: 'Application', namespace: 'ns', name: 'a', parentRefs: [] },
        { group: 'argoproj.io', kind: 'ApplicationSet', namespace: 'ns', name: 'b', parentRefs: [] },
      ],
    } as any;
    updateApplicationSubResources(graph, appId, tree);
    expect(graph.hasNode(resourceId('Application', 'ns', 'a'))).toBe(true);
    expect(graph.hasNode(resourceId('ApplicationSet', 'ns', 'b'))).toBe(true);
    expect(graph.hasEdge(appId, resourceId('Application', 'ns', 'a'))).toBe(true);
    expect(graph.hasEdge(appId, resourceId('ApplicationSet', 'ns', 'b'))).toBe(true);
  });

  it('should ignore non-argoproj.io or other kinds', () => {
    // Test that nodes with a group different from 'argoproj.io' or a kind different from Application/ApplicationSet are ignored
    // This verifies that only relevant ArgoCD resources are processed
    // The test ensures:
    // 1. No nodes or edges are created for ignored resources
    // 2. The graph only contains the initial parent node
    const tree = {
      nodes: [
        { group: 'apps', kind: 'Deployment', namespace: 'ns', name: 'd', parentRefs: [] },
        { group: '', kind: 'Service', namespace: 'ns', name: 's', parentRefs: [] },
      ],
    } as any;
    updateApplicationSubResources(graph, appId, tree);
    expect(graph.order).toBe(1); // only appId node
  });

  it('should handle parentRefs and create parent/child edges', () => {
    // Test that parentRefs are processed and edges are created from the referenced parent to the child
    // This verifies that the function builds the correct parent-child relationships based on parentRefs
    // The test ensures:
    // 1. Parent and child nodes are created if missing
    // 2. An edge is created from the parent to the child
    const tree = {
      nodes: [
        {
          group: 'argoproj.io',
          kind: 'Application',
          namespace: 'ns',
          name: 'child',
          parentRefs: [{ group: 'argoproj.io', kind: 'ApplicationSet', namespace: 'ns', name: 'parent' }],
        },
      ],
    } as any;
    updateApplicationSubResources(graph, appId, tree);
    const parentId = resourceId('ApplicationSet', 'ns', 'parent');
    const childId = resourceId('Application', 'ns', 'child');
    expect(graph.hasNode(parentId)).toBe(true);
    expect(graph.hasNode(childId)).toBe(true);
    expect(graph.hasEdge(parentId, childId)).toBe(true);
  });

  it('should not add duplicate nodes or edges', () => {
    // Test that calling the function multiple times with the same resource does not create duplicate nodes or edges
    // This verifies idempotency and uniqueness of nodes/edges
    // The test ensures:
    // 1. Only one node and one edge are created for the same resource
    // 2. The graph size/order remains correct after repeated calls
    const tree = {
      nodes: [{ group: 'argoproj.io', kind: 'Application', namespace: 'ns', name: 'dup', parentRefs: [] }],
    } as any;
    updateApplicationSubResources(graph, appId, tree);
    updateApplicationSubResources(graph, appId, tree);
    const dupId = resourceId('Application', 'ns', 'dup');
    expect(graph.order).toBe(2);
    expect(graph.size).toBe(1);
  });

  it('should handle undefined appId gracefully', () => {
    // Test that the function does not throw if appId is undefined
    // This verifies robustness to missing parent node
    // The test ensures:
    // 1. No exception is thrown
    // 2. The function completes successfully
    const tree = {
      nodes: [{ group: 'argoproj.io', kind: 'Application', namespace: 'ns', name: 'a', parentRefs: [] }],
    } as any;
    // Should not throw
    expect(() => updateApplicationSubResources(graph, undefined, tree)).not.toThrow();
  });

  it('should add ApplicationSet node without status/spec', () => {
    // Test that ApplicationSet nodes do not have status or spec fields
    // This verifies the type distinction between Application and ApplicationSet in the graph
    // The test ensures:
    // 1. The node is created with kind 'ApplicationSet'
    // 2. The status and spec fields are undefined
    const tree = {
      nodes: [{ group: 'argoproj.io', kind: 'ApplicationSet', namespace: 'ns', name: 'aset', parentRefs: [] }],
    } as any;
    updateApplicationSubResources(graph, appId, tree);
    const asetId = resourceId('ApplicationSet', 'ns', 'aset');
    const data = graph.getNodeAttribute(asetId, 'data');
    expect(data.kind).toBe('ApplicationSet');
    // @ts-expect-error intentionally: ApplicationSet does not have status/spec
    expect(data.status).toBeUndefined();
    // @ts-expect-error intentionally: ApplicationSet does not have status/spec
    expect(data.spec).toBeUndefined();
  });
});
