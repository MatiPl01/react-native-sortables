'worklet';

type CalculateRawProgressFunction = (
  position: number,
  contentContainerMeasurements: number,
  scrollContainerMeasurements: number
) => number;

export const calculateRawProgressVertical: CalculateRawProgressFunction = (
  position,
  contentContainerMeasurements,
  scrollContainerMeasurements
) => {
  return 0;
};

export const calculateRawProgressHorizontal: CalculateRawProgressFunction = (
  position,
  contentContainerMeasurements,
  scrollContainerMeasurements
) => {
  return 0;
};
