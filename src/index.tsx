import { DirectedGraph } from 'graphology';

import * as React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ApplicationMap } from './components/application-map';
import { StateScreen } from './components/state-screen';
import { StatusPanel } from './components/status-panel';
import { useApplicationSSE } from './hooks/useApplicationSSE';
import { useThrottledValue } from './hooks/useThrottledValue';
import './styles/index.scss';
import { Application, ApplicationSet, isApplication } from './types';
import { ConnectionStatus, RankDirection, SSEEvent } from './types';
import { processSSEEvent } from './utils/processSSEEvent';

/**
 * React reducer that updates the graph state based on SSE events.
 *
 * @param state - The current state of the graph
 * @param action - The action to perform
 * @returns The new state of the graph
 */
function graphReducer(
  state: { graph: DirectedGraph<Application | ApplicationSet>; version: number },
  action: { type: string; payload: SSEEvent }
) {
  const newGraph = state.graph.copy();
  processSSEEvent(newGraph, action.payload.result.type, action.payload.result.application);
  return { graph: newGraph, version: state.version + 1 };
}

/**
 * Checks if the user is authenticated by making a request to the session endpoint.
 * If the user is not authenticated, it redirects them to the login page.
 *
 * @returns {Promise<boolean>} - Returns true if authenticated, false otherwise
 */
async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/session/userinfo');
    if (!response.ok) return false;
    const { loggedIn } = await response.json();
    return loggedIn ?? false;
  } catch {
    return false;
  }
}

/**
 * Main component for the ArgoCD Application Map extension.
 */
const Extension: React.FC = () => {
  const [graph, dispatch] = React.useReducer(graphReducer, {
    graph: new DirectedGraph<Application | ApplicationSet>(),
    version: 0,
  });

  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);
  const connectionStatus = useApplicationSSE({
    onEvent: (event) => dispatch({ type: 'STREAM_EVENTS_RECEIVED', payload: event }),
    endpoint: '/api/v1/stream/applications',
  });

  const graphRef = React.useRef(graph.graph);
  React.useEffect(() => {
    graphRef.current = graph.graph;
  }, [graph.graph]);

  // Throttle updates
  const throttledGraph = useThrottledValue(graph.graph, 250);
  const throttledSelectedNodes = useThrottledValue(selectedNodes, 250);

  // Redirect to login if SSE error and not authenticated
  React.useEffect(() => {
    if (connectionStatus.status === ConnectionStatus.Error) {
      checkAuth().then((isAuth) => {
        if (!isAuth) {
          window.location.href = `/login?return_url=${encodeURIComponent(window.location.href)}`;
        }
      });
    }
  }, [connectionStatus.status]);

  // Handlers
  const onPaneClick = React.useCallback(() => setSelectedNodes([]), []);
  const onApplicationClick = React.useCallback((_: React.MouseEvent, applicationId: string) => {
    const application = graphRef.current.getNodeAttributes(applicationId);
    if (isApplication(application)) {
      window.location.href = `/applications/${application.metadata.namespace}/${application.metadata.name}?view=tree`;
    }
  }, []);

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

  return (
    <div className="argocd-application-map__container application-details">
      <StatusPanel graph={graph.graph} onStatusClicked={setSelectedNodes} connectionStatus={connectionStatus} />
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
