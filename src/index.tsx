import * as React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StateScreenApplicationEmpty from "./components/StateScreenApplicationEmpty";
import StateScreenApplicationError from "./components/StateScreenApplicationError";
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

  if (error) return <StateScreenApplicationError error={error} />;
  if (!graph) return <StateScreenApplicationEmpty />;

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
