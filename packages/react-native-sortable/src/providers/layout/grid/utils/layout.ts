import type { GridLayout, GridLayoutProps, Vector } from '../../../../types';
import { getColumnIndex, getRowIndex } from './helpers';

export const calculateLayout = ({
  columnWidth,
  gaps,
  indexToKey,
  itemDimensions,
  numColumns
}: GridLayoutProps): GridLayout | null => {
  'worklet';
  if (columnWidth <= 0) {
    return null;
  }

  const rowOffsets = [0];
  const itemPositions: Record<string, Vector> = {};

  for (const [itemIndex, itemKey] of Object.entries(indexToKey)) {
    const itemHeight = itemDimensions[itemKey]?.height;

    // Return if the item height is not yet measured
    if (itemHeight === undefined) {
      return null;
    }

    const rowIndex = getRowIndex(itemIndex, numColumns);
    const columnIndex = getColumnIndex(itemIndex, numColumns);
    const currentRowOffset = rowOffsets[rowIndex] ?? 0;

    // Update offset of the next row
    rowOffsets[rowIndex + 1] = Math.max(
      rowOffsets[rowIndex + 1] ?? 0,
      currentRowOffset + itemHeight + gaps.row
    );

    // Update item position
    itemPositions[itemKey] = {
      x: columnIndex * (columnWidth + gaps.column),
      y: currentRowOffset
    };
  }

  const offsetAfterLastRow = rowOffsets[rowOffsets.length - 1];
  const containerHeight = offsetAfterLastRow ? offsetAfterLastRow : 0;

  return {
    containerHeight,
    itemPositions,
    rowOffsets
  };
};
