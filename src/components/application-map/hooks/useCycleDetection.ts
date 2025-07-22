import { DirectedGraph } from 'graphology';

import { useMemo, useRef } from 'react';

import { ApplicationGraphNode } from '../../../types';
import { CycleDetectionResult } from '../../../types/cycles';
import { detectCycles } from '../../../utils/detectCycles';

/**
 * Maximum number of cached cycle detection results to prevent memory issues
 */
const MAX_CACHE_SIZE = 10;

/**
 * Custom hook for cycle detection with intelligent caching
 * @param graph The application graph to analyze
 * @returns Cycle detection result with caching optimization
 */
export function useCycleDetection(graph: DirectedGraph<ApplicationGraphNode> | null): CycleDetectionResult {
  // Cache for cycle detection results to avoid expensive recalculations
  const cycleCache = useRef<Map<string, CycleDetectionResult>>(new Map());

  // Generate deterministic graph signature for cache key
  const generateGraphSignature = (graph: DirectedGraph): string => {
    const nodes = graph.nodes().sort();
    const edges = graph.edges().sort();
    return `nodes:${nodes.join(',')}-edges:${edges.join(',')}`;
  };

  // Optimized cycle detection with caching
  const getCachedCycleDetection = (graph: DirectedGraph): CycleDetectionResult => {
    const signature = generateGraphSignature(graph);

    // Check if we have a cached result
    if (cycleCache.current.has(signature)) {
      const cached = cycleCache.current.get(signature)!;
      console.debug('[Extension] Using cached cycle detection result for signature:', signature);
      return cached;
    }

    // Compute new result
    console.debug('[Extension] Computing new cycle detection for signature:', signature);
    const result = detectCycles(graph);

    // Store in cache
    cycleCache.current.set(signature, result);

    // Cleanup cache if it gets too large (LRU-style)
    if (cycleCache.current.size > MAX_CACHE_SIZE) {
      const firstKey = cycleCache.current.keys().next().value;
      if (firstKey) {
        cycleCache.current.delete(firstKey);
        console.debug('[Extension] Cleaned up old cache entry:', firstKey);
      }
    }

    return result;
  };

  // Memoize expensive computations to avoid unnecessary re-calculations
  const memoizedCycleDetection = useMemo(() => {
    if (!graph || graph.order === 0) {
      return { hasCycle: false, cycles: [] };
    }
    return getCachedCycleDetection(graph);
  }, [graph]);

  return memoizedCycleDetection;
}
