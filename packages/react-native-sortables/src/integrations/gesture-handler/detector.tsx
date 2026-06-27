import type { PropsWithChildren } from 'react';
import { GestureDetector as RNGestureDetector } from 'react-native-gesture-handler';

import type { SortableGesture } from './types';

type GestureDetectorProps = PropsWithChildren<{
  gesture: SortableGesture;
  userSelect?: 'auto' | 'none' | 'text';
}>;

/**
 * Bridges the library's unified {@link SortableGesture} to gesture-handler's
 * `GestureDetector`: the two majors type gestures differently, so cast back to
 * whatever the installed version's detector expects.
 */
export default function GestureDetector({
  children,
  gesture,
  userSelect
}: GestureDetectorProps) {
  return (
    <RNGestureDetector gesture={gesture as never} userSelect={userSelect}>
      {children}
    </RNGestureDetector>
  );
}
