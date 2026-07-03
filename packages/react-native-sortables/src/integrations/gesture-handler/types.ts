import type {
  GestureTouchEvent,
  TouchData
} from 'react-native-gesture-handler';

export type { GestureTouchEvent, TouchData };

declare const sortableGesture: unique symbol;

/**
 * Opaque handle to a gesture-handler gesture. It is built by the adapter for the
 * installed major (v2 imperative builder or v3 hooks) and only ever handed back
 * to `<GestureDetector />` through `SortableGestureDetector`.
 *
 * It is intentionally opaque. gesture-handler's own gesture types diverge across
 * v2 and v3 - v3 even reuses the name `ComposedGesture` for a different shape -
 * so naming a concrete type here would resolve differently for consumers on v2
 * and on v3. Each adapter crosses this boundary explicitly: `asSortableGesture`
 * wraps a freshly built gesture, and the adapter's own typed unwrap turns it
 * back into that major's gesture when calling into gesture-handler.
 */
export type SortableGesture = { readonly [sortableGesture]: true };

export const asSortableGesture = (gesture: object): SortableGesture =>
  gesture as SortableGesture;

/**
 * Imperative control over a manual gesture's recognition state - the v2 gesture
 * `manager`, or the v3 `GestureStateManager` bound to the handler tag.
 */
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
