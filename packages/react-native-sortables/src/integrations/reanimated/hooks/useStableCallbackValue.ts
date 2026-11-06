import { useEffect, useState } from 'react';
import {
  isWorkletFunction,
  makeMutable,
  runOnJS
} from 'react-native-reanimated';

import type { AnyFunction } from '../../../helperTypes';

// We cannot store a function as a SharedValue because reanimated will treat
// it as an animation and will try to execute the animation when assigned
// to the SharedValue. Since we want the function to be treated as a value,
// we wrap it in an object and store the object in the SharedValue.
type WrappedCallback<C extends AnyFunction> = {
  call: C;
};

/** Everything one call of the hook owns, built once. Nothing in here is
 * created inside the hook on purpose: a closure declared there would capture
 * the hook scope with the callback in it, and the UI runtime holds on to what
 * `runOnJS` is given for longer than the shared value does (#619).
 */
const createCallbackStore = <C extends AnyFunction>() => {
  const ref: { current: C | undefined } = { current: undefined };
  const shared = makeMutable<null | WrappedCallback<C>>(null);

  const dispatch = (...args: Parameters<C>) => {
    ref.current?.(...args);
  };

  return {
    /** Returned to the caller, so its identity has to stay stable. */
    call: (...args: Parameters<C>) => {
      'worklet';
      shared.value?.call(...args);
    },
    /** Holds a JS callback. Emptied on unmount, refilled on every render. */
    ref,
    shared,
    /** What a JS callback is stored as - a worklet is stored as it is. */
    wrappedRef: {
      call: ((...args: Parameters<C>) => {
        'worklet';
        runOnJS(dispatch)(...args);
      }) as C
    } satisfies WrappedCallback<C>
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
  const [store] = useState(createCallbackStore<C>);
  const workletCallback = isWorkletFunction(callback) ? callback : undefined;
  const hasCallback = !!callback;

  // Assigning a reference is all this re-run costs. It has no cleanup of its
  // own, so there is no render in which the ref is empty, and it refills the
  // ref when React reconnects effects without re-rendering - after an
  // `<Activity>` is shown again, for instance.
  useEffect(() => {
    store.ref.current = callback;
  }, [callback, store]);

  // Wrapping the ref rather than the callback keeps the stored value the same
  // across renders, so this runs once per mount instead of once per render.
  useEffect(() => {
    // A worklet is copied to the UI runtime and holds nothing on the JS side,
    // so only the JS branch has to be released on unmount (#619). Clearing the
    // shared value alone is not enough - the UI runtime keeps calling into the
    // dispatcher, which reads the ref.
    if (workletCallback) {
      store.shared.value = { call: workletCallback };
      return;
    }

    store.shared.value = hasCallback ? store.wrappedRef : null;
    return () => {
      store.shared.value = null;
      store.ref.current = undefined;
    };
  }, [workletCallback, hasCallback, store]);

  return store.call;
}
