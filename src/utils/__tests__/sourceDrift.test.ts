import { describe, expect, test } from '@jest/globals';

import { Application, ApplicationSource, SourceDriftStatus } from '../../types';
import {
  ANNOTATION_PREFIX,
  detectSourceDrift,
  getSourceReferencesFromAnnotations,
  revertSourceDrift,
} from '../sourceDrift';

// Helper to create a mock application
const createMockApplication = (
  name: string = 'test-app',
  spec?: Partial<Application['spec']>,
  annotations?: Record<string, string>
): Application => ({
  kind: 'Application',
  metadata: {
    name,
    namespace: 'argocd',
    annotations,
  },
  spec: {
    destination: { server: 'https://kubernetes.default.svc', namespace: 'default' },
    project: 'default',
    syncPolicy: {},
    ...spec,
  },
});

// Helper to create a mock application source
const createMockSource = (overrides?: Partial<ApplicationSource>): ApplicationSource => ({
  repoURL: 'https://github.com/org/repo',
  path: 'manifests',
  targetRevision: 'main',
  ...overrides,
});

describe('getSourceReferencesFromAnnotations', () => {
  describe('Empty or no annotations', () => {
    test('should return empty array when no annotations provided', () => {
      const result = getSourceReferencesFromAnnotations();
      expect(result).toEqual([]);
    });

    test('should return empty array when empty annotations object provided', () => {
      const result = getSourceReferencesFromAnnotations({});
      expect(result).toEqual([]);
    });

    test('should return empty array when annotations contain no source references', () => {
      const annotations = {
        'app.kubernetes.io/name': 'test-app',
        'argocd.argoproj.io/sync-wave': '1',
        'some.other.annotation': 'value',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([]);
    });
  });

  describe('Single source annotations', () => {
    test('should extract single source with repository URL only', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ repoURL: 'https://github.com/org/repo' }]);
    });

    test('should extract single source with path only', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/path`]: 'manifests/prod',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ path: 'manifests/prod' }]);
    });

    test('should extract single source with target revision only', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/target-revision`]: 'v1.2.3',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ targetRevision: 'v1.2.3' }]);
    });

    test('should extract single source with chart only', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/chart`]: 'nginx',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ chart: 'nginx' }]);
    });

    test('should extract single source with all fields', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        [`${ANNOTATION_PREFIX}/path`]: 'manifests/prod',
        [`${ANNOTATION_PREFIX}/target-revision`]: 'v1.2.3',
        [`${ANNOTATION_PREFIX}/chart`]: 'nginx',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        {
          repoURL: 'https://github.com/org/repo',
          path: 'manifests/prod',
          targetRevision: 'v1.2.3',
          chart: 'nginx',
        },
      ]);
    });

    test('should extract single source with mixed order annotations', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/target-revision`]: 'v1.2.3',
        'app.kubernetes.io/name': 'test-app',
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        [`${ANNOTATION_PREFIX}/path`]: 'manifests',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        {
          repoURL: 'https://github.com/org/repo',
          path: 'manifests',
          targetRevision: 'v1.2.3',
        },
      ]);
    });
  });

  describe('Multi-source annotations', () => {
    test('should extract multi-source with single indexed source', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
        [`${ANNOTATION_PREFIX}/0.path`]: 'manifests/app1',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        undefined, // Index 0 is for single source
        {
          repoURL: 'https://github.com/org/repo1',
          path: 'manifests/app1',
        },
      ]);
    });

    test('should extract multi-source with multiple indexed sources', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
        [`${ANNOTATION_PREFIX}/0.path`]: 'manifests/app1',
        [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
        [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        undefined, // Index 0 is for single source
        {
          repoURL: 'https://github.com/org/repo1',
          path: 'manifests/app1',
        },
        {
          repoURL: 'https://github.com/org/repo2',
          targetRevision: 'develop',
        },
      ]);
    });

    test('should handle sparse multi-source indices', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
        [`${ANNOTATION_PREFIX}/2.repository-url`]: 'https://github.com/org/repo3',
        [`${ANNOTATION_PREFIX}/2.chart`]: 'redis',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        undefined, // Index 0 is for single source
        { repoURL: 'https://github.com/org/repo1' },
        undefined, // Index 2 is missing
        {
          repoURL: 'https://github.com/org/repo3',
          chart: 'redis',
        },
      ]);
    });

    test('should handle large multi-source indices', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/10.repository-url`]: 'https://github.com/org/repo11',
        [`${ANNOTATION_PREFIX}/10.path`]: 'charts/app11',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result[11]).toEqual({
        repoURL: 'https://github.com/org/repo11',
        path: 'charts/app11',
      });
    });
  });

  describe('Mixed single and multi-source annotations', () => {
    test('should extract both single source and multi-sources', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/main-repo',
        [`${ANNOTATION_PREFIX}/path`]: 'main-manifests',
        [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
        [`${ANNOTATION_PREFIX}/0.chart`]: 'nginx',
        [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
        [`${ANNOTATION_PREFIX}/1.target-revision`]: 'feature-branch',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        {
          repoURL: 'https://github.com/org/main-repo',
          path: 'main-manifests',
        },
        {
          repoURL: 'https://github.com/org/repo1',
          chart: 'nginx',
        },
        {
          repoURL: 'https://github.com/org/repo2',
          targetRevision: 'feature-branch',
        },
      ]);
    });
  });

  describe('Invalid or malformed annotations', () => {
    test('should ignore annotations with invalid field names', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/invalid-field`]: 'value',
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ repoURL: 'https://github.com/org/repo' }]);
    });

    test('should ignore annotations with invalid index format', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/abc.repository-url`]: 'https://github.com/org/repo',
        [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/valid-repo',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([undefined, { repoURL: 'https://github.com/org/valid-repo' }]);
    });

    test('should handle annotations with similar prefixes but different namespaces', () => {
      const annotations = {
        'source-ref.other.io/repository-url': 'https://github.com/org/other-repo',
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/correct-repo',
        'other-prefix.argocd.argoproj.io/repository-url': 'https://github.com/org/wrong-repo',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([{ repoURL: 'https://github.com/org/correct-repo' }]);
    });
  });

  describe('Annotation sorting and consistency', () => {
    test('should produce consistent results regardless of annotation order', () => {
      const annotations1 = {
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        [`${ANNOTATION_PREFIX}/path`]: 'manifests',
        [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
      };
      const annotations2 = {
        [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        [`${ANNOTATION_PREFIX}/path`]: 'manifests',
      };

      const result1 = getSourceReferencesFromAnnotations(annotations1);
      const result2 = getSourceReferencesFromAnnotations(annotations2);
      expect(result1).toEqual(result2);
    });

    test('should handle empty string values', () => {
      const annotations = {
        [`${ANNOTATION_PREFIX}/repository-url`]: '',
        [`${ANNOTATION_PREFIX}/path`]: 'manifests',
        [`${ANNOTATION_PREFIX}/target-revision`]: '',
      };
      const result = getSourceReferencesFromAnnotations(annotations);
      expect(result).toEqual([
        {
          repoURL: '',
          path: 'manifests',
          targetRevision: '',
        },
      ]);
    });
  });
});

describe('detectSourceDrift', () => {
  describe('Edge cases and invalid inputs', () => {
    test('should return Conform when application has no spec', () => {
      const app = createMockApplication('test-app', undefined);
      delete app.spec;
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when application spec is null', () => {
      const app = createMockApplication('test-app');
      app.spec = null as any;
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when no reference sources in annotations', () => {
      const app = createMockApplication('test-app', {
        source: createMockSource(),
      });
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when annotations are empty', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource(),
        },
        {}
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when no current sources are defined', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: undefined,
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when current sources array is empty', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when current sources contain only null/undefined values', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: null as any,
          sources: [null as any, undefined as any],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });
  });

  describe('Single source drift detection', () => {
    test('should return Conform when single source matches reference exactly', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'manifests',
            targetRevision: 'main',
            chart: 'nginx',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/chart`]: 'nginx',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Conform when single source matches reference partially (missing reference fields)', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'manifests',
            targetRevision: 'main',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Drift when repoURL differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/different-repo',
            path: 'manifests',
            targetRevision: 'main',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when path differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'different-manifests',
            targetRevision: 'main',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when targetRevision differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'manifests',
            targetRevision: 'develop',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when chart differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'manifests',
            targetRevision: 'main',
            chart: 'redis',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/chart`]: 'nginx',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when multiple fields differ', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/different-repo',
            path: 'different-manifests',
            targetRevision: 'develop',
            chart: 'redis',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/chart`]: 'nginx',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should handle undefined vs empty string differences', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: 'manifests',
            targetRevision: 'main',
            chart: undefined,
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/chart`]: '',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });
  });

  describe('Multi-source drift detection', () => {
    test('should return Conform when all multi-sources match their references', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'manifests2',
              targetRevision: 'develop',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'manifests2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Drift when first multi-source differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/different-repo1',
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'manifests2',
              targetRevision: 'develop',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'manifests2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when second multi-source differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'different-manifests2',
              targetRevision: 'develop',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'manifests2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should handle missing reference for some multi-sources', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'manifests2',
              targetRevision: 'develop',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          // Missing reference for sources[1]
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should handle more current sources than references', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'manifests2',
              targetRevision: 'develop',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo3',
              path: 'manifests3',
              targetRevision: 'feature',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'manifests2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
          // No reference for sources[2]
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });
  });

  describe('Mixed single and multi-source scenarios', () => {
    test('should return Conform when single source matches and multi-sources match', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/main-repo',
            path: 'main-manifests',
            targetRevision: 'main',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'v1.0.0',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/main-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'main-manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'v1.0.0',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should return Drift when single source differs but multi-sources match', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/different-main-repo',
            path: 'main-manifests',
            targetRevision: 'main',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/repo1',
              path: 'manifests1',
              targetRevision: 'v1.0.0',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/main-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'main-manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'v1.0.0',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should return Drift when single source matches but multi-source differs', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/main-repo',
            path: 'main-manifests',
            targetRevision: 'main',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/different-repo1',
              path: 'manifests1',
              targetRevision: 'v1.0.0',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/main-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'main-manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'v1.0.0',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });
  });

  describe('Special field value scenarios', () => {
    test('should handle empty string vs undefined comparisons correctly', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/repo',
            path: '',
            targetRevision: 'main',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: '',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should handle null vs undefined comparisons correctly', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: {
            ...createMockSource(),
            chart: null as any,
          },
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });

    test('should handle whitespace differences', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: ' https://github.com/org/repo ',
            path: 'manifests',
            targetRevision: 'main',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/repo',
          [`${ANNOTATION_PREFIX}/path`]: 'manifests',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'main',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });
  });

  describe('Performance and early exit scenarios', () => {
    test('should exit early on first drift detected', () => {
      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/different-repo1', // This should cause early exit
              path: 'manifests1',
              targetRevision: 'main',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/repo2',
              path: 'manifests2',
              targetRevision: 'develop',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'manifests1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'main',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'manifests2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'develop',
        }
      );
      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Drift);
    });

    test('should handle large number of sources efficiently', () => {
      const sources = Array.from({ length: 50 }, (_, i) =>
        createMockSource({
          repoURL: `https://github.com/org/repo${i}`,
          path: `manifests${i}`,
          targetRevision: 'main',
        })
      );

      const annotations: Record<string, string> = {};
      sources.forEach((_, i) => {
        annotations[`${ANNOTATION_PREFIX}/${i}.repository-url`] = `https://github.com/org/repo${i}`;
        annotations[`${ANNOTATION_PREFIX}/${i}.path`] = `manifests${i}`;
        annotations[`${ANNOTATION_PREFIX}/${i}.target-revision`] = 'main';
      });

      const app = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources,
        },
        annotations
      );

      const result = detectSourceDrift(app);
      expect(result).toBe(SourceDriftStatus.Conform);
    });
  });
});

