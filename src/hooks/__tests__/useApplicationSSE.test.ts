import { act, renderHook } from '@testing-library/react';

import { SSEEvent } from '../../types/sse';
import { ConnectionStatus, useApplicationSSE } from '../useApplicationSSE';

/**
 * Mock EventSource implementation for testing
 * This creates a controllable EventSource that can simulate:
 * - Successful connections and events
 * - Connection failures and retries
 * - Network errors and disconnections
 * - Manual close operations
 */
class MockEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  url: string;
  readyState: number;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  // Static registry to track all instances for cleanup
  static instances: MockEventSource[] = [];

  constructor(url: string) {
    this.url = url;
    this.readyState = MockEventSource.CONNECTING;
    MockEventSource.instances.push(this);
  }

  /**
   * Simulate opening the connection
   */
  simulateOpen(): void {
    this.readyState = MockEventSource.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  /**
   * Simulate receiving a message
   */
  simulateMessage(data: string): void {
    if (this.onmessage && this.readyState === MockEventSource.OPEN) {
      const event = new MessageEvent('message', { data });
      this.onmessage(event);
    }
  }

  /**
   * Simulate an error
   */
  simulateError(): void {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  /**
   * Simulate closing the connection
   */
  close(): void {
    this.readyState = MockEventSource.CLOSED;
  }

  /**
   * Clean up all instances
   */
  static cleanup(): void {
    MockEventSource.instances.forEach((instance) => {
      instance.close();
    });
    MockEventSource.instances = [];
  }
}

// Mock the global EventSource
const originalEventSource = (globalThis as any).EventSource;

describe('useApplicationSSE', () => {
  beforeEach(() => {
    // Replace global EventSource with our mock
    (globalThis as any).EventSource = MockEventSource;
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Restore original EventSource
    (globalThis as any).EventSource = originalEventSource;
    MockEventSource.cleanup();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with CONNECTING status', () => {
      const { result } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
        })
      );

      expect(result.current.status).toBe(ConnectionStatus.CONNECTING);
    });

    it('should transition to OPEN status when connection succeeds', async () => {
      const { result } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
        })
      );

      expect(result.current.status).toBe(ConnectionStatus.CONNECTING);

      // Simulate successful connection
      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateOpen();
      });

      expect(result.current.status).toBe(ConnectionStatus.OPEN);
    });

    it('should call onEvent callback when receiving messages', async () => {
      const mockOnEvent = jest.fn();
      const testEvent: SSEEvent = {
        result: {
          type: 'ADDED',
          application: {
            metadata: {
              name: 'test-app',
              namespace: 'test-namespace',
            },
            status: {
              health: { status: 'Healthy' },
              sync: { status: 'Synced' },
              resources: [],
            },
          },
        },
      };

      renderHook(() => useApplicationSSE({ onEvent: mockOnEvent, endpoint: '/api/v1/stream/applications' }));

      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateOpen();
        instance.simulateMessage(JSON.stringify(testEvent));
      });

      expect(mockOnEvent).toHaveBeenCalledWith(testEvent);
    });
  });

  describe('Error handling and reconnection', () => {
    it('should handle malformed JSON gracefully', () => {
      const mockOnEvent = jest.fn();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderHook(() => useApplicationSSE({ onEvent: mockOnEvent, endpoint: '/api/v1/stream/applications' }));

      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateOpen();
        instance.simulateMessage('invalid json');
      });

      expect(mockOnEvent).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[SSE] Failed to parse SSE event:', expect.any(Error), 'invalid json');

      consoleSpy.mockRestore();
    });

    it('should attempt reconnection on error with exponential backoff', () => {
      const { result } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
          initialRetryDelay: 100,
          maxRetryDelay: 1000,
          retryMultiplier: 2,
        })
      );

      // Simulate error
      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateError();
      });

      expect(result.current.status).toBe(ConnectionStatus.RETRYING);

      // Fast-forward the initial retry delay
      act(() => {
        jest.advanceTimersByTime(100);
      });

      // Should have attempted reconnection
      expect(MockEventSource.instances.length).toBe(2);
    });
  });

  describe('Configuration options', () => {
    it('should use custom endpoint', () => {
      const customEndpoint = '/api/custom/stream';
      renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: customEndpoint,
        })
      );

      const instance = MockEventSource.instances[0];
      expect(instance.url).toBe(customEndpoint);
    });

    it('should use custom retry delays', () => {
      const { result } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
          initialRetryDelay: 500,
          maxRetryDelay: 2000,
          retryMultiplier: 3,
        })
      );

      // Simulate error to trigger retry
      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateError();
      });

      expect(result.current.status).toBe(ConnectionStatus.RETRYING);

      // Should wait 500ms for first retry
      act(() => {
        jest.advanceTimersByTime(499);
      });
      expect(MockEventSource.instances.length).toBe(1);

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(MockEventSource.instances.length).toBe(2);
    });
  });

  describe('Cleanup and lifecycle', () => {
    it('should close connection when component unmounts', () => {
      const { unmount } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
        })
      );

      const instance = MockEventSource.instances[0];
      const closeSpy = jest.spyOn(instance, 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should clear retry timeout on unmount', () => {
      const { unmount } = renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
        })
      );

      // Trigger retry
      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateError();
      });

      unmount();

      // Fast-forward time to ensure timeout is cleared
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should not create new connection after unmount
      expect(MockEventSource.instances.length).toBe(1);
    });

    it('should handle onEvent callback changes without reconnecting', () => {
      const mockOnEvent1 = jest.fn();
      const mockOnEvent2 = jest.fn();

      const { rerender } = renderHook(
        ({ onEvent }) => useApplicationSSE({ onEvent, endpoint: '/api/v1/stream/applications' }),
        { initialProps: { onEvent: mockOnEvent1 } }
      );

      const initialInstanceCount = MockEventSource.instances.length;

      // Change the onEvent callback
      rerender({ onEvent: mockOnEvent2 });

      // Should not create a new connection
      expect(MockEventSource.instances.length).toBe(initialInstanceCount);

      // New callback should be used
      act(() => {
        const instance = MockEventSource.instances[0];
        instance.simulateOpen();
        instance.simulateMessage(
          JSON.stringify({
            result: { type: 'ADDED', application: { name: 'test' } },
          })
        );
      });

      expect(mockOnEvent1).not.toHaveBeenCalled();
      expect(mockOnEvent2).toHaveBeenCalled();
    });
  });

  describe('Multiple retry scenarios', () => {
    it('should implement exponential backoff correctly', () => {
      renderHook(() =>
        useApplicationSSE({
          onEvent: jest.fn(),
          endpoint: '/api/v1/stream/applications',
          initialRetryDelay: 100,
          maxRetryDelay: 1000,
          retryMultiplier: 2,
        })
      );

      // First error - should retry after 100ms
      act(() => {
        MockEventSource.instances[0].simulateError();
        jest.advanceTimersByTime(100);
      });
      expect(MockEventSource.instances.length).toBe(2);

      // Second error - should retry after 200ms
      act(() => {
        MockEventSource.instances[1].simulateError();
        jest.advanceTimersByTime(200);
      });
      expect(MockEventSource.instances.length).toBe(3);

      // Third error - should retry after 400ms
      act(() => {
        MockEventSource.instances[2].simulateError();
        jest.advanceTimersByTime(400);
      });
      expect(MockEventSource.instances.length).toBe(4);

      // Fourth error - should retry after 800ms
      act(() => {
        MockEventSource.instances[3].simulateError();
        jest.advanceTimersByTime(800);
      });
      expect(MockEventSource.instances.length).toBe(5);

      // Fifth error - should retry after maxRetryDelay (1000ms), not 1600ms
      act(() => {
        MockEventSource.instances[4].simulateError();
        jest.advanceTimersByTime(1000);
      });
      expect(MockEventSource.instances.length).toBe(6);
    });
  });
});
