/* eslint-disable import/no-unused-modules */
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import {
  useCommonValuesContext,
  useItemContext,
  useItemPanGesture
} from '../../providers';
import type { Dimensions } from '../../types';

export type SortableHandleProps = PropsWithChildren<{
  disabled?: boolean;
}>;

export function SortableHandle({
  children,
  disabled = false
}: SortableHandleProps) {
  const { itemKey, pressProgress } = useItemContext();
  const { touchedHandleDimensions, touchedItemKey } = useCommonValuesContext();

  const dimensions = useSharedValue<Dimensions | null>(null);

  const gesture = useItemPanGesture(itemKey, pressProgress);

  useAnimatedReaction(
    () => touchedItemKey.value,
    key => {
      if (key === itemKey) {
        touchedHandleDimensions.value = dimensions.value;
      }
    }
  );

  return (
    <GestureDetector gesture={gesture.enabled(!disabled)}>
      <View
        onLayout={({ nativeEvent: { layout } }) => {
          dimensions.value = {
            height: layout.height,
            width: layout.width
          };
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
