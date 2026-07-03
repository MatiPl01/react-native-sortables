import { useMemo } from 'react';
import type { GestureType } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';

import type { SortableGesture } from '../types';
import { asSortableGesture } from '../types';
import type { GestureHandlerAdapter } from './types';

/**
 * gesture-handler v2 imperative builder, used when gesture-handler < 3 is
 * installed (e.g. the Old Architecture / Paper). On iOS + New Architecture this
 * path still has the upstream issue #349 limitation, which only the v3 hook API
 * fixes (see `./v3`).
 */

// A SortableGesture reaching the v2 adapter was built by this adapter, so it is
// always a v2 builder gesture; unwrap it to call the imperative builder API.
const asV2Gesture = (gesture: SortableGesture): GestureType =>
  gesture as unknown as GestureType;

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
) => asSortableGesture(asV2Gesture(gesture).enabled(enabled));

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
        .simultaneousWithExternalGesture(asV2Gesture(externalGesture))
        .runOnJS(true);
      return gesture;
    };

    // `maxDistance` is applied on the concrete Tap/LongPress builders (which
    // declare it) rather than inside `decorate`, whose generic `GestureType`
    // does not expose it and would need a cast. `Manual` has no `maxDistance`.
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
