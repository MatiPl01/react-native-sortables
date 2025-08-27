import type { SharedValue } from 'react-native-reanimated';

export type AutoOffsetAdjustmentContextType = {
  additionalCrossOffset: SharedValue<null | number>;
  layoutUpdateProgress: SharedValue<null | number>;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  mainGroupSize: SharedValue<null | number>;
  isVertical: boolean;
};
