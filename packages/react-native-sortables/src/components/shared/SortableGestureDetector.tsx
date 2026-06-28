import type { PropsWithChildren } from 'react';
import type {
  ComposedGesture,
  GestureType
} from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';

export type SortableGestureDetectorProps = PropsWithChildren<{
  gesture: ComposedGesture | GestureType;
}>;

// The exported `GestureDetector` is generic and infers its gesture prop to the
// v3-only gesture type; pin it to the legacy props shape that accepts the
// cross-major `SortableGesture` union.
const Detector = GestureDetector as (
  props: SortableGestureDetectorProps
) => ReturnType<typeof GestureDetector>;

/**
 * Wrapper over gesture handler's `GestureDetector` used by all draggable item
 * parts. On native it is a passthrough; the web counterpart (`.web`) layers on
 * the browser-specific props needed to coexist with native scrolling.
 */
export default function SortableGestureDetector({
  children,
  gesture
}: SortableGestureDetectorProps) {
  return <Detector gesture={gesture}>{children}</Detector>;
}
