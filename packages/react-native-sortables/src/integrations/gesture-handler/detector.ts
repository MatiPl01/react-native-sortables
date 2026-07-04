import type { PropsWithChildren } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';

import type { SortableGesture } from './types';

type SortableGestureDetectorViewProps = PropsWithChildren<{
  gesture: SortableGesture;
  // Web-only layout hints, ignored on native (see `SortableGestureDetector.web`).
  touchAction?: 'pan-x' | 'pan-y';
  userSelect?: 'none';
}>;

// The one place the opaque handle is cast back to what `GestureDetector` accepts
// (its prop types differ across majors); shared by the native and web wrappers.
export const SortableGestureDetectorView = GestureDetector as unknown as (
  props: SortableGestureDetectorViewProps
) => ReturnType<typeof GestureDetector>;
