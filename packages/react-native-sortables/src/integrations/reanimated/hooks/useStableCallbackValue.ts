import { useCallback, useEffect, useMemo, useRef } from 'react';
import { isWorkletFunction, runOnJS } from 'react-native-reanimated';

import type { AnyFunction } from '../../../helperTypes';
import useMutableValue from './useMutableValue';

// We cannot store a function as a SharedValue because reanimated will treat
// it as an animation and will try to execute the animation when assigned
// to the SharedValue. Since we want the function to be treated as a value,
// we wrap it in an object and store the object in the SharedValue.
type WrappedCallback<C extends AnyFunction> = {
  call: C;
};

/** Built outside of the hook so that what is sent to the UI runtime captures
 * the ref alone. Built inside, it would capture the hook scope with the
 * callback in it, and the UI runtime holds on for longer than the shared value
 * does (#619).
 */
const wrapCallbackRef = <C extends AnyFunction>(ref: {
  current: C | undefined;
}): WrappedCallback<C> => {
  const dispatch = (...args: Parameters<C>) => {
    ref.current?.(...args);
  };

  return {
    call: ((...args: Parameters<C>) => {
      'worklet';
      runOnJS(dispatch)(...args);
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
  const stableCallback = useMutableValue<null | WrappedCallback<C>>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Wrapping the ref rather than the callback keeps the value the UI runtime
  // sees the same across renders, so the effect below runs once per mount
  // instead of once per render.
  const jsValue = useMemo(() => wrapCallbackRef<C>(callbackRef), []);
  const workletCallback = isWorkletFunction(callback) ? callback : undefined;
  const hasCallback = !!callback;

  useEffect(() => {
    // A worklet is copied to the UI runtime and holds nothing on the JS side,
    // so only the JS branch has to be released on unmount (#619).
    if (workletCallback) {
      stableCallback.value = { call: workletCallback };
      return;
    }

    stableCallback.value = hasCallback ? jsValue : null;
    return () => {
      stableCallback.value = null;
      callbackRef.current = undefined;
    };
  }, [workletCallback, hasCallback, jsValue, stableCallback]);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      stableCallback.value?.call(...args);
    },
    [stableCallback]
  );
}
