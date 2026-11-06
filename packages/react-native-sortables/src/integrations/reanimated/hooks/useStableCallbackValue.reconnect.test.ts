import { renderHook } from '@testing-library/react-hooks';

import useStableCallbackValue from './useStableCallbackValue';

type EffectCleanup = (() => void) | undefined;

type EffectRecord = {
  cleanup?: EffectCleanup;
  setup: () => EffectCleanup;
};

type ActualReact = {
  useEffect: (setup: () => EffectCleanup, deps?: Array<unknown>) => void;
  useRef: <T>(initial: T) => { current: T };
};

const effects: Array<EffectRecord> = [];

// React reconnects a tree's effects by running every cleanup and then every
// setup, with no render in between - `<Activity>` being shown again, a
// react-freeze thaw, or StrictMode's double invoke on mount. This mock keeps
// the latest setup of each effect so that order can be replayed exactly.
jest.mock('react', () => {
  const actual = jest.requireActual<ActualReact>('react');

  return {
    ...actual,
    useEffect: (setup: () => EffectCleanup, deps?: Array<unknown>) => {
      const record = actual.useRef<EffectRecord>({ setup }).current;
      record.setup = setup;

      actual.useEffect(() => {
        record.cleanup = record.setup() ?? undefined;
        if (!effects.includes(record)) effects.push(record);
        return () => record.cleanup?.();
      }, deps);
    }
  };
});

const reconnectEffects = () => {
  for (const effect of effects) effect.cleanup?.();
  for (const effect of effects) effect.cleanup = effect.setup() ?? undefined;
};

const flushRunOnJs = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useStableCallbackValue when effects reconnect without a render', () => {
  beforeEach(() => {
    effects.length = 0;
    jest.useRealTimers();
  });

  it('keeps calling a JS callback', async () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useStableCallbackValue(callback));

    reconnectEffects();
    result.current('a');
    await flushRunOnJs();

    expect(callback).toHaveBeenCalledWith('a');
  });

  it('calls the callback from the last render, not the one it mounted with', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, result } = renderHook(
      ({ cb }) => useStableCallbackValue(cb),
      { initialProps: { cb: first } }
    );

    rerender({ cb: second });
    reconnectEffects();
    result.current('a');
    await flushRunOnJs();

    expect(second).toHaveBeenCalledWith('a');
    expect(first).not.toHaveBeenCalled();
  });

  it('keeps calling a worklet callback', () => {
    const fn = jest.fn();
    const { result } = renderHook(() =>
      useStableCallbackValue((...args: Array<unknown>) => {
        'worklet';
        fn(...args);
      })
    );

    reconnectEffects();
    result.current('a');

    expect(fn).toHaveBeenCalledWith('a');
  });
});
