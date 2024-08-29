import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { useDebugContext } from '../../../debug';
import { useAnimatableValue } from '../../../hooks';
import type { Animatable, Dimensions, Vector } from '../../../types';
import { areArraysDifferent, areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

const DEBUG_COLORS = {
  gap: {
    backgroundColor: '#ffa500',
    borderColor: '#825500'
  }
};

type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  rowOffsets: SharedValue<Array<number>>;
  columnGap: SharedValue<number>;
  rowGap: SharedValue<number>;
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
    overrideItemDimensions
  } = useCommonValuesContext();
  const debugContext = useDebugContext();

  const rowOffsetDebugRects = debugContext?.useDebugRects(
    Math.ceil(itemsCount / columns) - 1
  );
  const columnGapDebugRects = debugContext?.useDebugRects(columns - 1);

  const columnGap = useAnimatableValue(columnGap_);
  const rowGap = useAnimatableValue(rowGap_);

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useSharedValue(-1);

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      gap: columnGap.value,
      width: containerWidth.value
    }),
    ({ gap, width }) => {
      if (width !== -1) {
        const colWidth = (width + gap) / columns - gap;
        columnWidth.value = colWidth;

        if (columnGapDebugRects) {
          for (let i = 0; i < columns - 1; i++) {
            columnGapDebugRects[i]?.set({
              ...DEBUG_COLORS.gap,
              width: gap,
              x: colWidth * (i + 1) + gap * i
            });
          }
        }
      }
    },
    [columns, columnGapDebugRects]
  );

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      gap: rowGap.value,
      idxToKey: indexToKey.value
    }),
    ({ dimensions, gap, idxToKey }) => {
      const offsets = [0];
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columns);
        const itemHeight = dimensions[key]?.height;

        // Return if the item height is not yet measured
        if (itemHeight === undefined) {
          return;
        }

        const offset = (offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + itemHeight + gap
        ));

        if (rowOffsetDebugRects?.[rowIndex]) {
          rowOffsetDebugRects[rowIndex]?.set({
            ...DEBUG_COLORS.gap,
            height: gap,
            positionOrigin: 'bottom',
            y: offset
          });
        }
      }
      // Update row offsets only if they have changed
      if (
        areArraysDifferent(
          offsets,
          rowOffsets.value,
          (a, b) => Math.abs(a - b) < OFFSET_EPS
        )
      ) {
        rowOffsets.value = offsets;
        const newHeight = offsets[offsets.length - 1] ?? 0;
        containerHeight.value = newHeight - gap;
      }
    },
    [columns, rowOffsetDebugRects]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      colWidth: columnWidth.value,
      gap: columnGap.value,
      idxToKey: indexToKey.value,
      offsets: rowOffsets.value
    }),
    ({ colWidth, gap, idxToKey, offsets }) => {
      if (colWidth === -1 || offsets.length === 0) {
        return;
      }
      const positions: Record<string, Vector> = {};
      const overriddenDimensions: Record<string, Partial<Dimensions>> = {};
      let overriddenDimensionsChanged = false;

      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columns);
        const colIndex = getColumnIndex(parseInt(itemIndex), columns);

        const y = offsets[rowIndex];
        if (y === undefined) {
          return;
        }

        const currentPosition = itemPositions.value[key];
        const calculatedPosition = {
          x: colIndex * (colWidth + gap),
          y
        };

        // Re-use existing position object if its properties are the same
        // (this prevents unnecessary reaction triggers in item components)
        positions[key] =
          !currentPosition ||
          areVectorsDifferent(currentPosition, calculatedPosition)
            ? calculatedPosition
            : currentPosition;

        // Override item dimensions if they are not yet overridden
        // or the column width has changed
        const currentOverriddenDimensions = overrideItemDimensions.value;
        const override = colWidth + gap;
        if (currentOverriddenDimensions[key]?.width !== override) {
          overriddenDimensionsChanged = true;
          overriddenDimensions[key] = {
            width: override
          };
        } else {
          // Re-use existing overridden dimensions if they are the same
          // to prevent unnecessary reaction triggers in item components
          overriddenDimensions[key] = currentOverriddenDimensions[key]!;
        }
      }

      itemPositions.value = positions;
      if (overriddenDimensionsChanged) {
        overrideItemDimensions.value = overriddenDimensions;
      }
    },
    [columns]
  );

  return {
    value: {
      columnGap,
      columnWidth,
      rowGap,
      rowOffsets
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
