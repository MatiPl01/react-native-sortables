import { runOnUI } from 'react-native-reanimated';

import type { AnyFunction } from '../../types';
import { useStableCallback } from '../callbacks';

export default function useUIStableCallback<C extends AnyFunction>(
  callback: C
) {
  return useStableCallback(runOnUI(callback));
}
