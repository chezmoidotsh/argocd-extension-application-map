import { Meta, StoryObj } from "@storybook/react";
import IconStatusHealth from "./IconStatusHealth";
import { HealthStatus } from "../types/application";

const meta: Meta<typeof IconStatusHealth> = {
  title: "Icons/IconStatusHealth",
  component: IconStatusHealth,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: Object.values(HealthStatus),
      table: {
        defaultValue: { summary: HealthStatus.Unknown },
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof IconStatusHealth>;

export const Healthy: Story = {
  args: { status: HealthStatus.Healthy },
};

export const Degraded: Story = {
  args: { status: HealthStatus.Degraded },
};

export const Progressing: Story = {
  args: { status: HealthStatus.Progressing },
};

export const Suspended: Story = {
  args: { status: HealthStatus.Suspended },
};

export const Missing: Story = {
  args: { status: HealthStatus.Missing },
};

export const Unknown: Story = {
  args: { status: HealthStatus.Unknown },
};
