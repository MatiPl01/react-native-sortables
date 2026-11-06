import { useEffect, useState } from 'react';
import {
  isWorkletFunction,
  makeMutable,
  runOnJS
} from 'react-native-reanimated';

import type { AnyFunction } from '../../../helperTypes';

// We cannot store a function as a SharedValue because reanimated will treat
// it as an animation and will try to execute the animation when assigned
// to the SharedValue, so it is wrapped in an object. Only a worklet goes in
// there: a JS callback is called from the JS thread, so the UI runtime needs
// to know nothing about it beyond that there is one.
type StoredCallback<C extends AnyFunction> = {
  worklet?: C;
};

/** Stored for a JS callback: the UI runtime needs nothing but the fact
 * that there is one.
 */
const JS_CALLBACK: StoredCallback<never> = Object.freeze({});

/** Everything one call of the hook owns. Built outside of the hook on purpose:
 * a closure created there would capture the hook scope with the callback in
 * it, and the UI runtime holds on to what `runOnJS` is given for longer than
 * the shared value does (#619).
 */
const createStableCallback = <C extends AnyFunction>() => {
  const shared = makeMutable<null | StoredCallback<C>>(null);
  // `js` is swapped on every render and read on the JS thread only, so it is
  // kept out of the shared value, which would copy it to the UI runtime.
  const store = { js: undefined as C | undefined, shared };

  const dispatch = (...args: Parameters<C>) => {
    store.js?.(...args);
  };

  return Object.assign(store, {
    /** Returned to the caller, so its identity has to stay stable. */
    stable: (...args: Parameters<C>) => {
      'worklet';
      const stored = shared.value;
      if (!stored) return;
      if (stored.worklet) stored.worklet(...args);
      else runOnJS(dispatch)(...args);
    }
  });
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
  const [store] = useState(createStableCallback<C>);
  const workletCallback = isWorkletFunction(callback) ? callback : undefined;
  const hasCallback = !!callback;

  // Swapping a reference is all this re-run costs, and nothing is sent to the
  // UI runtime. It has no cleanup of its own, so there is no render in which
  // the callback is missing, and it puts the callback back when React
  // reconnects effects without re-rendering - after an `<Activity>` is shown
  // again, for instance.
  useEffect(() => {
    store.js = callback;
  }, [callback, store]);

  // Nothing here depends on the callback itself, so it runs once per mount
  // rather than once per render.
  useEffect(() => {
    // A worklet is copied to the UI runtime and holds nothing on the JS side,
    // so it needs no cleanup. A JS callback is reachable from the UI runtime
    // through the dispatcher until it is dropped here (#619).
    if (workletCallback) {
      store.shared.value = { worklet: workletCallback };
      return;
    }

    store.shared.value = hasCallback ? JS_CALLBACK : null;
    return () => {
      store.shared.value = null;
      store.js = undefined;
    };
  }, [workletCallback, hasCallback, store]);

  return store.stable;
}
