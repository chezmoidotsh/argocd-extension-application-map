import React from 'react';

import { SyncStatus } from '../../types';

/**
 * Mapping of sync statuses to their corresponding JSX elements.
 *
 * NOTE: This constant guarantees that all sync statuses are covered.
 */
const icons: {
  [K in SyncStatus]: JSX.Element;
} = {
  // Synced icons representing an application that is in sync with its desired state.
  [SyncStatus.Synced]: <i className="fa fa-check-circle" style={{ color: 'var(--argo-sync-synced)' }} title="Synced" />,

  // OutOfSync icons representing an application that is not in sync with its desired state.
  [SyncStatus.OutOfSync]: (
    <i className="fa fa-arrow-alt-circle-up" style={{ color: 'var(--argo-sync-outofsync)' }} title="OutOfSync" />
  ),

  // Unknown icons representing an application whose sync status is unknown.
  [SyncStatus.Unknown]: (
    <i className="fa fa-circle-notch fa-spin" style={{ color: 'var(--argo-sync-unknown)' }} title="Unknown" />
  ),
} as const;

/**
 * The **IconStatusSync** displays a **visual indicator** of an application's synchronization status.
 */
const IconStatusSync: React.FC<{ status?: SyncStatus }> = ({ status }) => icons[status] || icons[SyncStatus.Unknown];

export default IconStatusSync;
