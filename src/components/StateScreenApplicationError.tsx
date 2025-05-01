import * as React from "react";

/**
 * Props for the StateScreenApplicationError component
 */
interface StateScreenApplicationErrorProps {
  /** The error object to display */
  error: Error;
}

/**
 * StateScreenApplicationError component displays an error message when application loading fails
 * @component
 * @example
 * ```tsx
 * <StateScreenApplicationError error={new Error("Failed to load applications")} />
 * ```
 */
const StateScreenApplicationError: React.FC<StateScreenApplicationErrorProps> = ({ error }) => {
  return (
    <div className="empty-state" style={{ padding: "1em" }}>
      <div className="empty-state__icon">
        <i className="fa-solid fa-xmark" />
      </div>
      <h4>Failed to load applications</h4>
      <h5>Please try refreshing the page or contact your administrator</h5>
      <pre style={{ color: "#ff6b6b" }}>{error.message}</pre>
    </div>
  );
};

export default StateScreenApplicationError;
