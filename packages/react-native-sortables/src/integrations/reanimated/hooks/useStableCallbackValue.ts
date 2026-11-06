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

type CallbackRef<C extends AnyFunction> = { current: C | undefined };

/** Both helpers are built outside of the hook on purpose. The UI runtime keeps
 * the function handed to `runOnJS` reachable for longer than the shared value
 * holds it, and a closure created inside the hook would carry the hook's whole
 * scope - the `callback` argument included - along with it, so the callback
 * could never be released (#619). Built here, the dispatcher captures nothing
 * but the ref, which the unmount cleanup empties.
 */
const createDispatcher =
  <C extends AnyFunction>(ref: CallbackRef<C>) =>
  (...args: Parameters<C>) => {
    ref.current?.(...args);
  };

const wrapDispatcher = <C extends AnyFunction>(
  dispatch: (...args: Parameters<C>) => void
): WrappedCallback<C> => ({
  call: ((...args: Parameters<C>) => {
    'worklet';
    runOnJS(dispatch)(...args);
  }) as C
});

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
  // Updated during render instead of in an effect, so a gesture that lands
  // before passive effects are flushed still reaches the callback created by
  // the render that is already on screen.
  callbackRef.current = callback;

  // A JS callback prop is a new function on almost every render, so a stable
  // dispatcher is wrapped instead of the callback itself. The value sent to the
  // UI runtime is then the same for the whole lifetime of the component, which
  // drops the per-render worklet build and `runOnJS` handle (one per handler
  // per item on a sortable container) and keeps the effect below from
  // re-running, so it can own the unmount cleanup without ever blanking the
  // value between two renders.
  const jsCallbackValue = useMemo(
    () => wrapDispatcher<C>(createDispatcher(callbackRef)),
    []
  );

  const workletCallback = isWorkletFunction(callback) ? callback : undefined;
  const hasCallback = !!callback;

  useEffect(() => {
    // A worklet is copied over to the UI runtime and keeps no reference on the
    // JS side, so it is stored as is and needs no cleanup. Only the JS branch
    // roots its callback, and with it the whole scope the callback was created
    // in, until both the value and the ref are cleared (#619).
    if (workletCallback) {
      stableCallback.value = { call: workletCallback };
      return;
    }

    stableCallback.value = hasCallback ? jsCallbackValue : null;
    return () => {
      stableCallback.value = null;
      callbackRef.current = undefined;
    };
  }, [workletCallback, hasCallback, jsCallbackValue, stableCallback]);

  return useCallback(
    (...args: Parameters<C>) => {
      'worklet';
      stableCallback.value?.call(...args);
    },
    [stableCallback]
  );
}
