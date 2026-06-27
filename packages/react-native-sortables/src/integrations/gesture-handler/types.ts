import type {
  ComposedGesture,
  GestureTouchEvent,
  GestureType,
  TouchData
} from 'react-native-gesture-handler';

export type { GestureTouchEvent, TouchData };

/**
 * A gesture object that can be handed to `<GestureDetector />`.
 *
 * The two gesture-handler major versions model gestures differently (the v2
 * imperative builder returns gesture instances, the v3 hook API returns plain
 * descriptors). We type this with `GestureType`/`ComposedGesture`, which are the
 * only gesture names exported by BOTH majors, so the published types resolve for
 * consumers on either version.
 */
export type SortableGesture = ComposedGesture | GestureType;

/**
 * Imperative control over a manual gesture's recognition state. Maps to the v2
 * gesture `manager` argument or to the v3 `GestureStateManager` bound to the
 * gesture's handler tag.
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
