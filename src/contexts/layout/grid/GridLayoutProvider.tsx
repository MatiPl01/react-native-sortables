import type { PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import type { Position } from '../../../types';
import { areArraysDifferent } from '../../../utils';
import { useMeasurementsContext, usePositionsContext } from '../../shared';
import { createGuardedContext } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

type GridLayoutContextType = {
  rowOffsets: SharedValue<Array<number>>;
  columnOffsets: SharedValue<Array<number>>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  itemsCount: number;
  columnsCount: number;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createGuardedContext(
  'GridLayout'
)<GridLayoutContextType, GridLayoutProviderProps>(({
  columnsCount,
  itemsCount
}) => {
  const { itemDimensions } = useMeasurementsContext();
  const { indexToKey, itemPositions } = usePositionsContext();

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnOffsets = useSharedValue<Array<number>>([]);

  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value
    }),
    ({ dimensions, idxToKey }) => {
      const offsets = {
        column: [0],
        row: [0]
      };
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), itemsCount);
        const columnIndex = getColumnIndex(parseInt(itemIndex), itemsCount);
        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + (dimensions[key]?.height ?? 0)
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
      }
    },
    [itemsCount]
  );

  useAnimatedReaction(
    () => ({
      idxToKey: indexToKey.value,
      offsets: {
        column: columnOffsets.value,
        row: rowOffsets.value
      }
    }),
    ({ idxToKey, offsets }) => {
      // Calculate item positions based on their order in the grid
      const positions: Record<string, Position> = {};

      for (const [index, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(index), columnsCount);
        const columnIndex = getColumnIndex(parseInt(index), itemsCount);
        const rowOffset = rowOffsets.value[rowIndex];
        const columnOffset = offsets.column[columnIndex];

        if (!rowOffset || !columnOffset) {
          return;
        }

        positions[key] = {
          x: columnOffset,
          y: rowOffset
        };
      }

      itemPositions.value = positions;
    }
  );

  return {
    columnOffsets,
    rowOffsets
  };
});

export { GridLayoutProvider, useGridLayoutContext };
