import { useCallback, useEffect, useState } from 'react';

import { services } from '../services';

/**
 * Hook for checking user permissions for quick actions
 * @param resource - The resource type (e.g., 'applications')
 * @param action - The action to perform (e.g., 'sync', 'get')
 * @param subresource - The specific resource (e.g., 'project/app-name')
 * @returns Permissions state and refresh function
 */
export function useCanI(resource: string, action: string, subresource: string) {
  const [permission, setPermissions] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkPermissions = useCallback(async () => {
    if (!resource || !action || !subresource) {
      setPermissions(false);
      return;
    }
    setError(null);

    try {
      setPermissions(await services.account.canI(resource, action, subresource));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check permissions';
      setPermissions(false);
      setError(errorMessage);
      console.error('Permission check error:', err);
    }
  }, [resource, action, subresource]);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return { isAllowed: permission, error };
}
