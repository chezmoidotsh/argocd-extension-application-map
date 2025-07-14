import { DirectedGraph } from 'graphology';

import { hasCycle } from '../hasCycle';

describe('hasCycle function', () => {
  // ACYCLIC GRAPHS (Should return false)
  describe('Acyclic Graphs', () => {
    it('should return false for an empty graph', () => {
      // Diagram:
      // []  (Empty graph)
      const graph = new DirectedGraph();
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for a graph with a single node', () => {
      // Diagram:
      //   ┌─┐
      //   │A│
      //   └─┘
      // (Single node, no edges)
      const graph = new DirectedGraph();
      graph.addNode('A');
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for a linear graph', () => {
      // Diagram:
      //   ┌─┐
      //   │A│
      //   └┬┘
      //   ┌▽┐
      //   │B│
      //   └┬┘
      //   ┌▽┐
      //   │C│
      //   └┬┘
      //   ┌▽┐
      //   │D│
      //   └─┘
      // (Linear path)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for a tree structure', () => {
      // Diagram:
      //   ┌───────┐
      //   │A      │
      //   └┬─────┬┘
      //   ┌▽───┐┌▽┐
      //   │B   ││C│
      //   └┬──┬┘└┬┘
      //   ┌▽┐┌▽┐┌▽┐
      //   │D││E││F│
      //   └─┘└─┘└─┘

      const graph = new DirectedGraph();
      graph.addNode('A'); // root
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
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for a complex DAG (Directed Acyclic Graph)', () => {
      // Diagram:
      //   ┌────┐
      //   │A   │
      //   └┬──┬┘
      //   ┌▽┐┌▽───┐
      //   │C││B   │
      //   └┬┘└┬──┬┘
      //   ┌▽──▽┐┌▽┐
      //   │D   ││E│
      //   └┬───┘└┬┘
      //   ┌▽─────▽┐
      //   │F      │
      //   └───────┘
      // (DAG with multiple paths)

      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');
      // Multiple paths but no cycles
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');
      graph.addEdge('B', 'E');
      graph.addEdge('D', 'F');
      graph.addEdge('E', 'F');
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for a diamond shape graph', () => {
      // Diagram:
      //   ┌────┐
      //   │A   │
      //   └┬──┬┘
      //   ┌▽┐┌▽┐
      //   │C││B│
      //   └┬┘└┬┘
      //   ┌▽──▽┐
      //   │D   │
      //   └────┘
      // (Diamond shape)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return false for multiple disconnected acyclic components', () => {
      // Diagram:
      //   ┌──┐┌──┐
      //   │A1││A2│
      //   └┬─┘└┬─┘
      //   ┌▽─┐┌▽─┐
      //   │B1││B2│
      //   └──┘└┬─┘
      //   ┌────▽┐
      //   │C2   │
      //   └─────┘
      // (Disconnected acyclic graphs)
      const graph = new DirectedGraph();
      // Component 1
      graph.addNode('A1');
      graph.addNode('B1');
      graph.addEdge('A1', 'B1');
      // Component 2
      graph.addNode('A2');
      graph.addNode('B2');
      graph.addNode('C2');
      graph.addEdge('A2', 'B2');
      graph.addEdge('B2', 'C2');
      expect(hasCycle(graph)).toBe(false);
    });
  });

  // CYCLIC GRAPHS (Should return true)
  describe('Cyclic Graphs', () => {
    it('should return true for a self-loop', () => {
      // Diagram:
      //   ┌─┐
      //   │A◁─┐
      //   └┬┘ │
      //    └──┘
      // (Self-loop - A points to itself)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addEdge('A', 'A');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a simple 2-node cycle', () => {
      // Diagram:
      //   ┌─┐
      //   │A◁─┐
      //   └┬┘ │
      //   ┌▽┐ │
      //   │B│ │
      //   └┬┘ │
      //    └──┘
      // (2-node cycle: A → B → A)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a simple 3-node cycle', () => {
      // Diagram:
      //   ┌─┐
      //   │A◁─┐
      //   └┬┘ │
      //   ┌▽┐ │
      //   │B│ │
      //   └┬┘ │
      //   ┌▽┐ │
      //   │C│ │
      //   └┬┘ │
      //    └──┘
      // (3-node cycle: A → B → C → A)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'A');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a long cycle', () => {
      // Diagram:
      //   ┌─┐
      //   │A◁─┐
      //   └┬┘ │
      //   ┌▽┐ │
      //   │B│ │
      //   └┬┘ │
      //   ┌▽┐ │
      //   │C│ │
      //   └┬┘ │
      //   ┌▽┐ │
      //   │D│ │
      //   └┬┘ │
      //   ┌▽┐ │
      //   │E│ │
      //   └┬┘ │
      //    └──┘
      // (5-node cycle: A → B → C → D → E → A)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      graph.addEdge('E', 'A');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a graph with branches and a cycle', () => {
      // Diagram:
      //   ┌────┐
      //   │A   ◁─┐
      //   └┬──┬┘ │
      //   ┌▽┐┌▽┐ │
      //   │E││B│ │
      //   └┬┘└┬┘ │
      //   ┌▽┐┌▽┐ │
      //   │F││C├─┘
      //   └─┘└┬┘
      //   ┌───▽┐
      //   │D   │
      //   └────┘
      // (Cycle: B → C → D → B with a branch A → E → F)
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
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for multiple cycles in the same graph', () => {
      // Diagram:
      //   ┌─┐    ┌─┐
      //   │A◁─┐  │C◁─┐
      //   └┬┘ │  └┬┘ │
      //   ┌▽┐ │  ┌▽┐ │
      //   │B│ │  │D│ │
      //   └┬┘ │  └┬┘ │
      //    └──┘  ┌▽┐ │
      //          │E│ │
      //          └┬┘ │
      //           └──┘
      // (Two separate cycles: A → B → A and C → D → E → C)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      // Cycle 1: A->B->A
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'A');
      // Cycle 2: C->D->E->C
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      graph.addEdge('E', 'C');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a graph with nested cycles', () => {
      // Diagram:
      //     ┌─┐
      //   ┌─▷A│
      //   │ └┬┘
      //   │ ┌▽┐
      //   │ │B◁────┐
      //   │ └┬┘    │
      //   │ ┌▽───┐ │
      //   │ │C   │ │
      //   │ └┬──┬┘ │
      //   │ ┌▽┐┌▽┐ │
      //   │ │D││E│ │
      //   │ └┬┘└┬┘ │
      //   └──┘  └──┘
      // (Outer cycle: A → B → C → D → A)
      // (Inner cycle: B → C → E → B)
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
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a complex graph with multiple paths and a cycle', () => {
      // Diagram:
      //   ┌────┐
      //   │A   │
      //   └┬──┬┘
      //   ┌▽┐┌▽┐
      //   │C││B◁─┐
      //   └┬┘└┬┘ │
      //   ┌▽──▽┐ │
      //   │D   │ │
      //   └┬──┬┘ │
      //   ┌▽┐┌▽┐ │
      //   │E││F│ │
      //   └┬┘└─┘ │
      //    └─────┘
      // (Cycle: B → D → E → B)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');
      // Multiple paths
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('B', 'D');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      graph.addEdge('D', 'F');
      // Add an edge that creates a cycle
      graph.addEdge('E', 'B');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a graph with a cycle at the end', () => {
      // Diagram:
      //   ┌─┐
      //   │A│
      //   └┬┘
      //   ┌▽┐
      //   │B│
      //   └┬┘
      //   ┌▽┐
      //   │C│
      //   └┬┘
      //   ┌▽┐
      //   │D◁─┐
      //   └┬┘ │
      //   ┌▽┐ │
      //   │E│ │
      //   └┬┘ │
      //    └──┘
      // (Linear path A → B → C → D → E with a cycle D ⇄ E at the end)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      // Linear path: A->B->C->D->E
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      // Add cycle at the end: D->E->D
      graph.addEdge('E', 'D');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true if one of multiple disconnected components has a cycle', () => {
      // Diagram:
      //   ┌──┐┌──┐
      //   │A1││A2◁─┐
      //   └┬─┘└┬─┘ │
      //   ┌▽─┐┌▽─┐ │
      //   │B1││B2│ │
      //   └┬─┘└┬─┘ │
      //   ┌▽─┐┌▽─┐ │
      //   │C1││C2│ │
      //   └──┘└┬─┘ │
      //        └───┘
      // (Component 1: No cycle, Component 2: A2 → B2 → C2 → A2 has a cycle)
      const graph = new DirectedGraph();
      // Component 1 (acyclic)
      graph.addNode('A1');
      graph.addNode('B1');
      graph.addNode('C1');
      graph.addEdge('A1', 'B1');
      graph.addEdge('B1', 'C1');

      // Component 2 (cyclic)
      graph.addNode('A2');
      graph.addNode('B2');
      graph.addNode('C2');
      graph.addEdge('A2', 'B2');
      graph.addEdge('B2', 'C2');
      graph.addEdge('C2', 'A2');

      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a graph with self-loop in middle of a path', () => {
      // Diagram:
      //   ┌─┐
      //   │A│
      //   └┬┘
      //   ┌▽┐
      //   │B◁─┐
      //   └┬┘ │
      //    ├──┘
      //   ┌▽┐
      //   │C│
      //   └┬┘
      //   ┌▽┐
      //   │D│
      //   └─┘
      // (Path A → B → C → D with self-loop at B: B → B)
      const graph = new DirectedGraph();
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'B'); // Self-loop
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      expect(hasCycle(graph)).toBe(true);
    });
  });

  // EDGE CASES AND SPECIAL SCENARIOS
  describe('Edge Cases', () => {
    it('should handle a complex graph with many nodes', () => {
      // Diagram: (simplified, as it has 100 nodes)
      //   ┌──┐
      //   │00│
      //   └┬─┘
      //   ┌▽─┐
      //   │01│
      //   └┬─┘
      //   ...
      //    │
      //   ┌▽─┐
      //   │50◁─┐
      //   └┬─┘ │
      //   .......
      //    │   │
      //   ┌▽─┐ │
      //   │99│ │
      //   └┬─┘ │
      //    └───┘

      const graph = new DirectedGraph();
      // Create 100 nodes
      for (let i = 0; i < 100; i++) {
        graph.addNode(`${i}`);
      }
      // Connect nodes in a chain
      for (let i = 0; i < 99; i++) {
        graph.addEdge(`${i}`, `${i + 1}`);
      }
      expect(hasCycle(graph)).toBe(false);

      // Add a cycle
      graph.addEdge('99', '50');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should handle a graph with obscure cycle', () => {
      // Diagram: (Complex graph with many connections)
      //     ┌─────┐
      //   ┌─▷A    │
      //   │ └┬─┬─┬┘
      //   │  │ │┌▽────────┐
      //   │  │ ││B        │
      //   │  │ │└┬─────┬┬─┘
      //   │  │ │┌▽────┐││
      //   │  │ ││C    │││
      //   │  │ │└┬─┬┬─┘││
      //   │  │┌▽─▽┐││  ││
      //   │  ││D  │││  ││
      //   │  │└──┬┘││  ││
      //   │  │   │ ││  ││
      //   │  │   │ ││  ││
      //   │  │   │ ││  ││
      //   │  │   │ ││  ││
      //   │  │┌──│─┘│  ││
      //   │  ││  │ ┌┘  ││
      //   │  ││ ┌│─│───┘│
      //   │  ││ ││ │┌───┘
      //   │  ││┌▽▽┐││
      //   │  │││E │││
      //   │  ││└┬─┘││
      //   │ ┌▽▽─▽┐ ││
      //   │ │F   │ ││
      //   │ └───┬┘ ││
      //   │    ┌│──│┘
      //   │  ┌─││──┘
      //   │  │┌▽▽┐
      //   │  ││G │
      //   │  │└┬─┘
      //   │ ┌▽─▽┐
      //   │ │H  │
      //   │ └┬──┘
      //   └──┘
      // (Multiple paths without cycle, then adding H → A creates a cycle)
      const graph = new DirectedGraph();
      // Create a complex path
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');
      graph.addNode('F');
      graph.addNode('G');
      graph.addNode('H');

      // Main path
      graph.addEdge('A', 'B');
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'E');
      graph.addEdge('E', 'F');
      graph.addEdge('F', 'G');
      graph.addEdge('G', 'H');

      // Lots of distracting edges
      graph.addEdge('A', 'D');
      graph.addEdge('B', 'E');
      graph.addEdge('C', 'F');
      graph.addEdge('A', 'F');
      graph.addEdge('B', 'G');
      graph.addEdge('C', 'H');

      expect(hasCycle(graph)).toBe(false);

      // Add an obscure edge creating a cycle
      graph.addEdge('H', 'A');
      expect(hasCycle(graph)).toBe(true);
    });

    it('should correctly identify a graph with multiple entry points to a cycle', () => {
      // Diagram:
      //   ┌───┐
      //   │A  │
      //   └┬─┬┘
      //    │┌▽┐
      //    ││B◁─┐
      //    │└┬┘ │
      //   ┌▽─▽┐ │
      //   │C  │ │
      //   └┬──┘ │
      //   ┌▽┐   │
      //   │D◁─┐ │
      //   └┬┘ │ │
      //    ├──│─┘
      //   ┌▽┐ │
      //   │E│ │
      //   └┬┘ │
      //    └──┘
      // (Cycle: B → C → D → B with multiple entry points A → B, A → C, E → D)
      const graph = new DirectedGraph();
      // Create cycle: B->C->D->B
      graph.addNode('A');
      graph.addNode('B');
      graph.addNode('C');
      graph.addNode('D');
      graph.addNode('E');

      // The cycle
      graph.addEdge('B', 'C');
      graph.addEdge('C', 'D');
      graph.addEdge('D', 'B');

      // Multiple entry points to the cycle
      graph.addEdge('A', 'B');
      graph.addEdge('A', 'C');
      graph.addEdge('E', 'D');

      expect(hasCycle(graph)).toBe(true);
    });
  });
});
