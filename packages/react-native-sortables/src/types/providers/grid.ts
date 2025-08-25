import type { SharedValue } from 'react-native-reanimated';

export type AutoOffsetAdjustmentContextType = {
  additionalCrossOffset: SharedValue<number>;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  isVertical: boolean;
};
