import { Handle, NodeProps, Node as ReactFlowNode } from '@xyflow/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { services } from '../../../services';
import { HealthStatus, SourceDriftStatus, SyncStatus } from '../../../types';
import { Application, ApplicationSet, isApplication } from '../../../types';
import { resourceId } from '../../../utils';
import { revertSourceDrift } from '../../../utils/sourceDrift';
import { IconStatusSourceDrift } from '../../icons';
import IconStatusHealth from '../../icons/IconStatusHealth';
import IconStatusSync from '../../icons/IconStatusSync';
import './ApplicationMapNode.scss';
import QuickActionButton from './QuickActionButton';

/**
 * Renders a node for an ArgoCD Application resource (icon, name, status).
 *
 * @param application - The ArgoCD Application resource to render.
 */
const ApplicationMapNode_Application: React.FC<{
  application: Application & { status?: { drift?: SourceDriftStatus } };
  hover: boolean;
}> = ({ application, hover }) => {
  const [isSyncAllowed, setIsSyncAllowed] = useState<boolean | null>(null);
  const [isRefreshAllowed, setIsRefreshAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if ((isSyncAllowed !== null && isRefreshAllowed !== null) || !hover) return;
    console.debug('Checking permissions for application:', application.metadata.name, isRefreshAllowed, isSyncAllowed);

    if (isSyncAllowed === null)
      services.account
        .canI('applications', 'sync', `${application.metadata.namespace}/${application.metadata.name}`)
        .then(setIsSyncAllowed)
        .catch(() => setIsSyncAllowed(false));
    if (isRefreshAllowed === null)
      services.account
        .canI('applications', 'get', `${application.metadata.namespace}/${application.metadata.name}`)
        .then(setIsRefreshAllowed)
        .catch(() => setIsRefreshAllowed(false));
  }, [application.metadata.namespace, application.metadata.name, hover]);

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
          <IconStatusSourceDrift status={application.status?.drift || SourceDriftStatus.Unknown} />
        </div>
      </div>

      <div className="argocd-application-map__node-quick-actions">
        <QuickActionButton
          isUnlocked={isSyncAllowed}
          icon="fa-sync"
          title="Sync the application"
          onClick={async () => {
            return await services.applications.sync(application.metadata.name, application.metadata.namespace);
          }}
        />

        <QuickActionButton
          isUnlocked={isRefreshAllowed}
          icon="fa-redo"
          title="Refresh the application"
          onClick={async () => {
            return await services.applications.refresh(application.metadata.name, application.metadata.namespace);
          }}
        />

        {application.status?.drift === SourceDriftStatus.Drift && (
          <QuickActionButton
            isUnlocked={true}
            icon="fa-code-compare"
            title="Revert source drift"
            onClick={async () => {
              return await services.applications.update(revertSourceDrift(application));
            }}
          />
        )}
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
        <span className="argocd-application-map__node-kind-icon__as-icon" aria-label="ApplicationSet icon">
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
  status?: { drift?: SourceDriftStatus };
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
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState(false);

  const onClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (isApplication(data)) {
        data.onApplicationClick?.(event, resourceId(data.kind, data.metadata.namespace, data.metadata.name));
      }
    },
    [data.onApplicationClick, data.kind, data.metadata.namespace, data.metadata.name]
  );

  const onMouseEnter = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => {
      setHovered(true);
    }, 100); // Delay to avoid checking permission on every hover
  }, []);

  const onMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  // Generate the CSS class for the node based on selection state
  const selectionState = data.selected === true ? 'selected' : data.selected === false ? 'unselected' : 'default';

  return (
    <div
      className={`application-resource-tree__node argocd-application-map__node argocd-application-map__node--${selectionState}`}
      data-testid="application-map-node"
      title={`Kind: ${data.kind}\nNamespace: ${data.metadata.namespace}\nName: ${data.metadata.name}`}
      style={{ width, height }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {sourcePosition && (
        <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}
      {targetPosition && (
        <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}

      {isApplication(data) ? (
        <ApplicationMapNode_Application application={data as Application} hover={hovered} />
      ) : (
        <ApplicationMapNode_ApplicationSet applicationSet={data as ApplicationSet} />
      )}
    </div>
  );
}
