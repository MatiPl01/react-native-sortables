import { renderHook } from '@testing-library/react-hooks';

import useStableCallbackValues from './useStableCallbackValues';

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

describe('useStableCallbackValues when effects reconnect without a render', () => {
  beforeEach(() => {
    effects.length = 0;
    jest.useRealTimers();
  });

  it('keeps calling a JS callback', async () => {
    const onFirst = jest.fn();
    const { result } = renderHook(() => useStableCallbackValues({ onFirst }));

    reconnectEffects();
    result.current.onFirst('a');
    await flushRunOnJs();

    expect(onFirst).toHaveBeenCalledWith('a');
  });

  it('calls the callback from the last render, not the one it mounted with', async () => {
    const first = jest.fn();
    const next = jest.fn();
    const { rerender, result } = renderHook(
      ({ cb }) => useStableCallbackValues({ onFirst: cb }),
      { initialProps: { cb: first } }
    );

    rerender({ cb: next });
    reconnectEffects();
    result.current.onFirst('a');
    await flushRunOnJs();

    expect(next).toHaveBeenCalledWith('a');
    expect(first).not.toHaveBeenCalled();
  });

  it('keeps calling a worklet callback', () => {
    const fn = jest.fn();
    const { result } = renderHook(() =>
      useStableCallbackValues({
        onFirst: (...args: Array<unknown>) => {
          'worklet';
          fn(...args);
        }
      })
    );

    reconnectEffects();
    result.current.onFirst('a');

    expect(fn).toHaveBeenCalledWith('a');
  });
});
