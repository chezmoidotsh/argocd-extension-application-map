import * as React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StateScreen from "./components/StateScreen";
import ApplicationMap, { RankDirection } from "./components/ApplicationMap";
import "./styles/index.scss";
import StatusPanel from "./components/StatusPanel";

import { useApplicationGraph } from "./hooks/useApplicationGraph";

/**
 * Main Extension component for the ArgoCD Application Map
 * Displays a graph visualization of ArgoCD applications and their relationships
 */
const Extension: React.FC = () => {
  const { graph, isLoading, error } = useApplicationGraph();

  /**
   * Checks if the user is authenticated by calling the ArgoCD API
   * @returns Promise<boolean> - true if authenticated, false otherwise
   */
  const checkAuth = React.useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/session/userinfo");
      if (!response.ok) {
        return false;
      }
      const { loggedIn } = await response.json();
      return loggedIn ?? false;
    } catch (error) {
      console.error("Authentication check failed:", error);
      return false;
    }
  }, []);

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
        additionalContent={
          <pre style={{ color: "#ff6b6b" }}>{error.message}</pre>
        }
      />
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
      <StatusPanel graph={graph} />
      <ReactFlowProvider>
        <ApplicationMap graph={graph} rankdir={RankDirection.LR} />
      </ReactFlowProvider>
    </div>
  );
};

// Register the component extension in ArgoCD
((window: any) => {
  window?.extensionsAPI?.registerSystemLevelExtension(
    Extension,
    "Application Map",
    "/map",
    "fa-light fa-sitemap",
  );
})(window);
