import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';

export type { GestureTouchEvent, TouchData };

// A gesture-handler gesture. Kept loosely typed because the v2 (builder) and v3
// (hook) gesture shapes diverge; each adapter narrows it to the concrete type it
// needs, and `SortableGestureDetector` hands it back to gesture-handler.
export type SortableGesture = object;

// Imperative control over a manual gesture (v2 `manager` / v3 `GestureStateManager`).
export type ManualGestureControl = {
  activate: () => void;
  end: () => void;
  fail: () => void;
};

export type ManualGestureCallbacks = {
  // Not a teardown hook: a handler detached mid-gesture reaches no terminal
  // state and emits nothing.
  onFinalize: () => void;
  onTouchesCancelled: (
    event: GestureTouchEvent,
    control: ManualGestureControl
  ) => void;
  onTouchesDown: (
    event: GestureTouchEvent,
    control: ManualGestureControl
  ) => void;
  onTouchesMove: (
    event: GestureTouchEvent,
    control: ManualGestureControl
  ) => void;
  onTouchesUp: (
    event: GestureTouchEvent,
    control: ManualGestureControl
  ) => void;
};

export type TouchableGestureConfig = {
  externalGesture: SortableGesture;
  failDistance: number;
  gestureMode: 'exclusive' | 'simultaneous';
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  onTouchesDown?: () => void;
  onTouchesUp?: () => void;
};
