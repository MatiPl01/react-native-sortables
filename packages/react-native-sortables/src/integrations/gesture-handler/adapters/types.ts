import type {
  ManualGestureCallbacks,
  SortableGesture,
  TouchableGestureConfig
} from '../types';

/**
 * Unified gesture API used across the library. Each gesture-handler major
 * version provides its own implementation (v2 imperative builder, v3 hook API),
 * selected once at module load based on which version is installed.
 */
export type GestureHandlerAdapter = {
  /** Manual pan gesture for a draggable item. */
  useDragGesture: (
    callbacks: ManualGestureCallbacks,
    deps: ReadonlyArray<unknown>
  ) => SortableGesture;
  /** Applies an `enabled` flag to an existing gesture (custom handle). */
  useEnabledGesture: (
    gesture: SortableGesture,
    enabled: boolean
  ) => SortableGesture;
  /** Composed tap / long-press / manual gesture for `SortableTouchable`. */
  useTouchableGesture: (config: TouchableGestureConfig) => SortableGesture;
};
