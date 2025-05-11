import * as React from "react";

/**
 * Props for the StateScreen component
 * @property {string} icon - The icon class name to display
 * @property {string} title - The main title text
 * @property {string} subtitle - The subtitle text
 * @property {JSX.Element} additionalContent - Optional content to display in a pre tag
 */
interface StateScreenProps {
  icon: string;
  title: string;
  subtitle: string;
  additionalContent?: JSX.Element;
}

/**
 * Component to display a state screen with an icon, title, subtitle and optional pre-formatted content
 * @param {StateScreenProps} props - The component props
 * @returns {JSX.Element} The state screen component
 * @example
 * ```tsx
 * // Basic usage
 * <StateScreen
 *   icon="argo-icon-application"
 *   title="No applications available"
 *   subtitle="Create new application to start"
 * />
 *
 * // With pre-formatted content
 * <StateScreen
 *   icon="fa-solid fa-xmark"
 *   title="Failed to load"
 *   subtitle="Please try refreshing"
 *   preContent={{
 *     content: "Error: Failed to load",
 *     color: "#ff6b6b"
 *   }}
 * />
 * ```
 */
const StateScreen: React.FC<StateScreenProps> = ({
  icon,
  title,
  subtitle,
  additionalContent,
}) => {
  return (
    <div className="empty-state" style={{ padding: "1em" }}>
      <div className="empty-state__icon">
        <i className={icon} />
      </div>
      <h4>{title}</h4>
      <h5>{subtitle}</h5>
      {additionalContent}
    </div>
  );
};

export default StateScreen;
