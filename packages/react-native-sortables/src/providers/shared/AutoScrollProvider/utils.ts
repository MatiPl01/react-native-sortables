'worklet';
import type {
  ExtrapolationType,
  MeasuredDimensions
} from 'react-native-reanimated';
import { interpolate } from 'react-native-reanimated';

type CalculateRawProgressFunction = (
  position: number,
  contentContainerMeasurements: MeasuredDimensions,
  scrollContainerMeasurements: MeasuredDimensions,
  activationOffset: [number, number],
  extrapolation: ExtrapolationType
) => number;

const calculateRawProgress = (
  position: number,
  contentPos: number,
  scrollablePos: number,
  scrollableSize: number,
  [startOffset, endOffset]: [number, number],
  extrapolation: ExtrapolationType
) => {
  const startBound = scrollablePos - contentPos;
  const startThreshold = startBound + startOffset;
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - endOffset;

  return interpolate(
    position,
    [startBound, startThreshold, endThreshold, endBound],
    [-1, 0, 0, 1],
    extrapolation
  );
};

export const calculateRawProgressVertical: CalculateRawProgressFunction = (
  position,
  { pageY: cY },
  { height: sH, pageY: sY },
  [startOffset, endOffset],
  extrapolation
) =>
  calculateRawProgress(
    position,
    cY,
    sY,
    sH,
    [startOffset, endOffset],
    extrapolation
  );

export const calculateRawProgressHorizontal: CalculateRawProgressFunction = (
  position,
  { pageX: cX },
  { pageX: sX, width: sW },
  [startOffset, endOffset],
  extrapolation
) =>
  calculateRawProgress(
    position,
    cX,
    sX,
    sW,
    [startOffset, endOffset],
    extrapolation
  );
