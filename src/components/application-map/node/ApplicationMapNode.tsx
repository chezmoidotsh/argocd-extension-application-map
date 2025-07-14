import { Handle, NodeProps, Node as ReactFlowNode } from '@xyflow/react';
import React from 'react';

import { HealthStatus, SyncStatus } from '../../../types';
import { Application, ApplicationSet, isApplication } from '../../../types';
import { resourceId } from '../../../utils';
import IconStatusHealth from '../../icons/IconStatusHealth';
import IconStatusSync from '../../icons/IconStatusSync';

/**
 * Renders a node for an ArgoCD Application resource (icon, name, status).
 *
 * @param application - The ArgoCD Application resource to render.
 */
const ApplicationMapNode_Application: React.FC<{ application: Application }> = ({ application }) => {
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
          <IconStatusHealth status={application.status?.health?.status || HealthStatus.Unknown} />
          <IconStatusSync status={application.status?.sync?.status || SyncStatus.Unknown} />
        </div>
      </div>
    </>
  );
};

/**
 * Renders a node for an ArgoCD ApplicationSet resource (icon, name).
 *
 * @param applicationSet - The ArgoCD ApplicationSet resource to render.
 */
const ApplicationMapNode_ApplicationSet: React.FC<{ applicationSet: ApplicationSet }> = ({ applicationSet }) => {
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

type ApplicationMapNodeData_Application = Application & {
  onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
  selected?: boolean;
};
type ApplicationMapNodeData_ApplicationSet = ApplicationSet;
type ApplicationMapNodeData = ApplicationMapNodeData_Application | ApplicationMapNodeData_ApplicationSet;

/**
 * Type definition for the **ApplicationMapNode** component, used by React Flow to know how to render the node.
 */
export type ApplicationMapNode = ReactFlowNode<ApplicationMapNodeData & Record<string, unknown>, 'application'>;

/**
 * The **ApplicationMapNode** is a **polymorphic node renderer** for the **ArgoCD extension**. It helps users
 * identify and interact with **resources** directly within the **application map**, supporting intuitive **exploration**
 * of the **deployment topology**.
 *
 * The node supports three selection states:
 * - **default**: Normal display with full opacity
 * - **selected**: Highlighted with full opacity and a blue outline
 * - **unselected**: Dimmed with reduced opacity
 *
 * @param props - The properties passed to the node, including data, targetPosition, sourcePosition, width, and height.
 */
export default function ApplicationMapNode(props: NodeProps<ApplicationMapNode>) {
  const { data, targetPosition, sourcePosition, width, height } = props;

  const onClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (isApplication(data)) {
        data.onApplicationClick?.(event, resourceId(data.kind, data.metadata.namespace, data.metadata.name));
      }
    },
    [data.onApplicationClick, data.kind, data.metadata.namespace, data.metadata.name]
  );

  // Generate the CSS class for the node based on selection state
  const selectionState = data.selected === true ? 'selected' : data.selected === false ? 'unselected' : 'default';
  const selectionClass = `argocd-application-map__node--${selectionState}`;

  return (
    <div
      className={`application-resource-tree__node application-resource-tree__node--application ${selectionClass}`}
      data-testid="application-map-node"
      title={`Kind: ${data.kind}\nNamespace: ${data.metadata.namespace}\nName: ${data.metadata.name}`}
      style={{ width, height }}
      onClick={onClick}
    >
      {sourcePosition && (
        <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}
      {targetPosition && (
        <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}

      {isApplication(data) ? (
        <ApplicationMapNode_Application application={data as Application} />
      ) : (
        <ApplicationMapNode_ApplicationSet applicationSet={data as ApplicationSet} />
      )}
    </div>
  );
}
