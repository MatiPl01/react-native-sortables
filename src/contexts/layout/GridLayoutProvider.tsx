import type { PropsWithChildren } from 'react';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import { createGuardedContext } from '../utils';

type GridLayoutContextType = {
  primaryAxisOffsets: SharedValue<Array<number>>; // rows for vertical layout, columns for horizontal layout
  secondaryAxisOffsets: SharedValue<Array<number>>; // columns for vertical layout, rows for horizontal layout
};

type GridLayoutProviderProps = PropsWithChildren<{
  orientation: 'horizontal' | 'vertical';
  rows: number;
  columns: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createGuardedContext(
  'GridLayout'
)<GridLayoutContextType, GridLayoutProviderProps>(({
  columns,
  orientation,
  rows
}) => {
  const primaryAxisOffsets = useSharedValue<Array<number>>([]);
  const secondaryAxisOffsets = useSharedValue<Array<number>>([]);

  return {
    primaryAxisOffsets,
    secondaryAxisOffsets
  };
});

export { GridLayoutProvider, useGridLayoutContext };