describe('revertSourceDrift', () => {
  describe('Edge cases and invalid inputs', () => {
    test('should return application unchanged when no reference sources in annotations', () => {
      const originalApp = createMockApplication('test-app', {
        source: createMockSource({
          repoURL: 'https://github.com/org/current-repo',
          path: 'current-path',
          targetRevision: 'current-branch',
        }),
      });

      const result = revertSourceDrift(originalApp);

      expect(result).toEqual(originalApp);
      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/current-repo',
        path: 'current-path',
        targetRevision: 'current-branch',
      });
    });

    test('should return application unchanged when annotations are empty', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
          }),
        },
        {}
      );

      const result = revertSourceDrift(originalApp);

      expect(result).toEqual(originalApp);
    });

    test('should log warning and return unchanged application when no reference sources', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const originalApp = createMockApplication('test-app', {
        source: createMockSource(),
      });

      const result = revertSourceDrift(originalApp);

      expect(consoleWarnSpy).toHaveBeenCalledWith('No reference sources defined for application:', 'test-app');
      expect(result).toEqual(originalApp);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Single source revert', () => {
    test('should revert all fields of single source from annotations', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
            targetRevision: 'current-branch',
            chart: 'current-chart',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'reference-path',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'reference-branch',
          [`${ANNOTATION_PREFIX}/chart`]: 'reference-chart',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-repo',
        path: 'reference-path',
        targetRevision: 'reference-branch',
        chart: 'reference-chart',
      });
    });

    test('should revert only specified fields and preserve others', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
            targetRevision: 'current-branch',
            chart: 'current-chart',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-repo',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'reference-branch',
          // Note: path and chart are not specified in reference
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-repo',
        path: 'current-path', // preserved
        targetRevision: 'reference-branch',
        chart: 'current-chart', // preserved
      });
    });

    test('should handle partial reference source with undefined fields', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
            targetRevision: 'current-branch',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-repo',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-repo',
        path: 'current-path',
        targetRevision: 'current-branch',
      });
    });

    test('should handle empty string values in reference source', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
            targetRevision: 'current-branch',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: '',
          [`${ANNOTATION_PREFIX}/path`]: 'reference-path',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: '',
        path: 'reference-path',
        targetRevision: 'current-branch',
      });
    });
  });

  describe('Multi-source revert', () => {
    test('should revert all multi-sources from annotations', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
              targetRevision: 'current-branch1',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/current-repo2',
              path: 'current-path2',
              targetRevision: 'current-branch2',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'reference-path1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'reference-branch1',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/reference-repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'reference-path2',
          [`${ANNOTATION_PREFIX}/1.target-revision`]: 'reference-branch2',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/reference-repo1',
          path: 'reference-path1',
          targetRevision: 'reference-branch1',
        },
        {
          repoURL: 'https://github.com/org/reference-repo2',
          path: 'reference-path2',
          targetRevision: 'reference-branch2',
        },
      ]);
    });

    test('should revert only sources with reference annotations and preserve others', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
              targetRevision: 'current-branch1',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/current-repo2',
              path: 'current-path2',
              targetRevision: 'current-branch2',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/current-repo3',
              path: 'current-path3',
              targetRevision: 'current-branch3',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/0.path`]: 'reference-path1',
          // No reference for source index 1
          [`${ANNOTATION_PREFIX}/2.repository-url`]: 'https://github.com/org/reference-repo3',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/reference-repo1',
          path: 'reference-path1',
          targetRevision: 'current-branch1',
        },
        {
          // Source index 1 unchanged
          repoURL: 'https://github.com/org/current-repo2',
          path: 'current-path2',
          targetRevision: 'current-branch2',
        },
        {
          repoURL: 'https://github.com/org/reference-repo3',
          path: 'current-path3',
          targetRevision: 'current-branch3',
        },
      ]);
    });

    test('should not create new sources if reference has more sources than current', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/reference-repo2',
          [`${ANNOTATION_PREFIX}/2.repository-url`]: 'https://github.com/org/reference-repo3',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.sources).toHaveLength(1);
      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/reference-repo1',
          path: 'current-path1',
          targetRevision: 'main', // This comes from createMockSource helper
        },
      ]);
    });

    test('should handle undefined sources array gracefully', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: undefined,
          sources: undefined,
        },
        {
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/reference-repo2',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.sources).toBeUndefined();
    });
  });

  describe('Mixed single and multi-source revert', () => {
    test('should revert both single source and multi-sources', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-main-repo',
            path: 'current-main-path',
            targetRevision: 'current-main-branch',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
              targetRevision: 'current-branch1',
            }),
            createMockSource({
              repoURL: 'https://github.com/org/current-repo2',
              path: 'current-path2',
              targetRevision: 'current-branch2',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-main-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'reference-main-path',
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/0.target-revision`]: 'reference-branch1',
          [`${ANNOTATION_PREFIX}/1.repository-url`]: 'https://github.com/org/reference-repo2',
          [`${ANNOTATION_PREFIX}/1.path`]: 'reference-path2',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-main-repo',
        path: 'reference-main-path',
        targetRevision: 'current-main-branch',
      });

      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/reference-repo1',
          path: 'current-path1',
          targetRevision: 'reference-branch1',
        },
        {
          repoURL: 'https://github.com/org/reference-repo2',
          path: 'reference-path2',
          targetRevision: 'current-branch2',
        },
      ]);
    });

    test('should handle case where only single source has reference', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-main-repo',
            path: 'current-main-path',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
            }),
          ],
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-main-repo',
          [`${ANNOTATION_PREFIX}/target-revision`]: 'reference-main-branch',
          // No multi-source references
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-main-repo',
        path: 'current-main-path',
        targetRevision: 'reference-main-branch',
      });

      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/current-repo1',
          path: 'current-path1',
          targetRevision: 'main', // This comes from createMockSource helper
        },
      ]);
    });

    test('should handle case where only multi-sources have references', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-main-repo',
            path: 'current-main-path',
          }),
          sources: [
            createMockSource({
              repoURL: 'https://github.com/org/current-repo1',
              path: 'current-path1',
            }),
          ],
        },
        {
          // No single source references
          [`${ANNOTATION_PREFIX}/0.repository-url`]: 'https://github.com/org/reference-repo1',
          [`${ANNOTATION_PREFIX}/0.chart`]: 'reference-chart1',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/current-main-repo',
        path: 'current-main-path',
        targetRevision: 'main', // This comes from createMockSource helper
      });

      expect(result.spec.sources).toEqual([
        {
          repoURL: 'https://github.com/org/reference-repo1',
          path: 'current-path1',
          chart: 'reference-chart1',
          targetRevision: 'main', // This comes from createMockSource helper
        },
      ]);
    });
  });

  describe('Data integrity and immutability', () => {
    test('should not mutate original application object', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource({
            repoURL: 'https://github.com/org/current-repo',
            path: 'current-path',
          }),
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-repo',
          [`${ANNOTATION_PREFIX}/path`]: 'reference-path',
        }
      );

      const originalSourceSnapshot = { ...originalApp.spec.source };

      const result = revertSourceDrift(originalApp);

      // Original application should remain unchanged
      expect(originalApp.spec.source).toEqual(originalSourceSnapshot);

      // Result should have the reverted values
      expect(result.spec.source).toEqual({
        repoURL: 'https://github.com/org/reference-repo',
        path: 'reference-path',
        targetRevision: 'main',
      });
    });

    test('should preserve other application properties', () => {
      const originalApp = createMockApplication(
        'test-app',
        {
          source: createMockSource(),
          destination: { server: 'https://custom.server', namespace: 'custom-namespace' },
          project: 'custom-project',
          syncPolicy: { automated: { prune: true, selfHeal: false } },
        },
        {
          [`${ANNOTATION_PREFIX}/repository-url`]: 'https://github.com/org/reference-repo',
        }
      );

      const result = revertSourceDrift(originalApp);

      expect(result.metadata).toEqual(originalApp.metadata);
      expect(result.spec.destination).toEqual(originalApp.spec.destination);
      expect(result.spec.project).toEqual(originalApp.spec.project);
      expect(result.spec.syncPolicy).toEqual(originalApp.spec.syncPolicy);
    });
  });
});
