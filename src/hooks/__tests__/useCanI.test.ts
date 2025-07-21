import { renderHook, waitFor } from '@testing-library/react';

import * as services from '../../services';
import { useCanI } from '../useCanI';

// Mock the services
jest.mock('../../services', () => ({
  services: {
    account: {
      canI: jest.fn(),
    },
  },
}));

const mockCanI = services.services.account.canI as jest.Mock;

describe('usePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check permission successfully', async () => {
    mockCanI.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useCanI('applications', 'sync', 'namespace/app'));

    await waitFor(() => {
      expect(result.current.isAllowed).not.toBeNull();
    });

    expect(result.current.isAllowed).toBe(true);
    expect(result.current.error).toBeNull();

    expect(mockCanI).toHaveBeenCalledWith('applications', 'sync', 'namespace/app');
  });

  it('should handle permission check errors', async () => {
    const error = new Error('Permission check failed');
    mockCanI.mockRejectedValue(error);

    const { result } = renderHook(() => useCanI('applications', 'sync', 'namespace/app'));

    await waitFor(() => {
      expect(result.current.isAllowed).not.toBeNull();
    });

    expect(result.current.isAllowed).toBe(false);
    expect(result.current.error).toBe('Permission check failed');
  });

  it('should update permissions when dependencies change', async () => {
    mockCanI
      .mockResolvedValueOnce(true) // namespace1/app1
      .mockResolvedValueOnce(false); // namespace2/app2

    const { result, rerender } = renderHook(
      ({ namespace, app }) => useCanI('applications', 'sync', `${namespace}/${app}`),
      {
        initialProps: { namespace: 'namespace1', app: 'app1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isAllowed).not.toBeNull();
    });

    expect(result.current.isAllowed).toBe(true);

    // Change props
    rerender({ namespace: 'namespace2', app: 'app2' });

    await waitFor(() => {
      expect(result.current.isAllowed).not.toBeNull();
    });

    expect(result.current.isAllowed).toBe(false);

    expect(mockCanI).toHaveBeenCalledWith('applications', 'sync', 'namespace1/app1');
    expect(mockCanI).toHaveBeenCalledWith('applications', 'sync', 'namespace2/app2');
  });
});
