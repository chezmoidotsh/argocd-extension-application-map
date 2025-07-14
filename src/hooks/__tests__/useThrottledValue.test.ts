import { act, renderHook } from '@testing-library/react';

import { useThrottledValue } from '../useThrottledValue';

describe('useThrottledValue', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Basic functionality', () => {
    it('should initialize with the initial value', () => {
      const initialValue = 'initial';
      const { result } = renderHook(() => useThrottledValue(initialValue, 1000));

      expect(result.current).toBe(initialValue);
    });

    it('should return the new value immediately when delay is 0', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 0 },
      });

      expect(result.current).toBe('initial');

      // Update the value
      rerender({ value: 'updated', delay: 0 });

      expect(result.current).toBe('updated');
    });

    it('should throttle rapid value changes', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1000 },
      });

      expect(result.current).toBe('initial');

      // Update the value multiple times rapidly
      rerender({ value: 'update1', delay: 1000 });
      expect(result.current).toBe('initial'); // Should still be initial

      rerender({ value: 'update2', delay: 1000 });
      expect(result.current).toBe('initial'); // Should still be initial

      rerender({ value: 'final', delay: 1000 });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward time to trigger the throttled update
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current).toBe('final'); // Should now be the latest value
    });
  });

  describe('Timing behavior', () => {
    it('should update immediately if enough time has passed since last update', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1000 },
      });

      expect(result.current).toBe('initial');

      // Update after the delay period has passed
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      rerender({ value: 'updated', delay: 1000 });

      expect(result.current).toBe('updated'); // Should update immediately
    });

    it('should respect different delay values', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 500 },
      });

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward less than the delay
      act(() => {
        jest.advanceTimersByTime(400);
      });

      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward the remaining time
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe('updated'); // Should now be updated
    });

    it('should handle changing delay values', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1000 },
      });

      expect(result.current).toBe('initial');

      // Update value and change delay
      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial');

      // Fast-forward with the new delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple consecutive updates correctly', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'v1', delay: 1000 },
      });

      expect(result.current).toBe('v1');

      // First update: value does not change immediately (throttling in effect)
      rerender({ value: 'v2', delay: 1000 });
      expect(result.current).toBe('v1');

      // Advance 500ms, then update the value again
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Second update: previous timer is cancelled and a new 500ms timer is started
      rerender({ value: 'v3', delay: 1000 });
      expect(result.current).toBe('v1');

      // Advance 500ms (total 1000ms since the first update)
      // The hook applies the latest value ('v3')
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('v3'); // Value is now updated

      // Advance time again: no further updates should occur
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('v3'); // Still 'v3'
    });

    it('should work with different data types', () => {
      // Test with numbers
      const { result: numberResult, rerender: numberRerender } = renderHook(
        ({ value, delay }) => useThrottledValue(value, delay),
        {
          initialProps: { value: 1, delay: 1000 },
        }
      );

      expect(numberResult.current).toBe(1);

      numberRerender({ value: 42, delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(numberResult.current).toBe(42);

      // Test with objects
      const { result: objectResult, rerender: objectRerender } = renderHook(
        ({ value, delay }) => useThrottledValue(value, delay),
        {
          initialProps: { value: { id: 1, name: 'initial' }, delay: 1000 },
        }
      );

      expect(objectResult.current).toEqual({ id: 1, name: 'initial' });

      const newObject = { id: 2, name: 'updated' };
      objectRerender({ value: newObject, delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(objectResult.current).toEqual(newObject);

      // Test with arrays
      const { result: arrayResult, rerender: arrayRerender } = renderHook(
        ({ value, delay }) => useThrottledValue(value, delay),
        {
          initialProps: { value: [1, 2, 3], delay: 1000 },
        }
      );

      expect(arrayResult.current).toEqual([1, 2, 3]);

      arrayRerender({ value: [4, 5, 6], delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(arrayResult.current).toEqual([4, 5, 6]);
    });
  });

  describe('Cleanup and lifecycle', () => {
    it('should clear timeout when component unmounts', () => {
      const { result, rerender, unmount } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1000 },
      });

      expect(result.current).toBe('initial');

      // Update value to trigger timeout
      rerender({ value: 'updated', delay: 1000 });
      expect(result.current).toBe('initial');

      // Unmount before timeout completes
      unmount();

      // Fast-forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Value should not have updated after unmount
      // Note: we can't test the final value after unmount,
      // but we can ensure no errors are thrown
      expect(() => {
        jest.advanceTimersByTime(1000);
      }).not.toThrow();
    });

    it('should handle rapid unmount and remount', () => {
      const { rerender, unmount } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1000 },
      });

      // Update value
      rerender({ value: 'updated', delay: 1000 });

      // Unmount immediately
      unmount();

      // Remount with new hook instance
      const { result: newResult, rerender: newRerender } = renderHook(
        ({ value, delay }) => useThrottledValue(value, delay),
        {
          initialProps: { value: 'newInitial', delay: 1000 },
        }
      );

      expect(newResult.current).toBe('newInitial');

      // Should work normally after remount
      newRerender({ value: 'newUpdated', delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(newResult.current).toBe('newUpdated');
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined and null values', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: undefined as string | undefined, delay: 1000 },
      });

      expect(result.current).toBeUndefined();

      rerender({ value: null as string | null, delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current).toBeNull();

      rerender({ value: 'defined', delay: 1000 });
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current).toBe('defined');
    });

    it('should handle very small delay values', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 1 },
      });

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 1 });
      expect(result.current).toBe('initial');

      act(() => {
        jest.advanceTimersByTime(1);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle very large delay values', () => {
      const { result, rerender } = renderHook(({ value, delay }) => useThrottledValue(value, delay), {
        initialProps: { value: 'initial', delay: 999999 },
      });

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 999999 });
      expect(result.current).toBe('initial');

      // Fast-forward a reasonable amount of time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward to the actual delay
      act(() => {
        jest.advanceTimersByTime(999999 - 10000);
      });

      expect(result.current).toBe('updated');
    });
  });
});
