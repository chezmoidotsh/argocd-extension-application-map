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
import ApplicationMap from "./components/ApplicationMap";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";

const Extension: React.FC = () => {
  const { data: applications, error: applicationsError } = useApplications();
  const { data: applicationSets, error: applicationSetsError } = useApplicationSets();

  if (applicationsError) return <ErrorState error={applicationsError} />;
  if (applicationSetsError) return <ErrorState error={applicationSetsError} />;
  if (!applications?.length && !applicationSets?.length) return <EmptyState />;

  return (
    <div style={{ 
      padding: "1em", 
      height: "calc(100vh - 100px)",
      width: "100%",
      boxSizing: "border-box",
      overflow: "hidden"
    }}>
      <ReactFlowProvider>
        <ApplicationMap
          applications={applications}
          applicationSets={applicationSets}
        >
          <Background />
          <MiniMap />
          <Controls />
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
