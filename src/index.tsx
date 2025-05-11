import * as React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StateScreen from "./components/StateScreen";
import ApplicationMap, { RankDirection } from "./components/ApplicationMap";
import "./styles/ApplicationMap.css";
import "./styles/CustomControls.css";

import isAuthenticated from "./hooks/isAuthenticated";
import { useApplicationGraph } from "./hooks/useApplicationGraph";

const Extension: React.FC = () => {
  const { graph, isLoading, error } = useApplicationGraph();

  const authenticated = isAuthenticated(
    // NOTE: check if user is authenticated when an error occurs
    error,
  );
  if (authenticated === false) {
    window.location.href = `/login?return_url=${encodeURIComponent(window.location.href)}`;
  }


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

  return (
    <div className="argocd-application-map__container">
      <ReactFlowProvider>
        <ApplicationMap
          graph={graph}
          rankdir={RankDirection.LR}
        ></ApplicationMap>
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
