import * as GestureHandler from 'react-native-gesture-handler';

import { adapter as v2Adapter } from './adapters/v2';
import { adapter as v3Adapter } from './adapters/v3';

// The v3 hook API only exists in gesture-handler >= 3. Pick the adapter once at
// module load (the installed version is fixed at runtime) so the chosen hooks are
// called in a stable order across renders.
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
