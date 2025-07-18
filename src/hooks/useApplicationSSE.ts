import { useEffect, useRef, useState } from 'react';

import { ConnectionStatus, ConnectionStatusDetails, SSEEvent } from '../types';

/**
 * Options for configuring the SSE connection and behavior
 * @property onEvent - Callback for each SSE event
 * @property endpoint - SSE endpoint URL (default: '/api/v1/stream/applications')
 * @property expBackoff - Exponential backoff configuration for reconnection attempts
 * @property expBackoff.initial - Initial delay in ms before first retry (default: 1000)
 * @property expBackoff.max - Maximum delay in ms for retries (default: 15000)
 * @property expBackoff.multiplier - Multiplier for exponential backoff (default: 2)
 * @property maxRetryCount - Maximum number of retry attempts before giving up (default: 23 or ~5 minutes)
 */
export interface UseApplicationSSEOptions {
  onEvent: (event: SSEEvent) => void;
  endpoint: string;
  expBackoff?: { initial: number; max: number; multiplier?: number };
  maxRetryCount?: number;
}

/**
 * React hook to subscribe to application events via Server-Sent Events (SSE).
 * Handles automatic reconnection with exponential backoff and exposes connection status.
 *
 * @param options - Configuration options for the SSE connection
 * @return Connection status information including current status and additional details
 */
export function useApplicationSSE(options: UseApplicationSSEOptions): ConnectionStatusDetails {
  const {
    onEvent,
    endpoint,
    expBackoff: delay = { initial: 1000, max: 15000, multiplier: 2 },
    maxRetryCount = 23,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusDetails>({
    status: ConnectionStatus.Unknown,
  });

  // Stable ref for onEvent to avoid unnecessary reconnections
  const onEventRef = useRef(onEvent);
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

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
      return Math.min(delay.initial * Math.pow(delay.multiplier || 2, retryCount), delay.max);
    }

    /**
     * Establish the SSE connection and set up event handlers
     */
    function connect() {
      cleanup();

      const connection = connectionRef.current;
      console.debug(`[SSE] Connecting (attempt #${connection.retryCount + 1})...`);
      setConnectionStatus((prev) => ({
        // NOTE: Connecting occurs only once, during the first connection to the SSE endpoint
        status: prev.status === ConnectionStatus.Retrying ? ConnectionStatus.Retrying : ConnectionStatus.Connecting,
      }));

      const eventSource = new EventSource(endpoint, { withCredentials: true });
      connection.eventSource = eventSource;

      eventSource.onopen = () => {
        console.debug('[SSE] Connection established');
        setConnectionStatus({ status: ConnectionStatus.Connected, since: new Date() });
        connection.retryCount = 0;
      };

      eventSource.onerror = (error) => {
        console.error('[SSE] Connection failed:', error);
        if (connection.retryCount >= maxRetryCount) {
          console.warn(`[SSE] Maximum retry attempts reached (${maxRetryCount}), giving up`);
          setConnectionStatus({ status: ConnectionStatus.Closed, since: new Date() });
          connection.eventSource?.close();
          connection.eventSource = null;
          return;
        }

        const retryDelay = getRetryDelay(connection.retryCount);
        console.debug(`[SSE] Retrying in ${retryDelay}ms`);
        setConnectionStatus({ status: ConnectionStatus.Retrying });

        connection.retryCount += 1;
        connection.retryTimeout = window.setTimeout(connect, retryDelay);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);
          onEventRef.current?.(data);
        } catch (error) {
          console.error('[SSE] Failed to parse SSE event:', error, event.data);
          setConnectionStatus({ status: ConnectionStatus.Error });
        }
      };
    }

    console.debug('[SSE] Hook mounted, initiating connection');
    connect();

    return () => {
      console.debug('[SSE] Hook unmounting, cleaning up');
      cleanup();
    };
  }, [endpoint, delay.initial, delay.max, delay.multiplier, maxRetryCount]);

  return connectionStatus;
}
