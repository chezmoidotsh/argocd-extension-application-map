import { Application } from "./application";
import { DirectedGraph } from "graphology";
import { Node } from "@xyflow/react";

export {
  Application,
  ApplicationKind,
  HealthStatus,
  SyncStatus,
} from "./application";
export {
  ArgoApplication as ArgoCDApplication,
  ArgoApplicationSet as ArgoCDApplicationSet,
} from "./argocd";

/**
 * Type representing a graph of applications
 */
export type ApplicationGraph = DirectedGraph<ApplicationGraphNode>;

/**
 * Type representing a node in the application graph based on the react-flow library
 */
export type ApplicationGraphNode = Omit<Node, "data"> & { data: Application };
