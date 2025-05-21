/**
 * @fileoverview Core type definitions for the ArgoCD Overview Extension
 * This file exports types and interfaces used throughout the application for
 * managing ArgoCD applications and their relationships.
 */
// External dependencies
// Internal type imports
import { DirectedGraph } from 'graphology';
import { Node } from '@xyflow/react';
import type { Application, ApplicationKind, ApplicationSet, ApplicationUnion } from './application';
import { HealthStatus, SyncStatus } from './application';
import type { ArgoApplication } from './argocd';
import { HealthStatuses, SyncStatuses } from './status';

/**
 * Re-export application-related types
 */
export type { Application, ApplicationSet, ApplicationKind };

/**
 * Re-export application-related constants and interfaces
 */
export { HealthStatus, SyncStatus, HealthStatuses, SyncStatuses };
export type { ArgoApplication };

/**
 * Represents a directed graph of applications where nodes are applications
 * and edges represent relationships between them.
 *
 * @template ApplicationGraphNode - The type of nodes in the graph
 */
export type ApplicationGraph = DirectedGraph<ApplicationGraphNode>;

/**
 * Represents a node in the application graph, extending the base Node type
 * from react-flow with application-specific data.
 *
 * @extends {Omit<Node, "data">} - Base node type without the data property
 * @property {Application} data - The application data associated with this node
 */
export type ApplicationGraphNode = Omit<Node, 'data'> & {
  data: ApplicationUnion;
};

export const isApplication = (node: ApplicationUnion): node is Application => {
  return node?.kind === 'Application';
};
export const isApplicationSet = (node: ApplicationUnion): node is ApplicationSet => {
  return node?.kind === 'ApplicationSet';
};
