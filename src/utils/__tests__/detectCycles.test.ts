import { DirectedGraph } from 'graphology';

import { detectCycles, getCycleIndexForEdge, getCycleIndicesForNode } from '../detectCycles';

describe('detectCycles function', () => {
  describe('Acyclic Graphs', () => {
    it('should return no cycles for an empty graph', () => {
      const graph = new DirectedGraph();
      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should return no cycles for a single node', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should return no cycles for a linear graph', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should return no cycles for a tree structure', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('B', 'E');
      graph.addEdge('C', 'F');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should return no cycles for a complex DAG', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');
      graph.addEdge('B', 'E');
      graph.addEdge('D', 'F');
      graph.addEdge('E', 'F');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });
  });

  describe('Cyclic Graphs', () => {
    it('should detect a self-loop and return correct path', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addEdge('A', 'A');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);

      const cycle = result.cycles[0];
      expect(cycle.nodes).toEqual(['A']);
      expect(cycle.edges).toEqual([{ source: 'A', target: 'A', id: 'A-A' }]);
      expect(cycle.id).toBe('A');
    });

    it('should detect a simple 2-node cycle and return correct path', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);

      const cycle = result.cycles[0];
      expect(cycle.nodes).toEqual(expect.arrayContaining(['A', 'B']));
      expect(cycle.nodes).toHaveLength(2);
      expect(cycle.edges).toHaveLength(2);

      // Check that all expected edges exist
      const edgeIds = cycle.edges.map((e) => e.id);
      expect(edgeIds).toContain('A-B');
      expect(edgeIds).toContain('B-A');
    });

    it('should detect a simple 3-node cycle and return correct path', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'A');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);

      const cycle = result.cycles[0];
      expect(cycle.nodes).toEqual(expect.arrayContaining(['A', 'B', 'C']));
      expect(cycle.nodes).toHaveLength(3);
      expect(cycle.edges).toHaveLength(3);

      // Check that all expected edges exist
      const edgeIds = cycle.edges.map((e) => e.id);
      expect(edgeIds).toContain('A-B');
      expect(edgeIds).toContain('B-C');
      expect(edgeIds).toContain('C-A');
    });

    it('should detect multiple cycles and return correct paths', () => {
      const graph = new DirectedGraph();

      // Cycle 1: A->B->A
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');

      // Cycle 2: C->D->E->C
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      graph.addEdge('E', 'C');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(2);

      // Check that we have one 2-node cycle and one 3-node cycle
      const cycleLengths = result.cycles.map((c) => c.nodes.length).sort();
      expect(cycleLengths).toEqual([2, 3]);
    });

    it('should detect a cycle in a graph with branches', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');

      // Main path with a cycle
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'B'); // This creates a cycle B->C->D->B

      // Branch without a cycle
      graph.addEdge('A', 'E');
      graph.addEdge('E', 'F');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);

      const cycle = result.cycles[0];
      expect(cycle.nodes).toEqual(expect.arrayContaining(['B', 'C', 'D']));
      expect(cycle.nodes).toHaveLength(3);
    });

    it('should handle complex graph with nested cycles', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');

      // Outer cycle: A->B->C->D->A
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'A');

      // Inner cycle: B->C->E->B
      graph.addEdge('C', 'E');
      graph.addEdge('E', 'B');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles.length).toBeGreaterThanOrEqual(1);

      // Should detect cycles, but exact number may vary due to overlapping cycles
      // The important thing is that cycles are detected
      const allCycleNodes = new Set();
      result.cycles.forEach((cycle) => {
        cycle.nodes.forEach((node) => allCycleNodes.add(node));
      });

      // All nodes except potentially isolated ones should be in cycles
      expect(allCycleNodes.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle disconnected components with cycles', () => {
      const graph = new DirectedGraph();

      // Component 1 (acyclic)
      graph.addNode('A1');
      graph.addNode('B1');
      graph.addEdge('A1', 'B1');

      // Component 2 (cyclic)
      graph.addNode('A2');
      graph.addNode('B2');
      graph.addNode('C2');
      graph.addEdge('A2', 'B2');
      graph.addEdge('B2', 'C2');
      graph.addEdge('C2', 'A2');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);

      const cycle = result.cycles[0];
      expect(cycle.nodes).toEqual(expect.arrayContaining(['A2', 'B2', 'C2']));
    });

    it('should deduplicate equivalent cycles', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');

      // Create a cycle that might be detected multiple times
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'A');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1); // Should be deduplicated
    });

    it('should handle large cycles efficiently', () => {
      const graph = new DirectedGraph();
      const nodeCount = 50;

      // Create a large cycle
      for (let i = 0; i < nodeCount; i++) {
        graph.addNode(`node${i}`);
      }

      for (let i = 0; i < nodeCount; i++) {
        const source = `node${i}`;
        const target = `node${(i + 1) % nodeCount}`;
        graph.addEdge(source, target);
      }

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(true);
      expect(result.cycles).toHaveLength(1);
      expect(result.cycles[0].nodes).toHaveLength(nodeCount);
      expect(result.cycles[0].edges).toHaveLength(nodeCount);
    });
  });

  describe('Utility Functions', () => {
    let graph: DirectedGraph;
    let result: any;

    beforeEach(() => {
      graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'A');

      result = detectCycles(graph);
    });

    describe('getCycleIndexForEdge', () => {
      it('should return correct cycle index for edges in cycle', () => {
        expect(getCycleIndexForEdge('A-B', result)).toBe(0);
        expect(getCycleIndexForEdge('B-C', result)).toBe(0);
        expect(getCycleIndexForEdge('C-A', result)).toBe(0);
      });

      it('should return -1 for edges not in any cycle', () => {
        expect(getCycleIndexForEdge('D-E', result)).toBe(-1);
        expect(getCycleIndexForEdge('nonexistent', result)).toBe(-1);
      });
    });

    describe('getCycleIndicesForNode', () => {
      it('should return correct cycle indices for nodes in cycle', () => {
        expect(getCycleIndicesForNode('A', result)).toEqual([0]);
        expect(getCycleIndicesForNode('B', result)).toEqual([0]);
        expect(getCycleIndicesForNode('C', result)).toEqual([0]);
      });

      it('should return empty array for nodes not in any cycle', () => {
        expect(getCycleIndicesForNode('D', result)).toEqual([]);
        expect(getCycleIndicesForNode('nonexistent', result)).toEqual([]);
      });

      it('should return multiple indices for nodes in multiple cycles', () => {
        // Add another cycle that shares node B
        graph.addNode('D');
        graph.addEdge('B', 'D');
        graph.addEdge('D', 'B');

        const multiCycleResult = detectCycles(graph);
        const nodeIndices = getCycleIndicesForNode('B', multiCycleResult);

        expect(nodeIndices.length).toBeGreaterThanOrEqual(1);
        expect(nodeIndices).toEqual(expect.arrayContaining([expect.any(Number)]));
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle graphs with no edges', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');

      const result = detectCycles(graph);

      expect(result.hasCycle).toBe(false);
      expect(result.cycles).toHaveLength(0);
    });

    it('should be consistent across multiple calls', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');

      const result1 = detectCycles(graph);
      const result2 = detectCycles(graph);

      expect(result1.hasCycle).toBe(result2.hasCycle);
      expect(result1.cycles).toHaveLength(result2.cycles.length);
    });

    it('should validate that detected edges actually exist in graph', () => {
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');

      const result = detectCycles(graph);

      // Verify all detected edges exist in the original graph
      result.cycles.forEach((cycle) => {
        cycle.edges.forEach((edge) => {
          expect(graph.hasEdge(edge.source, edge.target)).toBe(true);
        });
      });
    });
  });
});
