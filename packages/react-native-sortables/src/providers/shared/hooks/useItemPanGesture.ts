import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

import { useDragContext } from '../DragProvider';
import { View } from 'react-native';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>,
  handleRef?: AnimatedRef<View>
) {
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();

  return useMemo(
    () =>
      Gesture.Manual()
        .manualActivation(true)
        .onTouchesDown((e, manager) => {
          handleTouchStart(
            e,
            key,
            activationAnimationProgress,
            manager.activate,
            manager.fail,
            handleRef
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
      key,
      activationAnimationProgress,
      handleDragEnd,
      handleTouchStart,
      handleTouchesMove,
      handleRef
    ]
  );
}
