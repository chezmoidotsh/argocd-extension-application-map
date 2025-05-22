import * as React from 'react';

/**
 * The **StateScreen** component provides a **consistent and reusable interface** for displaying empty, error, or
 * informational states across the application.
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
