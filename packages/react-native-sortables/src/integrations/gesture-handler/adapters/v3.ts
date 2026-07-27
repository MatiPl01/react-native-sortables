import { useMemo } from 'react';
import type {
  GestureTouchEvent,
  ManualGestureConfig
} from 'react-native-gesture-handler';
import * as GestureHandler from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useMutableValue, useStableCallbackValue } from '../../reanimated';
import type { ManualGestureControl } from '../types';
import type { GestureHandlerAdapter } from './types';

// gesture-handler v3 hook API, which fixes issue #349: hook gestures keep
// receiving touches after a screen re-attaches. Hooks are read off a namespace
// import so bundling never fails on these v3-only names under v2; this adapter
// is only selected when they exist (see `../index`).
const {
  GestureStateManager,
  useExclusiveGestures,
  useLongPressGesture,
  useManualGesture,
  useSimultaneousGestures,
  useTapGesture
} = GestureHandler;

function createControl(
  handlerTag: number,
  pendingActivation: SharedValue<boolean>
): ManualGestureControl {
  'worklet';
  return {
    // `GestureStateManager.activate` throws when called outside a gesture event,
    // but the library activates from a delayed timeout - so flag it here and run
    // the real activation in the next in-event `onTouchesMove`.
    activate: () => {
      'worklet';
      pendingActivation.value = true;
    },
    end: () => {
      'worklet';
      GestureStateManager.deactivate(handlerTag);
    },
    fail: () => {
      'worklet';
      pendingActivation.value = false;
      GestureStateManager.fail(handlerTag);
    }
  };
}

// v3 memoizes on the config object identity alone, and re-applying a config
// natively resets it before updating it, which briefly drops `needsPointerData`
// and can swallow a touch event of a drag in progress.
const useDragGesture: GestureHandlerAdapter['useDragGesture'] = (
  callbacks,
  deps
) => {
  const pendingActivation = useMutableValue(false);

  const config = useMemo(
    () => ({
      onFinalize: () => {
        'worklet';
        callbacks.onFinalize();
      },
      onTouchesCancel: (event: GestureTouchEvent) => {
        'worklet';
        callbacks.onTouchesCancelled(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      },
      onTouchesDown: (event: GestureTouchEvent) => {
        'worklet';
        pendingActivation.value = false;
        callbacks.onTouchesDown(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      },
      onTouchesMove: (event: GestureTouchEvent) => {
        'worklet';
        if (pendingActivation.value) {
          pendingActivation.value = false;
          GestureStateManager.activate(event.handlerTag);
        }
        callbacks.onTouchesMove(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      },
      onTouchesUp: (event: GestureTouchEvent) => {
        'worklet';
        callbacks.onTouchesUp(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      }
    }),
    // The dependency list is owned by the caller (useItemPanGesture).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  );

  return useManualGesture(config);
};

// Only the handlers that are passed create a gesture (and a native handler), so
// a touchable with a single callback stays a single gesture. That makes the
// hook order depend on which handlers exist, so a caller MUST keep that set
// (and `gestureMode`) stable across renders, or remount when it changes -
// SortableTouchable enforces this by keying its inner component on the set.
const useTouchableGesture: GestureHandlerAdapter['useTouchableGesture'] = ({
  externalGesture,
  failDistance,
  gestureMode,
  onDoubleTap,
  onLongPress,
  onTap,
  onTouchesDown,
  onTouchesUp
}) => {
  // `simultaneousWith` accepts v3's `AnyGesture` union, which is not exported
  // by name.
  const simultaneousWith =
    externalGesture as unknown as ManualGestureConfig['simultaneousWith'];

  // `useStableCallbackValue` wraps each handler into a worklet - a worklet runs
  // on the UI thread, a JS handler is marshalled to the JS thread - which the
  // reanimated detector requires.
  /* eslint-disable react-hooks/rules-of-hooks */
  const recognizers: Parameters<typeof useExclusiveGestures> = [];

  if (onTap) {
    recognizers.push(
      useTapGesture({
        maxDistance: failDistance,
        onActivate: useStableCallbackValue(onTap),
        shouldCancelWhenOutside: false,
        simultaneousWith
      })
    );
  }
  if (onDoubleTap) {
    recognizers.push(
      useTapGesture({
        maxDistance: failDistance,
        numberOfTaps: 2,
        onActivate: useStableCallbackValue(onDoubleTap),
        shouldCancelWhenOutside: false,
        simultaneousWith
      })
    );
  }
  if (onLongPress) {
    recognizers.push(
      useLongPressGesture({
        maxDistance: failDistance,
        onActivate: useStableCallbackValue(onLongPress),
        shouldCancelWhenOutside: false,
        simultaneousWith
      })
    );
  }

  // Touch callbacks live on their own Manual gesture composed simultaneously
  // (below) with the recognizers, so they keep firing after a recognizer wins.
  // An Exclusive relation cancels the losing siblings, which is what dropped
  // `onTouchesUp` after a long press activated.
  const touchTracker =
    (onTouchesDown ?? onTouchesUp)
      ? useManualGesture({
          onTouchesDown: onTouchesDown
            ? useStableCallbackValue(onTouchesDown)
            : undefined,
          onTouchesUp: onTouchesUp
            ? useStableCallbackValue(onTouchesUp)
            : undefined,
          simultaneousWith
        })
      : null;

  const composedRecognizers =
    gestureMode === 'exclusive'
      ? useExclusiveGestures(...recognizers)
      : useSimultaneousGestures(...recognizers);

  const gesture = !touchTracker
    ? composedRecognizers
    : recognizers.length
      ? useSimultaneousGestures(composedRecognizers, touchTracker)
      : touchTracker;
  /* eslint-enable react-hooks/rules-of-hooks */

  return gesture;
};

export const adapter: GestureHandlerAdapter = {
  useDragGesture,
  useTouchableGesture
};
