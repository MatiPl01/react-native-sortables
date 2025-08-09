import type { SharedValue } from 'react-native-reanimated';

import type { FlexDirection, FlexLayout } from '../layout';

export type GridLayoutContextType = {
  mainGroupSize: SharedValue<null | number>;
  numGroups: number;
  mainGap: SharedValue<number>;
  crossGap: SharedValue<number>;
  isVertical: boolean;
};

export type FlexLayoutContextType = {
  flexDirection: FlexDirection;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  keyToGroup: SharedValue<Record<string, number>>;
  appliedLayout: SharedValue<FlexLayout | null>;
  useFlexLayoutReaction: (
    idxToKey: SharedValue<Array<string> | null>,
    onChange: (layout: FlexLayout | null, shouldAnimate: boolean) => void
  ) => void;
  calculateFlexLayout: (idxToKey: Array<string>) => FlexLayout | null;
};
