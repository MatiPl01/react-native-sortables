import { useCallback } from 'react';
import type { View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

import { useDragContext } from '../DragProvider';

export default function useItemPanGestureFactory(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();

  return useCallback(
    (handleRef?: AnimatedRef<View>) =>
      Gesture.Manual()
        .onTouchesDown((e, manager) => {
          handleTouchStart(
            e,
            key,
            activationAnimationProgress,
            handleRef,
            manager.activate,
            manager.fail
          );
        })
        .onTouchesMove((e, manager) => {
          handleTouchesMove(e, manager.fail);
        })
        .onTouchesCancelled((_, manager) => {
          manager.fail();
        })
        .onTouchesUp((_, manager) => {
          manager.end();
        })
        .onFinalize(() => {
          handleDragEnd(key, activationAnimationProgress);
        }),
    [
      handleDragEnd,
      handleTouchStart,
      handleTouchesMove,
      key,
      activationAnimationProgress
    ]
  );
}
