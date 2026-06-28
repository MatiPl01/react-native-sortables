import { useMemo } from 'react';
import type { GestureType } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';

import { asSortableGesture } from '../types';
import type { GestureHandlerAdapter } from './types';

/**
 * gesture-handler v2 imperative builder, used when gesture-handler < 3 is
 * installed (e.g. the Old Architecture / Paper). On iOS + New Architecture this
 * path still has the upstream issue #349 limitation, which only the v3 hook API
 * fixes (see `./v3`).
 */

const useDragGesture: GestureHandlerAdapter['useDragGesture'] = (
  callbacks,
  deps
) =>
  asSortableGesture(
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
    )
  );

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) => asSortableGesture((gesture as GestureType).enabled(enabled));

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
      if ('maxDistance' in gesture) {
        (
          gesture as { maxDistance: (distance: number) => GestureType }
        ).maxDistance(failDistance);
      }
      return gesture;
    };

    const gestures: Array<GestureType> = [];

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

    return asSortableGesture(
      gestureMode === 'exclusive'
        ? Gesture.Exclusive(...gestures)
        : Gesture.Simultaneous(...gestures)
    );
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
