import { HealthStatus, SyncStatus } from '../types/application';
import { allStatusScenario, cyclicScenario } from './.storybook/scenarii';
import StatusPanel, { StatusPanelCycleWarning, StatusPanelHealth, StatusPanelSync } from './StatusPanel';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { within } from '@storybook/test';
import { expect } from '@storybook/test';
import React from 'react';

const meta: Meta<typeof StatusPanel> = {
  title: 'Status Panel/StatusPanel',
  component: StatusPanel,
  tags: ['autodocs'],
  subcomponents: {
    StatusPanelHealth,
    StatusPanelSync,
    StatusPanelCycleWarning,
  },
  argTypes: {
    graph: { control: false }, // graph must not be controlled by storybook
  },
};
export default meta;
type Story = StoryObj<typeof StatusPanel>;

export const Example: Story = {
  args: {
    graph: allStatusScenario,
    onFilterUpdated: action('onFilterUpdated'),
  },
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    const healthStatusHealthy = await canvas.findByTestId('health-status-healthy-row');
    expect(healthStatusHealthy).not.toBeNull();
    expect(healthStatusHealthy).toHaveTextContent('1 application healthy');

    const healthStatusDegraded = await canvas.findByTestId('health-status-degraded-row');
    expect(healthStatusDegraded).not.toBeNull();
    expect(healthStatusDegraded).toHaveTextContent('1 application degraded');

    const healthStatusProgressing = await canvas.findByTestId('health-status-progressing-row');
    expect(healthStatusProgressing).not.toBeNull();
    expect(healthStatusProgressing).toHaveTextContent('1 application progressing');

    const healthStatusSuspended = await canvas.findByTestId('health-status-suspended-row');
    expect(healthStatusSuspended).not.toBeNull();
    expect(healthStatusSuspended).toHaveTextContent('1 application suspended');

    const healthStatusMissing = await canvas.findByTestId('health-status-missing-row');
    expect(healthStatusMissing).not.toBeNull();
    expect(healthStatusMissing).toHaveTextContent('1 application missing');

    const healthStatusUnknown = await canvas.findByTestId('health-status-unknown-row');
    expect(healthStatusUnknown).not.toBeNull();
    expect(healthStatusUnknown).toHaveTextContent('1 application unknown');

    const syncStatusSynced = await canvas.findByTestId('sync-status-synced-row');
    expect(syncStatusSynced).not.toBeNull();
    expect(syncStatusSynced).toHaveTextContent('1 application synced');

    const syncStatusOutOfSync = await canvas.findByTestId('sync-status-outofsync-row');
    expect(syncStatusOutOfSync).not.toBeNull();
    expect(syncStatusOutOfSync).toHaveTextContent('4 applications outofsync');

    const syncStatusUnknown = await canvas.findByTestId('sync-status-unknown-row');
    expect(syncStatusUnknown).not.toBeNull();
    expect(syncStatusUnknown).toHaveTextContent('1 application unknown');

    expect(canvas.queryByTestId('cycle-warning-panel')).toBeNull();
  },
};

export const WithCycleWarning: Story = {
  args: {
    graph: cyclicScenario,
    onFilterUpdated: action('onFilterUpdated'),
  },
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    const cycleWarning = await canvas.findByTestId('cycle-warning-panel');
    expect(cycleWarning).not.toBeNull();
  },
};

export const AllHealthStatuses: Story = {
  render: () => (
    <div className="application-status-panel">
      <StatusPanelHealth
        statuses={[
          HealthStatus.Healthy,
          HealthStatus.Degraded,
          HealthStatus.Missing,
          HealthStatus.Progressing,
          HealthStatus.Suspended,
          HealthStatus.Unknown,
        ]}
        onStatusClick={action('onHealthStatusClick')}
      />
    </div>
  ),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    const healthStatusHealthy = await canvas.findByTestId('health-status-healthy-row');
    expect(healthStatusHealthy).not.toBeNull();
    expect(healthStatusHealthy).toHaveTextContent('1 application healthy');

    const healthStatusDegraded = await canvas.findByTestId('health-status-degraded-row');
    expect(healthStatusDegraded).not.toBeNull();
    expect(healthStatusDegraded).toHaveTextContent('1 application degraded');

    const healthStatusProgressing = await canvas.findByTestId('health-status-progressing-row');
    expect(healthStatusProgressing).not.toBeNull();
    expect(healthStatusProgressing).toHaveTextContent('1 application progressing');

    const healthStatusSuspended = await canvas.findByTestId('health-status-suspended-row');
    expect(healthStatusSuspended).not.toBeNull();
    expect(healthStatusSuspended).toHaveTextContent('1 application suspended');

    const healthStatusMissing = await canvas.findByTestId('health-status-missing-row');
    expect(healthStatusMissing).not.toBeNull();
    expect(healthStatusMissing).toHaveTextContent('1 application missing');

    const healthStatusUnknown = await canvas.findByTestId('health-status-unknown-row');
    expect(healthStatusUnknown).not.toBeNull();
    expect(healthStatusUnknown).toHaveTextContent('1 application unknown');
  },
};

export const AllSyncStatuses: Story = {
  render: () => (
    <div className="application-status-panel">
      <StatusPanelSync
        statuses={[SyncStatus.Synced, SyncStatus.OutOfSync, SyncStatus.Unknown]}
        onStatusClick={action('onSyncStatusClick')}
      />
    </div>
  ),
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement);

    const syncStatusSynced = await canvas.findByTestId('sync-status-synced-row');
    expect(syncStatusSynced).not.toBeNull();
    expect(syncStatusSynced).toHaveTextContent('1 application synced');

    const syncStatusOutOfSync = await canvas.findByTestId('sync-status-outofsync-row');
    expect(syncStatusOutOfSync).not.toBeNull();
    expect(syncStatusOutOfSync).toHaveTextContent('1 application outofsync');

    const syncStatusUnknown = await canvas.findByTestId('sync-status-unknown-row');
    expect(syncStatusUnknown).not.toBeNull();
    expect(syncStatusUnknown).toHaveTextContent('1 application unknown');
  },
};
