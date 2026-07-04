import { useMemo } from 'react';
import type { GestureType } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';

import type { GestureHandlerAdapter } from './types';

// gesture-handler v2 imperative builder, used when v2 is installed (Old
// Architecture). The v3 hook API (`./v3`) is what fixes issue #349.

const useDragGesture: GestureHandlerAdapter['useDragGesture'] = (
  callbacks,
  deps
) =>
  useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown(callbacks.onTouchesDown)
        .onTouchesMove(callbacks.onTouchesMove)
        .onTouchesCancelled(callbacks.onTouchesCancelled)
        .onTouchesUp(callbacks.onTouchesUp),
    // The dependency list is owned by the caller (useItemPanGesture).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) => (gesture as GestureType).enabled(enabled);

const useTouchableGesture: GestureHandlerAdapter['useTouchableGesture'] = ({
  externalGesture,
  failDistance,
  gestureMode,
  onDoubleTap,
  onLongPress,
  onTap,
  onTouchesDown,
  onTouchesUp
}) =>
  useMemo(() => {
    const decorate = <T extends GestureType>(gesture: T): T => {
      gesture
        .simultaneousWithExternalGesture(externalGesture as GestureType)
        .runOnJS(true);
      return gesture;
    };

    // maxDistance only exists on the Tap/LongPress builders, so set it there.
    const gestures: Array<GestureType> = [];

    if (onTap) {
      gestures.push(
        decorate(Gesture.Tap().maxDistance(failDistance)).onStart(onTap)
      );
    }
    if (onDoubleTap) {
      gestures.push(
        decorate(
          Gesture.Tap().numberOfTaps(2).maxDistance(failDistance)
        ).onStart(onDoubleTap)
      );
    }
    if (onLongPress) {
      gestures.push(
        decorate(Gesture.LongPress().maxDistance(failDistance)).onStart(
          onLongPress
        )
      );
    }

    if (onTouchesDown || onTouchesUp) {
      const target = gestures.at(-1) ?? decorate(Gesture.Manual());
      if (!gestures.length) {
        gestures.push(target);
      }
      if (onTouchesDown) {
        target.onTouchesDown(onTouchesDown);
      }
      if (onTouchesUp) {
        target.onTouchesUp(onTouchesUp);
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

export const adapter: GestureHandlerAdapter = {
  useDragGesture,
  useEnabledGesture,
  useTouchableGesture
};
