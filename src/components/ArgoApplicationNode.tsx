import React from "react";
import HealthStatusIcon from "./HealthStatusIcon";
import SyncStatusIcon from "./SyncStatusIcon";
import { Handle, NodeProps } from "@xyflow/react";
import { Application } from "../types";

/**
 * Props for the ArgoApplicationNode component
 * @extends Omit<NodeProps, "data"> - Inherits all NodeProps except for the data property
 */
interface ArgoApplicationNodeProps extends Omit<NodeProps, "data"> {
  /** The ArgoCD application data to display */
  data: Application;
}

/**
 * ArgoApplicationNode component displays an ArgoCD application or application set in a node format
 * with health and sync status indicators.
 *
 * @component
 * @example
 * ```tsx
 * <ArgoApplicationNode
 *   data={applicationData}
 *   width={200}
 *   height={100}
 *   sourcePosition="right"
 *   targetPosition="left"
 * />
 * ```
 */
const ArgoApplicationNode: React.FC<ArgoApplicationNodeProps> = ({
  data,
  width,
  height,
  sourcePosition,
  targetPosition,
  ...props
}) => {
  const nodeTitle = `Kind: ${data.kind}\nNamespace: ${data.metadata.namespace}\nName: ${data.metadata.name}`;
  const iconClass =
    data.kind === "ApplicationSet"
      ? "argo-icon-catalog"
      : "argo-icon-application";

  return (
    <div
      className="application-resource-tree__node application-resource-tree__node--application"
      title={nodeTitle}
      style={{ width, height }}
      {...props}
    >
      <Handle
        type="source"
        position={sourcePosition}
        style={{ opacity: 0, pointerEvents: "none" }}
      />
      <Handle
        type="target"
        position={targetPosition}
        style={{ opacity: 0, pointerEvents: "none" }}
      />

      <div className="application-resource-tree__node-kind-icon">
        <i
          title={data.kind}
          className={`icon ${iconClass}`}
          aria-label={`${data.kind} icon`}
        />
        <div className="application-resource-tree__node-kind">
          {data.kind.toLowerCase()}
        </div>
      </div>

      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {data.metadata.name}
        </div>
        <div className="application-resource-tree__node-status-icon">
          <HealthStatusIcon status={data.status?.health} />
          <SyncStatusIcon status={data.status?.sync} />
        </div>
      </div>
    </div>
  );
};

export default ArgoApplicationNode;
