const MIN_ADDITIONAL_OFFSET = 5;

export const getAdditionalSwapOffset = (gap: number, size: number) => {
  'worklet';
  return Math.max(
    MIN_ADDITIONAL_OFFSET,
    Math.min(gap / 2 + MIN_ADDITIONAL_OFFSET, (gap + size) / 2)
  );
};
