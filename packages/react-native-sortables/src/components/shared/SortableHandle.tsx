import type { PropsWithChildren } from 'react';
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
  const { activeItemKey, snapItemDimensions } = useCommonValuesContext();
  const { itemKey, pressProgress } = useItemContext();

  const viewRef = useAnimatedRef<View>();
  const gesture = useItemPanGesture(itemKey, pressProgress, viewRef);

  useAnimatedReaction(
    () => activeItemKey.value,
    activeKey => {
      if (activeKey !== itemKey) {
        return;
      }

      const measurements = measure(viewRef);
      if (!measurements) {
        return;
      }

      const { height, width } = measurements;
      snapItemDimensions.value = {
        height,
        width
      };
    }
  );

  return (
    <GestureDetector gesture={gesture.enabled(!disabled)}>
      <View
        ref={viewRef}
        onLayout={({ nativeEvent: { layout } }) => {
          if (activeItemKey.value === itemKey) {
            snapItemDimensions.value = {
              height: layout.height,
              width: layout.width
            };
          }
        }}>
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
