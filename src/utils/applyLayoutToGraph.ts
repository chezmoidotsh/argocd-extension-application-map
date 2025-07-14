import Dagre from '@dagrejs/dagre';
import { DirectedGraph } from 'graphology';

import { RankDirection } from '../types/rankdirection';

/**
 * Automatically computes and applies a DAG layout to the given graph, using the specified direction ("LR", "TB", etc).
 *
 * This function leverages dagre to position nodes in 2D space, then updates the 'x' and 'y' attributes of each node
 * in the original graph, centering each node based on its width and height.
 *
 * @param graph Directed graph whose nodes have {x, y, width, height} attributes.
 * @param rankdir Layout direction ("LR", "TB", "RL", "BT").
 * @returns The original graph, with node positions updated.
 */
export function applyLayoutToGraph<T>(
  graph: DirectedGraph<T extends { width: number; height: number } ? T : never>,
  rankdir: keyof typeof RankDirection
): DirectedGraph<T & { x: number; y: number }> {
  const dagreGraph = new Dagre.graphlib.Graph().setDefaultNodeLabel(() => ({})).setGraph({ rankdir });

  graph.forEachNode((node) => {
    dagreGraph.setNode(node, {
      width: graph.getNodeAttribute(node, 'width'),
      height: graph.getNodeAttribute(node, 'height'),
    });
  });
  graph.forEachEdge((_edge, _attributes, source, target) => {
    dagreGraph.setEdge(source, target, {});
  });
  Dagre.layout(dagreGraph);

  graph.forEachNode((node, attributes) => {
    const { x, y } = dagreGraph.node(node);
    (graph as DirectedGraph<T extends { x: number; y: number } ? T : never>).setNodeAttribute(
      node,
      'x',
      x - attributes.width / 2
    );
    (graph as DirectedGraph<T extends { x: number; y: number } ? T : never>).setNodeAttribute(
      node,
      'y',
      y - attributes.height / 2
    );
  });

  return graph as DirectedGraph<T & { x: number; y: number }>;
}
