import type { DependencyList } from 'react';
import { useCallback } from 'react';
import { runOnUI } from 'react-native-reanimated';

import type { AnyFunction } from '../../types';

export default function useUICallback<C extends AnyFunction>(
  callback: C,
  deps: DependencyList
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(runOnUI(callback), deps);
}
