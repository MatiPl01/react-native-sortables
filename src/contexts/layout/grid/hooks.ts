import { useAnimatedReaction } from 'react-native-reanimated';

import type { ReorderStrategy } from '../../../types';
import { reorderItems } from '../../../utils';
import {
  useDragContext,
  useMeasurementsContext,
  usePositionsContext
} from '../../shared';
import { useGridLayoutContext } from './GridLayoutProvider';
import { getColumnIndex, getRowIndex } from './utils';

export function useGridOrderUpdater(
  numColumns: number,
  strategy: ReorderStrategy
): void {
  const { containerHeight, itemDimensions } = useMeasurementsContext();
  const { indexToKey, keyToIndex } = usePositionsContext();
  const { rowOffsets } = useGridLayoutContext();
  const { activeItemKey, activeItemPosition } = useDragContext();

  useAnimatedReaction(
    () => ({
      activeKey: activeItemKey.value,
      activePosition: activeItemPosition.value
    }),
    ({ activeKey, activePosition }) => {
      if (activeKey === null) {
        return;
      }
      const dimensions = itemDimensions.value[activeKey];
      if (!dimensions) {
        return;
      }

      const centerY = activePosition.y + dimensions.height / 2;
      const centerX = activePosition.x + dimensions.width / 2;
      const activeIndex = keyToIndex.value[activeKey];
      const itemsCount = indexToKey.value.length;

      if (activeIndex === undefined) {
        return;
      }

      const rowIndex = getRowIndex(activeIndex, numColumns);
      const columnIndex = getColumnIndex(activeIndex, numColumns);

      // Get active item bounding box
      const yOffsetAbove = rowOffsets.value[rowIndex];
      if (yOffsetAbove === undefined) {
        return;
      }
      const yOffsetBelow = rowOffsets.value[rowIndex + 1];
      const xOffsetLeft = columnIndex * dimensions.width;
      const xOffsetRight = (columnIndex + 1) * dimensions.width;

      // Check if the center of the active item is over the top or bottom edge of the container
      let dy = 0;
      if (yOffsetAbove > 0 && centerY < yOffsetAbove) {
        dy = -1;
      } else if (
        yOffsetBelow !== undefined &&
        yOffsetBelow < containerHeight.value &&
        centerY > yOffsetBelow
      ) {
        dy = 1;
      }

      // Check if the center of the active item is over the left or right edge of the container
      let dx = 0;
      if (xOffsetLeft > 0 && centerX < xOffsetLeft) {
        dx = -1;
      } else if (
        columnIndex < numColumns - 1 &&
        activeIndex < itemsCount &&
        centerX > xOffsetRight
      ) {
        dx = 1;
      }

      const indexOffset = dy * numColumns + dx;
      // Swap the active item with the item at the new index
      const newIndex = activeIndex + indexOffset;
      if (newIndex === activeIndex || newIndex < 0 || newIndex >= itemsCount) {
        return;
      }

      // Update the order of items
      indexToKey.value = reorderItems(
        indexToKey.value,
        activeIndex,
        newIndex,
        strategy
      );
    }
  );
}
