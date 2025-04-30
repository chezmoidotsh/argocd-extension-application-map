import { ArgoCDApplication, ArgoCDApplicationSet } from "../types/argocd";
import {
  Application,
  ApplicationKind,
  HealthStatus,
  SyncStatus,
} from "../types/application";

/**
 * Converts an ArgoCDApplication to an Application
 * @param argoApp The ArgoCD application to convert
 * @returns The converted Application
 */
export function convertArgoCDApplicationToApplication(
  argoApp: ArgoCDApplication,
): Application {
  console.debug(`ArgoCDApplication:`, argoApp);
  const app: Application = {
    kind: "Application",
    metadata: {
      name: argoApp.metadata.name,
      namespace: argoApp.metadata.namespace,
      annotations: argoApp.metadata.annotations,
      labels: argoApp.metadata.labels,
    },
    spec: {
      source: {
        repoURL: argoApp.spec.source.repoURL,
        path: argoApp.spec.source.path,
        targetRevision: argoApp.spec.source.targetRevision,
      },
      destination: {
        server: argoApp.spec.destination.server,
        namespace: argoApp.spec.destination.namespace,
      },
      project: argoApp.spec.project,
      syncPolicy: {
        automated: {
          prune: argoApp.spec.syncPolicy.automated.prune,
          selfHeal: argoApp.spec.syncPolicy.automated.selfHeal,
        },
      },
    },
    status: {
      health:
        (argoApp.status.health?.status as HealthStatus) ?? HealthStatus.Unknown,
      sync: (argoApp.status.sync?.status as SyncStatus) ?? SyncStatus.Unknown,
    },
    resources: argoApp.status.resources
      .filter(
        (resource) =>
          resource.kind === "Application" || resource.kind === "ApplicationSet",
      )
      .map((resource) => ({
        kind: resource.kind as ApplicationKind,
        metadata: {
          name: resource.name,
          namespace: resource.namespace,
        },
        status: {
          health:
            (resource.health?.status as HealthStatus) ?? HealthStatus.Unknown,
          sync: (resource.status as SyncStatus) ?? SyncStatus.Unknown,
        },
      })),
  };

  return app;
}

/**
 * Converts an ArgoCDApplicationSet to an Application
 * @param argoAppSet The ArgoCD application set to convert
 * @returns The converted Application
 */
export function convertArgoCDApplicationSetToApplication(
  argoAppSet: ArgoCDApplicationSet,
): Application {
  console.debug(`ArgoCDApplicationSet:`, argoAppSet);
  const app: Application = {
    kind: "ApplicationSet",
    metadata: {
      name: argoAppSet.metadata.name,
      namespace: argoAppSet.metadata.namespace,
      annotations: argoAppSet.metadata.annotations,
      labels: argoAppSet.metadata.labels,
    },
    status: {
      health: undefined,
      sync: undefined,
    },
    resources: argoAppSet.status.resources
      .filter(
        (resource) =>
          resource.kind === "Application" || resource.kind === "ApplicationSet",
      )
      .map((resource) => ({
        kind: resource.kind as ApplicationKind,
        metadata: {
          name: resource.name,
          namespace: resource.namespace,
        },
        status: {
          health:
            (resource.health?.status as HealthStatus) ?? HealthStatus.Unknown,
          sync: (resource.status as SyncStatus) ?? SyncStatus.Unknown,
        },
      })),
  };

  return app;
}
