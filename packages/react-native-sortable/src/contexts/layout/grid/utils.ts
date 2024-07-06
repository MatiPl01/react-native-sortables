export const getRowIndex = (index: number, numColumns: number): number => {
  'worklet';
  return Math.floor(index / numColumns);
};

export const getColumnIndex = (index: number, numColumns: number): number => {
  'worklet';
  return index % numColumns;
};
