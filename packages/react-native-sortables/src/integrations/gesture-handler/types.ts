import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';

export type { GestureTouchEvent, TouchData };

declare const sortableGesture: unique symbol;

// Opaque handle to a gesture-handler gesture. The v2 and v3 gesture types
// diverge, so adapters wrap/unwrap it at the boundary rather than name one.
export type SortableGesture = { readonly [sortableGesture]: true };

export const asSortableGesture = (gesture: object): SortableGesture =>
  gesture as SortableGesture;

// Imperative control over a manual gesture (v2 `manager` / v3 `GestureStateManager`).
export type ManualGestureControl = {
  activate: () => void;
  end: () => void;
  fail: () => void;
};

export type ManualGestureCallbacks = {
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
