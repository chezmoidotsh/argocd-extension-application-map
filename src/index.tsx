import * as React from "react";
import useApplications from "./hooks/useApplications";
import useApplicationSets from "./hooks/useApplicationSets";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./styles/ApplicationMap.css";
import "./styles/CustomControls.css";
import ApplicationMap from "./components/ApplicationMap";
import StateScreenApplicationEmpty from "./components/StateScreenApplicationEmpty";
import StateScreenApplicationError from "./components/StateScreenApplicationError";

const Extension: React.FC = () => {
  const { data: applications, error: applicationsError } = useApplications();
  const { data: applicationSets, error: applicationSetsError } =
    useApplicationSets();

  if (applicationsError) return <StateScreenApplicationError error={applicationsError} />;
  if (applicationSetsError) return <StateScreenApplicationError error={applicationSetsError} />;
  if (!applications?.length && !applicationSets?.length) return <StateScreenApplicationEmpty />;

  return (
    <div className="argocd-application-map__container">
      <ReactFlowProvider>
        <ApplicationMap
          applications={applications}
          applicationSets={applicationSets}
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
