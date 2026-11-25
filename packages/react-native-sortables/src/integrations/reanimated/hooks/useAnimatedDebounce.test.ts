import { renderHook } from '@testing-library/react-hooks';

import useAnimatedDebounce from './useAnimatedDebounce';

describe(useAnimatedDebounce, () => {
  it('returns the same object on every render', () => {
    const { rerender, result } = renderHook(() => useAnimatedDebounce());
    const debounce = result.current;

    rerender();

    expect(result.current).toBe(debounce);
  });

  it('calls only the last scheduled callback', () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result } = renderHook(() => useAnimatedDebounce());

    result.current.schedule(first, 100);
    result.current.schedule(second, 100);
    jest.advanceTimersByTime(200);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('does not call a cancelled callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useAnimatedDebounce());

    result.current.schedule(callback, 100);
    result.current.cancel();
    jest.advanceTimersByTime(200);

    expect(callback).not.toHaveBeenCalled();
  });
});
