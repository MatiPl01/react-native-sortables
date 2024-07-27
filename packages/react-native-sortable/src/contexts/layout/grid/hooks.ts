import type { ReorderStrategy } from '../../../types';
import { reorderItems } from '../../../utils';
import {
  useMeasurementsContext,
  useOrderUpdater,
  usePositionsContext
} from '../../shared';
import { useGridLayoutContext } from './GridLayoutProvider';
import { getColumnIndex, getRowIndex } from './utils';

export function useGridOrderUpdater(
  numColumns: number,
  strategy: ReorderStrategy
): void {
  const { containerHeight } = useMeasurementsContext();
  const { indexToKey } = usePositionsContext();
  const { rowOffsets } = useGridLayoutContext();

  useOrderUpdater(
    ({ activeIndex, centerPosition: { x, y }, dimensions }) => {
      'worklet';
      const itemsCount = indexToKey.value.length;
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
      if (yOffsetAbove > 0 && y < yOffsetAbove) {
        dy = -1;
      } else if (
        yOffsetBelow !== undefined &&
        yOffsetBelow < containerHeight.value &&
        y > yOffsetBelow
      ) {
        dy = 1;
      }

      // Check if the center of the active item is over the left or right edge of the container
      let dx = 0;
      if (xOffsetLeft > 0 && x < xOffsetLeft) {
        dx = -1;
      } else if (
        columnIndex < numColumns - 1 &&
        activeIndex < itemsCount &&
        x > xOffsetRight
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
    },
    [strategy]
  );
}
