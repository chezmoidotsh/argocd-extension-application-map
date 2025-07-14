import { useEffect, useRef, useState } from 'react';

import { ArgoApplication } from '../types/argocd';

/**
 * Status of the SSE connection
 */
export enum ConnectionStatus {
  Closed = 'CLOSED',
  Connecting = 'CONNECTING',
  Error = 'ERROR',
  Open = 'OPEN',
  Retrying = 'RETRYING',
}

/**
 * Represents the top-level event structure from the ArgoCD SSE stream.
 * @property {Object} result - The result of the event
 * @property {string} result.type - The type of the event
 * @property {ArgoApplication} result.application - The application object
 */
export interface SSEEvent {
  result: {
    type: 'ADDED' | 'MODIFIED' | 'DELETED';
    application: ArgoApplication;
  };
}

/**
 * Options for configuring the SSE connection and behavior
 * @property onEvent - Callback for each SSE event
 * @property endpoint - SSE endpoint URL (default: '/api/v1/stream/applications')
 * @property initialRetryDelay - Initial retry delay in ms (default: 1000)
 * @property maxRetryDelay - Maximum retry delay in ms (default: 15000)
 * @property retryMultiplier - Exponential backoff multiplier (default: 2)
 */
export interface UseApplicationSSEOptions {
  onEvent: (event: SSEEvent) => void;
  endpoint: string;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  retryMultiplier?: number;
}

/**
 * Return type of the useApplicationSSE hook
 */
interface UseApplicationSSEReturn {
  status: ConnectionStatus;
  message: string;
}

/**
 * React hook to subscribe to application events via Server-Sent Events (SSE).
 * Handles automatic reconnection with exponential backoff and exposes connection status.
 *
 * @param options - Configuration options for the SSE connection
 * @returns { status } - The current connection status
 */
export function useApplicationSSE(options: UseApplicationSSEOptions): UseApplicationSSEReturn {
  const { onEvent, endpoint, initialRetryDelay = 1000, maxRetryDelay = 15000, retryMultiplier = 2 } = options;

  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.Connecting);
  const [message, setMessage] = useState<string>('Connecting to ArgoCD API...');

  // Stable ref for onEvent to avoid unnecessary reconnections
  const onEventRef = useRef(onEvent);

  // Single ref for managing connection state
  const connectionRef = useRef<{
    eventSource: EventSource | null;
    retryTimeout: number | null;
    retryCount: number;
  }>({
    eventSource: null,
    retryTimeout: null,
    retryCount: 0,
  });

  // Keep onEvent ref up to date
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    /**
     * Clean up the current SSE connection and any pending retry
     */
    function cleanup() {
      const connection = connectionRef.current;
      if (connection.eventSource) {
        console.debug('[SSE] Closing existing connection');
        connection.eventSource.close();
        connection.eventSource = null;
      }
      if (connection.retryTimeout) {
        clearTimeout(connection.retryTimeout);
        connection.retryTimeout = null;
      }
    }

    /**
     * Calculate the next retry delay using exponential backoff
     * @param retryCount - Number of consecutive failures
     * @returns Delay in milliseconds
     */
    function getRetryDelay(retryCount: number): number {
      return Math.min(initialRetryDelay * Math.pow(retryMultiplier, retryCount), maxRetryDelay);
    }

    /**
     * Establish the SSE connection and set up event handlers
     */
    function connect() {
      cleanup();

      const connection = connectionRef.current;
      console.debug(`[SSE] Connecting (attempt #${connection.retryCount + 1})...`);
      setStatus(ConnectionStatus.Connecting);
      setMessage(`Connecting to ArgoCD API (attempt #${connection.retryCount + 1})...`);

      const eventSource = new EventSource(endpoint, { withCredentials: true });
      connection.eventSource = eventSource;

      eventSource.onopen = () => {
        console.debug('[SSE] Connection established');
        setStatus(ConnectionStatus.Open);
        setMessage('Connected to ArgoCD API');
        connection.retryCount = 0;
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection failed:', error);
        setStatus(ConnectionStatus.Closed);
        setMessage('Connection to ArgoCD API failed');

        const retryDelay = getRetryDelay(connection.retryCount);
        console.debug(`[SSE] Retrying in ${retryDelay}ms`);
        setStatus(ConnectionStatus.Retrying);
        setMessage(`Retrying at ${new Date(Date.now() + retryDelay).toLocaleTimeString()}...`);

        connection.retryCount += 1;
        connection.retryTimeout = setTimeout(connect, retryDelay) as unknown as number;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          onEventRef.current?.(data); // Use stable ref
        } catch (error) {
          console.error('[SSE] Failed to parse SSE event:', error, event.data);
          setStatus(ConnectionStatus.Error);
          setMessage(`Failed to parse SSE event: ${error}`);
        }
      };
    }

    console.debug('[SSE] Hook mounted, initiating connection');
    connect();

    return () => {
      console.debug('[SSE] Hook unmounting, cleaning up');
      cleanup();
    };
  }, [endpoint, initialRetryDelay, maxRetryDelay, retryMultiplier]);

  return { status, message };
}
