import { type PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { useTouchableGesture } from '../../integrations/gesture-handler';
import { useItemContext } from '../../providers';
import SortableGestureDetector from './SortableGestureDetector';

type SortableTouchableProps = PropsWithChildren<
  ViewProps & {
    onTap?: () => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
    onTouchesDown?: () => void;
    onTouchesUp?: () => void;
    failDistance?: number;
    gestureMode?: 'exclusive' | 'simultaneous';
  }
>;

export default function SortableTouchable({
  children,
  failDistance = 10,
  gestureMode = 'exclusive',
  onDoubleTap,
  onLongPress,
  onTap,
  onTouchesDown,
  onTouchesUp,
  ...viewProps
}: SortableTouchableProps) {
  const { gesture: externalGesture } = useItemContext();

  const gesture = useTouchableGesture({
    externalGesture,
    failDistance,
    gestureMode,
    onDoubleTap,
    onLongPress,
    onTap,
    onTouchesDown,
    onTouchesUp
  });

  return (
    <SortableGestureDetector gesture={gesture}>
      <View {...viewProps} collapsable={false}>
        {children}
      </View>
    </SortableGestureDetector>
  );
}
