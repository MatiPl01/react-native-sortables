import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import type { Vector } from '../../../types';
import { areArraysDifferent, areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext } from '../../shared';
import { createProvider } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

type GridLayoutContextType = {
  columnWidth: SharedValue<number>;
  rowOffsets: SharedValue<Array<number>>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  columns: number;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  columnGap: columnGapValue,
  columns,
  rowGap: rowGapValue
}) => {
  const {
    containerHeight,
    containerWidth,
    indexToKey,
    itemDimensions,
    itemPositions,
    overrideItemDimensions
  } = useCommonValuesContext();

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useSharedValue(-1);

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      columnGap: columnGapValue.value,
      width: containerWidth.value
    }),
    ({ columnGap, width }) => {
      if (width !== -1) {
        const colWidth = (width + columnGap) / columns;
        overrideItemDimensions.value = Object.fromEntries(
          Object.keys(itemDimensions.value).map(key => [
            key,
            { width: colWidth }
          ])
        );
        columnWidth.value = colWidth;
      }
    },
    [columns]
  );

  // ROW OFFSETS UPDATER
  useAnimatedReaction(
    () => ({
      dimensions: itemDimensions.value,
      idxToKey: indexToKey.value,
      rowGap: rowGapValue.value
    }),
    ({ dimensions, idxToKey, rowGap }) => {
      const offsets = [0];
      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columns);
        const itemHeight = dimensions[key]?.height;

        // Return if the item height is not yet measured
        if (itemHeight === undefined) {
          return;
        }

        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + itemHeight + rowGap
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
        const newHeight = offsets[offsets.length - 1] ?? 0;
        containerHeight.value = newHeight - rowGap;
      }
    },
    [columns]
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
        const rowIndex = getRowIndex(parseInt(itemIndex), columns);
        const colIndex = getColumnIndex(parseInt(itemIndex), columns);

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
    [columns]
  );

  return {
    value: {
      columnWidth,
      rowOffsets
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
