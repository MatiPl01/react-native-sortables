import type {
  ComposedGesture,
  GestureTouchEvent,
  GestureType,
  TouchData
} from 'react-native-gesture-handler';

export type { GestureTouchEvent, TouchData };

/**
 * A gesture handed to `<GestureDetector />`. Typed with the only gesture names
 * exported by both gesture-handler majors, so published types resolve for
 * consumers on either version.
 */
export type SortableGesture = ComposedGesture | GestureType;

/** Re-tags a version-specific gesture object as the unified {@link SortableGesture}. */
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

/** Touch lifecycle callbacks for the draggable item's manual gesture. */
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

/** Configuration for the composed gesture used by `SortableTouchable`. */
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
