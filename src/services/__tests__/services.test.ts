import { services } from '../index';

// Mock fetch globally
(globalThis as any).fetch = jest.fn();

describe('ArgoCD Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('account.canI', () => {
    it('should return true when user has permission', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 'yes' }),
      });

      const result = await services.account.canI('applications', 'sync', 'default/test-app');

      expect(fetch).toHaveBeenCalledWith('/api/v1/account/can-i/applications/sync/default/test-app', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ value: 'no' }),
      });

      const result = await services.account.canI('applications', 'sync', 'default/test-app');

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          code: 403,
          error: 'Forbidden',
          message: 'You do not have permission to perform this action',
        }),
      });

      const result = await services.account.canI('applications', 'sync', 'default/test-app');

      expect(result).toBe(false);
    });

    it('should return false when fetch throws error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await services.account.canI('applications', 'sync', 'default/test-app');

      expect(result).toBe(false);
    });
  });

  describe('applications.sync', () => {
    it('should successfully sync application', async () => {
      const mockResponse = { metadata: { name: 'test-app' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await services.applications.sync('test-app', 'argocd');

      expect(fetch).toHaveBeenCalledWith('/api/v1/applications/test-app/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appNamespace: 'argocd',
          dryRun: false,
          strategy: { hook: { force: false } },
        }),
      });

      expect(result.success).toBe(true);
      expect((result as { data: any }).data).toEqual(mockResponse);
    });

    it('should sync application with namespace', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await services.applications.sync('test-app', 'test-namespace');

      expect(fetch).toHaveBeenCalledWith('/api/v1/applications/test-app/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appNamespace: 'test-namespace',
          dryRun: false,
          strategy: { hook: { force: false } },
        }),
      });
    });

    it('should sync application in dry-run mode', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await services.applications.sync('test-app', 'test-namespace', true);

      expect(fetch).toHaveBeenCalledWith('/api/v1/applications/test-app/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appNamespace: 'test-namespace',
          dryRun: true,
          strategy: { hook: { force: false } },
        }),
      });
    });

    it('should handle sync failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Sync failed',
      });

      const result = await services.applications.sync('test-app', 'argocd');

      expect(result.success).toBe(false);
      expect((result as { error: string }).error).toContain('Sync failed: 400 Bad Request');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await services.applications.sync('test-app', 'argocd');

      expect(result.success).toBe(false);
      expect((result as { error: string }).error).toContain('Sync error: Network error');
    });
  });

  describe('applications.refresh', () => {
    it('should successfully refresh application', async () => {
      const mockResponse = { metadata: { name: 'test-app' } };
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await services.applications.refresh('test-app', 'argocd');

      expect(fetch).toHaveBeenCalledWith('/api/v1/applications/test-app?refresh=normal&appNamespace=argocd', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.success).toBe(true);
      expect((result as { data: any }).data).toEqual(mockResponse);
    });

    it('should refresh application with namespace', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await services.applications.refresh('test-app', 'test-namespace');

      expect(fetch).toHaveBeenCalledWith('/api/v1/applications/test-app?refresh=normal&appNamespace=test-namespace', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle refresh failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Application not found',
      });

      const result = await services.applications.refresh('test-app', 'argocd');

      expect(result.success).toBe(false);
      expect((result as { error: string }).error).toContain('Refresh failed: 404 Not Found');
    });
  });
});
