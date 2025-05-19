import * as React from 'react';
import { ControlButton, Panel } from '@xyflow/react';

/**
 * ApplicationMapNavigationControls component provides zoom and fit view controls for the application map
 */
const ApplicationMapNavigationControls: React.FC<{
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
}> = ({ zoomIn, zoomOut, fitView }) => {
  return (
    <Panel
      className="react-flow__controls argocd-application-map__controls-panel horizontal"
      position="top-left"
      style={{ display: 'inline-flex', flexDirection: 'row' }}
    >
      <ControlButton
        className="argocd-application-map__control-button"
        title="Fit view"
        onClick={() => fitView()}
        aria-label="Fit view"
      >
        <i className="fa fa-expand fa-fw" />
      </ControlButton>
      <span className="argocd-application-map__separator" />
      <ControlButton
        className="argocd-application-map__control-button"
        title="Zoom in"
        onClick={() => zoomIn()}
        aria-label="Zoom in"
      >
        <i className="fa fa-search-plus fa-fw" />
      </ControlButton>
      <ControlButton
        className="argocd-application-map__control-button"
        title="Zoom out"
        onClick={() => zoomOut()}
        aria-label="Zoom out"
      >
        <i className="fa fa-search-minus fa-fw" />
      </ControlButton>
    </Panel>
  );
};

export default ApplicationMapNavigationControls;
