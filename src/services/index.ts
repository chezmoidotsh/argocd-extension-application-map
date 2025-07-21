/**
 * Services for ArgoCD API interactions
 */
class ArgoCDServices {
  /**
   * Account services for permissions
   */
  account = {
    /**
     * Check if the current user has permission to perform an action
     * @param resource - The resource type (e.g., 'applications')
     * @param action - The action to perform (e.g., 'sync', 'get')
     * @param subresource - The specific resource (e.g., 'project/app-name')
     * @returns Promise with permission check result
     */
    canI: async (resource: string, action: string, subresource: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/v1/account/can-i/${resource}/${action}/${subresource}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Permission check failed: ${response.status} ${response.statusText}`);
          return false;
        }

        const result: { value: 'yes' | 'no' } = await response.json();
        return result.value === 'yes';
      } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
      }
    },
  };

  /**
   * Application services for actions
   */
  applications = {
    /**
     * Synchronize an application
     * @param name - Application name
     * @param namespace - Application namespace
     * @param dryRun - Whether to perform a dry run (default: false)
     * @returns Promise with action result
     */
    sync: async (
      name: string,
      namespace: string,
      dryRun: boolean = false
    ): Promise<{ success: false; error: string } | { success: true; data: any }> => {
      try {
        const url = `/api/v1/applications/${name}/sync`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appNamespace: namespace,
            dryRun: dryRun,
            strategy: { hook: { force: false } },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            error: `Sync failed: ${response.status} ${response.statusText} - ${errorText}`,
          };
        }

        const data = await response.json();
        return {
          success: true,
          data,
        };
      } catch (error) {
        return {
          success: false,
          error: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },

    /**
     * Refresh an application
     * @param name - Application name
     * @param namespace - Application namespace
     * @returns Promise with action result
     */
    refresh: async (
      name: string,
      namespace: string
    ): Promise<{ success: false; error: string } | { success: true; data: any }> => {
      try {
        const url = `/api/v1/applications/${name}`;
        const params = new URLSearchParams({ refresh: 'normal', appNamespace: namespace });

        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            error: `Refresh failed: ${response.status} ${response.statusText} - ${errorText}`,
          };
        }

        const data = await response.json();
        return {
          success: true,
          data,
        };
      } catch (error) {
        return {
          success: false,
          error: `Refresh error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    },
  };
}

/**
 * Global services instance
 */
export const services = new ArgoCDServices();
