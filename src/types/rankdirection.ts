import { Position } from '@xyflow/react';

export const RankDirection = {
  LR: {
    rankdir: 'LR',
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  RL: {
    rankdir: 'RL',
    sourcePosition: Position.Left,
    targetPosition: Position.Right,
  },
  TB: {
    rankdir: 'TB',
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  },
  BT: {
    rankdir: 'BT',
    sourcePosition: Position.Top,
    targetPosition: Position.Bottom,
  },
} as const;

export type RankDirectionType = (typeof RankDirection)[keyof typeof RankDirection];
