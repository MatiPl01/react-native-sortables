import { renderHook } from '@testing-library/react-hooks';
import { Gesture } from 'react-native-gesture-handler';

import { useDragGesture } from '../index';
import type { ManualGestureCallbacks } from '../types';

// gesture-handler without the hook API -> the integration must select the v2
// imperative-builder adapter.
jest.mock('react-native-gesture-handler', () => {
  const manual: Record<string, jest.Mock> = {};
  for (const method of [
    'onTouchesDown',
    'onTouchesMove',
    'onTouchesCancelled',
    'onTouchesUp'
  ]) {
    manual[method] = jest.fn(() => manual);
  }
  return {
    Gesture: { Manual: jest.fn(() => manual) },
    GestureDetector: () => null
  };
});

const Manual = (Gesture as unknown as { Manual: jest.Mock }).Manual;

const callbacks: ManualGestureCallbacks = {
  onTouchesCancelled: jest.fn(),
  onTouchesDown: jest.fn(),
  onTouchesMove: jest.fn(),
  onTouchesUp: jest.fn()
};

it('selects the v2 adapter and wires the drag callbacks into the builder', () => {
  renderHook(() => useDragGesture(callbacks, []));

  expect(Manual).toHaveBeenCalledTimes(1);
  const manual = Manual.mock.results[0]!.value as Record<string, jest.Mock>;
  expect(manual.onTouchesDown).toHaveBeenCalledWith(callbacks.onTouchesDown);
  expect(manual.onTouchesUp).toHaveBeenCalledWith(callbacks.onTouchesUp);
});
