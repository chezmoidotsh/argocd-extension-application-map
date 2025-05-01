import * as React from 'react';

interface ErrorStateProps {
  error: Error;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="empty-state" style={{ padding: '1em' }}>
      <div className="empty-state__icon">
        <i className="fa-solid fa-xmark"/>
      </div>
      <h4>Failed to load applications</h4>
      <h5>Please try refreshing the page or contact your administrator</h5>
      <pre style={{ color: '#ff6b6b' }}>{error.message} </pre>
    </div>
  );
};

export default ErrorState; 