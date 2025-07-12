import { Handle, Node, NodeProps } from '@xyflow/react';
import React from 'react';

import { HealthStatus, SyncStatus } from '../types/application';
import { ArgoApplication, ArgoApplicationSet, isArgoApplication, isArgoApplicationSet } from '../types/argocd';
import { resourceId } from '../utils';
import ApplicationNodeStatusIconHealth from './IconStatusHealth';
import ApplicationNodeStatusIconSync from './IconStatusSync';

export const NODE_WIDTH = 282;
export const NODE_HEIGHT = 52;

/**
 * Renders a node for an ArgoCD Application resource (icon, name, status).
 */
const ApplicationMapNode_Application: React.FC<{
  application: ArgoApplication;
}> = ({ application }) => {
  return (
    <>
      <div className="application-resource-tree__node-kind-icon">
        <i title="Application" className="icon argo-icon-application" aria-label="Application icon" />
        <div className="application-resource-tree__node-kind">application</div>
      </div>

      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {application.metadata.namespace}/{application.metadata.name}
        </div>
        <div className="application-resource-tree__node-status-icon">
          <ApplicationNodeStatusIconHealth status={application.status?.health?.status || HealthStatus.Unknown} />
          <ApplicationNodeStatusIconSync status={application.status?.sync?.status || SyncStatus.Unknown} />
        </div>
      </div>
    </>
  );
};

/**
 * Renders a node for an ArgoCD ApplicationSet resource (icon, name).
 */
const ApplicationMapNode_ApplicationSet: React.FC<{
  applicationSet: ArgoApplicationSet;
}> = ({ applicationSet }) => {
  return (
    <>
      <div className="application-resource-tree__node-kind-icon">
        <span className="as-icon" aria-label="ApplicationSet icon">
          AS
        </span>
        <div className="application-resource-tree__node-kind">applicationset</div>
      </div>

      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {applicationSet.metadata.namespace}/{applicationSet.metadata.name}
        </div>
      </div>
    </>
  );
};

export type ApplicationMapNode = Node<
  (ArgoApplication | ArgoApplicationSet) & {
    onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
    onApplicationSetClick?: (event: React.MouseEvent, applicationSetId: string) => void;
    selected?: boolean;
  } & Record<string, unknown>,
  'application'
>;

/**
 * The **ApplicationMapNode** is a **polymorphic node renderer** for the **ArgoCD overview graph**. It helps users
 * identify and interact with **resources** directly within the **application map**, supporting intuitive **exploration**
 * of the **deployment topology**.
 *
 * The node supports three selection states:
 * - **default**: Normal display with full opacity
 * - **selected**: Highlighted with full opacity and a blue outline
 * - **unselected**: Dimmed with reduced opacity
 */
export default function ApplicationMapNode({
  data,
  sourcePosition,
  targetPosition,
  width,
  height,
}: NodeProps<ApplicationMapNode>) {
  const onClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (isArgoApplication(data)) {
        data.onApplicationClick?.(event, resourceId(data.kind, data.metadata.namespace, data.metadata.name));
      } else if (isArgoApplicationSet(data)) {
        data.onApplicationSetClick?.(event, resourceId(data.kind, data.metadata.namespace, data.metadata.name));
      }
    },
    [data]
  );

  // Generate the CSS class for the node based on selection state
  const selectionState = data.selected === true ? 'selected' : data.selected === false ? 'unselected' : 'default';
  const selectionClass = `argocd-application-map__node--${selectionState}`;

  return (
    <div
      className={`application-resource-tree__node application-resource-tree__node--application ${selectionClass}`}
      data-testid="application-map-node"
      title={`Kind: ${data.kind}\nNamespace: ${data.metadata.namespace}\nName: ${data.metadata.name}`}
      style={{ width: width ?? NODE_WIDTH, height: height ?? NODE_HEIGHT }}
      onClick={onClick}
    >
      {sourcePosition && (
        <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}
      {targetPosition && (
        <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}

      {isArgoApplication(data) ? (
        <ApplicationMapNode_Application application={data as ArgoApplication} />
      ) : isArgoApplicationSet(data) ? (
        <ApplicationMapNode_ApplicationSet applicationSet={data as ArgoApplicationSet} />
      ) : null}
    </div>
  );
}
