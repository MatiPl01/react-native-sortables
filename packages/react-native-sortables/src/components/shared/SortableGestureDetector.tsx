import type { PropsWithChildren } from 'react';
import type {
  ComposedGesture,
  GestureType
} from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';

export type SortableGestureDetectorProps = PropsWithChildren<{
  gesture: ComposedGesture | GestureType;
}>;

// Cast `GestureDetector` to its legacy props so it accepts the cross-major
// `SortableGesture` union (its exported types otherwise reject it).
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
