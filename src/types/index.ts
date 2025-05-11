/**
 * @fileoverview Core type definitions for the ArgoCD Overview Extension
 * This file exports types and interfaces used throughout the application for
 * managing ArgoCD applications and their relationships.
 */

// External dependencies
import { DirectedGraph } from "graphology";
import { Node } from "@xyflow/react";

// Internal type imports
import type { Application, ApplicationKind } from "./application";
import { HealthStatus, SyncStatus } from "./application";
import {
  ArgoApplication as ArgoCDApplication,
  ArgoApplicationSet as ArgoCDApplicationSet,
} from "./argocd";
import { HealthStatuses, SyncStatuses } from "./status";

/**
 * Re-export application-related types
 */
export type { Application, ApplicationKind };

/**
 * Re-export application-related constants and interfaces
 */
export {
  HealthStatus,
  SyncStatus,
  ArgoCDApplication,
  ArgoCDApplicationSet,
  HealthStatuses,
  SyncStatuses,
};

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
export type ApplicationGraphNode = Omit<Node, "data"> & { data: Application };
