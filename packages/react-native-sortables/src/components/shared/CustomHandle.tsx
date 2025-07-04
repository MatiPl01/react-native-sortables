import { type PropsWithChildren, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { runOnUI, useAnimatedRef } from 'react-native-reanimated';

import {
  useCustomHandleContext,
  useIsInPortalOutlet,
  useItemContext
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
  mode?: 'draggable' | 'fixed-order' | 'non-draggable';
}>;

export default function CustomHandle(props: CustomHandleProps) {
  // The item is teleported when it is rendered within the PortalOutlet
  // component
  const isTeleported = useIsInPortalOutlet();

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

  const { gesture, isActive, itemKey } = useItemContext();
  const handleRef = useAnimatedRef<View>();

  const { registerHandle, updateActiveHandleMeasurements } =
    customHandleContext;
  const dragEnabled = mode === 'draggable';

  useEffect(() => {
    return registerHandle(itemKey, handleRef, mode === 'fixed-order');
  }, [handleRef, itemKey, registerHandle, mode]);

  const onLayout = useCallback(() => {
    'worklet';
    if (isActive.value) {
      updateActiveHandleMeasurements(itemKey);
    }
  }, [itemKey, isActive, updateActiveHandleMeasurements]);

  return (
    <GestureDetector gesture={gesture.enabled(dragEnabled)} userSelect='none'>
      <View collapsable={false} ref={handleRef} onLayout={runOnUI(onLayout)}>
        {children}
      </View>
    </GestureDetector>
  );
}
