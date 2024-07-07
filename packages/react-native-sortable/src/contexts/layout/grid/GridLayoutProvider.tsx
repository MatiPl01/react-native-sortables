import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import type { Position } from '../../../types';
import { areArraysDifferent, arePositionsDifferent } from '../../../utils';
import { useMeasurementsContext, usePositionsContext } from '../../shared';
import { createEnhancedContext } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  rowOffsets: SharedValue<Array<number>>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  columnsCount: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createEnhancedContext(
  'GridLayout'
)<GridLayoutContextType, GridLayoutProviderProps>(({ columnsCount }) => {
  const {
    itemDimensions,
    measurementsCompleted,
    targetContainerHeight,
    targetContainerWidth
  } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useDerivedValue(() =>
    targetContainerWidth.value === -1
      ? -1
      : targetContainerWidth.value / columnsCount
  );

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      canUpdate: measurementsCompleted.value,
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ canUpdate, dimensions, idxToKey }) => {
      if (!canUpdate) {
        return;
      }
      console.log('row updater');
      const offsets = [0];
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnsCount);
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
        rowOffsets.value = offsets;
        targetContainerHeight.value = offsets[offsets.length - 1] ?? 0;
      }
    },
    [columnsCount]
  );

  // ITEM POSITIONS UPDATER
  useAnimatedReaction(
    () => ({
      canUpdate: measurementsCompleted.value,
      colWidth: columnWidth.value,
      idxToKey: indexToKey.value,
      offsets: rowOffsets.value
    }),
    ({ canUpdate, colWidth, idxToKey, offsets }) => {
      if (colWidth === -1 || offsets.length === 0 || !canUpdate) {
        return;
      }
      const positions: Record<string, Position> = {};

      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnsCount);
        const colIndex = getColumnIndex(parseInt(itemIndex), columnsCount);

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
          arePositionsDifferent(currentPosition, calculatedPosition)
            ? calculatedPosition
            : currentPosition;
      }

      console.log(positions);
      itemPositions.value = positions;
    },
    [columnsCount]
  );

  return {
    value: {
      columnWidth,
      rowOffsets
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
