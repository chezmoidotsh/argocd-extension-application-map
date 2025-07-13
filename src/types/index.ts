/**
 * @fileoverview Core type definitions for the ArgoCD Overview Extension
 * This file exports types and interfaces used throughout the application for
 * managing ArgoCD applications and their relationships.
 */
// External dependencies
// Internal type imports
import { DirectedGraph } from 'graphology';

import { HealthStatus, SyncStatus } from './application';
import { ArgoApplication, ArgoApplicationSet } from './argocd';
import { RankDirection, RankDirectionType } from './graph';
import { HealthStatuses, SyncStatuses } from './status';

/**
 * Re-export application-related types
 */
export type { RankDirectionType };

/**
 * Re-export application-related constants and interfaces
 */
export { HealthStatus, SyncStatus, HealthStatuses, SyncStatuses, RankDirection };

/**
 * Represents a directed graph of applications where nodes are applications
 * and edges represent relationships between them.
 */
export type ApplicationGraph = DirectedGraph<ArgoApplication | ArgoApplicationSet>;

export const isApplication = (node: ArgoApplication | ArgoApplicationSet): node is ArgoApplication => {
  return node?.kind === 'Application';
};
export const isApplicationSet = (node: ArgoApplication | ArgoApplicationSet): node is ArgoApplicationSet => {
  return node?.kind === 'ApplicationSet';
};
