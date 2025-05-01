import * as React from "react";

/**
 * StateScreenApplicationEmpty component displays a message when there are no applications to show
 * @component
 * @example
 * ```tsx
 * <StateScreenApplicationEmpty />
 * ```
 */
const StateScreenApplicationEmpty: React.FC = () => {
  return (
    <div className="empty-state" style={{ padding: "1em" }}>
      <div className="empty-state__icon">
        <i className="argo-icon-application" />
      </div>
      <h4>No applications available to you just yet</h4>
      <h5>
        Create new application to start managing resources in your cluster
      </h5>
    </div>
  );
};

export default StateScreenApplicationEmpty;
