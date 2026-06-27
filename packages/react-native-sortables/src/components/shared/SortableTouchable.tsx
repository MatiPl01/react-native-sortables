import { type PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import {
  GestureDetector,
  useTouchableGesture
} from '../../integrations/gesture-handler';
import { useItemContext } from '../../providers';

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
    <GestureDetector gesture={gesture} userSelect='none'>
      <View {...viewProps} collapsable={false}>
        {children}
      </View>
    </GestureDetector>
  );
}
