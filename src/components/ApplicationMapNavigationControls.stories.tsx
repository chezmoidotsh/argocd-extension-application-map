import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import ApplicationMapNavigationControls from "./ApplicationMapNavigationControls";
import { ReactFlowProvider } from "@xyflow/react";

const meta: Meta<typeof ApplicationMapNavigationControls> = {
  title: "ApplicationMap/NavigationControls",
  component: ApplicationMapNavigationControls,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ReactFlowProvider>
        <div style={{ padding: 24, background: "#f8f9fa", minHeight: 200 }}>
          <Story />
        </div>
      </ReactFlowProvider>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ApplicationMapNavigationControls>;

export const Basic: Story = {};
