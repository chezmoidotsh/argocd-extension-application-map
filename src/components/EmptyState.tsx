import * as React from 'react';

interface EmptyStateProps {
  message?: string;
  submessage?: string;
}

const EmptyState: React.FC<EmptyStateProps> = () => {
  return (
    <div className="empty-state" style={{ padding: '1em' }}>
      <div className="empty-state__icon">
        <i className="argo-icon-application" />
      </div>
      <h4>No applications available to you just yet</h4>
      <h5>Create new application to start managing resources in your cluster</h5>
    </div>
  );
};

export default EmptyState; 