import * as GestureHandler from 'react-native-gesture-handler';

import { adapter as v2Adapter } from './adapters/v2';
import { adapter as v3Adapter } from './adapters/v3';

/**
 * The v3 hook API (`useManualGesture`, ...) only exists in
 * react-native-gesture-handler >= 3. We pick the matching adapter once, at
 * module load - the installed gesture-handler version never changes at runtime,
 * so the selected hooks are always called in the same order across renders.
 */
const hasHookApi =
  typeof (GestureHandler as { useManualGesture?: unknown }).useManualGesture ===
  'function';

const adapter = hasHookApi ? v3Adapter : v2Adapter;

export const useDragGesture = adapter.useDragGesture;
export const useEnabledGesture = adapter.useEnabledGesture;
export const useTouchableGesture = adapter.useTouchableGesture;

export { default as GestureDetector } from './detector';
export type {
  GestureTouchEvent,
  ManualGestureControl,
  SortableGesture,
  TouchableGestureConfig,
  TouchData
} from './types';
