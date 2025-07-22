import { Application, ApplicationSource, SourceDriftStatus } from '../types';

export const ANNOTATION_PREFIX = 'source-ref.argocd.argoproj.io';

/**
 * Source reference information stored in annotations
 */
type SourceReference = Partial<Pick<ApplicationSource, 'repoURL' | 'path' | 'targetRevision' | 'chart'>>;

/**
 * Extracts source references from application annotations.
 *
 * @param annotations - Annotations from the application metadata.
 * @returns Array of source references, where the first element (index 0) corresponds to the single source (if present),
 *          and subsequent elements correspond to multi-sources (refs[1] = sources[0], refs[2] = sources[1], etc.).
 */
export function getSourceReferencesFromAnnotations(annotations: Record<string, string> = {}): SourceReference[] {
  const sourceRefs: SourceReference[] = [];

  // Filter annotations to only those starting with the annotation prefix
  // and sort them to ensure consistent order
  const rxAnnotation = new RegExp(
    `^${ANNOTATION_PREFIX}/(?<idx>\\d+\\.)?(?<field>repository-url|path|target-revision|chart)$`
  );
  const filteredAnnotations = Object.entries(annotations)
    .filter(([key]) => rxAnnotation.test(key))
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  for (const [annotation, value] of filteredAnnotations) {
    const match = annotation.match(rxAnnotation);
    if (match) {
      const { idx, field } = match.groups;

      const ref: SourceReference = {};
      switch (field) {
        case 'repository-url':
          ref.repoURL = value;
          break;
        case 'path':
          ref.path = value;
          break;
        case 'target-revision':
          ref.targetRevision = value;
          break;
        case 'chart':
          ref.chart = value;
          break;
        default:
          continue; // Skip unknown fields... but this should not happen
      }

      if (idx === undefined) {
        // Single source annotation
        sourceRefs[0] = {
          ...(sourceRefs[0] || {}),
          ...ref,
        };
      } else {
        // Multi-source annotation
        const sourceIndex = parseInt(idx, 10);

        sourceRefs[sourceIndex + 1] = {
          ...(sourceRefs[sourceIndex + 1] || {}),
          ...ref,
        };
      }
    }
  }
  return sourceRefs;
}

/**
 * Check if an application has source drift
 * @param application - The application to check for source drift
 * @returns SourceDriftStatus indicating whether the application is in drift, conform, or unknown
 */
export function detectSourceDrift(application: Application): SourceDriftStatus {
  if (!application.spec) {
    // No application spec defined - cannot determine drift
    return SourceDriftStatus.Conform;
  }

  // Extract reference sources from annotations
  const referenceSources = getSourceReferencesFromAnnotations(application.metadata?.annotations);
  if (referenceSources.length === 0) {
    // No reference sources defined - cannot determine drift
    return SourceDriftStatus.Conform;
  }

  // Get current sources from application spec
  const currentSources = [application.spec.source, ...(application.spec.sources || [])];
  if (currentSources.filter((s) => s).length === 0) {
    // No current sources defined - cannot determine drift
    return SourceDriftStatus.Conform;
  }

  // Compare each current source with its reference
  for (let index = 0; index < currentSources.length; index++) {
    const currentSource = currentSources[index];
    const referenceSource = referenceSources[index];

    if (!referenceSource) {
      // No reference for this source index
      continue;
    }

    // Check for repository drift
    const fields: (keyof SourceReference)[] = ['repoURL', 'path', 'targetRevision', 'chart'];
    for (const field of fields) {
      // Only check fields that are defined in the reference source
      if (referenceSource[field] !== undefined && currentSource[field] !== referenceSource[field]) {
        return SourceDriftStatus.Drift;
      }
    }
  }

  // If no drift was detected, return conform status
  return SourceDriftStatus.Conform;
}

/**
 * Revert source drift for an application
 * @param application - The application to revert source drift for
 * @returns The updated application object
 */
export function revertSourceDrift(application: Application): Application {
  const referenceSources = getSourceReferencesFromAnnotations(application.metadata?.annotations);
  if (referenceSources.length === 0) {
    // No reference sources defined - cannot revert drift
    return application;
  }

  // Create a deep copy of the application to avoid mutation
  const updatedApplication = JSON.parse(JSON.stringify(application)) as Application;

  const [source, ...sources] = referenceSources;
  if (source && updatedApplication.spec.source) {
    updatedApplication.spec.source = {
      ...updatedApplication.spec.source,
      ...source,
    };
  }

  // If there are multiple sources, we need to set them in the application spec
  if (sources.length > 0 && updatedApplication.spec.sources) {
    for (let i = 0; i < sources.length; i++) {
      if (i >= updatedApplication.spec.sources.length) break; // Do not create new sources if not already defined

      const source = sources[i];
      if (!source) continue;

      updatedApplication.spec.sources[i] = {
        ...updatedApplication.spec.sources[i],
        ...source,
      };
    }
  }

  return updatedApplication;
}
