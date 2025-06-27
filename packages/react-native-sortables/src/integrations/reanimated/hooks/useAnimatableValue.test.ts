import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react-native';
import { isSharedValue, makeMutable } from 'react-native-reanimated';

import useAnimatableValue from './useAnimatableValue';

describe(useAnimatableValue, () => {
  it('returns a shared value', () => {
    const { result } = renderHook(() => useAnimatableValue('something'));

    expect(isSharedValue(result.current)).toBe(true);
  });

  describe('when plain value is passed', () => {
    it('returns correct shared value', () => {
      const value = 1;
      const { result } = renderHook(() => useAnimatableValue(value));

      expect(result.current.value).toBe(value);
    });

    it('updates shared value when plain value changes', async () => {
      const { rerender, result } = renderHook(
        ({ value }) => useAnimatableValue(value),
        { initialProps: { value: 1 } }
      );

      rerender({ value: 2 });
      await waitFor(() => {
        expect(result.current.value).toBe(2);
      });

      rerender({ value: 3 });
      await waitFor(() => {
        expect(result.current.value).toBe(3);
      });
    });
  });

  describe('when shared value is passed', () => {
    it('returns correct shared value', () => {
      const value = makeMutable(1);
      const { result } = renderHook(() => useAnimatableValue(value));

      expect(result.current.value).toBe(1);
    });

    it('updates shared value when plain value changes', async () => {
      const value = makeMutable(1);
      const { result } = renderHook(() => useAnimatableValue(value));

      value.value = 2;
      await waitFor(() => {
        expect(result.current.value).toBe(2);
      });

      value.value = 3;
      await waitFor(() => {
        expect(result.current.value).toBe(3);
      });
    });
  });
});
