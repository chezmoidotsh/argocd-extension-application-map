import * as React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import StateScreenApplicationEmpty from "./components/StateScreenApplicationEmpty";
import StateScreenApplicationError from "./components/StateScreenApplicationError";
import ApplicationMap from "./components/ApplicationMap";
import "./styles/ApplicationMap.css";
import "./styles/CustomControls.css";

import isAuthenticated from "./hooks/isAuthenticated";
import useApplications from "./hooks/useApplications";
import useApplicationSets from "./hooks/useApplicationSets";

const Extension: React.FC = () => {
  const { data: applications, error: applicationsError } = useApplications();
  const { data: applicationSets, error: applicationSetsError } =
    useApplicationSets();

  const authenticated = isAuthenticated(
    // NOTE: check if user is authenticated when an error occurs
    applicationsError,
    applicationSetsError,
  );
  if (authenticated === false) {
    window.location.href = `/login?return_url=${encodeURIComponent(window.location.href)}`;
  }

  if (applicationsError)
    return <StateScreenApplicationError error={applicationsError} />;
  if (applicationSetsError)
    return <StateScreenApplicationError error={applicationSetsError} />;
  if (!applications?.length && !applicationSets?.length)
    return <StateScreenApplicationEmpty />;

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
