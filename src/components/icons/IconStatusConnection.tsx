import React from 'react';

import { ConnectionStatus } from '../../types';

/**
 * Mapping of sync statuses to their corresponding JSX elements.
 *
 * NOTE: This constant guarantees that all connection statuses are covered.
 */
const icons: {
  [K in ConnectionStatus]: JSX.Element;
} = {
  // Connected icons representing an application that is connected to the SSE.
  [ConnectionStatus.Connected]: (
    <i
      className="fa fa-wifi argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--connected"
      title="Connected"
    />
  ),

  // Connecting icons representing an application that is in the process of connecting to the SSE.
  [ConnectionStatus.Connecting]: (
    <i
      className="fa fa-spinner fa-spin argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--connecting"
      title="Connecting"
    />
  ),

  // Closed icons representing an application that is disconnected from the SSE.
  [ConnectionStatus.Closed]: (
    <span
      className="fa-stack argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--closed"
      title="Disconnected"
    >
      <i className="fa fa-slash fa-stack-1x" />
      <i className="fa fa-wifi fa-stack-1x" />
    </span>
  ),

  // Error icons representing an application that has encountered an error with the SSE.
  [ConnectionStatus.Error]: (
    <i
      className="fa fa-exclamation argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--error"
      title="Error"
    />
  ),

  // Retrying icons representing an application that is attempting to reconnect to the SSE.
  [ConnectionStatus.Retrying]: (
    <i
      className="fa fa-refresh fa-spin argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--retrying"
      title="Reconnecting"
    />
  ),

  // Unknown icons representing an application whose SSE connection status is unknown.
  [ConnectionStatus.Unknown]: (
    <i
      className="fa fa-question argocd-application-map__status-panel__connection-status-badge__icon argocd-application-map__connection-status-icon--unknown"
      title="Unknown"
    />
  ),
} as const;

/**
 * The **IconStatusConnection** displays a **visual indicator** of the SSE connection status.
 */
const IconStatusConnection: React.FC<{ status: ConnectionStatus }> = ({ status }) =>
  icons[status] || icons[ConnectionStatus.Unknown];

export default IconStatusConnection;
