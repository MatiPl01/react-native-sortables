import { type PropsWithChildren } from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import type { RequiredBy } from '../../helperTypes';
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
  // No callbacks means no gestures at all - render just the view and skip the
  // gesture detector entirely.
  if (!(onTap ?? onDoubleTap ?? onLongPress ?? onTouchesDown ?? onTouchesUp)) {
    return (
      <View {...viewProps} collapsable={false}>
        {children}
      </View>
    );
  }

  // The inner component creates a gesture only for the handlers that exist, so
  // its hook order depends on which handlers are set. Remount when that set (or
  // the mode) changes so the hook order stays stable within a mount.
  const gesturesKey = `${gestureMode}:${+!!onTap}${+!!onDoubleTap}${+!!onLongPress}${+!!onTouchesDown}${+!!onTouchesUp}`;

  return (
    <TouchableGesture
      failDistance={failDistance}
      gestureMode={gestureMode}
      key={gesturesKey}
      onDoubleTap={onDoubleTap}
      onLongPress={onLongPress}
      onTap={onTap}
      onTouchesDown={onTouchesDown}
      onTouchesUp={onTouchesUp}
      {...viewProps}>
      {children}
    </TouchableGesture>
  );
}

// Same props as the public component, but the inner component receives
// `failDistance`/`gestureMode` already resolved to defaults.
type TouchableGestureProps = RequiredBy<
  SortableTouchableProps,
  'failDistance' | 'gestureMode'
>;

function TouchableGesture({
  children,
  failDistance,
  gestureMode,
  onDoubleTap,
  onLongPress,
  onTap,
  onTouchesDown,
  onTouchesUp,
  ...viewProps
}: TouchableGestureProps) {
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
