import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, withTiming } from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../../constants';
import { useAutoScrollContext } from '../AutoScrollProvider';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';

export default function useItemPanGesture(
  key: string,
  pressProgress: SharedValue<number>,
  reverseXAxis = false
) {
  const { reorderStrategy, activatedItemKey } = useCommonValuesContext();
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};

  return useMemo(
    () =>
      Gesture.Manual()
        .manualActivation(true)
        .onTouchesDown((e, manager) => {
          // Ignore touch if another item is already being touched/activated
          if (activatedItemKey.value !== null) {
            manager.fail();
            return;
          }

          handleTouchStart(
            e,
            key,
            reorderStrategy.value,
            pressProgress,
            manager.activate
          );
        })
        .onTouchesCancelled((_, manager) => {
          manager.fail();
        })
        .onTouchesUp((_, manager) => {
          manager.end();
        })
        .onTouchesMove((e, manager) => {
          handleTouchesMove(e, reverseXAxis, manager.fail);
        })
        .onFinalize(() => {
          pressProgress.value = withTiming(0, {
            duration: TIME_TO_ACTIVATE_PAN
          });
          updateStartScrollOffset?.(-1);
          handleDragEnd(key, reorderStrategy.value);
        }),
    [
      key,
      reverseXAxis,
      reorderStrategy,
      pressProgress,
      activatedItemKey,
      handleTouchStart,
      handleTouchesMove,
      handleDragEnd,
      updateStartScrollOffset
    ]
  );
}
