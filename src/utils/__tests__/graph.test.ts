import { DirectedGraph } from 'graphology';

import { RankDirection } from '../../types/graph';
import { applyLayoutToGraph } from '../graph';

type NodeAttributes = {
  width: number;
  height: number;
  name: string;
};

describe('applyLayoutToGraph', () => {
  let graph: DirectedGraph<NodeAttributes>;

  beforeEach(() => {
    graph = new DirectedGraph<NodeAttributes>();
  });

  it('should not fail with an empty graph', () => {
    expect(() => applyLayoutToGraph(graph, 'TB')).not.toThrow();
    expect(graph.order).toBe(0);
  });

  it('should return the same graph instance', () => {
    const returnedGraph = applyLayoutToGraph(graph, 'TB');
    expect(returnedGraph).toBe(graph);
  });

  it('should assign positions to nodes in a graph with no edges', () => {
    graph.addNode('A', { name: 'A', width: 100, height: 50 });
    graph.addNode('B', { name: 'B', width: 100, height: 50 });

    const layouted = applyLayoutToGraph(graph, 'TB');

    const nodeAAttrs = layouted.getNodeAttributes('A');
    const nodeBAttrs = layouted.getNodeAttributes('B');

    expect(nodeAAttrs.x).toBeLessThan(nodeBAttrs.x); // Node A is behind Node B ...
    expect(nodeAAttrs.y).toBe(nodeBAttrs.y); // ... but they are on the same horizontal level (Top-Bottom layout)
  });

  it('should correctly apply layout and center nodes', () => {
    graph.addNode('A', { name: 'A', width: 80, height: 40 });
    graph.addNode('B', { name: 'B', width: 80, height: 40 });
    graph.addEdge('A', 'B');

    const layouted = applyLayoutToGraph(graph, 'TB');

    const nodeAAttrs = layouted.getNodeAttributes('A');
    const nodeBAttrs = layouted.getNodeAttributes('B');

    // Check if positions are centered
    // x = dagreX - width / 2
    // y = dagreY - height / 2
    expect(nodeAAttrs.x).toBe(40 - 80 / 2); // 0
    expect(nodeAAttrs.y).toBe(20 - 40 / 2); // 0
    expect(nodeBAttrs.x).toBe(40 - 80 / 2); // 0
    expect(nodeBAttrs.y).toBe(110 - 40 / 2); // 90
  });

  const directions: (keyof typeof RankDirection)[] = ['TB', 'BT', 'LR', 'RL'];
  directions.forEach((direction) => {
    it(`should apply layout with ${direction} direction`, () => {
      graph.addNode('A', { name: 'A', width: 100, height: 50 });
      graph.addNode('B', { name: 'B', width: 100, height: 50 });
      graph.addEdge('A', 'B');

      const layouted = applyLayoutToGraph(graph, direction);

      const nodeAAttrs = layouted.getNodeAttributes('A');
      const nodeBAttrs = layouted.getNodeAttributes('B');

      // NOTE: Y axis is inverted
      switch (direction) {
        case 'TB':
          expect(nodeAAttrs.x).toBe(nodeBAttrs.x); // A and B are on the same vertical axis ...
          expect(nodeAAttrs.y).toBeLessThan(nodeBAttrs.y); // ... but A is above B
          break;
        case 'BT':
          expect(nodeAAttrs.x).toBe(nodeBAttrs.x); // A and B are on the same vertical axis ...
          expect(nodeAAttrs.y).toBeGreaterThan(nodeBAttrs.y); // ... but A is below B
          break;
        case 'LR':
          expect(nodeAAttrs.x).toBeLessThan(nodeBAttrs.x); // A is to the left of B
          expect(nodeAAttrs.y).toBe(nodeBAttrs.y); // A and B are on the same horizontal level
          break;
        case 'RL':
          expect(nodeAAttrs.x).toBeGreaterThan(nodeBAttrs.x); // A is to the right of B
          expect(nodeAAttrs.y).toBe(nodeBAttrs.y); // A and B are on the same horizontal level
          break;
      }
    });
  });

  it('should handle a more complex graph', () => {
    graph.addNode('A', { name: 'A', width: 100, height: 50 });
    graph.addNode('B', { name: 'B', width: 100, height: 50 });
    graph.addNode('C', { name: 'C', width: 100, height: 50 });
    graph.addNode('D', { name: 'D', width: 100, height: 50 });
    graph.addEdge('A', 'B');
    graph.addEdge('A', 'C');
    graph.addEdge('B', 'D');
    graph.addEdge('C', 'D');

    const layouted = applyLayoutToGraph(graph, 'TB');

    layouted.forEachNode((_node, attributes) => {
      // A simple check to ensure layout has been applied
      expect(attributes.x !== 0 || attributes.y !== 0).toBe(true);
    });

    const nodeAAttrs = layouted.getNodeAttributes('A');
    const nodeBAttrs = layouted.getNodeAttributes('B');
    const nodeCAttrs = layouted.getNodeAttributes('C');
    const nodeDAttrs = layouted.getNodeAttributes('D');

    // With TB, D should be below B and C, which are below A.
    expect(nodeBAttrs.y).toBeGreaterThan(nodeAAttrs.y);
    expect(nodeCAttrs.y).toBeGreaterThan(nodeAAttrs.y);
    expect(nodeDAttrs.y).toBeGreaterThanOrEqual(nodeBAttrs.y);
    expect(nodeDAttrs.y).toBeGreaterThanOrEqual(nodeCAttrs.y);
  });
});
