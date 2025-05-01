import * as React from "react";
import { useReactFlow, Panel, ControlButton } from "@xyflow/react";

const MapNavigationControls: React.FC<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>> = ({className,...props}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel
      {...props}
      className={`react-flow__controls argocd-application-map__controls-panel horizontal ${className}`}
      position="top-left"
      data-testid="rf__controls"
    >
      <ControlButton className="argocd-application-map__control-button" title="Fit view" onClick={() => fitView()}>
        <i className="fa fa-expand fa-fw"></i>
      </ControlButton>
      <span className="argocd-application-map__separator"></span>
      <ControlButton className="argocd-application-map__control-button" title="Zoom in" onClick={() => zoomIn()}>
        <i className="fa fa-search-plus fa-fw"></i>
      </ControlButton>
      <ControlButton className="argocd-application-map__control-button" title="Zoom out" onClick={() => zoomOut()}>
        <i className="fa fa-search-minus fa-fw"></i>
      </ControlButton>
    </Panel>
  );
};

export default MapNavigationControls; 