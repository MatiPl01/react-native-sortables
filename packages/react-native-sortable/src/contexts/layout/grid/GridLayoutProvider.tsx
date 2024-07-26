import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { areArraysDifferent } from '../../../utils';
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
  const { containerHeight, containerWidth, itemDimensions } =
    useMeasurementsContext();
  const { indexToKey, targetItemPositions } = usePositionsContext();

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useDerivedValue(() =>
    containerWidth.value === -1 ? -1 : containerWidth.value / columnsCount
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
        containerHeight.value = offsets[offsets.length - 1] ?? 0;
      }
    },
    [columnsCount]
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

      for (const [itemIndex, key] of Object.entries(idxToKey)) {
        const rowIndex = getRowIndex(parseInt(itemIndex), columnsCount);
        const colIndex = getColumnIndex(parseInt(itemIndex), columnsCount);

        const y = offsets[rowIndex];
        if (y === undefined) {
          return;
        }

        const targetPosition = targetItemPositions.current[key];
        if (targetPosition) {
          targetPosition.x.value = colIndex * colWidth;
          targetPosition.y.value = y;
        }
      }
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
