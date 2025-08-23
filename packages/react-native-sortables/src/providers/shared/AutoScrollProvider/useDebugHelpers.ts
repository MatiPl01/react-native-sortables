import { useCallback } from 'react';
import type { MeasuredDimensions } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';

const DEBUG_COLORS = {
  backgroundColor: '#CE00B5',
  borderColor: '#4E0044'
};

export default function useDebugHelpers(
  isVertical: boolean,
  [startOffset, endOffset]: [number, number]
) {
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects(['start', 'end']);

  const hideDebugViews = useCallback(() => {
    'worklet';
    debugRects?.start.hide();
    debugRects?.end.hide();
  }, [debugRects]);

  const updateDebugRects = useCallback(
    (
      contentContainerMeasurements: MeasuredDimensions,
      scrollContainerMeasurements: MeasuredDimensions
    ) => {
      'worklet';
      const { pageX: cX, pageY: cY } = contentContainerMeasurements;
      const {
        height: sH,
        pageX: sX,
        pageY: sY,
        width: sW
      } = scrollContainerMeasurements;

      const startProps = isVertical
        ? {
            height: startOffset,
            y: sY - cY
          }
        : {
            width: startOffset,
            x: sX - cX
          };

      const endProps = isVertical
        ? {
            height: endOffset,
            positionOrigin: 'bottom' as const,
            y: sY - cY + sH
          }
        : {
            positionOrigin: 'right' as const,
            width: endOffset,
            x: sX - cX + sW
          };

      debugRects?.start.set({ ...DEBUG_COLORS, ...startProps });
      debugRects?.end.set({ ...DEBUG_COLORS, ...endProps });
    },
    [debugRects, isVertical, startOffset, endOffset]
  );

  return debugContext ? { hideDebugViews, updateDebugRects } : {};
}
