import * as React from 'react';

/**
 * The **ApplicationMapNavigationControlsProps** interface defines the properties for the ApplicationMapNavigationControls component.
 * @property zoomIn - Function to zoom in on the application map.
 * @property zoomOut - Function to zoom out of the application map.
 * @property fitView - Function to fit the entire application map within the view.
 */
type ApplicationMapNavigationControlsProps = {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
};

/**
 * The **ApplicationMapNavigationControls** provides **interactive controls** for navigating the application map with
 * the following features:
 * - **Zoom in** to focus on a specific area
 * - **Zoom out** to view the entire map
 * - **Fit view** to automatically adjust the zoom level to fit the entire map on the screen
 */
const ApplicationMapNavigationControls: React.FC<ApplicationMapNavigationControlsProps> = ({
  zoomIn,
  zoomOut,
  fitView,
}) => {
  return (
    <div className="graph-options-panel">
      <a className="group-nodes-button" title="Fit view" onClick={() => fitView()} aria-label="Fit view">
        <i className="fa fa-expand fa-fw" />
      </a>
      <span className="separator" />
      <a className="group-nodes-button" title="Zoom in" onClick={() => zoomIn()} aria-label="Zoom in">
        <i className="fa fa-search-plus fa-fw" />
      </a>
      <a className="group-nodes-button" title="Zoom out" onClick={() => zoomOut()} aria-label="Zoom out">
        <i className="fa fa-search-minus fa-fw" />
      </a>
    </div>
  );
};

export default ApplicationMapNavigationControls;
