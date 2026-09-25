import { renderHook } from '@testing-library/react-hooks';
import { useDerivedValue } from 'react-native-reanimated';

import useAnimatableValue from './useAnimatableValue';

let mockIsWeb = false;

jest.mock('react-native-reanimated', () => ({
  isSharedValue: jest.fn(() => false),
  useDerivedValue: jest.fn(() => ({ value: 0 }))
}));

jest.mock('../../../constants', () => ({
  get IS_WEB() {
    return mockIsWeb;
  }
}));

describe(useAnimatableValue, () => {
  const mockUseDerivedValue = jest.mocked(useDerivedValue);

  it('does not pass dependencies to useDerivedValue on native, where Reanimated warns about them', () => {
    mockIsWeb = false;

    renderHook(() => useAnimatableValue(1));

    expect(mockUseDerivedValue).toHaveBeenCalledWith(
      expect.any(Function),
      undefined
    );
  });

  it('passes the value and modifier as dependencies on web, where Reanimated needs them', () => {
    mockIsWeb = true;
    const modify = (value: number) => value * 2;

    renderHook(() => useAnimatableValue(1, modify));

    expect(mockUseDerivedValue).toHaveBeenCalledWith(expect.any(Function), [
      1,
      modify
    ]);
  });
});
