import type {
  ManualGestureCallbacks,
  SortableGesture,
  TouchableGestureConfig
} from '../types';

// Gesture API implemented per gesture-handler major (v2 builder, v3 hooks); the
// adapter is picked once at module load (see `../index`).
export type GestureHandlerAdapter = {
  useDragGesture: (
    callbacks: ManualGestureCallbacks,
    deps: ReadonlyArray<unknown>
  ) => SortableGesture;
  useTouchableGesture: (config: TouchableGestureConfig) => SortableGesture;
};
