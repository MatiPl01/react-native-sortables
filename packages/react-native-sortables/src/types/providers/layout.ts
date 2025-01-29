import type { SharedValue } from 'react-native-reanimated';

import type { FlexDirection, FlexLayout, GridLayout } from '../layout';

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
  keyToGroup: SharedValue<Record<string, number>>;
  appliedLayout: SharedValue<FlexLayout | null>;
  useFlexLayoutReaction: (
    idxToKey: SharedValue<Array<string> | null>,
    onChange: (layout: FlexLayout | null) => void
  ) => void;
  calculateFlexLayout: (idxToKey: Array<string>) => FlexLayout | null;
};
