import React from 'react';

import { SourceDriftStatus } from '../../types';
import './IconStatusSourceDrift.scss';

/**
 * Mapping of source drift statuses to their corresponding JSX elements.
 *
 * NOTE: This constant guarantees that all source drift statuses are covered.
 * Conform status returns null to not display any icon when sources are conforming.
 */
const icons: {
  [K in SourceDriftStatus]: JSX.Element;
} = {
  // Conform - no icon displayed when sources are conforming to their reference.
  [SourceDriftStatus.Conform]: null,

  // Drift icons representing an application whose sources have drifted from their reference.
  [SourceDriftStatus.Drift]: (
    <i
      className="fa fa-code-branch utils-source-drift-status-icon argocd-application-map__source-drift-status-icon--drift"
      title="Source drift detected"
    />
  ),

  // Unknown - no icon displayed when the source drift status is unknown or not determined.
  [SourceDriftStatus.Unknown]: null,
} as const;

/**
 * The **IconStatusSourceDrift** displays a **visual indicator** of an application's source drift status.
 * Returns null for Conform status to avoid displaying an icon when sources are conforming.
 */
const IconStatusSourceDrift: React.FC<{ status?: SourceDriftStatus }> = ({ status }) =>
  icons[status] || icons[SourceDriftStatus.Unknown];

export default IconStatusSourceDrift;
