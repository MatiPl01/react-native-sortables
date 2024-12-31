import { type PropsWithChildren, useCallback } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';
import { useAnimatableValue } from '../../../hooks';
import type {
  Animatable,
  GridLayout,
  GridLayoutContextType
} from '../../../types';
import { useCommonValuesContext, useDerivedLayoutFactory } from '../../shared';
import { createProvider } from '../../utils';
import { calculateLayout } from './utils';

const DEBUG_COLORS = {
  backgroundColor: '#ffa500',
  borderColor: '#825500'
};

type GridLayoutProviderProps = PropsWithChildren<{
  itemsCount: number;
  columns: number;
  rowGap: Animatable<number>;
  columnGap: Animatable<number>;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  columnGap: columnGap_,
  columns,
  itemsCount,
  rowGap: rowGap_
}) => {
  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions,
    itemsStyleOverride
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const debugRowGapRects = debugContext?.useDebugRects(
    Math.ceil(itemsCount / columns) - 1
  );
  const debugColumnGapRects = debugContext?.useDebugRects(columns - 1);

  const columnGap = useAnimatableValue(columnGap_);
  const rowGap = useAnimatableValue(rowGap_);
  const columnWidth = useSharedValue(-1);

  const useGridLayoutReaction = useCallback(
    (
      idxToKey: SharedValue<Array<string>>,
      onChange: (layout: GridLayout | null) => void
    ) =>
      useAnimatedReaction(
        () => ({
          columnWidth: columnWidth.value,
          gaps: {
            column: columnGap.value,
            row: rowGap.value
          },
          indexToKey: idxToKey.value,
          itemDimensions: itemDimensions.value,
          numColumns: columns
        }),
        layoutProps => {
          onChange(calculateLayout(layoutProps));
        }
      ),
    [columnWidth, columnGap, rowGap, columns, itemDimensions]
  );

  const useGridLayout = useDerivedLayoutFactory(useGridLayoutReaction);

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      gap: columnGap.value,
      width: containerWidth.value
    }),
    ({ gap, width }) => {
      if (width === -1) {
        return;
      }
      const colWidth = (width + gap) / columns - gap;
      columnWidth.value = colWidth;

      // DEBUG ONLY
      if (debugColumnGapRects) {
        for (let i = 0; i < columns - 1; i++) {
          debugColumnGapRects[i]?.set({
            ...DEBUG_COLORS,
            width: gap,
            x: colWidth * (i + 1) + gap * i
          });
        }
      }
    }
  );

  // GRID LAYOUT UPDATER
  useGridLayoutReaction(indexToKey, layout => {
    'worklet';
    if (!layout) {
      return;
    }

    // Update item positions
    itemPositions.value = layout.itemPositions;
    // Update container height
    containerHeight.value = layout.containerHeight;
    // Update style overrides
    const currentStyleOverride = itemsStyleOverride.value;
    if (currentStyleOverride?.width !== columnWidth.value) {
      itemsStyleOverride.value = {
        width: columnWidth.value
      };
    }

    // DEBUG ONLY
    if (debugRowGapRects) {
      for (let i = 0; i < layout.rowOffsets.length - 1; i++) {
        debugRowGapRects[i]?.set({
          ...DEBUG_COLORS,
          height: rowGap.value,
          y: layout.rowOffsets[i + 1]! - rowGap.value
        });
      }
    }
  });

  return {
    value: {
      columnGap,
      columnWidth,
      numColumns: columns,
      rowGap,
      useGridLayout
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
