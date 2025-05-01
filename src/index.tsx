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

const Extension: React.FC = () => {
  const applications = useApplications();
  const applicationSets = useApplicationSets();

  return (
    <div style={{ padding: "20px", height: "800px" }}>
      {!applications?.length && !applicationSets?.length ? (
        <EmptyState />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

// Register the component extension in ArgoCD
((window: any) => {
  window?.extensionsAPI?.registerSystemLevelExtension(
    Extension,
    "Application Map",
    "/map",
    "fa-sitemap",
  );
})(window);
