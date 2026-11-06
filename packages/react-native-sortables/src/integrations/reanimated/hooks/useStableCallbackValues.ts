import { useEffect, useState } from 'react';
import {
  isWorkletFunction,
  makeMutable,
  runOnJS
} from 'react-native-reanimated';

import type { AnyFunction } from '../../../helperTypes';

type Callbacks = Record<string, AnyFunction>;

// We cannot store a function as a SharedValue because reanimated will treat
// it as an animation and will try to execute the animation when assigned
// to the SharedValue, so it is wrapped in an object. Only a worklet goes in
// there: a JS callback is called from the JS thread, so the UI runtime needs
// to know nothing about it beyond that there is one.
type StoredCallbacks<T extends Callbacks> = {
  [K in keyof T]?: { worklet?: T[K] };
};

/** Stored for a JS callback: the UI runtime needs nothing but the fact
 * that there is one.
 */
const JS_CALLBACK = Object.freeze({});

/** Everything one call of the hook owns, for every callback at once. Built
 * outside of the hook on purpose: a closure created there would capture the
 * hook scope with the callbacks in it, and the UI runtime holds on to what
 * `runOnJS` is given for longer than the shared value does (#619).
 */
const createStableCallbacks = <T extends Callbacks>(keys: Array<keyof T>) => {
  const shared = makeMutable<StoredCallbacks<T>>({});
  // `js` is swapped on every render and read on the JS thread only, so it is
  // kept out of the shared value, which would copy it to the UI runtime.
  const store = {
    js: {} as Partial<T>,
    keys,
    published: null as null | StoredCallbacks<T>,
    shared
  };

  // One dispatcher for the whole group, so the UI runtime holds a single
  // handle rather than one per callback.
  const dispatch = (key: keyof T, args: Array<unknown>) => {
    store.js[key]?.(...args);
  };

  const stable = {} as { [K in keyof T]: T[K] };
  for (const key of keys) {
    stable[key] = ((...args: Array<unknown>) => {
      'worklet';
      const stored = shared.value[key];
      if (!stored) return;
      if (stored.worklet) stored.worklet(...args);
      else runOnJS(dispatch)(key, args);
    }) as T[keyof T];
  }

  return Object.assign(store, { stable });
};

type Store<T extends Callbacks> = ReturnType<typeof createStableCallbacks<T>>;

/** True when the UI runtime's copy is out of date. A JS callback is always the
 * same frozen object, so swapping one for another is not a change here.
 */
const needsPublishing = <T extends Callbacks>(
  store: Store<T>,
  callbacks: Partial<T>
) => {
  if (!store.published) return true;

  for (const key of store.keys) {
    const callback = callbacks[key];
    const published = store.published[key];

    if (!callback) {
      if (published) return true;
    } else if (isWorkletFunction(callback)) {
      if (published?.worklet !== callback) return true;
    } else if (!published || published.worklet) {
      return true;
    }
  }

  return false;
};

/** Creates one stable worklet callback per entry, each of which can be called
 * from the UI runtime. See `useStableCallbackValue` for how a single callback
 * is handled - this hook does the same for a whole group, with one shared
 * value and one set of hooks instead of one of each per callback.
 */
export default function useStableCallbackValues<T extends Callbacks>(
  callbacks: Partial<T>
) {
  // The keys are the shape of the hook and are read once, like the number of
  // hooks a component calls.
  const [store] = useState(() =>
    createStableCallbacks<T>(Object.keys(callbacks))
  );

  // Swapping references is all this re-run costs, and the shared value is
  // written only when the UI runtime's copy is actually out of date. Having no
  // cleanup means there is no render in which a callback is missing, and that
  // the callbacks are put back when React reconnects effects without
  // re-rendering - after an `<Activity>` is shown again, for instance.
  useEffect(() => {
    store.js = callbacks;

    if (!needsPublishing(store, callbacks)) return;

    const next = {} as StoredCallbacks<T>;
    for (const key of store.keys) {
      const callback = callbacks[key];
      if (!callback) continue;
      next[key] = isWorkletFunction(callback)
        ? { worklet: callback as T[typeof key] }
        : (JS_CALLBACK as { worklet?: T[typeof key] });
    }

    store.published = next;
    store.shared.value = next;
  });

  // A worklet is copied to the UI runtime and holds nothing on the JS side. A
  // JS callback is reachable from the UI runtime through the dispatcher until
  // it is dropped here (#619).
  useEffect(
    () => () => {
      store.shared.value = {};
      store.js = {};
      store.published = null;
    },
    [store]
  );

  return store.stable;
}
