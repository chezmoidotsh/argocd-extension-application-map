import * as React from 'react';
import { ControlButton, Panel } from '@xyflow/react';
import '../styles/index.scss';

/**
 * The **ApplicationMapNavigationControls** provides **interactive controls** for navigating the application map with
 * the following features:
 * - **Zoom in** to focus on a specific area
 * - **Zoom out** to view the entire map
 * - **Fit view** to automatically adjust the zoom level to fit the entire map on the screen
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
