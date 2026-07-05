import { renderHook } from '@testing-library/react-hooks';
import * as GestureHandler from 'react-native-gesture-handler';
import { isWorkletFunction } from 'react-native-reanimated';

import { useDragGesture, useTouchableGesture } from '../index';
import type { ManualGestureCallbacks } from '../types';

// gesture-handler with the hook API present -> the integration must select the
// v3 hook adapter (the one that fixes issue #349).
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: () => null,
  GestureStateManager: {
    activate: jest.fn(),
    deactivate: jest.fn(),
    fail: jest.fn()
  },
  useExclusiveGestures: jest.fn(() => ({})),
  useLongPressGesture: jest.fn(() => ({ handlerTag: 3 })),
  useManualGesture: jest.fn(() => ({ config: {}, handlerTag: 1 })),
  useSimultaneousGestures: jest.fn(() => ({})),
  useTapGesture: jest.fn(() => ({ handlerTag: 2 }))
}));

const mocked = GestureHandler as unknown as {
  useLongPressGesture: jest.Mock;
  useManualGesture: jest.Mock;
  useTapGesture: jest.Mock;
};
const useManualGesture = mocked.useManualGesture;

const callbacks: ManualGestureCallbacks = {
  onTouchesCancelled: jest.fn(),
  onTouchesDown: jest.fn(),
  onTouchesMove: jest.fn(),
  onTouchesUp: jest.fn()
};

it('selects the v3 adapter and wires the drag callbacks into the manual hook', () => {
  renderHook(() => useDragGesture(callbacks, []));

  expect(useManualGesture).toHaveBeenCalledTimes(1);
  const [config] = useManualGesture.mock.calls[0] as [Record<string, unknown>];
  expect(typeof config.onTouchesDown).toBe('function');
  expect(typeof config.onTouchesUp).toBe('function');
});

it('wraps touchable handlers into worklets so JS callbacks do not reach the detector raw', () => {
  const onTap = jest.fn();

  renderHook(() =>
    useTouchableGesture({
      externalGesture: {},
      failDistance: 10,
      gestureMode: 'exclusive',
      onTap,
      onTouchesDown: jest.fn()
    })
  );

  const configOf = (mock: jest.Mock) =>
    mock.mock.calls.map(([config]) => config as Record<string, unknown>);

  // The raw JS handler is wrapped into a worklet, so the reanimated detector's
  // `useHandler` never sees a non-worklet (which would throw at render).
  const tapConfig = configOf(mocked.useTapGesture).find(
    config => config.onActivate !== undefined
  );
  expect(tapConfig?.onActivate).not.toBe(onTap);
  expect(isWorkletFunction(tapConfig?.onActivate)).toBe(true);

  const [manualConfig] = configOf(mocked.useManualGesture);
  expect(isWorkletFunction(manualConfig?.onTouchesDown)).toBe(true);
});
