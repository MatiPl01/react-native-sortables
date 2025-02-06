import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue } from 'react-native-reanimated';

import { useAutoScrollContext } from '../AutoScrollProvider';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  pressProgress: SharedValue<number>
) {
  const { activeItemKey, sortEnabled } = useCommonValuesContext();
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};

  return useMemo(
    () =>
      Gesture.Manual()
        .manualActivation(true)
        .onTouchesDown((e, manager) => {
          // Ignore touch if another item is already being touched/activated
          // if the current item is still animated to the drag end position
          // or sorting is disabled at all
          if (
            activeItemKey.value !== null ||
            pressProgress.value > 0 ||
            !sortEnabled.value
          ) {
            manager.fail();
            return;
          }
          handleTouchStart(e, key, pressProgress, manager.activate);
        })
        .onTouchesCancelled((_, manager) => {
          manager.fail();
        })
        .onTouchesUp((_, manager) => {
          manager.end();
        })
        .onTouchesMove((e, manager) => {
          handleTouchesMove(e, manager.fail);
        })
        .onFinalize(() => {
          updateStartScrollOffset?.(-1);
          handleDragEnd(key, pressProgress);
        }),
    [
      key,
      pressProgress,
      activeItemKey,
      handleTouchStart,
      handleTouchesMove,
      handleDragEnd,
      updateStartScrollOffset,
      sortEnabled
    ]
  );
}
