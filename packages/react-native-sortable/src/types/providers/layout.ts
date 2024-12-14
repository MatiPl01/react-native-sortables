import type { SharedValue } from 'react-native-reanimated';

import type { FlexDirection, FlexLayoutProps, GridLayout } from '../layout';

export type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  numColumns: number;
  useGridLayout: (
    idxToKey: SharedValue<Array<string>>
  ) => SharedValue<GridLayout | null>;
};

export type FlexLayoutContextType = {
  flexDirection: FlexDirection;
  itemGroups: SharedValue<Array<Array<string>>>;
  keyToGroup: SharedValue<Record<string, number>>;
  crossAxisGroupSizes: SharedValue<Array<number>>;
  crossAxisGroupOffsets: SharedValue<Array<number>>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
  adjustedCrossGap: SharedValue<number>;
  dimensionsLimits: SharedValue<FlexLayoutProps['limits']>;
};
