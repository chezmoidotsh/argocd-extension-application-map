import { DirectedGraph } from 'graphology';

import * as React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ApplicationMap } from './components/application-map';
import { StateScreen } from './components/state-screen';
import { StatusPanel } from './components/status-panel';
import { ConnectionStatus, SSEEvent, useApplicationSSE } from './hooks/useApplicationSSE';
import { useThrottledValue } from './hooks/useThrottledValue';
import './styles/index.scss';
import { ArgoApplication, ArgoApplicationSet, isArgoApplication } from './types/argocd';
import { RankDirection } from './types/graph';
import { updateGraph } from './utils/graph_manager';

const Extension: React.FC = () => {
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);
  const { status: sseStatus, message: sseMessage } = useApplicationSSE({
    onEvent: (event) => {
      dispatch({ type: 'STREAM_EVENTS_RECEIVED', payload: event });
    },
    endpoint: '/api/v1/stream/applications',
  });
  console.debug('[Extension] SSE Status:', sseStatus);

  const [graph, dispatch] = React.useReducer(
    function (
      state: { graph: DirectedGraph<ArgoApplication | ArgoApplicationSet>; version: number },
      action: { type: string; payload: SSEEvent }
    ) {
      console.debug('[Extension] SSE Event Payload:', action.payload);
      // Create a new graph instance by copying the old one to ensure reference change
      const newGraph = state.graph.copy();

      // Update the new graph instance
      updateGraph(newGraph, action.payload.result.type, action.payload.result.application);

      // Return a new state object with the new graph instance and updated version
      return { graph: newGraph, version: state.version + 1 };
    },
    { graph: new DirectedGraph<ArgoApplication | ArgoApplicationSet>(), version: 0 }
  );

  // Use a ref to hold the latest graph object without triggering re-renders of callbacks
  const graphRef = React.useRef(graph.graph);

  // Update the ref whenever the graph.graph object itself changes
  React.useEffect(() => {
    graphRef.current = graph.graph;
  }, [graph.graph]);

  /**
   * Checks if the user is authenticated by calling the ArgoCD API
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  const checkAuth = React.useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/session/userinfo');
      if (!response.ok) {
        return false;
      }
      const { loggedIn } = await response.json();
      return loggedIn ?? false;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }, []);

  /**
   * Resets the selected nodes and edges when the pane is clicked
   */
  const onPaneClick = React.useCallback(() => {
    setSelectedNodes([]);
  }, []);

  /**
   * Redirects to the application details page when the user clicks on an application
   */
  const onApplicationClick = React.useCallback(
    (_: React.MouseEvent, applicationId: string) => {
      const application = graphRef.current.getNodeAttributes(applicationId);
      if (isArgoApplication(application)) {
        window.location.href = `/applications/${application.metadata.namespace}/${application.metadata.name}?view=tree`;
      }
    },
    [] // No dependencies because it uses graphRef.current
  );

  // Throttle graph and selectedNodes updates to prevent performance issues with high refresh rates
  const throttledGraph = useThrottledValue(graph.graph, 250);
  const throttledSelectedNodes = useThrottledValue(selectedNodes, 250);

  // Check authentication when there's an error
  React.useEffect(() => {
    if (sseStatus === ConnectionStatus.Error) {
      checkAuth().then((isAuth) => {
        if (!isAuth) {
          window.location.href = `/login?return_url=${encodeURIComponent(window.location.href)}`;
        }
      });
    }
  }, [sseStatus, checkAuth]);

  // Empty state
  if (graph.graph && graph.graph.order < 1) {
    return (
      <StateScreen
        icon="argo-icon-application"
        title="No applications available to you just yet"
        subtitle="Create new application to start managing resources in your cluster"
      />
    );
  }

  // Main application map view
  console.debug('[Extension] Rendering ApplicationMap with throttledGraph ref:', throttledGraph);
  console.debug('[Extension] Rendering ApplicationMap with throttledSelectedNodes ref:', throttledSelectedNodes);
  return (
    <div className="argocd-application-map__container application-details">
      <StatusPanel
        graph={graph.graph}
        onStatusClicked={setSelectedNodes}
        sseStatus={sseStatus}
        sseMessage={sseMessage}
      />
      <ReactFlowProvider>
        <ApplicationMap
          graph={throttledGraph}
          rankdir={RankDirection.LR}
          selectedApplications={throttledSelectedNodes}
          onPaneClick={onPaneClick}
          onApplicationClick={onApplicationClick}
        />
      </ReactFlowProvider>
    </div>
  );
};

// Register the component extension in ArgoCD
((window: any) => {
  window?.extensionsAPI?.registerSystemLevelExtension(Extension, 'Application Map', '/map', 'fa-light fa-sitemap');
})(window);
