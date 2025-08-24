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
  maxOverscroll: [number, number],
  extrapolation: ExtrapolationType
) => number;

const calculateRawProgress = (
  position: number,
  contentPos: number,
  scrollablePos: number,
  scrollableSize: number,
  containerSize: number,
  [startOffset, endOffset]: [number, number],
  [maxStartOverscroll, maxEndOverscroll]: [number, number],
  extrapolation: ExtrapolationType
) => {
  const startBound = scrollablePos - contentPos;
  const startThreshold = startBound + startOffset;
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - endOffset;

  const startBoundProgress = -interpolate(
    position,
    [-maxStartOverscroll, startOffset],
    [0, 1],
    Extrapolation.CLAMP
  );

  const endBoundProgress = interpolate(
    position,
    [containerSize - endOffset, containerSize + maxEndOverscroll],
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
  { height: cH, pageY: cY },
  { height: sH, pageY: sY },
  ...rest
) => calculateRawProgress(position, cY, sY, sH, cH, ...rest);

export const calculateRawProgressHorizontal: CalculateRawProgressFunction = (
  position,
  { pageX: cX, width: cW },
  { pageX: sX, width: sW },
  ...rest
) => calculateRawProgress(position, cX, sX, sW, cW, ...rest);

type ClampDistanceFunction = (
  distance: number,
  contentContainerMeasurements: MeasuredDimensions,
  scrollContainerMeasurements: MeasuredDimensions,
  maxOverscroll: [number, number]
) => number;

const clampDistance = (
  distance: number,
  containerOffset: number,
  scrollableSize: number,
  containerSize: number,
  [maxStartOverscroll, maxEndOverscroll]: [number, number]
) => {
  if (distance < 0) {
    // Scrolling up
    return (
      Math.max(containerOffset + distance, -maxStartOverscroll) -
      containerOffset
    );
  }

  if (distance > 0) {
    // Scrolling down
    return (
      Math.min(
        containerOffset + distance,
        containerSize - scrollableSize + maxEndOverscroll
      ) - containerOffset
    );
  }

  return 0;
};

export const clampDistanceVertical: ClampDistanceFunction = (
  distance,
  { height: cH, pageY: cY },
  { height: sH, pageY: sY },
  ...rest
) => clampDistance(distance, sY - cY, sH, cH, ...rest);

export const clampDistanceHorizontal: ClampDistanceFunction = (
  distance,
  { pageX: cX, width: cW },
  { pageX: sX, width: sW },
  ...rest
) => clampDistance(distance, sX - cX, sW, cW, ...rest);
