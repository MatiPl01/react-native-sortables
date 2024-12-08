export const getRowIndex = (
  index: number | string,
  numColumns: number
): number => {
  'worklet';
  return Math.floor(+index / numColumns);
};

export const getColumnIndex = (
  index: number | string,
  numColumns: number
): number => {
  'worklet';
  return +index % numColumns;
};
