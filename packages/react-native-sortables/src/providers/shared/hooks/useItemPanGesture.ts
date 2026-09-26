import { useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { ManualGestureCallbacks } from '../../../integrations/gesture-handler';
import { useDragGesture } from '../../../integrations/gesture-handler';
import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { handleDragEnd, handleTouchesMove, handleTouchStart } =
    useDragContext();

  const deps = [
    handleDragEnd,
    handleTouchStart,
    handleTouchesMove,
    key,
    activationAnimationProgress
  ];

  const callbacks = useMemo<ManualGestureCallbacks>(
    () => ({
      // A touch that ends before the item activates never reaches onFinalize,
      // so the touch callbacks below repeat this cleanup.
      onFinalize: () => {
        'worklet';
        handleDragEnd(key, activationAnimationProgress);
      },
      onTouchesCancelled: (_event, control) => {
        'worklet';
        handleDragEnd(key, activationAnimationProgress);
        control.fail();
      },
      onTouchesDown: (event, control) => {
        'worklet';
        handleTouchStart(
          event,
          key,
          activationAnimationProgress,
          control.activate,
          control.fail
        );
      },
      onTouchesMove: (event, control) => {
        'worklet';
        handleTouchesMove(event, control.fail);
      },
      onTouchesUp: (_event, control) => {
        'worklet';
        handleDragEnd(key, activationAnimationProgress);
        control.end();
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  return useDragGesture(callbacks, deps);
}
