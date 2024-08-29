/* eslint-disable import/no-unused-modules */
import { reorderItems } from '../../../utils';
import { useCommonValuesContext, useOrderUpdater } from '../../shared';
import { useGridLayoutContext } from './GridLayoutProvider';
import { getColumnIndex, getGridItemBoundingBox } from './utils';

export function useGridOrderUpdater(numColumns: number): void {
  const { containerHeight, indexToKey } = useCommonValuesContext();
  const { columnGap, columnWidth, rowGap, rowOffsets } = useGridLayoutContext();

  useOrderUpdater(({ activeIndex, strategy, touchPosition: { x, y } }) => {
    'worklet';
    const itemsCount = indexToKey.value.length;
    const columnIndex = getColumnIndex(activeIndex, numColumns);
    const bounds = getGridItemBoundingBox(
      activeIndex,
      numColumns,
      columnWidth.value,
      rowOffsets.value,
      { column: columnGap.value, row: rowGap.value }
    );

    if (!bounds) {
      return;
    }

    // Check if the center of the active item is over the top or bottom edge of the container
    let dy = 0;
    if (bounds.y1 > 0 && y < bounds.y1) {
      dy = -1;
    } else if (
      bounds.y2 !== undefined &&
      bounds.y2 < containerHeight.value &&
      y > bounds.y2
    ) {
      dy = 1;
    }

    // Check if the center of the active item is over the left or right edge of the container

    let dx = 0;
    if (bounds.x1 > 0 && x < bounds.x1) {
      dx = -1;
    } else if (
      columnIndex < numColumns - 1 &&
      activeIndex < itemsCount &&
      x > bounds.x2
    ) {
      dx = 1;
    }

    const indexOffset = dy * numColumns + dx;
    // Swap the active item with the item at the new index
    const newIndex = activeIndex + indexOffset;
    if (newIndex === activeIndex || newIndex < 0 || newIndex >= itemsCount) {
      return;
    }

    // return the new order of items
    return reorderItems(indexToKey.value, activeIndex, newIndex, strategy);
  });
}
