import { HealthStatus, SyncStatus } from '../types/application';
import { resourceId } from '../utils';
import ApplicationNodeStatusIconHealth from './IconStatusHealth';
import ApplicationNodeStatusIconSync from './IconStatusSync';
import { Handle, Node, NodeProps } from '@xyflow/react';
import React from 'react';

export const NODE_WIDTH = 282;
export const NODE_HEIGHT = 52;

/**
 * Renders a node for an ArgoCD Application resource (icon, name, status).
 */
const ApplicationMapNode_Application: React.FC<{
  name: string;
  namespace: string;
  health?: HealthStatus;
  sync?: SyncStatus;
}> = ({ name, namespace, health, sync }) => {
  return (
    <>
      <div className="application-resource-tree__node-kind-icon">
        <i title="Application" className="icon argo-icon-application" aria-label="Application icon" />
        <div className="application-resource-tree__node-kind">application</div>
      </div>

      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {namespace}/{name}
        </div>
        <div className="application-resource-tree__node-status-icon">
          <ApplicationNodeStatusIconHealth status={health || HealthStatus.Unknown} />
          <ApplicationNodeStatusIconSync status={sync || SyncStatus.Unknown} />
        </div>
      </div>
    </>
  );
};

/**
 * Renders a node for an ArgoCD ApplicationSet resource (icon, name).
 */
const ApplicationMapNode_ApplicationSet: React.FC<{
  name: string;
  namespace: string;
}> = ({ name, namespace }) => {
  return (
    <>
      <div className="application-resource-tree__node-kind-icon">
        <div className="argocd-application-map__node-kind-icon-as" aria-label="ApplicationSet icon">
          <span style={{ color: 'white', fontSize: '1em' }}>AS</span>
        </div>
        <div className="application-resource-tree__node-kind">applicationset</div>
      </div>

      <div className="application-resource-tree__node-content">
        <div className="application-resource-tree__node-title application-resource-tree__direction-left">
          {namespace}/{name}
        </div>
      </div>
    </>
  );
};

export type ApplicationMapNode = Node<
  (
    | { kind: 'Application'; name: string; namespace: string; health: HealthStatus; sync: SyncStatus }
    | { kind: 'ApplicationSet'; name: string; namespace: string }
  ) & {
    onApplicationClick?: (event: React.MouseEvent, applicationId: string) => void;
    onApplicationSetClick?: (event: React.MouseEvent, applicationSetId: string) => void;
  },
  'application'
>;

/**
 * ApplicationMapNode component
 *
 * Main visual node renderer for the ArgoCD overview graph. Handles both Application and ApplicationSet resources polymorphically.
 *
 * Features:
 * - Renders either an Application or ApplicationSet node based on the resource type
 * - Integrates with @xyflow/react (via <Handle />) to provide invisible source/target connectors for graph edges
 * - Displays resource metadata (kind, namespace, name) as tooltip/title
 * - Handles click navigation to the detailed ArgoCD Application page (using namespace/name)
 * - Applies consistent sizing and styling for graph layout
 */
export default function ApplicationMapNode({ data, sourcePosition, targetPosition }: NodeProps<ApplicationMapNode>) {
  const onClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (data.kind === 'Application') {
        data.onApplicationClick?.(event, resourceId(data.kind, data.namespace, data.name));
      } else {
        data.onApplicationSetClick?.(event, resourceId(data.kind, data.namespace, data.name));
      }
    },
    [data]
  );

  console.debug('Displaying node', { data });

  return (
    <div
      className="application-resource-tree__node application-resource-tree__node--application"
      data-testid="application-map-node"
      title={`Kind: ${data.kind}\nNamespace: ${data.namespace}\nName: ${data.name}`}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      onClick={onClick}
    >
      {sourcePosition && (
        <Handle type="source" position={sourcePosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}
      {targetPosition && (
        <Handle type="target" position={targetPosition} style={{ opacity: 0, pointerEvents: 'none' }} />
      )}

      {data.kind === 'Application' ? (
        <ApplicationMapNode_Application
          name={data.name}
          namespace={data.namespace}
          health={data.health}
          sync={data.sync}
        />
      ) : (
        <ApplicationMapNode_ApplicationSet name={data.name} namespace={data.namespace} />
      )}
    </div>
  );
}
