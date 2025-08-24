import type { SharedValue } from 'react-native-reanimated';

import type { Vector } from '../layout';

export type AutoOffsetAdjustmentContextType = {
  additionalCrossOffset: SharedValue<number>;
  calculateOffsetShift: (
    newItemPositions: Record<string, Vector>,
    prevItemPositions: Record<string, Vector>
  ) => null | number;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  isVertical: boolean;
};
