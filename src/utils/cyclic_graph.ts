import { DirectedGraph } from "graphology";

/**
 * Checks if a graph contains cycles using DFS algorithm
 * @param graph The Graphology directed graph to check
 * @returns true if the graph contains at least one cycle, false otherwise
 */
export function hasCycle(graph: DirectedGraph): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  // Helper function to perform DFS
  function dfs(node: string): boolean {
    // If node is in recursion stack, we found a cycle
    if (recursionStack.has(node)) {
      return true;
    }

    // If node was already visited in a previous DFS call, no cycle here
    if (visited.has(node)) {
      return false;
    }

    // Mark node as visited and add to recursion stack
    visited.add(node);
    recursionStack.add(node);

    // Check all out-neighbors
    let hasCycleInNeighbors = false;
    graph.forEachOutNeighbor(node, (neighbor: string) => {
      // Continue DFS even if neighbor was visited before
      // Only stop if we find a cycle
      if (dfs(neighbor)) {
        hasCycleInNeighbors = true;
      }
    });

    // Remove node from recursion stack before backtracking
    recursionStack.delete(node);
    return hasCycleInNeighbors;
  }

  // Check all nodes in case the graph is not connected
  let hasCycle = false;
  graph.forEachNode((node: string) => {
    if (!visited.has(node)) {
      if (dfs(node)) {
        hasCycle = true;
      }
    }
  });

  return hasCycle;
}
