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
  useDragGesture: (
    callbacks: ManualGestureCallbacks,
    deps: ReadonlyArray<unknown>
  ) => SortableGesture;
  useEnabledGesture: (
    gesture: SortableGesture,
    enabled: boolean
  ) => SortableGesture;
  useTouchableGesture: (config: TouchableGestureConfig) => SortableGesture;
};
