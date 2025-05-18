import * as React from 'react';
import type { JSX } from 'react';

/**
 * This component provides a reusable, visually consistent way to present empty, error, or informational states
 * throughout the application. It displays an icon, a title, a subtitle, and optional additional content (such as
 * pre-formatted code, actions, or explanations).
 *
 * Typical use cases include:
 * - Empty data sets (e.g., no applications found)
 * - Error or warning screens
 * - Onboarding or instructional messages
 * - Maintenance or offline notifications
 */
const StateScreen: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}> = ({ icon, title, subtitle, children }) => {
  return (
    <div className="empty-state" style={{ padding: '1em' }}>
      <div className="empty-state__icon">
        <i className={icon} />
      </div>
      <h4>{title}</h4>
      <h5>{subtitle}</h5>
      {children}
    </div>
  );
};

export default StateScreen;
