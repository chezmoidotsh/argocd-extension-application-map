import React from 'react';

import { SyncStatus } from '../../types';

/**
 * Mapping of sync statuses to their corresponding icons, colors, and titles.
 */
const iconMappings: {
  [K in SyncStatus]: {
    readonly color: string;
    readonly icon: string;
    readonly title?: string;
  };
} = {
  [SyncStatus.Synced]: {
    color: '#18be94',
    icon: 'fa-check-circle',
    title: 'Synced',
  },
  [SyncStatus.OutOfSync]: {
    color: '#f4c030',
    icon: 'fa-arrow-alt-circle-up',
    title: 'OutOfSync',
  },
  [SyncStatus.Unknown]: {
    color: '#ccd6dd',
    icon: 'fa-circle-notch fa-spin',
  },
} as const;

/**
 * The **IconStatusSync** displays a **visual indicator** of an application's synchronization status.
 */
const IconStatusSync: React.FC<{ status?: SyncStatus }> = ({ status }) => {
  const { icon, color, title } = iconMappings[status] || iconMappings[SyncStatus.Unknown];
  return (
    <i
      qe-id="utils-sync-status-title"
      title={title}
      className={`fa ${icon} utils-sync-status-icon`}
      style={{ color, marginRight: 4 }}
    ></i>
  );
};

export default IconStatusSync;
