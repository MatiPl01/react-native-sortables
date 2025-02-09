import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  pressProgress: SharedValue<number>
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
            pressProgress,
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
          handleDragEnd(key, pressProgress);
        }),
    [key, pressProgress, handleDragEnd, handleTouchStart, handleTouchesMove]
  );
}
