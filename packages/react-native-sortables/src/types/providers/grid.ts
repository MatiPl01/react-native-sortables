import type { SharedValue } from 'react-native-reanimated';

import type { Vector } from '../layout';

export type AutoOffsetAdjustmentContextType = {
  additionalCrossOffset: SharedValue<number>;
  onBeforeItemPositionsUpdate?: (
    oldPositions: Record<string, Vector>,
    newPositions: Record<string, Vector>
  ) => void;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  mainGroupSize: SharedValue<null | number>;
  isVertical: boolean;
};
