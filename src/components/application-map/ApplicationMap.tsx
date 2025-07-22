import { DirectedGraph } from 'graphology';

import * as React from 'react';
import { ReactFlow, useReactFlow } from '@xyflow/react';

import { ApplicationGraphNode, RankDirectionType } from '../../types';
import './ApplicationMap.scss';
import { NODE_HEIGHT, NODE_WIDTH, useApplicationMapData, useCycleDetection } from './hooks';
import { ApplicationMapNavigationControls } from './navigation-controls';
import { ApplicationMapNode } from './node';

// Re-export node dimensions for backward compatibility
export { NODE_WIDTH, NODE_HEIGHT };

/**
 * The **ApplicationMapProps** interface defines the properties for the ApplicationMap component.
 *
 * @property graph - The application graph to display, containing nodes and edges representing applications and their relationships.
 * @property rankdir - The direction of the graph layout (e.g., "LR" for left-to-right).
 * @property selectedApplications - A list of application IDs that are currently selected in the graph.
 * @property onPaneClick - Callback function triggered when the pane is clicked.
 * @property onApplicationClick - Callback function triggered when an application node is clicked.
 */
type ApplicationMapProps = {
  graph: DirectedGraph<ApplicationGraphNode>;
  rankdir: RankDirectionType;

  selectedApplications?: string[];

  onPaneClick?: () => void;
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
};

/**
 * The **ApplicationMap** is a visual component that displays an **interactive graph** of ArgoCD applications and their
 * relationships.
 *
 * It provides a way for users to quickly **visualize** application and ApplicationSet resources in a **graphical
 * representation** and explore their **dependencies** and **relationships**, allowing them to understand the structure
 * and status of their ArgoCD environment, making complex deployments more accessible and manageable.
 *
 * @param props - The properties passed to the ApplicationMap component.
 */
const ApplicationMap: React.FC<ApplicationMapProps> = ({
  graph,
  rankdir,
  selectedApplications = [],
  onPaneClick,
  onApplicationClick,
  ...props
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // Detect cycles with intelligent caching
  const cycleInfo = useCycleDetection(graph);

  // Generate nodes and edges with cycle styling
  const { nodes, edges } = useApplicationMapData({
    graph,
    rankdir,
    selectedApplications,
    cycleInfo,
    onApplicationClick,
  });

  // Memoized node types to prevent unnecessary re-renders
  const nodeTypes = React.useMemo(() => ({ application: ApplicationMapNode }), []);

  return (
    <ReactFlow
      {...props}
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      style={{ width: '100%', height: '100%' }}
      fitView
      fitViewOptions={{ maxZoom: 1, minZoom: 0.5 }}
      onPaneClick={onPaneClick}
    >
      <ApplicationMapNavigationControls
        zoomIn={zoomIn}
        zoomOut={zoomOut}
        fitView={fitView}
        aria-label="ArgoCD Application Map Navigation Controls"
      />
    </ReactFlow>
  );
};

export default ApplicationMap;
