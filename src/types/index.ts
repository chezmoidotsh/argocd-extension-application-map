import { Application, ApplicationSet, SourceDriftStatus } from './application';

export { ConnectionStatus } from './sse';
export { isApplication, isApplicationSet, HealthStatus, SyncStatus, SourceDriftStatus } from './application';
export { RankDirection } from './rankdirection';
export { QuickActionState } from './quickActions';
export type { Application, ApplicationSet, ApplicationSource } from './application';
export type { RankDirectionType } from './rankdirection';
export type { SSEEvent, ConnectionStatusDetails } from './sse';

/**
 * Represents a node in the application graph with all necessary properties.
 * This includes the application or application set, and its drift status.
 */
export type ApplicationGraphNode = (Application & { status?: { drift?: SourceDriftStatus } }) | ApplicationSet;
