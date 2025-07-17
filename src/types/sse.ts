import { Application } from './application';

/**
 * Status of the SSE connection
 */
export enum ConnectionStatus {
  Closed = 'Closed',
  Connected = 'Connected',
  Connecting = 'Connecting',
  Error = 'Error',
  Retrying = 'Retrying',
  Unknown = 'Unknown',
}

export type ConnectionStatusDetails =
  | { status: ConnectionStatus.Closed; since: Date }
  | { status: ConnectionStatus.Connected; since: Date }
  | { status: ConnectionStatus.Connecting }
  | { status: ConnectionStatus.Error }
  | { status: ConnectionStatus.Retrying }
  | { status: ConnectionStatus.Unknown };

/**
 * Represents the top-level event structure from the ArgoCD SSE stream.
 * @property {Object} result - The result of the event
 * @property {string} result.type - The type of the event
 * @property {ArgoApplication} result.application - The application object
 */
export interface SSEEvent {
  result: {
    type: 'ADDED' | 'MODIFIED' | 'DELETED';
    application: Application;
  };
}
