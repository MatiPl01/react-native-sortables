import { useMemo } from 'react';
import type { GestureType } from 'react-native-gesture-handler';
import { Gesture } from 'react-native-gesture-handler';

import type { SortableGesture } from '../types';
import type { GestureHandlerAdapter } from './types';

/**
 * gesture-handler v2 (imperative builder) implementation. This is the legacy
 * path used when react-native-gesture-handler < 3 is installed (e.g. on the Old
 * Architecture / Paper, which gesture-handler v3 no longer supports).
 *
 * NOTE: on iOS + New Architecture this path is affected by the upstream
 * gesture-handler limitation described in issue #349 (gestures stop being
 * recognized after a screen is detached and re-attached, e.g. bottom tabs with
 * `detachInactiveScreens={false}`). The limitation is not fixable here and is
 * resolved only by the v3 hook API - see `./v3`.
 */

const useDragGesture: GestureHandlerAdapter['useDragGesture'] = (
  callbacks,
  deps
) =>
  useMemo(
    () =>
      Gesture.Manual()
        .onTouchesDown((event, manager) =>
          callbacks.onTouchesDown(event, manager)
        )
        .onTouchesMove((event, manager) =>
          callbacks.onTouchesMove(event, manager)
        )
        .onTouchesCancelled((event, manager) =>
          callbacks.onTouchesCancelled(event, manager)
        )
        .onTouchesUp((event, manager) => callbacks.onTouchesUp(event, manager)),
    // The caller (useItemPanGesture) controls the dependency list; `callbacks`
    // is rebuilt whenever any of these change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  ) as unknown as SortableGesture;

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) =>
  (gesture as unknown as GestureType).enabled(
    enabled
  ) as unknown as SortableGesture;

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
    const decorate = <T extends GestureType>(decoratedGesture: T): T => {
      decoratedGesture
        .simultaneousWithExternalGesture(
          externalGesture as unknown as GestureType
        )
        .runOnJS(true);
      if ('maxDistance' in decoratedGesture) {
        (
          decoratedGesture as { maxDistance: (distance: number) => GestureType }
        ).maxDistance(failDistance);
      }
      return decoratedGesture;
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
      // Reuse the already added gesture if possible or create a manual gesture
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

    return (gestureMode === 'exclusive'
      ? Gesture.Exclusive(...gestures)
      : Gesture.Simultaneous(...gestures)) as unknown as SortableGesture;
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
