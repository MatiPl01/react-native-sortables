import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  activationAnimationProgress: SharedValue<number>
) {
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();

  return useMemo(
    () =>
      Gesture.Manual()
        // .shouldCancelWhenOutside(false)
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
        .onTouchesCancelled((e, manager) => {
          console.log('onTouchesCancelled', key, e.allTouches);
          manager.fail();
        })
        .onTouchesUp((e, manager) => {
          console.log('onTouchesUp', key, e.allTouches);
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
