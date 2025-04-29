import moment from 'moment';

export type ApplicationHealthStatus = 'Healthy' | 'Suspended' | 'Progressing' | 'Missing' | 'Degraded' | 'Unknown';
export type ApplicationSyncStatus = 'Synced' | 'Syncing' | 'OutOfSync' | 'Unknown';

export interface Application {
    kind: 'Application' | 'ApplicationSet';
    name: string;
    namespace: string;
    health?: { 
        status: ApplicationHealthStatus;
        message?: string;
    };
    sync?: { 
        status: ApplicationSyncStatus;
    };
    creationTimestamp?: number;

    resources?: Array<Application>;
}