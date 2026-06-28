import { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import type {
  ComposedGesture,
  GestureType
} from 'react-native-gesture-handler';
import { GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';

import { useCommonValuesContext, useItemContext } from '../../providers';

// A single non-passive `touchmove` listener shared by all sortables, attached
// only while at least one item is being dragged (ref counted).
let activeDragCount = 0;
const preventScroll = (event: TouchEvent) => event.preventDefault();

function blockNativeScroll() {
  if (activeDragCount++ === 0) {
    document.addEventListener('touchmove', preventScroll, { passive: false });
  }
}

function releaseNativeScroll() {
  if (activeDragCount > 0 && --activeDragCount === 0) {
    document.removeEventListener('touchmove', preventScroll);
  }
}

export type SortableGestureDetectorProps = PropsWithChildren<{
  gesture: ComposedGesture | GestureType;
}>;

// Cast `GestureDetector` to its legacy props (plus web layout props) so it
// accepts the cross-major `SortableGesture` union.
const Detector = GestureDetector as (
  props: SortableGestureDetectorProps & {
    touchAction?: 'pan-x' | 'pan-y';
    userSelect?: 'none';
  }
) => ReturnType<typeof GestureDetector>;

/**
 * Web `GestureDetector`: relaxes `touch-action` to the scroll axis (so items
 * don't block scrolling the ScrollView) and blocks native scroll while dragging.
 */
export default function SortableGestureDetector({
  children,
  gesture
}: SortableGestureDetectorProps) {
  const { autoScrollDirection } = useCommonValuesContext();
  const { isActive } = useItemContext();
  const isBlockingRef = useRef(false);
  const touchAction = autoScrollDirection === 'horizontal' ? 'pan-x' : 'pan-y';

  const setBlocking = useCallback((blocking: boolean) => {
    if (blocking === isBlockingRef.current) {
      return;
    }
    isBlockingRef.current = blocking;
    if (blocking) {
      blockNativeScroll();
    } else {
      releaseNativeScroll();
    }
  }, []);

  useAnimatedReaction(
    () => isActive.value,
    (active, previous) => {
      if (active !== previous) {
        runOnJS(setBlocking)(active);
      }
    }
  );

  // Release the lock if the item unmounts mid-drag
  useEffect(() => () => setBlocking(false), [setBlocking]);

  return (
    <Detector gesture={gesture} touchAction={touchAction} userSelect='none'>
      {children}
    </Detector>
  );
}
