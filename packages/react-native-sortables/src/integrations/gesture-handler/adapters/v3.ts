import type {
  ManualGesture,
  ManualGestureConfig
} from 'react-native-gesture-handler';
import * as GestureHandler from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

import { useMutableValue } from '../../reanimated';
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

// v3 hooks re-apply config every render, so the caller's `deps` are unused.
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
  });
};

const useEnabledGesture: GestureHandlerAdapter['useEnabledGesture'] = (
  gesture,
  enabled
) => {
  // v3 gestures are immutable; return a copy with config.enabled toggled.
  const current = gesture as ManualGesture;
  const next = { ...current, config: { ...current.config } };
  next.config.enabled = enabled;
  return next;
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
  // Related to every touchable gesture; `simultaneousWith` accepts v3's
  // `AnyGesture` union, which is not exported by name.
  const simultaneousWith =
    externalGesture as unknown as ManualGestureConfig['simultaneousWith'];

  // Touchable callbacks are plain JS functions, not worklets. In v3 that
  // requires `disableReanimated` (not `runOnJS`): the reanimated detector runs
  // `useHandler`, which rejects non-worklet handlers, so the reanimated path
  // has to be turned off entirely - the same config gesture-handler's own
  // Touchable/Pressable use for their JS handlers.
  // Hooks run unconditionally; gestures without a handler stay disabled.
  const tap = useTapGesture({
    disableReanimated: true,
    enabled: !!onTap,
    maxDistance: failDistance,
    onActivate: onTap,
    simultaneousWith
  });
  const doubleTap = useTapGesture({
    disableReanimated: true,
    enabled: !!onDoubleTap,
    maxDistance: failDistance,
    numberOfTaps: 2,
    onActivate: onDoubleTap,
    simultaneousWith
  });
  const longPress = useLongPressGesture({
    disableReanimated: true,
    enabled: !!onLongPress,
    maxDistance: failDistance,
    onActivate: onLongPress,
    simultaneousWith
  });
  const manual = useManualGesture({
    disableReanimated: true,
    enabled: !!(onTouchesDown ?? onTouchesUp),
    onTouchesDown,
    onTouchesUp,
    simultaneousWith
  });

  const exclusive = useExclusiveGestures(tap, doubleTap, longPress, manual);
  const simultaneous = useSimultaneousGestures(
    tap,
    doubleTap,
    longPress,
    manual
  );

  return gestureMode === 'exclusive' ? exclusive : simultaneous;
};

export const adapter: GestureHandlerAdapter = {
  useDragGesture,
  useEnabledGesture,
  useTouchableGesture
};
