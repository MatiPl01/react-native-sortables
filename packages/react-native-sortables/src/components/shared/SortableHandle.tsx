import { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { measure, useAnimatedRef } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useCustomHandleContext,
  useItemContext,
  usePortalOutletContext
} from '../../providers';
import { error } from '../../utils';

/** Props for the Sortable Handle component */
export type SortableHandleProps = PropsWithChildren<{
  /** Controls how the item behaves in the sortable component
   * - 'draggable': Item can be dragged and moves with reordering (default)
   * - 'non-draggable': Item cannot be dragged but moves with reordering
   * - 'fixed': Item stays in place and cannot be dragged
   * @default 'draggable'
   */
  mode?: 'draggable' | 'fixed' | 'non-draggable';
}>;

export function SortableHandle(props: SortableHandleProps) {
  // The item is teleported when it is rendered within the PortalOutlet
  // component. Because PortalOutlet creates a context, we can use it to
  // check if the item is teleported
  const isTeleported = !!usePortalOutletContext();

  // In case of teleported handle items, we want to render just the
  // handle component without any functionality
  return isTeleported ? (
    <View>{props.children}</View>
  ) : (
    <SortableHandleComponent {...props} />
  );
}

function SortableHandleComponent({
  children,
  mode = 'draggable'
}: SortableHandleProps) {
  const { activeItemKey, activeItemPosition, containerRef } =
    useCommonValuesContext();
  const { gesture, itemKey } = useItemContext();
  const customHandleContext = useCustomHandleContext();

  if (!customHandleContext) {
    throw error(
      'Please add a `customHandle` property on the Sortable component to use a custom handle component.'
    );
  }

  const {
    activeHandleMeasurements,
    activeHandleOffset,
    makeItemFixed,
    removeFixedItem
  } = customHandleContext;
  const dragEnabled = mode === 'draggable';

  const viewRef = useAnimatedRef<View>();

  useEffect(() => {
    if (mode === 'fixed') {
      makeItemFixed(itemKey);
    }

    return () => removeFixedItem(itemKey);
  }, [mode, itemKey, makeItemFixed, removeFixedItem]);

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

    const { pageX: handlePageX, pageY: handlePageY } = handleMeasurements;
    const { pageX: containerPageX, pageY: containerPageY } =
      containerMeasurements;
    const { x: activeX, y: activeY } = activeItemPosition.value;

    activeHandleMeasurements.value = handleMeasurements;
    activeHandleOffset.value = {
      x: handlePageX - containerPageX - activeX,
      y: handlePageY - containerPageY - activeY
    };
  }, [
    activeItemKey,
    activeItemPosition,
    containerRef,
    itemKey,
    activeHandleMeasurements,
    activeHandleOffset,
    viewRef
  ]);

  const adjustedGesture = useMemo(
    () =>
      Gesture.Simultaneous(
        gesture.enabled(dragEnabled),
        Gesture.Manual().onTouchesDown(measureHandle)
      ),
    [dragEnabled, gesture, measureHandle]
  );

  return (
    <GestureDetector gesture={adjustedGesture} userSelect='none'>
      <View ref={viewRef} onLayout={dragEnabled ? measureHandle : undefined}>
        {children}
      </View>
    </GestureDetector>
  );
}
