import { renderHook } from '@testing-library/react-hooks';

import useStableCallbackValue from './useStableCallbackValue';

type ActualReanimated = {
  makeMutable: <T>(value: T) => { value: T };
};

// Wraps the shared value in a recording proxy, so the test can assert how many
// times the hook writes a value to the UI runtime.
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<ActualReanimated>(
    'react-native-reanimated'
  );
  const writes: Array<unknown> = [];

  return {
    ...actual,
    __writes: writes,
    makeMutable: <T>(initialValue: T) => {
      const mutable = actual.makeMutable(initialValue);

      return {
        get value() {
          return mutable.value;
        },
        set value(next: T) {
          writes.push(next);
          mutable.value = next;
        }
      };
    }
  };
});

const { __writes: writes } = jest.requireMock<{ __writes: Array<unknown> }>(
  'react-native-reanimated'
);

const workletCallback = (fn: jest.Mock) => {
  const callback = (...args: Array<unknown>) => {
    'worklet';
    fn(...args);
  };
  return callback;
};

describe(useStableCallbackValue, () => {
  beforeEach(() => {
    writes.length = 0;
    // A JS callback is dispatched through runOnJS, which queues a microtask;
    // real timers let awaiting a microtask actually flush it.
    jest.useRealTimers();
  });

  describe('when a JS callback is passed', () => {
    it('calls it while mounted', async () => {
      const callback = jest.fn();
      const { result } = renderHook(() => useStableCallbackValue(callback));

      result.current('a');
      await Promise.resolve();

      expect(callback).toHaveBeenCalledWith('a');
    });

    it('does not call it after unmount', async () => {
      const callback = jest.fn();
      const { result, unmount } = renderHook(() =>
        useStableCallbackValue(callback)
      );

      unmount();
      result.current('a');
      await Promise.resolve();

      expect(callback).not.toHaveBeenCalled();
    });

    it('calls the latest callback after the previous one is replaced', async () => {
      const callback = jest.fn();
      const nextCallback = jest.fn();
      const { rerender, result } = renderHook(
        ({ cb }) => useStableCallbackValue(cb),
        { initialProps: { cb: callback } }
      );

      rerender({ cb: nextCallback });
      result.current('a');
      await Promise.resolve();

      expect(nextCallback).toHaveBeenCalledWith('a');
      expect(callback).not.toHaveBeenCalled();
    });

    it('writes a single value for the whole mount and clears it on unmount', () => {
      const first = jest.fn();
      const second = jest.fn();
      const third = jest.fn();
      const { rerender, unmount } = renderHook(
        ({ cb }) => useStableCallbackValue(cb),
        { initialProps: { cb: first } }
      );

      rerender({ cb: second });
      rerender({ cb: third });

      expect(writes).toHaveLength(1);

      unmount();

      expect(writes).toEqual([expect.any(Object), null]);
    });
  });

  describe('when a worklet callback is passed', () => {
    it('calls it while mounted', () => {
      const fn = jest.fn();
      const { result } = renderHook(() =>
        useStableCallbackValue(workletCallback(fn))
      );

      result.current('a');

      expect(fn).toHaveBeenCalledWith('a');
    });

    it('calls the latest worklet after the previous one is replaced', () => {
      const fn = jest.fn();
      const nextFn = jest.fn();
      const { rerender, result } = renderHook(
        ({ cb }) => useStableCallbackValue(cb),
        { initialProps: { cb: workletCallback(fn) } }
      );

      rerender({ cb: workletCallback(nextFn) });
      result.current('a');

      expect(nextFn).toHaveBeenCalledWith('a');
      expect(fn).not.toHaveBeenCalled();
    });

    // A worklet is copied to the UI runtime and holds no reference on the JS
    // side, so it is intentionally left in place - clearing it would need a
    // cleanup on an effect that re-runs whenever the worklet identity changes.
    it('is not cleared on unmount', () => {
      const fn = jest.fn();
      const { result, unmount } = renderHook(() =>
        useStableCallbackValue(workletCallback(fn))
      );

      unmount();
      result.current('a');

      expect(fn).toHaveBeenCalledWith('a');
    });
  });

  describe('when no callback is passed', () => {
    it('returns a worklet that does nothing', () => {
      const { result } = renderHook(() => useStableCallbackValue());

      expect(() => result.current('a')).not.toThrow();
    });

    it('stores null instead of dispatching to the JS thread', () => {
      renderHook(() => useStableCallbackValue());

      expect(writes).toEqual([null]);
    });
  });
});
