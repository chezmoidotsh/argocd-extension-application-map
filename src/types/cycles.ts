/**
 * Types for cycle detection functionality in the application dependency graph
 */

/**
 * Information about a single edge in the dependency graph
 */
export interface EdgeInfo {
  /** Source node identifier */
  source: string;
  /** Target node identifier */
  target: string;
  /** Unique edge identifier (typically "source-target") */
  id: string;
}

/**
 * Information about a detected cycle in the dependency graph
 */
export interface CycleInfo {
  /** Unique identifier for the cycle (nodes joined by "->") */
  id: string;
  /** Array of node identifiers that form the cycle (ordered) */
  nodes: string[];
  /** Array of edges that form the cycle */
  edges: EdgeInfo[];
}

/**
 * Result of cycle detection algorithm
 */
export interface CycleDetectionResult {
  /** Whether any cycles were detected in the graph */
  hasCycle: boolean;
  /** Array of all detected cycles */
  cycles: CycleInfo[];
}
