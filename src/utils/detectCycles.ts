import { DirectedGraph } from 'graphology';

import { CycleDetectionResult, CycleInfo, EdgeInfo } from '../types/cycles';

/**
 * Detects all cycles in a directed graph and returns complete cycle paths
 * Uses enhanced DFS algorithm with path tracking for comprehensive cycle detection
 *
 * @param graph The Graphology directed graph to analyze
 * @returns CycleDetectionResult containing boolean flag and detailed cycle information
 */
export function detectCycles(graph: DirectedGraph): CycleDetectionResult {
  const cycles: CycleInfo[] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const pathStack: string[] = [];

  /**
   * Performs depth-first search to detect cycles
   * @param node Current node being processed
   */
  function dfs(node: string): void {
    // If node is in recursion stack, we found a back edge (cycle)
    if (recursionStack.has(node)) {
      // Extract the cycle path from the point where we hit the back edge
      const cycleStartIndex = pathStack.indexOf(node);
      if (cycleStartIndex !== -1) {
        const cycleNodes = pathStack.slice(cycleStartIndex);
        cycleNodes.push(node); // Close the cycle

        const cycleInfo = createCycleInfo(cycleNodes, graph);
        if (cycleInfo) {
          cycles.push(cycleInfo);
        }
      }
      return;
    }

    // If node was already visited in a previous DFS traversal, skip
    if (visited.has(node)) {
      return;
    }

    // Mark node as visited and add to current path
    visited.add(node);
    recursionStack.add(node);
    pathStack.push(node);

    // Explore all outgoing neighbors
    graph.forEachOutNeighbor(node, (neighbor: string) => {
      dfs(neighbor);
    });

    // Backtrack: remove node from recursion stack and path
    recursionStack.delete(node);
    pathStack.pop();
  }

  // Process all nodes to handle disconnected components
  graph.forEachNode((node: string) => {
    if (!visited.has(node)) {
      dfs(node);
    }
  });

  // Deduplicate cycles that represent the same loop
  const uniqueCycles = deduplicateCycles(cycles);

  return {
    hasCycle: uniqueCycles.length > 0,
    cycles: uniqueCycles,
  };
}

/**
 * Creates a CycleInfo object from a sequence of nodes forming a cycle
 * @param nodes Array of node IDs forming the cycle (with duplicate end node)
 * @param graph The graph to validate edges exist
 * @returns CycleInfo object or null if invalid cycle
 */
function createCycleInfo(nodes: string[], graph: DirectedGraph): CycleInfo | null {
  if (nodes.length < 2) {
    // Need at least 1 node (plus duplicate) to form a cycle
    return null;
  }

  // Handle self-loops (nodes like ['A', 'A'])
  if (nodes.length === 2 && nodes[0] === nodes[1]) {
    const node = nodes[0];

    // Verify the self-loop edge exists
    if (!graph.hasEdge(node, node)) {
      console.warn(`[detectCycles] Self-loop edge ${node}->${node} not found in graph`);
      return null;
    }

    return {
      id: node,
      nodes: [node],
      edges: [
        {
          source: node,
          target: node,
          id: `${node}-${node}`,
        },
      ],
    };
  }

  if (nodes.length < 3) {
    // Need at least 2 unique nodes + duplicate to form a non-self-loop cycle
    return null;
  }

  // Remove the duplicate end node to get the actual cycle
  const cycleNodes = nodes.slice(0, -1);
  const edges: EdgeInfo[] = [];

  // Create edges for the cycle
  for (let i = 0; i < cycleNodes.length; i++) {
    const source = cycleNodes[i];
    const target = cycleNodes[(i + 1) % cycleNodes.length];

    // Verify the edge actually exists in the graph
    if (!graph.hasEdge(source, target)) {
      console.warn(`[detectCycles] Edge ${source}->${target} not found in graph`);
      return null;
    }

    edges.push({
      source,
      target,
      id: `${source}-${target}`,
    });
  }

  return {
    id: cycleNodes.join('->'),
    nodes: cycleNodes,
    edges,
  };
}

/**
 * Removes duplicate cycles that represent the same logical cycle
 * Two cycles are considered the same if they contain the same set of nodes
 * regardless of starting point or direction
 *
 * @param cycles Array of detected cycles
 * @returns Array of unique cycles
 */
function deduplicateCycles(cycles: CycleInfo[]): CycleInfo[] {
  const seen = new Set<string>();
  const uniqueCycles: CycleInfo[] = [];

  for (const cycle of cycles) {
    // Create a canonical signature for the cycle
    // Sort nodes to handle different starting points
    const sortedNodes = cycle.nodes.slice().sort();
    const signature = sortedNodes.join(',');

    if (!seen.has(signature)) {
      seen.add(signature);
      uniqueCycles.push(cycle);
    }
  }

  return uniqueCycles;
}

/**
 * Utility function to check if a specific edge is part of any cycle
 * @param edgeId Edge identifier in format "source-target"
 * @param cycleResult Result from detectCycles function
 * @returns Index of the cycle containing this edge, or -1 if not in any cycle
 */
export function getCycleIndexForEdge(edgeId: string, cycleResult: CycleDetectionResult): number {
  for (let i = 0; i < cycleResult.cycles.length; i++) {
    const cycle = cycleResult.cycles[i];
    if (cycle.edges.some((edge) => edge.id === edgeId)) {
      return i;
    }
  }
  return -1;
}

/**
 * Utility function to check if a specific node is part of any cycle
 * @param nodeId Node identifier
 * @param cycleResult Result from detectCycles function
 * @returns Array of cycle indices that contain this node
 */
export function getCycleIndicesForNode(nodeId: string, cycleResult: CycleDetectionResult): number[] {
  const indices: number[] = [];
  for (let i = 0; i < cycleResult.cycles.length; i++) {
    const cycle = cycleResult.cycles[i];
    if (cycle.nodes.includes(nodeId)) {
      indices.push(i);
    }
  }
  return indices;
}
