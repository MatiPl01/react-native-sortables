import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, withTiming } from 'react-native-reanimated';

import { TIME_TO_ACTIVATE_PAN } from '../../../constants';
import { useAutoScrollContext } from '../AutoScrollProvider';
import { useCommonValuesContext } from '../CommonValuesProvider';
import { useDragContext } from '../DragProvider';
import { useMeasurementsContext } from '../MeasurementsProvider';

export default function useItemPanGesture(
  key: string,
  pressProgress: SharedValue<number>,
  reverseXAxis = false
) {
  const { containerHeight, reorderStrategy, touchedItemKey } =
    useCommonValuesContext();
  const { tryMeasureContainerHeight, updateTouchedItemDimensions } =
    useMeasurementsContext();
  const { handleDragEnd, handleTouchStart, handleTouchesMove } =
    useDragContext();
  const { updateStartScrollOffset } = useAutoScrollContext() ?? {};

  return useMemo(
    () =>
      Gesture.Manual()
        .manualActivation(true)
        .onTouchesDown((e, manager) => {
          // Ignore touch if another item is already being touched/activated
          if (touchedItemKey.value !== null) {
            manager.fail();
            return;
          }
          // This should never happen, but just in case the container height
          // was not measured withing the specified interval and onLayout
          // was not called, we will try to measure it again after the item
          // is touched
          if (containerHeight.value === -1) {
            tryMeasureContainerHeight();
          }
          handleTouchStart(
            e,
            key,
            reorderStrategy.value,
            pressProgress,
            manager.activate
          );
          updateTouchedItemDimensions(key);
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
      containerHeight,
      touchedItemKey,
      handleTouchStart,
      handleTouchesMove,
      handleDragEnd,
      tryMeasureContainerHeight,
      updateStartScrollOffset,
      updateTouchedItemDimensions
    ]
  );
}
