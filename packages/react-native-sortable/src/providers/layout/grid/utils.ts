export const getRowIndex = (index: number, numColumns: number): number => {
  'worklet';
  return Math.floor(index / numColumns);
};

export const getColumnIndex = (index: number, numColumns: number): number => {
  'worklet';
  return index % numColumns;
};

export const getGridItemBoundingBox = (
  activeIndex: number,
  numColumns: number,
  columnWidth: number,
  rowOffsets: Array<number>,
  gaps: { row: number; column: number }
) => {
  'worklet';
  const rowIndex = getRowIndex(activeIndex, numColumns);
  const columnIndex = getColumnIndex(activeIndex, numColumns);

  // Get active item bounding box
  const yOffsetAbove = rowOffsets[rowIndex];
  if (yOffsetAbove === undefined) {
    return;
  }
  const yOffsetBelow = rowOffsets[rowIndex + 1];
  const xOffsetLeft = columnIndex * columnWidth;
  const xOffsetRight = (columnIndex + 1) * columnWidth;

  return {
    x1: xOffsetLeft,
    x2: xOffsetRight,
    y1: yOffsetAbove,
    y2: yOffsetBelow
  };
};
