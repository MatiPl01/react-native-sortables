import { type PropsWithChildren } from 'react';
import {
  type SharedValue,
  useAnimatedReaction,
  useSharedValue
} from 'react-native-reanimated';

import { OFFSET_EPS } from '../../../constants';
import { useAnimatableValue } from '../../../hooks';
import type { Animatable, Dimensions, Vector } from '../../../types';
import { areArraysDifferent, areVectorsDifferent } from '../../../utils';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { createProvider } from '../../utils';
import { getColumnIndex, getRowIndex } from './utils';

const DEBUG = false; // TODO - maybe move to constants

const SWAP_OFFSET = 10;

type GridLayoutContextType = {
  columnWidth: SharedValue<null | number>;
  rowOffsets: SharedValue<Array<number>>;
  rowGap: SharedValue<number>;
  columnGap: SharedValue<number>;
};

type GridLayoutProviderProps = PropsWithChildren<{
  columns: number;
  rowGap: Animatable<number>;
  columnGap: Animatable<number>;
}>;

const { GridLayoutProvider, useGridLayoutContext } = createProvider(
  'GridLayout'
)<GridLayoutProviderProps, GridLayoutContextType>(({
  children,
  columnGap: columnGap_,
  columns,
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

  const columnGap = useAnimatableValue(columnGap_);
  const rowGap = useAnimatableValue(rowGap_);

  const rowOffsets = useSharedValue<Array<number>>([]);
  const columnWidth = useSharedValue<null | number>(null);

  // TARGET COLUMN WIDTH UPDATER
  useAnimatedReaction(
    () => ({
      gap: columnGap.value,
      width: containerWidth.value
    }),
    ({ gap, width }) => {
      if (width !== -1) {
        const colWidth = (width + gap) / columns;
        columnWidth.value = colWidth;
      }
    },
    [columns]
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

        offsets[rowIndex + 1] = Math.max(
          offsets[rowIndex + 1] ?? 0,
          (offsets[rowIndex] ?? 0) + itemHeight + gap
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
        containerHeight.value = newHeight - gap;
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
      if (colWidth === null || offsets.length === 0) {
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

        // Override item dimensions if they are not yet overridden
        // or the column width has changed
        const currentOverriddenDimensions = overrideItemDimensions.value;
        if (currentOverriddenDimensions[key]?.width !== colWidth) {
          overriddenDimensionsChanged = true;
          overriddenDimensions[key] = {
            width: colWidth
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

  // ITEMS ORDER UPDATER
  useOrderUpdater(
    ({ activeIndex, dimensions, strategy, touchPosition: { x, y } }) => {
      'worklet';
      if (columnWidth.value === null) {
        return;
      }

      const itemsCount = indexToKey.value.length;
      const rowIndex = getRowIndex(activeIndex, columns);
      const columnIndex = getColumnIndex(activeIndex, columns);

      // Get active item bounding box
      const yOffsetAbove = rowOffsets.value[rowIndex] ?? 0;
      const yOffsetBelow = (rowOffsets.value[rowIndex + 1] ?? 0) - rowGap.value;
      const xOffsetLeft = columnIndex * dimensions.width;
      const xOffsetRight = (columnIndex + 1) * dimensions.width;

      // const rowHeightAbove =
      //   rowIndex > 0
      //     ? yOffsetAbove - (rowOffsets.value[rowIndex - 1] ?? 0) - rowGap.value
      //     : 0;
      // const rowHeightBelow =
      //   rowIndex < rowOffsets.value.length - 1 && yOffsetBelow !== undefined
      //     ? (rowOffsets.value[rowIndex + 1] ?? 0) - yOffsetBelow - rowGap.value
      //     : 0;

      // const ignoreRangeX = Math.min(
      //   Math.max(SWAP_OFFSET, columnGap.value),
      //   columnGap.value + columnWidth.value / 2
      // );
      // const ignoreRangeTop = Math.min(
      //   Math.max(SWAP_OFFSET, rowGap.value),
      //   rowGap.value + rowHeightAbove / 2
      // );
      // const ignoreRangeBottom = Math.min(
      //   Math.max(SWAP_OFFSET, rowGap.value),
      //   rowGap.value + rowHeightBelow / 2
      // );

      // // Check if should swap the active item with the item above or below
      // let dy = 0;
      // if (yOffsetAbove > 0 && y <= yOffsetAbove - ignoreRangeTop) {
      //   dy = -1;
      // } else if (
      //   yOffsetBelow !== undefined &&
      //   yOffsetBelow < containerHeight.value &&
      //   y >= yOffsetBelow + ignoreRangeBottom
      // ) {
      //   dy = 1;
      // }

      // console.log({ dy, ignoreRangeBottom });

      // // Check if should swap the active item with the item on the left or right
      // const dx = 0;
      // // if (xOffsetLeft > 0 && x <= xOffsetLeft - ignoreRangeX) {
      // //   dx = -1;
      // // } else if (
      // //   columnIndex < columns - 1 &&
      // //   activeIndex < itemsCount &&
      // //   x >= xOffsetRight + ignoreRangeX
      // // ) {
      // //   dx = 1;
      // // }

      // const indexOffset = dy * columns + dx;
      // // Swap the active item with the item at the new index
      // const newIndex = activeIndex + indexOffset;
      // if (newIndex === activeIndex || newIndex < 0 || newIndex >= itemsCount) {
      //   return;
      // }

      // // return the new order of items
      // return reorderItems(indexToKey.value, activeIndex, newIndex, strategy);
    },
    [columns]
  );

  return {
    children: DEBUG ? <>{children}</> : children,
    value: {
      columnGap,
      columnWidth,
      rowGap,
      rowOffsets
    }
  };
});

export { GridLayoutProvider, useGridLayoutContext };
