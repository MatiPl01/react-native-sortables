import { renderHook } from '@testing-library/react-hooks';

import { useStableCallback } from './callbacks';

describe('hooks/callbacks', () => {
  const callback1 = jest.fn();
  const callback2 = jest.fn();
  const callback3 = jest.fn();

  describe(useStableCallback, () => {
    it('returns a function', () => {
      const { result } = renderHook(() => useStableCallback(callback1));

      expect(result.current).toBeInstanceOf(Function);
    });

    it('returns the same function in terms of reference when input callback changes', () => {
      const { rerender, result } = renderHook(
        ({ callback }) => useStableCallback(callback),
        { initialProps: { callback: callback1 } }
      );

      const initialResult = result.current;

      rerender({ callback: callback2 });
      expect(result.current).toBe(initialResult);

      rerender({ callback: callback3 });
      expect(result.current).toBe(initialResult);
    });

    it('calls the latest passed callback when the returned function is called', () => {
      const { rerender, result } = renderHook(
        (callback: () => void) => useStableCallback(callback),
        { initialProps: callback1 }
      );

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      result.current();
      expect(callback1).toHaveBeenCalledTimes(1);

      rerender(callback2);
      result.current();
      expect(callback1).toHaveBeenCalledTimes(1); // no more calls to the old callback
      expect(callback2).toHaveBeenCalledTimes(1);

      rerender(callback3);
      result.current();
      expect(callback1).toHaveBeenCalledTimes(1); // no more calls to the old callback
      expect(callback2).toHaveBeenCalledTimes(1); // no more calls to the old callback
      expect(callback3).toHaveBeenCalledTimes(1);
    });
  });
});
