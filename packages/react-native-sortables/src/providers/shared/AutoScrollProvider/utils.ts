'worklet';
import type { MeasuredDimensions } from 'react-native-reanimated';

import type { DebugLineUpdater, DebugRectUpdater } from '../../../types';

const DEBUG_COLORS = {
  backgroundColor: '#CE00B5',
  borderColor: '#4E0044'
};

export const handleMeasurementsVertical = (
  threshold: [number, number],
  maxOverScrollOffset: [number, number] | null,
  touchOffset: number,
  scrollableMeasurements: MeasuredDimensions,
  containerMeasurements: MeasuredDimensions,
  debugRects: Record<'end' | 'start', DebugRectUpdater> | undefined,
  debugLine: DebugLineUpdater | undefined
) => {
  const { height: sH, pageY: sY } = scrollableMeasurements;
  const { height: cH, pageY: cY } = containerMeasurements;
  maxOverScrollOffset ??= threshold;

  const startDistance = sY + maxOverScrollOffset[0] - cY;
  const endDistance = cY + cH - (sY + sH - maxOverScrollOffset[1]);

  const startOverflow = sY + threshold[0] - (cY + touchOffset);
  const endOverflow = cY + touchOffset - (sY + sH - threshold[1]);

  if (debugRects) {
    debugRects.start.set({
      ...DEBUG_COLORS,
      height: threshold[0],
      y: sY - cY
    });
    debugRects.end.set({
      ...DEBUG_COLORS,
      height: threshold[1],
      positionOrigin: 'bottom',
      y: sY - cY + sH
    });
  }
  if (debugLine) {
    debugLine.set({
      color: DEBUG_COLORS.backgroundColor,
      y: touchOffset
    });
  }

  return {
    containerPosition: cY,
    endDistance,
    endOverflow,
    startDistance,
    startOverflow
  };
};

export const handleMeasurementsHorizontal = (
  threshold: [number, number],
  maxOverScrollOffset: [number, number] | null,
  touchOffset: number,
  scrollableMeasurements: MeasuredDimensions,
  containerMeasurements: MeasuredDimensions,
  debugRects: Record<'end' | 'start', DebugRectUpdater> | undefined,
  debugLine: DebugLineUpdater | undefined
) => {
  const { pageX: sX, width: sW } = scrollableMeasurements;
  const { pageX: cX, width: cW } = containerMeasurements;
  maxOverScrollOffset ??= threshold;

  const startDistance = sX + maxOverScrollOffset[0] - cX;
  const endDistance = cX + cW - (sX + sW - maxOverScrollOffset[1]);

  const startOverflow = sX + threshold[0] - (cX + touchOffset);
  const endOverflow = cX + touchOffset - (sX + sW - threshold[1]);

  if (debugRects) {
    debugRects.start.set({
      ...DEBUG_COLORS,
      width: threshold[0],
      x: sX - cX
    });
    debugRects.end.set({
      ...DEBUG_COLORS,
      positionOrigin: 'right',
      width: threshold[1],
      x: sX - cX + sW
    });
  }
  if (debugLine) {
    debugLine.set({
      color: DEBUG_COLORS.backgroundColor,
      x: touchOffset
    });
  }

  return {
    containerPosition: cX,
    endDistance,
    endOverflow,
    startDistance,
    startOverflow
  };
};
