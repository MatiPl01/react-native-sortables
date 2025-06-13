import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { handleDragEnd, handleTouchesMove, handleTouchStart } =
    useDragContext();

  return useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((e, manager) => {
          handleTouchStart(
            e,
            key,
            activationAnimationProgress,
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
