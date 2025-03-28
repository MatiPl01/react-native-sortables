import { useCallback, useEffect } from 'react';
import {
  isWorkletFunction,
  runOnJS,
  useSharedValue
} from 'react-native-reanimated';

import type { AnyFunction } from '../../types';

type WrappedCallback<C extends AnyFunction> = {
  call: C;
};

const wrap = <C extends AnyFunction>(callback: C): WrappedCallback<C> => {
  if (isWorkletFunction(callback)) {
    return { call: callback };
  }
  return {
    call: ((...args: Parameters<C>) => {
      'worklet';
      runOnJS(callback)(args);
    }) as C
  };
};

/** Creates a stable worklet callback that can be called from the UI runtime
 * @param callback The JavaScript or worklet function to be called
 * @returns A worklet function that can be safely called from the UI thread
 * @default Behavior:
 * - If passed a regular JS function, calls it on the JS thread using runOnJS
 * - If passed a worklet function, calls it directly on the UI thread
 * @important The returned function maintains a stable reference and properly handles
 * thread execution based on the input callback type
 */
export default function useStableCallbackValue<C extends AnyFunction>(
  callback?: C
) {
  const stableCallback = useSharedValue<WrappedCallback<C> | null>(null);

  useEffect(() => {
    if (callback) {
      stableCallback.value = wrap(callback);
    } else {
      stableCallback.value = null;
    }
  }, [callback, stableCallback]);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      stableCallback.value?.call(...args);
    },
    [stableCallback]
  );
}
