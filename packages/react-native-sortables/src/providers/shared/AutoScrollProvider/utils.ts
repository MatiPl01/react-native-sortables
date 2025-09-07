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
  contentSize: number,
  scrollablePos: number,
  scrollableSize: number,
  [startOffset, endOffset]: [number, number],
  [maxStartOverscroll, maxEndOverscroll]: [number, number],
  extrapolation: ExtrapolationType
) => {
  const startBound = scrollablePos - contentPos;
  const startThreshold = startBound + startOffset;
  const endBound = startBound + scrollableSize;
  const endThreshold = endBound - endOffset;

  const startBoundProgress = -interpolate(
    startBound,
    [-maxStartOverscroll, startOffset],
    [0, 1],
    Extrapolation.CLAMP
  );

  const endBoundProgress = interpolate(
    endBound,
    [contentSize - endOffset, contentSize + maxEndOverscroll],
    [1, 0],
    Extrapolation.CLAMP
  );

  console.log(
    endBound,
    contentSize - endOffset,
    contentSize + maxEndOverscroll,
    endBoundProgress
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
) => calculateRawProgress(position, cY, cH, sY, sH, ...rest);

export const calculateRawProgressHorizontal: CalculateRawProgressFunction = (
  position,
  { pageX: cX, width: cW },
  { pageX: sX, width: sW },
  ...rest
) => calculateRawProgress(position, cX, cW, sX, sW, ...rest);

type ClampDistanceFunction = (
  distance: number,
  contentContainerMeasurements: MeasuredDimensions,
  scrollContainerMeasurements: MeasuredDimensions,
  contentBounds: [number, number],
  maxOverscroll: [number, number]
) => number;

const clampDistance = (
  distance: number,
  containerOffset: number,
  scrollableSize: number,
  [startOffset, endOffset]: [number, number],
  [maxStartOverscroll, maxEndOverscroll]: [number, number]
) => {
  if (distance < 0) {
    // Scrolling up
    return Math.min(
      0,
      Math.max(containerOffset + distance, startOffset - maxStartOverscroll) -
        containerOffset
    );
  }

  if (distance > 0) {
    // Scrolling down
    return Math.max(
      0,
      Math.min(
        containerOffset + distance,
        endOffset - scrollableSize + maxEndOverscroll
      ) - containerOffset
    );
  }

  return 0;
};

export const clampDistanceVertical: ClampDistanceFunction = (
  distance,
  { pageY: cY },
  { height: sH, pageY: sY },
  ...rest
) => clampDistance(distance, sY - cY, sH, ...rest);

export const clampDistanceHorizontal: ClampDistanceFunction = (
  distance,
  { pageX: cX },
  { pageX: sX, width: sW },
  ...rest
) => clampDistance(distance, sX - cX, sW, ...rest);
