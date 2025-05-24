import * as React from 'react';
import { Edge, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ApplicationMap from './components/ApplicationMap';
import StateScreen from './components/StateScreen';
import StatusPanel from './components/StatusPanel';
import { useApplicationGraph } from './hooks/useApplicationGraph';
import './styles/index.scss';
import type { Application } from './types/application';
import { RankDirection } from './types/graph';

/**
 * Main Extension component for the ArgoCD Application Map
 * Displays a graph visualization of ArgoCD applications and their relationships
 */
const Extension: React.FC = () => {
  const { graph, isLoading, error } = useApplicationGraph();
  const [selectedNodes, setSelectedNodes] = React.useState<string[]>([]);

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
   * Selects the edge and nodes associated with the clicked edge when the user clicks on an edge
   * @param event The mouse event
   * @param edge The edge that was clicked
   */
  const onEdgeClick = React.useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdges([edge.id]);
    setSelectedNodes([edge.source, edge.target]);
  }, []);

  /**
   * Resets the selected nodes and edges when the pane is clicked
   */
  const onPaneClick = React.useCallback(() => {
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, []);

  /**
   * Redirects to the application details page when the user clicks on an application
   */
  const onApplicationClick = React.useCallback(
    (_: React.MouseEvent, applicationId: string) => {
      const application = graph?.getNodeAttribute(applicationId, 'data') as Application;
      if (application) {
        window.location.href = `/applications/${application.metadata.namespace}/${application.metadata.name}?view=tree`;
      }
    },
    [graph]
  );

  // Check authentication when there's an error
  React.useEffect(() => {
    if (error) {
      checkAuth().then((isAuth) => {
        if (!isAuth) {
          window.location.href = `/login?return_url=${encodeURIComponent(window.location.href)}`;
        }
      });
    }
  }, [error, checkAuth]);

  // Loading state
  if (isLoading) {
    return (
      <StateScreen
        icon="fa-solid fa-hourglass"
        title="Loading applications..."
        subtitle="Please wait while we fetch your application data"
      />
    );
  }

  // Error state
  if (error) {
    return (
      <StateScreen
        icon="fa-solid fa-xmark"
        title="Failed to load applications"
        subtitle="Please try refreshing the page or contact your administrator"
      >
        <pre style={{ color: '#ff6b6b' }}>{error.message}</pre>
      </StateScreen>
    );
  }

  // Empty state
  if (!graph) {
    return (
      <StateScreen
        icon="argo-icon-application"
        title="No applications available to you just yet"
        subtitle="Create new application to start managing resources in your cluster"
      />
    );
  }

  // Main application map view
  return (
    <div className="argocd-application-map__container">
      <StatusPanel graph={graph} onStatusClicked={setSelectedNodes} />
      <ReactFlowProvider>
        <ApplicationMap
          graph={graph}
          rankdir={RankDirection.LR}
          selectedApplications={selectedNodes}
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
