import { Meta, StoryObj } from '@storybook/react';

import { SourceDriftStatus } from '../../types';
import StatusPanelSourceDrift from './StatusPanelSourceDrift';

const meta: Meta<typeof StatusPanelSourceDrift> = {
  title: 'Components/Status Panel/Source Drift',
  component: StatusPanelSourceDrift,
};
export default meta;
type Story = StoryObj<typeof StatusPanelSourceDrift>;

export const Default: Story = {
  args: {
    countPerStatus: {
      [SourceDriftStatus.Conform]: 5,
      [SourceDriftStatus.Drift]: 1,
      [SourceDriftStatus.Unknown]: 0,
    },
    onStatusClick: () => {},
  },
};
