import * as React from "react";
import useApplications from "./hooks/useApplications";
import useApplicationSets from "./hooks/useApplicationSets";
import {
  Controls,
  MiniMap,
  ReactFlowProvider,
  Background,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles/ApplicationMap.css";
import "./styles/CustomControls.css";
import ApplicationMap from "./components/ApplicationMap";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import MapNavigationControls from "./components/MapNavigationControls";

const Extension: React.FC = () => {
  const { data: applications, error: applicationsError } = useApplications();
  const { data: applicationSets, error: applicationSetsError } = useApplicationSets();

  if (applicationsError) return <ErrorState error={applicationsError} />;
  if (applicationSetsError) return <ErrorState error={applicationSetsError} />;
  if (!applications?.length && !applicationSets?.length) return <EmptyState />;

  return (
    <div className="argocd-application-map__container">
      <ReactFlowProvider fitView>
        <ApplicationMap
          applications={applications}
          applicationSets={applicationSets}
        >
          <MiniMap 
            position="top-right"
            pannable={true}
            zoomable={true}
            aria-label="ArgoCD Application Map Mini Map"
          />
          <MapNavigationControls 
            aria-label="ArgoCD Application Map Navigation Controls"
          />
        </ApplicationMap>
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
