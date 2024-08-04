import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import type { Vector } from '../../../types';
import { areArraysDifferent, areVectorsDifferent } from '../../../utils';
import { useMeasurementsContext, usePositionsContext } from '../../shared';
import { createEnhancedContext } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  rowOffsets: SharedValue<Array<number>>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  columnCount: number;
  columnGap: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createEnhancedContext(
  'GridLayout'
)<GridLayoutContextType, GridLayoutProviderProps>(({
  columnCount,
  columnGap
}) => {
  const { containerHeight, containerWidth, itemDimensions, measureAllItems } =
    useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useSharedValue(-1);

  // COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      width: containerWidth.value
    }),
    ({ width }) => {
      if (width === -1) {
        return;
      }
      const newWidth = width / columnCount + columnGap / 2;
      if (columnWidth.value === -1) {
        columnWidth.value = newWidth;
      } else {
        // Manually trigger the measurement of all items to ensure that they
        // dimensions are correctly updated when the column width changes
        columnWidth.value = withTiming(newWidth, undefined, measureAllItems);
      }
    },
    [columnCount, columnGap]
  );

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ dimensions, idxToKey }) => {
      const offsets = [0];
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnCount);
        const itemHeight = dimensions[key]?.height;

        // Return if the item height is not yet measured
        if (itemHeight === undefined) {
          return;
        }

        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + itemHeight
        );
      }
      // Update row offsets only if they have changed
      if (
        areArraysDifferent(
          offsets,
          rowOffsets.value,
          (a, b) => Math.abs(a - b) < OFFSET_EPS
        )
      ) {
        console.log('>>> current rowOffsets.value', rowOffsets.value);
        console.log('>>> set rowOffsets.value', offsets);
        rowOffsets.value = offsets;
        const newHeight = offsets[offsets.length - 1] ?? 0;
        if (containerHeight.value === -1) {
          console.log('>>> set containerHeight.value', newHeight);
          containerHeight.value = newHeight;
        } else {
          console.log('>>> set containerHeight.value withTiming', newHeight);
          containerHeight.value = withTiming(newHeight);
        }
      }
    },
    [columnCount]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      colWidth: columnWidth.value,
      idxToKey: indexToKey.value,
      offsets: rowOffsets.value
    }),
    ({ colWidth, idxToKey, offsets }) => {
      if (colWidth === -1 || offsets.length === 0) {
        return;
      }
      const positions: Record<string, Vector> = {};

      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnCount);
        const colIndex = getColumnIndex(parseInt(itemIndex), columnCount);

        const y = offsets[rowIndex];
        if (y === undefined) {
          return;
        }

        const currentPosition = itemPositions.value[key];
        const calculatedPosition = {
          x: colIndex * colWidth,
          y
        };

        // Re-use existing position object if its properties are the same
        // (this prevents unnecessary reaction triggers in item components)
        positions[key] =
          !currentPosition ||
          areVectorsDifferent(currentPosition, calculatedPosition)
            ? calculatedPosition
            : currentPosition;
      }

      itemPositions.value = positions;
    },
    [columnCount]
  );

  return {
    value: {
      columnWidth,
      rowOffsets
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
