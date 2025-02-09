import { type PropsWithChildren, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  measure,
  useAnimatedReaction,
  useAnimatedRef
} from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useItemContext,
  useItemPanGesture
} from '../../providers';

export type SortableHandleProps = PropsWithChildren<{
  disabled?: boolean;
}>;

export function SortableHandle({
  children,
  disabled = false
}: SortableHandleProps) {
  const {
    activeItemKey,
    activeItemPosition,
    containerRef,
    snapItemDimensions,
    snapItemOffset
  } = useCommonValuesContext();
  const { itemKey, pressProgress } = useItemContext();

  const viewRef = useAnimatedRef<View>();
  const gesture = useItemPanGesture(itemKey, pressProgress);

  const measureHandle = useCallback(() => {
    'worklet';
    if (activeItemKey.value !== itemKey) {
      return;
    }

    const handleMeasurements = measure(viewRef);
    const containerMeasurements = measure(containerRef);

    if (
      !handleMeasurements ||
      !containerMeasurements ||
      !activeItemPosition.value
    ) {
      return;
    }

    const { height, pageX, pageY, width } = handleMeasurements;
    const { pageX: containerPageX, pageY: containerPageY } =
      containerMeasurements;
    const { x: activeX, y: activeY } = activeItemPosition.value;

    snapItemDimensions.value = { height, width };
    snapItemOffset.value = {
      x: pageX - containerPageX - activeX,
      y: pageY - containerPageY - activeY
    };
  }, [
    activeItemKey,
    activeItemPosition,
    containerRef,
    itemKey,
    snapItemDimensions,
    snapItemOffset,
    viewRef
  ]);

  // Measure the handle when the active item key changes
  useAnimatedReaction(() => activeItemKey.value, measureHandle);

  const adjustedGesture = useMemo(
    () => gesture.enabled(!disabled),
    [disabled, gesture]
  );

  return (
    <GestureDetector gesture={adjustedGesture}>
      <View ref={viewRef} onLayout={measureHandle}>
        {children}
      </View>
    </GestureDetector>
  );
}

export function SortableHandleInternal({
  children
}: {
  children: React.ReactNode;
}) {
  const { itemKey, pressProgress } = useItemContext();

  const gesture = useItemPanGesture(itemKey, pressProgress);

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
