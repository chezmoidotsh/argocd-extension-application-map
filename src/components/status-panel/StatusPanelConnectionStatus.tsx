import prettyMilliseconds from 'pretty-ms';

import React, { useEffect, useState } from 'react';

import { ConnectionStatus, ConnectionStatusDetails } from '../../types';
import { IconStatusConnection } from '../icons';

// Type guards for each connection status type
type ClosedStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Closed }>;
type ConnectedStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Connected }>;
type ConnectingStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Connecting }>;
type ErrorStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Error }>;
type RetryingStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Retrying }>;
type UnknownStatusInformation = Extract<ConnectionStatusDetails, { status: ConnectionStatus.Unknown }>;


interface StatusPanelConnectionStatusProps {
  status: ConnectionStatusDetails;
}

// Custom hook for time tracking
const useTimeTracking = (since: Date) => {
  const [, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: number;
    let timeout: number;

    // Refresh every second for the first minute
    interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    // After 1 minute, switch to refreshing every minute
    timeout = window.setTimeout(() => {
      clearInterval(interval);
      interval = window.setInterval(() => {
        setNow(Date.now());
      }, 61000);
    }, 61000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [since]);
};

// Utility function for formatting relative time
const formatRelativeTime = (since: Date): string =>
  prettyMilliseconds(Math.max(Date.now() - since.getTime(), MIN_RETRY_DELAY), {
    secondsDecimalDigits: 0,
    verbose: false,
    compact: true,
    millisecondsDecimalDigits: 0,
  });

// Base component for status badges
interface StatusBadgeProps {
  className: string;
  status: ConnectionStatus;
  children: React.ReactNode;
}

const StatusBadge: React.FC<StatusBadgeProps & React.HTMLProps<HTMLDivElement>> = ({
  className,
  status,
  children,
  ...props
}) => (
  <div className={`argocd-application-map__status-panel__sse-status-badge ${className}`} {...props}>
    <IconStatusSSE status={status} />
    <span className="argocd-application-map__status-panel__sse-status-text">{children}</span>
  </div>
);

// Individual status components
const ConnectedStatusBadge: React.FC<ConnectedStatusInformation> = ({ since }) => {
  useTimeTracking(since);

  return (
    <StatusBadge
      className="argocd-application-map__status-panel__sse-status-badge--open"
      status={ConnectionStatus.Connected}
    >
      Connected • {formatRelativeTime(since)} ago
    </StatusBadge>
  );
};

const ConnectingStatusBadge: React.FC<ConnectingStatusInformation> = () => (
  <StatusBadge
    className="argocd-application-map__status-panel__sse-status-badge--connecting"
    status={ConnectionStatus.Connecting}
  >
    Connecting...
  </StatusBadge>
);

const RetryingStatusBadge: React.FC<RetryingStatusInformation> = ({}) => {
  return (
    <StatusBadge
      className="argocd-application-map__status-panel__sse-status-badge--retrying"
      status={ConnectionStatus.Retrying}
    >
      Reconnecting...
    </StatusBadge>
  );
};

const ErrorStatusBadge: React.FC<ErrorStatusInformation> = () => (
  <StatusBadge
    className="argocd-application-map__status-panel__sse-status-badge--error"
    status={ConnectionStatus.Error}
  >
    Connection Error
  </StatusBadge>
);

const UnknownStatusBadge: React.FC<UnknownStatusInformation> = () => (
  <StatusBadge
    className="argocd-application-map__status-panel__sse-status-badge--unknown"
    status={ConnectionStatus.Unknown}
  >
    Unknown status
  </StatusBadge>
);

const ClosedStatusBadge: React.FC<ClosedStatusInformation> = ({ since }) => {
  useTimeTracking(since);

  return (
    <StatusBadge
      className="argocd-application-map__status-panel__sse-status-badge--closed"
      status={ConnectionStatus.Closed}
      title="Click to refresh the page"
      onClick={window.location.reload}
    >
      Connection Lost • {formatRelativeTime(since)} ago
    </StatusBadge>
  );
};

const StatusPanelConnectionStatus: React.FC<StatusPanelConnectionStatusProps> = ({ status }) => {
  switch (status.status) {
    case ConnectionStatus.Connected:
      return <ConnectedStatusBadge {...status} />;
    case ConnectionStatus.Connecting:
      return <ConnectingStatusBadge {...status} />;
    case ConnectionStatus.Retrying:
      return <RetryingStatusBadge {...status} />;
    case ConnectionStatus.Error:
      return <ErrorStatusBadge {...status} />;
    case ConnectionStatus.Closed:
      return <ClosedStatusBadge {...status} />;
    case ConnectionStatus.Unknown:
    default:
      return <UnknownStatusBadge {...status} />;
  }
};

export default StatusPanelConnectionStatus;
