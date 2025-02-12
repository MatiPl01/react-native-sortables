import { type PropsWithChildren, useCallback } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { IS_WEB } from '../../../constants';
import { useDebugContext } from '../../../debug';
import { useAnimatableValue } from '../../../hooks';
import type {
  Animatable,
  GridLayout,
  GridLayoutContextType
} from '../../../types';
import { useCommonValuesContext, useMeasurementsContext } from '../../shared';
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
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions,
    itemsStyleOverride,
    shouldAnimateLayout
  } = useCommonValuesContext();
  const { applyControlledContainerDimensions } = useMeasurementsContext();
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
      onChange: (layout: GridLayout | null, shouldAnimate: boolean) => void
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
        (props, previousProps) => {
          onChange(
            calculateLayout(props),
            // Animate layout only if parent container is not resized
            // (e.g. skip animation when the browser window is resized)
            !!(
              IS_WEB &&
              previousProps &&
              props.columnWidth === previousProps.columnWidth
            )
          );
        }
      ),
    [columnWidth, columnGap, rowGap, columns, itemDimensions]
  );

  const useGridLayout = useCallback(
    (idxToKey: SharedValue<Array<string>>) =>
      useDerivedValue(() =>
        calculateLayout({
          columnWidth: columnWidth.value,
          gaps: {
            column: columnGap.value,
            row: rowGap.value
          },
          indexToKey: idxToKey.value,
          itemDimensions: itemDimensions.value,
          numColumns: columns
        })
      ),
    [columnWidth, columnGap, rowGap, columns, itemDimensions]
  );

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      gap: columnGap.value,
      width: containerWidth.value
    }),
    ({ gap, width }) => {
      if (width === null) {
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
  useGridLayoutReaction(indexToKey, (layout, shouldAnimate) => {
    'worklet';
    shouldAnimateLayout.value = shouldAnimate;
    if (!layout) {
      return;
    }

    // Update item positions
    itemPositions.value = layout.itemPositions;
    // Update controlled container dimensions
    applyControlledContainerDimensions(layout.totalDimensions);
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
