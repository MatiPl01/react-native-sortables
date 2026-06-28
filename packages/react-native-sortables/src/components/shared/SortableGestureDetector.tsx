import type { PropsWithChildren } from 'react';
import type {
  ComposedGesture,
  GestureType
} from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';

export type SortableGestureDetectorProps = PropsWithChildren<{
  gesture: ComposedGesture | GestureType;
}>;

/**
 * Wrapper over gesture handler's `GestureDetector` used by all draggable item
 * parts. On native it is a passthrough; the web counterpart (`.web`) layers on
 * the browser-specific props needed to coexist with native scrolling.
 */
export default function SortableGestureDetector({
  children,
  gesture
}: SortableGestureDetectorProps) {
  // `gesture` spans both gesture-handler majors; cast to the installed
  // detector's prop type.
  return (
    <GestureDetector gesture={gesture as never}>{children}</GestureDetector>
  );
}
