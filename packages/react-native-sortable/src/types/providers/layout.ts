import type { SharedValue } from 'react-native-reanimated';

import type {
  FlexDirection,
  FlexLayout,
  FlexLayoutProps,
  GridLayout
} from '../layout';

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
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  itemGroups: SharedValue<Array<Array<string>>>;
  keyToGroup: SharedValue<Record<string, number>>;
  groupSizeLimit: SharedValue<number>;
  crossAxisGroupSizes: SharedValue<Array<number>>;
  crossAxisGroupOffsets: SharedValue<Array<number>>;
  adjustedCrossGap: SharedValue<number>;
  dimensionsLimits: SharedValue<FlexLayoutProps['limits']>;
  useFlexLayoutReaction: (
    idxToKey: SharedValue<Array<string>>,
    onChange: (layout: FlexLayout | null) => void
  ) => void;
  calculateFlexLayout: (idxToKey: Array<string>) => FlexLayout | null;
};
