import { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import {
  measure,
  useAnimatedReaction,
  useAnimatedRef
} from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useCustomHandleContext,
  useItemContext,
  useItemPanGesture,
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
  const { activationAnimationProgress, itemKey } = useItemContext();
  const customHandleContext = useCustomHandleContext();

  if (!customHandleContext) {
    throw error(
      'Please add a `customHandle` property on the Sortable component to use a custom handle component.'
    );
  }

  const {
    activeHandleDimensions,
    activeHandleOffset,
    fixedItemKeys,
    makeItemFixed,
    removeFixedItem
  } = customHandleContext;
  const dragEnabled = mode === 'draggable';

  const viewRef = useAnimatedRef<View>();
  const gesture = useItemPanGesture(
    itemKey,
    activationAnimationProgress,
    viewRef
  );

  useEffect(() => {
    console.log('handle', itemKey);
    if (mode === 'fixed') {
      makeItemFixed(itemKey);
    }

    return () => removeFixedItem(itemKey);
  }, [mode, itemKey, fixedItemKeys, makeItemFixed, removeFixedItem]);

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

    activeHandleDimensions.value = { height, width };
    activeHandleOffset.value = {
      x: pageX - containerPageX - activeX,
      y: pageY - containerPageY - activeY
    };
  }, [
    activeItemKey,
    activeItemPosition,
    containerRef,
    itemKey,
    activeHandleDimensions,
    activeHandleOffset,
    viewRef
  ]);

  // Measure the handle when the active item key changes
  useAnimatedReaction(() => activeItemKey.value, measureHandle);

  const adjustedGesture = useMemo(
    () => gesture.enabled(dragEnabled),
    [dragEnabled, gesture]
  );

  return (
    <GestureDetector gesture={adjustedGesture} userSelect='none'>
      <View ref={viewRef} onLayout={dragEnabled ? measureHandle : undefined}>
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
  const { activationAnimationProgress, itemKey } = useItemContext();

  const gesture = useItemPanGesture(itemKey, activationAnimationProgress);

  return (
    <GestureDetector gesture={gesture} userSelect='none'>
      {children}
    </GestureDetector>
  );
}
