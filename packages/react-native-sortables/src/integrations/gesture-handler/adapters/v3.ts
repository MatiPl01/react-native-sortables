// `SingleGesture` only exists in gesture-handler v3; this is a type-only import
// (erased at runtime) used to bridge the public `SortableGesture` back to the v3
// hook gesture type, so it never affects the v2 fallback path.
import type { SingleGesture } from 'react-native-gesture-handler';
import * as GestureHandler from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useMutableValue } from '../../reanimated';
import type { ManualGestureControl, SortableGesture } from '../types';
import type { GestureHandlerAdapter } from './types';

/**
 * gesture-handler v3 (hook API) implementation, used when
 * react-native-gesture-handler >= 3 is installed.
 *
 * This path fixes issue #349: unlike the v2 imperative builder, the v3 hook
 * gestures keep receiving touches after a screen is detached and re-attached
 * (e.g. bottom tabs with `detachInactiveScreens={false}` on iOS + New
 * Architecture), so a drag no longer gets "stuck" or stops activating.
 */

// Resolved lazily at module load; these are `undefined` when an older
// gesture-handler is installed, in which case this adapter is never selected
// (see `../index`). The namespace import keeps bundlers from failing on the
// missing named exports.
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
    // The library activates the gesture from a delayed timeout (the drag
    // activation delay). gesture-handler v3's `_setGestureStateSync` throws when
    // called outside a gesture event, so we cannot activate from the timeout
    // directly. Instead we flag the request and perform the actual activation in
    // the next `onTouchesMove`, which runs inside a gesture event.
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

  return useManualGesture({
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
  }) as unknown as SortableGesture;
};

type ConfigurableGesture = { config?: { enabled?: boolean } };

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) => {
  const configurable = gesture as ConfigurableGesture;
  return {
    ...configurable,
    config: { ...configurable.config, enabled }
  } as unknown as SortableGesture;
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
  // The external (drag) gesture is tracked with the cross-version
  // `SortableGesture` type; cast it back to the v3 gesture type for the
  // simultaneous relation.
  const external = externalGesture as unknown as SingleGesture;

  // Hooks must run unconditionally, so every gesture is always created and the
  // ones without a handler are simply disabled.
  const tap = useTapGesture({
    enabled: !!onTap,
    maxDistance: failDistance,
    onActivate: onTap,
    runOnJS: true,
    simultaneousWith: external
  });

  const doubleTap = useTapGesture({
    enabled: !!onDoubleTap,
    maxDistance: failDistance,
    numberOfTaps: 2,
    onActivate: onDoubleTap,
    runOnJS: true,
    simultaneousWith: external
  });

  const longPress = useLongPressGesture({
    enabled: !!onLongPress,
    maxDistance: failDistance,
    onActivate: onLongPress,
    runOnJS: true,
    simultaneousWith: external
  });

  const manual = useManualGesture({
    enabled: !!(onTouchesDown ?? onTouchesUp),
    onTouchesDown,
    onTouchesUp,
    runOnJS: true,
    simultaneousWith: external
  });

  // Both compositions are created (rules of hooks), but only the one matching
  // the requested mode is returned and attached to a detector - the relations
  // of a composition are applied when it is attached, so the unused one is
  // inert.
  const exclusive = useExclusiveGestures(tap, doubleTap, longPress, manual);
  const simultaneous = useSimultaneousGestures(
    tap,
    doubleTap,
    longPress,
    manual
  );

  return (gestureMode === 'exclusive'
    ? exclusive
    : simultaneous) as unknown as SortableGesture;
};

export const adapter: GestureHandlerAdapter = {
  useDragGesture,
  useEnabledGesture,
  useTouchableGesture
};
