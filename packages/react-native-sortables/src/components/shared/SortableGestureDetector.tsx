import type { PropsWithChildren } from 'react';

import type { SortableGesture } from '../../integrations/gesture-handler';
import { SortableGestureDetectorView } from '../../integrations/gesture-handler';

export type SortableGestureDetectorProps = PropsWithChildren<{
  gesture: SortableGesture;
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
  return (
    <SortableGestureDetectorView gesture={gesture}>
      {children}
    </SortableGestureDetectorView>
  );
}
