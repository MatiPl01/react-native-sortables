'worklet';
import type {
  ExtrapolationType,
  MeasuredDimensions
} from 'react-native-reanimated';
import { Extrapolation, interpolate } from 'react-native-reanimated';

type CalculateRawProgressFunction = (
  position: number,
  contentContainerMeasurements: MeasuredDimensions,
  scrollContainerMeasurements: MeasuredDimensions,
  activationOffset: [number, number],
  contentBounds: [number, number],
  extrapolation: ExtrapolationType
) => number;

const calculateRawProgress = (
  position: number,
  contentPos: number,
  scrollablePos: number,
  scrollableSize: number,
  [startOffset, endOffset]: [number, number],
  [startContent, endContent]: [number, number],
  extrapolation: ExtrapolationType
) => {
  const startBound = scrollablePos - contentPos;
  const startThreshold = startBound + startOffset;
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - endOffset;

  const startBoundProgress = -interpolate(
    position,
    [startContent, startContent + startOffset],
    [0, 1],
    Extrapolation.CLAMP
  );

  const endBoundProgress = interpolate(
    position,
    [endContent - endOffset, endContent],
    [1, 0],
    Extrapolation.CLAMP
  );

  return interpolate(
    position,
    [startBound, startThreshold, endThreshold, endBound],
    [startBoundProgress, 0, 0, endBoundProgress],
    extrapolation
  );
};

export const calculateRawProgressVertical: CalculateRawProgressFunction = (
  position,
  { pageY: cY },
  { height: sH, pageY: sY },
  ...rest
) => calculateRawProgress(position, cY, sY, sH, ...rest);

export const calculateRawProgressHorizontal: CalculateRawProgressFunction = (
  position,
  { pageX: cX },
  { pageX: sX, width: sW },
  ...rest
) => calculateRawProgress(position, cX, sX, sW, ...rest);
