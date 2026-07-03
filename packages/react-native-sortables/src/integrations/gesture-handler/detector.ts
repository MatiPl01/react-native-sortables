import type { PropsWithChildren } from 'react';
import { GestureDetector } from 'react-native-gesture-handler';

import type { SortableGesture } from './types';

type SortableGestureDetectorViewProps = PropsWithChildren<{
  gesture: SortableGesture;
  // Web-only layout hints, ignored on native (see `SortableGestureDetector.web`).
  touchAction?: 'pan-x' | 'pan-y';
  userSelect?: 'none';
}>;

/**
 * `GestureDetector` re-typed to accept the opaque {@link SortableGesture}. This
 * is the single place that handle is unwrapped back into a gesture-handler
 * gesture: gesture-handler's own prop types differ across majors (v2 is a plain
 * component, v3 a generic overload) and neither accepts the cross-major handle
 * through JSX, so the native and web wrappers share this one bridge instead of
 * each casting the detector themselves.
 */
export const SortableGestureDetectorView = GestureDetector as unknown as (
  props: SortableGestureDetectorViewProps
) => ReturnType<typeof GestureDetector>;
