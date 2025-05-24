import { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { measure, useAnimatedRef } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useCustomHandleContext,
  useDragContext,
  useItemContext,
  usePortalOutletContext
} from '../../providers';
import { error } from '../../utils';

/** Props for the Sortable Handle component */
export type CustomHandleProps = PropsWithChildren<{
  /** Controls how the item behaves in the sortable component
   * - 'draggable': Item can be dragged and moves with reordering (default)
   * - 'non-draggable': Item cannot be dragged but moves with reordering
   * - 'fixed': Item stays in place and cannot be dragged
   * @default 'draggable'
   */
  mode?: 'draggable' | 'fixed' | 'non-draggable';
}>;

export default function CustomHandle(props: CustomHandleProps) {
  // The item is teleported when it is rendered within the PortalOutlet
  // component. Because PortalOutlet creates a context, we can use it to
  // check if the item is teleported
  const isTeleported = !!usePortalOutletContext();

  // In case of teleported handle items, we want to render just the
  // handle component without any functionality
  return isTeleported ? (
    <View>{props.children}</View>
  ) : (
    <CustomHandleComponent {...props} />
  );
}

function CustomHandleComponent({
  children,
  mode = 'draggable'
}: CustomHandleProps) {
  const customHandleContext = useCustomHandleContext();
  if (!customHandleContext) {
    throw error(
      'Please add a `customHandle` property on the Sortable component to use a custom handle component.'
    );
  }

  const { activeItemKey, containerRef, itemPositions } =
    useCommonValuesContext();
  const { setDragStartValues } = useDragContext();
  const { gesture, itemKey } = useItemContext();
  const viewRef = useAnimatedRef<View>();

  const {
    activeHandleMeasurements,
    activeHandleOffset,
    makeItemFixed,
    removeFixedItem
  } = customHandleContext;
  const dragEnabled = mode === 'draggable';

  useEffect(() => {
    if (mode === 'fixed') {
      makeItemFixed(itemKey);
    }

    return () => removeFixedItem(itemKey);
  }, [mode, itemKey, makeItemFixed, removeFixedItem]);

  const measureHandle = useCallback(
    (mustBeActive: boolean) => {
      'worklet';
      if (mustBeActive && activeItemKey.value !== itemKey) {
        return;
      }

      const handleMeasurements = measure(viewRef);
      const containerMeasurements = measure(containerRef);
      const itemPosition = itemPositions.value[itemKey];

      if (!handleMeasurements || !containerMeasurements || !itemPosition) {
        return;
      }

      const { pageX, pageY } = handleMeasurements;
      const { pageX: containerPageX, pageY: containerPageY } =
        containerMeasurements;
      const { x: activeX, y: activeY } = itemPosition;

      activeHandleMeasurements.value = handleMeasurements;
      activeHandleOffset.value = {
        x: pageX - containerPageX - activeX,
        y: pageY - containerPageY - activeY
      };

      setDragStartValues(itemKey);
    },
    [
      activeHandleOffset,
      activeHandleMeasurements,
      activeItemKey,
      containerRef,
      itemPositions,
      itemKey,
      setDragStartValues,
      viewRef
    ]
  );

  const gestureWithMeasure = useMemo(
    () =>
      gesture.onBegin(() => {
        'worklet';
        measureHandle(false);
      }),
    [gesture, measureHandle]
  );

  return (
    <GestureDetector
      gesture={gestureWithMeasure.enabled(dragEnabled)}
      userSelect='none'>
      <View
        collapsable={false}
        ref={viewRef}
        onLayout={dragEnabled ? () => measureHandle(true) : undefined}>
        {children}
      </View>
    </GestureDetector>
  );
}
