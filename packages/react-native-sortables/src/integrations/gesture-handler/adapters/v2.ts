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
    const recognizers: Array<GestureType> = [];

    if (onTap) {
      recognizers.push(
        decorate(Gesture.Tap().maxDistance(failDistance)).onStart(onTap)
      );
    }
    if (onDoubleTap) {
      recognizers.push(
        decorate(
          Gesture.Tap().numberOfTaps(2).maxDistance(failDistance)
        ).onStart(onDoubleTap)
      );
    }
    if (onLongPress) {
      recognizers.push(
        decorate(Gesture.LongPress().maxDistance(failDistance)).onStart(
          onLongPress
        )
      );
    }

    let touchTracker: GestureType | null = null;
    if (onTouchesDown || onTouchesUp) {
      touchTracker = decorate(Gesture.Manual());
      if (onTouchesDown) {
        touchTracker.onTouchesDown(onTouchesDown);
      }
      if (onTouchesUp) {
        touchTracker.onTouchesUp(onTouchesUp);
      }
    }

    const recognizerGroup = recognizers.length
      ? gestureMode === 'exclusive'
        ? Gesture.Exclusive(...recognizers)
        : Gesture.Simultaneous(...recognizers)
      : null;

    if (recognizerGroup && touchTracker) {
      return Gesture.Simultaneous(recognizerGroup, touchTracker);
    }
    // SortableTouchable renders a plain View when no callback is set, so exactly
    // one of these is non-null by the time we get here.
    return recognizerGroup ?? touchTracker ?? Gesture.Manual();
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
