import { useCallback } from 'react';
import type { MeasuredDimensions, SharedValue } from 'react-native-reanimated';

import { useDebugContext } from '../../../debug';

const TRIGGER_COLORS = {
  backgroundColor: '#CE00B5',
  borderColor: '#4E0044'
};

const OVERSCROLL_COLORS = {
  backgroundColor: '#0078CE',
  borderColor: '#004466'
};

export default function useDebugHelpers(
  isVertical: boolean,
  [startOffset, endOffset]: [number, number],
  contentBounds: SharedValue<[number, number] | null>,
  [maxStartOverscroll, maxEndOverscroll]: [number, number]
) {
  const debugContext = useDebugContext();

  const debugRects = debugContext?.useDebugRects([
    'startOverscroll',
    'endOverscroll',
    'start',
    'end'
  ]);

  const hideDebugViews = useCallback(() => {
    'worklet';
    debugRects?.startOverscroll.hide();
    debugRects?.endOverscroll.hide();
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

      const startTriggerProps = isVertical
        ? {
            height: startOffset,
            y: sY - cY
          }
        : {
            width: startOffset,
            x: sX - cX
          };

      const endTriggerProps = isVertical
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

      debugRects?.start.set({ ...TRIGGER_COLORS, ...startTriggerProps });
      debugRects?.end.set({ ...TRIGGER_COLORS, ...endTriggerProps });

      if (!contentBounds.value) {
        return;
      }

      const [startBound, endBound] = contentBounds.value;
      const startOverscrollProps = isVertical
        ? {
            height: maxStartOverscroll,
            positionOrigin: 'bottom' as const,
            y: startBound
          }
        : {
            positionOrigin: 'right' as const,
            width: maxStartOverscroll,
            x: startBound
          };

      const endOverscrollProps = isVertical
        ? {
            height: maxEndOverscroll,
            y: endBound
          }
        : {
            width: maxEndOverscroll,
            x: endBound
          };

      debugRects?.startOverscroll.set({
        ...OVERSCROLL_COLORS,
        ...startOverscrollProps
      });
      debugRects?.endOverscroll.set({
        ...OVERSCROLL_COLORS,
        ...endOverscrollProps
      });
    },
    [
      debugRects,
      isVertical,
      startOffset,
      endOffset,
      contentBounds,
      maxStartOverscroll,
      maxEndOverscroll
    ]
  );

  return debugContext ? { hideDebugViews, updateDebugRects } : {};
}
