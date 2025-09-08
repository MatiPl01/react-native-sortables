import type { SharedValue } from 'react-native-reanimated';

import type { GridLayoutProps } from '../layout';

export type AutoOffsetAdjustmentContextType = {
  additionalCrossOffset: SharedValue<null | number>;
  adaptLayoutProps: (
    props: GridLayoutProps,
    prevProps: GridLayoutProps | null
  ) => GridLayoutProps;
};

export type GridLayoutContextType = {
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  mainGroupSize: SharedValue<null | number>;
  isVertical: boolean;
};
