import React from 'react';

export interface StatusPanelIconProps {
  icon: React.ReactNode;
  color?: string;
  fontSize?: number;
  title?: string;
  style?: React.CSSProperties;
}

const StatusPanelIcon: React.FC<StatusPanelIconProps> = ({ icon, color, fontSize, title, style }) => (
  <span
    style={{ color, fontSize, ...style, display: 'inline-block', verticalAlign: 'middle' }}
    title={title}
    aria-label={title}
  >
    {icon}
  </span>
);

export default React.memo(StatusPanelIcon);
