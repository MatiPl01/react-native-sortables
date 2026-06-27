import type { SingleGesture } from 'react-native-gesture-handler';
import * as GestureHandler from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useMutableValue } from '../../reanimated';
import type { ManualGestureControl } from '../types';
import { asSortableGesture } from '../types';
import type { GestureHandlerAdapter } from './types';

/**
 * gesture-handler v3 hook API, used when gesture-handler >= 3 is installed. This
 * is what fixes issue #349: v3 hook gestures keep receiving touches after a
 * screen is detached and re-attached, so a drag no longer gets stuck.
 *
 * The hooks are resolved through a namespace import so bundlers don't fail on
 * these (v3-only) names when an older gesture-handler is installed - this
 * adapter is only ever selected when they exist (see `../index`).
 */
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

const useDragGesture: GestureHandlerAdapter['useDragGesture'] = callbacks => {
  const pendingActivation = useMutableValue(false);

  return asSortableGesture(
    useManualGesture({
      onTouchesCancel: event => {
        'worklet';
        callbacks.onTouchesCancelled(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      },
      onTouchesDown: event => {
        'worklet';
        pendingActivation.value = false;
        callbacks.onTouchesDown(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      },
      onTouchesMove: event => {
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
      onTouchesUp: event => {
        'worklet';
        callbacks.onTouchesUp(
          event,
          createControl(event.handlerTag, pendingActivation)
        );
      }
    })
  );
};

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) => {
  const current = gesture as { config?: object };
  return asSortableGesture({
    ...current,
    config: { ...current.config, enabled }
  });
};

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
  const simultaneousWith = externalGesture as object as SingleGesture;

  // Hooks run unconditionally, so every gesture is always created; the ones
  // without a handler stay disabled.
  const tap = useTapGesture({
    enabled: !!onTap,
    maxDistance: failDistance,
    onActivate: onTap,
    runOnJS: true,
    simultaneousWith
  });
  const doubleTap = useTapGesture({
    enabled: !!onDoubleTap,
    maxDistance: failDistance,
    numberOfTaps: 2,
    onActivate: onDoubleTap,
    runOnJS: true,
    simultaneousWith
  });
  const longPress = useLongPressGesture({
    enabled: !!onLongPress,
    maxDistance: failDistance,
    onActivate: onLongPress,
    runOnJS: true,
    simultaneousWith
  });
  const manual = useManualGesture({
    enabled: !!(onTouchesDown ?? onTouchesUp),
    onTouchesDown,
    onTouchesUp,
    runOnJS: true,
    simultaneousWith
  });

  const exclusive = useExclusiveGestures(tap, doubleTap, longPress, manual);
  const simultaneous = useSimultaneousGestures(
    tap,
    doubleTap,
    longPress,
    manual
  );

  return asSortableGesture(
    gestureMode === 'exclusive' ? exclusive : simultaneous
  );
};

export const adapter: GestureHandlerAdapter = {
  useDragGesture,
  useEnabledGesture,
  useTouchableGesture
};
