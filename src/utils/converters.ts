import { ArgoCDApplication, ArgoCDApplicationSet } from "../types/argocd";
import { Application, HealthStatus, SyncStatus } from "../types/application";

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
      destination: {
        server: argoApp.spec.destination.server,
        namespace: argoApp.spec.destination.namespace,
      },
      project: argoApp.spec.project,
      syncPolicy: {
        automated: argoApp.spec.syncPolicy.automated && {
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
  };

  return app;
}
