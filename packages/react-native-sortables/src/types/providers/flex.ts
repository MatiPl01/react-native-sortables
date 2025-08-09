import type { SharedValue } from 'react-native-reanimated';

import type { FlexDirection, FlexLayout } from '../layout';

export type FlexLayoutContextType = {
  flexDirection: FlexDirection;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
  keyToGroup: SharedValue<Record<string, number>>;
  appliedLayout: SharedValue<FlexLayout | null>;
  calculateFlexLayout: (idxToKey: Array<string>) => FlexLayout | null;
};
