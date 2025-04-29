import React from "react";
import HealthStatusIcon from "./HealthStatusIcon";
import SyncStatusIcon from "./SyncStatusIcon";
import { Position, Handle } from "@xyflow/react";

interface ArgoApplicationNodeProps {
  data: any;
  sourcePosition?: Position;
  targetPosition?: Position;
}

const handleStyle = { opacity: 0, pointerEvents: 'none' as const };

const ArgoApplicationNode: React.FC<ArgoApplicationNodeProps> = ({ data, sourcePosition = Position.Right, targetPosition = Position.Left }) => {
  const isAppSet = data.kind === "ApplicationSet";
  return (
    <div
      className="application-resource-tree__node application-resource-tree__node--application"
      title={`Kind: ${data.kind}\nNamespace: ${data.namespace}\nName: ${data.name}`}
      style={{ width: 282, height: 52 }}
    >
      <Handle type="target" position={targetPosition} style={handleStyle} />
      <Handle type="source" position={sourcePosition} style={handleStyle} />
      <div className="application-resource-tree__node-kind-icon">
        <i
          title={isAppSet ? "ApplicationSet" : "Application"}
          className={`icon ${isAppSet ? "argo-icon-catalog" : "argo-icon-application"}`}
        ></i>
        <br />
        <div className="application-resource-tree__node-kind">{isAppSet ? "appset" : "application"}</div>
      </div>
      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {data.name}
        </div>
        <div className="application-resource-tree__node-status-icon">
          <HealthStatusIcon status={data.healthStatus} />
          <SyncStatusIcon status={data.syncStatus} />
        </div>
      </div>
      <div className="application-resource-tree__node-labels">
        <span title={`Application was created ${data.age}`}>
          <time className="application-resource-tree__node-label">{data.age}</time>
        </span>
      </div>
    </div>
  );
};

export default ArgoApplicationNode; 