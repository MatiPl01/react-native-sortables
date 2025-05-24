import { type PropsWithChildren, useMemo } from 'react';
import { View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureType
} from 'react-native-gesture-handler';

import { useItemContext } from '../../providers';

type SortableTouchableProps = PropsWithChildren<{
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onTouchesDown?: () => void;
  onTouchesUp?: () => void;
  failDistance?: number;
  gestureMode?: 'exclusive' | 'simultaneous';
}>;

export default function SortableTouchable({
  children,
  failDistance = 10,
  onTap,
  onDoubleTap,
  onLongPress,
  onTouchesDown,
  onTouchesUp,
  gestureMode = 'exclusive'
}: SortableTouchableProps) {
  const { gesture: externalGesture } = useItemContext();

  const gesture = useMemo(() => {
    const decorate = <T extends GestureType>(gesture: T): T => {
      gesture.simultaneousWithExternalGesture(externalGesture).runOnJS(true);
      if ('maxDistance' in gesture) {
        (
          gesture as { maxDistance: (distance: number) => GestureType }
        ).maxDistance(failDistance);
      }
      return gesture;
    };

    const gestures = [];

    if (onTap) {
      gestures.push(decorate(Gesture.Tap()).onStart(onTap));
    }

    if (onDoubleTap) {
      gestures.push(
        decorate(Gesture.Tap()).numberOfTaps(2).onStart(onDoubleTap)
      );
    }

    if (onLongPress) {
      gestures.push(decorate(Gesture.LongPress()).onStart(onLongPress));
    }

    if (onTouchesDown || onTouchesUp) {
      // Reuse already added gesture if possible or create a manual gesture
      // if there is no other gesture yet
      if (!gestures.length) {
        gestures.push(decorate(Gesture.Manual()));
      }

      const lastGesture = gestures[gestures.length - 1]!;

      if (onTouchesDown) {
        lastGesture.onTouchesDown(onTouchesDown);
      }
      if (onTouchesUp) {
        lastGesture.onTouchesUp(onTouchesUp);
      }
    }

    return gestureMode === 'exclusive'
      ? Gesture.Exclusive(...gestures)
      : Gesture.Simultaneous(...gestures);
  }, [
    failDistance,
    onTap,
    onDoubleTap,
    onLongPress,
    onTouchesDown,
    onTouchesUp,
    externalGesture,
    gestureMode
  ]);

  return (
    <GestureDetector gesture={gesture} userSelect='none'>
      <View collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
