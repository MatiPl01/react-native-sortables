import { useCallback } from 'react';
import { runOnJS } from 'react-native-reanimated';

import type { AnyFunction } from '../../types';
import { noop } from '../../utils';
import { useStableCallback } from '../callbacks';

export default function useJSStableCallback<C extends AnyFunction>(
  callback?: C
) {
  const hasCallback = !!callback;
  const stableCallback = useStableCallback(callback ?? noop);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      if (hasCallback) runOnJS(stableCallback)(...args);
    },
    [stableCallback, hasCallback]
  );
}
