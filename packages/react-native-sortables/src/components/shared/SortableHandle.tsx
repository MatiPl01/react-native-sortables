import { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import type { GestureType } from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedRef } from 'react-native-reanimated';

import {
  useCustomHandleContext,
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

export function CustomHandle(props: CustomHandleProps) {
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

  const { createItemPanGesture, itemKey } = useItemContext();
  const handleRef = useAnimatedRef<View>();
  const gesture = useMemo(
    () => createItemPanGesture(handleRef),
    [createItemPanGesture, handleRef]
  );

  const { makeItemFixed, removeFixedItem, updateActiveHandleMeasurements } =
    customHandleContext;
  const dragEnabled = mode === 'draggable';

  useEffect(() => {
    if (mode === 'fixed') {
      makeItemFixed(itemKey);
    }

    return () => removeFixedItem(itemKey);
  }, [mode, itemKey, makeItemFixed, removeFixedItem]);

  const onLayout = useCallback(
    () => updateActiveHandleMeasurements(itemKey, handleRef),
    [itemKey, handleRef, updateActiveHandleMeasurements]
  );

  return (
    <GestureDetector gesture={gesture.enabled(dragEnabled)} userSelect='none'>
      <View collapsable={false} ref={handleRef} onLayout={onLayout}>
        {children}
      </View>
    </GestureDetector>
  );
}

type InternalHandleProps = PropsWithChildren<{
  createItemPanGesture: () => GestureType;
}>;

export function InternalHandle({
  children,
  createItemPanGesture
}: InternalHandleProps) {
  const gesture = useMemo(() => createItemPanGesture(), [createItemPanGesture]);

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
