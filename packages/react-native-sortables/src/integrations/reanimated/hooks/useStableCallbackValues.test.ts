import { renderHook } from '@testing-library/react-hooks';

import useStableCallbackValues from './useStableCallbackValues';

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

const { __writes: writes } = jest.requireMock<{
  __writes: Array<unknown>;
}>('react-native-reanimated');

const worklet = (fn: jest.Mock) => {
  const callback = (...args: Array<unknown>) => {
    'worklet';
    fn(...args);
  };
  return callback;
};

const flushRunOnJs = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe(useStableCallbackValues, () => {
  beforeEach(() => {
    writes.length = 0;
    jest.useRealTimers();
  });

  it('calls each JS callback', async () => {
    const onFirst = jest.fn();
    const onSecond = jest.fn();
    const { result } = renderHook(() =>
      useStableCallbackValues({ onFirst, onSecond })
    );

    result.current.onFirst('a');
    result.current.onSecond('b');
    await flushRunOnJs();

    expect(onFirst).toHaveBeenCalledWith('a');
    expect(onSecond).toHaveBeenCalledWith('b');
  });

  it('calls the latest callback after the previous one is replaced', async () => {
    const first = jest.fn();
    const next = jest.fn();
    const { rerender, result } = renderHook(
      ({ cb }) => useStableCallbackValues({ onFirst: cb }),
      { initialProps: { cb: first } }
    );

    rerender({ cb: next });
    result.current.onFirst('a');
    await flushRunOnJs();

    expect(next).toHaveBeenCalledWith('a');
    expect(first).not.toHaveBeenCalled();
  });

  it('calls a worklet callback directly', () => {
    const fn = jest.fn();
    const { result } = renderHook(() =>
      useStableCallbackValues({ onFirst: worklet(fn) })
    );

    result.current.onFirst('a');

    expect(fn).toHaveBeenCalledWith('a');
  });

  it('does nothing for a key with no callback', async () => {
    const onFirst = jest.fn();
    const { result } = renderHook(() =>
      useStableCallbackValues<{ onFirst: jest.Mock; onSecond: jest.Mock }>({
        onFirst,
        onSecond: undefined
      })
    );

    expect(() => {
      result.current.onSecond('a');
    }).not.toThrow();
    await flushRunOnJs();

    expect(onFirst).not.toHaveBeenCalled();
  });

  it('does not call anything after unmount', async () => {
    const onFirst = jest.fn();
    const { result, unmount } = renderHook(() =>
      useStableCallbackValues({ onFirst })
    );

    unmount();
    result.current.onFirst('a');
    await flushRunOnJs();

    expect(onFirst).not.toHaveBeenCalled();
  });

  it('writes a single value for the whole mount and clears it on unmount', () => {
    const first = jest.fn();
    const second = jest.fn();
    const third = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ cb }) => useStableCallbackValues({ onFirst: cb }),
      { initialProps: { cb: first } }
    );

    rerender({ cb: second });
    rerender({ cb: third });

    expect(writes).toHaveLength(1);

    unmount();

    expect(writes).toHaveLength(2);
  });

  it('republishes when a worklet callback is replaced', () => {
    const first = jest.fn();
    const next = jest.fn();
    const { rerender } = renderHook(
      ({ fn }) => useStableCallbackValues({ onFirst: worklet(fn) }),
      { initialProps: { fn: first } }
    );

    expect(writes).toHaveLength(1);

    rerender({ fn: next });

    expect(writes).toHaveLength(2);
  });
});
