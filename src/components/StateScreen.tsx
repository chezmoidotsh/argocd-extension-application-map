import * as React from "react";
import type { JSX } from "react";

/**
 * Component to display a state screen with an icon, title, subtitle and optional pre-formatted content
 */
const StateScreen: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  additionalContent?: JSX.Element;
}> = ({ icon, title, subtitle, additionalContent }) => {
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
