import { CycleDetectionResult } from '../../../types/cycles';

/**
 * Cycle color palette for visual distinction between multiple cycles
 */
export const CYCLE_COLORS = ['#d32f2f', '#f57c00', '#7b1fa2', '#c2185b', '#00796b'] as const;

/**
 * Information about an edge that is part of a cycle
 */
export interface EdgeCycleInfo {
  cycleIndex: number;
  cycleId: string;
}

/**
 * Finds cycle information for a specific edge
 * @param edgeId Edge identifier in format "source-target"
 * @param cycles Cycle detection result
 * @returns Cycle information or null if edge is not part of any cycle
 */
export function getCycleInfoForEdge(edgeId: string, cycles: CycleDetectionResult): EdgeCycleInfo | null {
  for (let i = 0; i < cycles.cycles.length; i++) {
    const cycle = cycles.cycles[i];
    if (cycle.edges.some((edge) => edge.id === edgeId)) {
      return { cycleIndex: i, cycleId: cycle.id };
    }
  }
  return null;
}

/**
 * Gets the visual style for a cycle edge
 * @param cycleIndex Index of the cycle (0-based)
 * @returns React CSS properties for the edge
 */
export function getCycleEdgeStyle(cycleIndex: number): React.CSSProperties {
  const color = CYCLE_COLORS[cycleIndex % CYCLE_COLORS.length];

  return {
    stroke: color,
    strokeWidth: 2,
    strokeDasharray: 'none',
    strokeOpacity: 1,
  };
}

/**
 * Gets the color for a specific cycle
 * @param cycleIndex Index of the cycle (0-based)
 * @returns CSS color string
 */
export function getCycleColor(cycleIndex: number): string {
  return CYCLE_COLORS[cycleIndex % CYCLE_COLORS.length];
}
