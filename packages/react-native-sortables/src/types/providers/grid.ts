import type { SharedValue } from 'react-native-reanimated';

export type AdditionalCrossOffsetContextType = {
  additionalCrossOffset: SharedValue<number>;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  mainGroupSize: SharedValue<null | number>;
  isVertical: boolean;
};
